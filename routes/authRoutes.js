import express from "express";
import {
    eventsRedirect,
    getAuth,
    isLoggedIn,
} from "../controllers/authController.js";

const router = express.Router();

// Google OAuth
router.get("/", getAuth);
router.get("/redirect", eventsRedirect);
router.get("/validate", isLoggedIn);

export default router;
