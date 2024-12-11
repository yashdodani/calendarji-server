import mongoose from "mongoose";
import app from "./app.js";

process.on("uncaughtException", (err) => {
    console.log(err.name, err.message);
    console.log("UNCAUGHT EXCEPTION!! SHUTTING DOWN....");
    process.exit(1);
});

const DB = process.env.DATABASE.replace(
    "<password>",
    process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
    console.log("DB connection successful");
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

process.on("unhandledRejection", (err) => {
    console.log(err.name, err.message);
    console.log("UNHANDLED REJECTION!! SHUTTING DOWN....");
    server.close(() => {
        process.exit(1);
    });
});

process.on("SIGTERM", () => {
    console.log("SIGTERM RECIEVED. Shutting down gracefully");
    server.close(() => {
        console.log("Process terminated...");
    });
});
