import express from 'express'
import {getEvents, createEvents, getCalendars, updateEvent, deleteEvent} from '../controllers/calendarController.js'
import { protect } from '../controllers/authController.js';

const router = express.Router();

// a valid user can only access these routes.
router.use(protect);

router.get('/', getCalendars)

router.get('/events', getEvents)

router.post('/events', createEvents)

router.put('/events/:id', updateEvent);

router.delete('/events/:id', deleteEvent)


export default router;