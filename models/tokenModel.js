import mongoose from 'mongoose'

const calendarTokenSchema = new mongoose.Schema({
    access_token: {
        type: String,
        required: true,
    },
    refresh_token: {
        type: String,
        required: true,
    },
    scope: {
        type: String,
        required: true,
    },
    token_type: {
        type: String
    },
    expiry_date: {
        type: Number
    },
    userId: {
        type: String,
        required: true
    }
})

const CalendarToken = mongoose.model('CalendarToken', calendarTokenSchema)
export default CalendarToken;