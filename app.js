import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import calendarRoutes from "./routes/calendarRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import oauth2Client from "./utils/oauth2Client.js";

const app = express();

app.use(
    cors({
        origin: "https://calendarji.vercel.app",
        credentials: true,
    })
);

app.use(cookieParser());

app.use(express.json());

app.use("/calendar", calendarRoutes);
app.use("/auth", authRoutes);

app.get("/events", (req, res) => {});

export default app;
