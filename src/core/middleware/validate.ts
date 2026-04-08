import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate =
    (schema: ZodObject, source: "body" | "query" | "params") =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req[source]);

            if (source === "body") {
                req.body = parsed;
            } else {
                Object.assign(req[source], parsed);
            }

            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    status: "fail",
                    error: err.flatten().fieldErrors,
                });
            }
            next(err);
        }
    };
