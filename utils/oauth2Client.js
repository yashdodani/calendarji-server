import 'dotenv/config'
import { google } from 'googleapis'

// OAuth2 configuration
const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URL,
});

export default oauth2Client;