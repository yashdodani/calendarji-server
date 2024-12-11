import oauth2Client from "./utils/oauth2Client.js";

// Returns sub for identifying the user.
async function verify(idToken) {
    const ticket = await oauth2Client.verifyIdToken({
        idToken: idToken,
        audience: process.env.CLIENT_ID,
    })

    const payload = ticket.getPayload();
    const userId = payload['sub'];

    return userId;
}

export {verify};