import { google } from "googleapis";
import oauth2Client from "../utils/oauth2Client.js";
import CalendarToken from "../models/tokenModel.js";

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

/*
    const calendarToken = await CalendarToken.findOne({userId: '114540273855321090860'})
    const credentials = {
        access_token: calendarToken.access_token,
        refresh_token: calendarToken.refresh_token,
        scope: calendarToken.scope,
        token_type: calendarToken.token_type,
        expiry_date: calendarToken.expiry_date
    }

    oauth2Client.setCredentials(credentials)
*/

export async function getEvents(req, res) {
    if (!req.credentials) {
        res.send("ERROR!! Credentials not set");
        return;
    }

    // set the credentials
    oauth2Client.setCredentials(req.credentials);

    const calendarId = "primary";
    calendar.events.list(
        {
            calendarId,
            timeMin: new Date().toISOString(),
            maxResults: 15,
            singleEvents: true,
            orderBy: "startTime",
        },
        (err, response) => {
            if (err) {
                console.error("Can't fetch events");
                res.send("Error");
                return;
            }
            const events = response.data.items;
            res.json(events);
        }
    );
}

export async function createEvents(req, res) {
    if (!req.credentials) {
        res.send("ERROR!! Credentials not set");
        return;
    }
    // set the credentials
    oauth2Client.setCredentials(req.credentials);

    const body = req.body;

    const event = {
        summary: body.summary,
        location: body.location,
        description: body.description,
        start: body.start,
        end: body.end,
    };

    calendar.events.insert(
        {
            calendarId: "primary",
            auth: oauth2Client,
            resource: event,
        },
        (err, event) => {
            if (err) {
                console.log("Error connecting to calendar services!!", err);
                res.status(400).json({
                    message: "Error connecting to calendar services",
                });
                return;
            }
            res.status(200).send(event.data);
        }
    );
}

export async function getCalendars(req, res) {
    calendar.calendarList.list({}, (err, response) => {
        if (err) {
            console.error("error fetching calenders", err);
            res.send("Error!");
            return;
        }
        const calendars = response.data.items;
        res.json(calendars);
    });
}

export async function updateEvent(req, res) {
    const eventId = req.params.id;

    if (!req.credentials) {
        res.send("ERROR!! Credentials not set");
        return;
    }
    // set the credentials
    oauth2Client.setCredentials(req.credentials);

    const event = {
        summary: "Tech Talk with Yash",
        location: "Zoom Meeting",

        description: "Demo event for Arindam's Blog Post.",
        start: {
            dateTime: "2024-12-11T19:30:00+05:30",
            timeZone: "Asia/Kolkata",
        },
        end: {
            dateTime: "2024-12-11T20:30:00+05:30",
            timeZone: "Asia/Kolkata",
        },
    };

    calendar.events.update(
        {
            calendarId: "primary",
            eventId: eventId,
            resource: event,
            auth: oauth2Client,
        },
        (err, event) => {
            if (err) {
                console.log("Cannot update event!!");
                res.send("Cannot update event");
                return;
            }
            res.status(200).json({
                message: "Event Updated",
            });
        }
    );
}

export async function deleteEvent(req, res) {
    const eventId = req.params.id;

    if (!req.credentials) {
        res.send("ERROR!! Credentials not set");
        return;
    }
    // set the credentials
    oauth2Client.setCredentials(req.credentials);

    calendar.events.delete(
        {
            calendarId: "primary",
            eventId: eventId,
        },
        (err, response) => {
            if (err) {
                console.log("Error deleting event");
                res.send("Error deleting event");
                return;
            }
            res.json({
                message: "Event Deleted",
            });
        }
    );
}
