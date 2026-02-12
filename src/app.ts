import express, { Application, Request, Response, NextFunction } from "express";
import { errorHandler } from "./core/middleware/error.middleware.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    }),
);
app.use(express.urlencoded({ extended: true }));

//health check route
app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ message: "health check is running" });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
