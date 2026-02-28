import express, { Application, Request, Response, NextFunction } from "express";
import { errorHandler } from "./core/middleware/error.middleware.js";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./modules/auth/route.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//health check route
app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ message: "health check is running" });
});

//Auth route
app.use("/auth", authRoute);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
