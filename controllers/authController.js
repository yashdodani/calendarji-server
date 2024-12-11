import jwt from "jsonwebtoken";
import crypto from "crypto";
import { promisify } from "util";
import { verify } from "../utils.js";
import oauth2Client from "../utils/oauth2Client.js";
import CalendarToken from "../models/tokenModel.js";
import { calendar } from "googleapis/build/src/apis/calendar/index.js";

// scope of access in google calendar api
const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.email",
];

const encryptionPassword = process.env.ENCRYPTION_PASSWORD;
const encryptionKey = crypto.scryptSync(encryptionPassword, "salt", 32);
let idToken;
let userId;

function encryptData(plaintext) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
}

function decryptData(ciphertext) {
    const [ivHex, encrypted] = ciphertext.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

export async function getAuth(req, res) {
    const redirectUrl = req.query.redirectUrl;
    // check if user already login.
    let jwt_token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        jwt_token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
        jwt_token = req.cookies.jwt;
    }

    if (jwt_token) {
        // validate the token
        const decoded = await promisify(jwt.verify)(
            jwt_token,
            process.env.JWT_SECRET_KEY
        );

        // check if user exists
        const calendarToken = await CalendarToken.findOne({
            userId: decoded.userId,
        });
        if (calendarToken) {
            // user already exists
            const credentials = {
                access_token: calendarToken.access_token,
                refresh_token: calendarToken.refresh_token,
                scope: calendarToken.scope,
                token_type: calendarToken.token_type,
                expiry_date: calendarToken.expiry_date,
            };

            oauth2Client.setCredentials(credentials);
            res.redirect(redirectUrl);
            return;
        }
    }

    // user not logged in, google oauth required.
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        state: redirectUrl,
    });
    res.redirect(url);
}

export async function eventsRedirect(req, res) {
    const { code, state: redirectUrl } = req.query;

    oauth2Client.getToken(code, async (err, tokens) => {
        if (err) {
            console.log("Couldn't get token", err);
            res.send("Error");
            return;
        }
        oauth2Client.setCredentials(tokens); // set tokens in client

        idToken = tokens.id_token;

        // Get the userId(sub) to identify user.
        userId = await verify(idToken).catch(console.error);
        if (!userId) {
            console.log("COULD NOT VERIFY SUB!");
            res.send("Error verifying user.");
            return;
        }

        // check if user already exists
        const oldUser = await CalendarToken.findOne({ userId: userId });
        if (oldUser) {
            console.log("LOGIN: Old User");
            // send jwt to the user
            const jwt_token = jwt.sign(
                { userId: userId },
                process.env.JWT_SECRET_KEY,
                {
                    expiresIn: "24h",
                }
            );

            res.cookie("jwt", jwt_token, {
                maxAge: 24 * 60 * 60 * 1000,
            });
            res.redirect(redirectUrl);
            return;
        }

        // encrypt tokens and save in db
        const access_token_encrypted = encryptData(tokens.access_token);
        const refresh_token_encrypted = encryptData(tokens.refresh_token);
        const dataForDB = {
            access_token: access_token_encrypted,
            refresh_token: refresh_token_encrypted,
            scope: tokens.scope,
            token_type: tokens.token_type,
            expiry_date: tokens.expiry_date,
            userId: userId,
        };

        const newCalendarToken = await CalendarToken.create(dataForDB);
        if (newCalendarToken) {
            console.log("LOGIN: New User Registered!");
        }

        // send jwt to the user
        const jwt_token = jwt.sign(
            { userId: userId },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "24h",
            }
        );

        res.cookie("jwt", jwt_token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: false,
        });
        console.log(`Redirecting to ${redirectUrl}`);
        res.redirect(redirectUrl);
    });
}

export async function protect(req, res, next) {
    let jwt_token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        jwt_token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
        jwt_token = req.cookies.jwt;
    }

    if (!jwt_token) {
        return next(
            new Error("You are not logged in, please login to get access")
        );
    }

    // validate the token
    const decoded = await promisify(jwt.verify)(
        jwt_token,
        process.env.JWT_SECRET_KEY
    ).catch((err) => {
        return;
    });

    if (!decoded) {
        return next(new Error("JWT is malformed"));
    }

    const calendarToken = await CalendarToken.findOne({
        userId: decoded.userId,
    });
    if (!calendarToken) {
        return next(
            new Error("User belonging to the Token does no longer exists.")
        );
    }

    // user exists
    const access_token_decrypted = decryptData(calendarToken.access_token);
    const refresh_token_decrypted = decryptData(calendarToken.refresh_token);

    const credentials = {
        access_token: access_token_decrypted,
        refresh_token: refresh_token_decrypted,
        scope: calendarToken.scope,
        token_type: calendarToken.token_type,
        expiry_date: calendarToken.expiry_date,
    };

    req.credentials = credentials;
    req.userId = calendarToken.userId;
    next();
}
