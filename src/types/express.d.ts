import "express";
import { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: string | JwtPayload;
        }
    }
}
declare global {
    namespace Express {
        interface Request {
            userId?: number;
        }
    }
}
export {};
