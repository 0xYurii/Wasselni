import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authPayloadSchema } from "../validators/auth.validators.js";

export const authenticateToken = asyncHandler(
    (req: Request, res: Response, next: NextFunction) => {
        // Get token from Authorization header
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        if (typeof decoded != "object" || decoded === null) {
            return res.status(403).json({ error: "Invalid token payload" });
        }

        const parsed = authPayloadSchema.safeParse(decoded);
        if (!parsed.success) {
            return res.status(403).json({ error: "Invalid token payload" });
        }
        req.userId = Number(parsed.data.sub);
    },
);
