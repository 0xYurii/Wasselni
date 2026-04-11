import express, { Application, Request, Response } from "express";
import { errorHandler } from "./core/middleware/error.middleware.js";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./modules/auth/route.js";
import ridesRoute from "./modules/rides/route.js";
import bookingsRoute from "./modules/bookings/route.js";
import usersRoute from "./modules/users/route.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

//Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "Too many requests" },
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many login attempts" },
});

// CORS & Helmet
app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", limiter);
app.use("/api/auth/login", authLimiter);

//health check route
app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ message: "health check is running" });
});

//Auth route
app.use("/api/auth", authRoute);

//Rides route
app.use("/api/rides", ridesRoute);

//Users route
app.use("api/users", usersRoute);

//Bookings route
app.use("/api/bookings", bookingsRoute);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
