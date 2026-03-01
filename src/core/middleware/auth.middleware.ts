import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authPayloadSchema } from "../validators/auth.validators.js";

export const authenticateToken = asyncHandler(
    (req: Request, res: Response, next: NextFunction) => {
        // Accept JWT from either Authorization header or httpOnly cookie.
        const authHeader = req.headers["authorization"];
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : undefined;
        const cookieToken = req.cookies?.jwt;
        const token = bearerToken || cookieToken;

        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }

        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!);
            if (typeof decoded != "object" || decoded === null) {
                return res.status(403).json({ error: "Invalid token payload" });
            }
            const parsed = authPayloadSchema.safeParse(decoded);
            if (!parsed.success) {
                return res.status(403).json({ error: "Invalid token payload" });
            }
            req.userId = Number(parsed.data.sub);
            req.userRole = parsed.data.role;
            return next();
        } catch (err) {
            return res.status(403).json({ error: "Token expired or invalid" });
        }
    },
);
