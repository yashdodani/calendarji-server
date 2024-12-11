import express from 'express'
import { eventsRedirect, getAuth } from '../controllers/authController.js';

const router = express.Router();



// Google OAuth 
router.get('/', getAuth);
router.get('/redirect', eventsRedirect)

export default router;