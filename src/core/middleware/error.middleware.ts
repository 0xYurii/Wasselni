import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

const isDev = process.env.NODE_ENV !== "production";

// Type guard for Prisma errors
interface PrismaError {
    code: string;
    meta?: { target?: string[] };
}

function isPrismaError(err: unknown): err is PrismaError {
    return (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof (err as PrismaError).code === "string" &&
        (err as PrismaError).code.startsWith("P")
    );
}

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    // Default values
    let statusCode = 500;
    let message = "Internal server error";
    let isOperational = false;

    // 1. Handle AppError instances
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }
    // 2. Handle ZodError (validation errors)
    else if (err instanceof ZodError) {
        statusCode = 400;
        const fieldErrors = err.flatten().fieldErrors;
        message = Object.entries(fieldErrors)
            .map(([field, errors]) => `${field}: ${(errors as string[] | undefined)?.join(", ")}`)
            .join("; ") || "Validation error";
        isOperational = true;
    }
    // 3. Handle Prisma errors
    else if (isPrismaError(err)) {
        isOperational = true;
        switch (err.code) {
            case "P2002": // Unique constraint violation
                statusCode = 409;
                message = "Already exists";
                break;
            case "P2025": // Record not found
                statusCode = 404;
                message = "Not found";
                break;
            case "P2003": // Foreign key constraint violation
                statusCode = 400;
                message = "Invalid reference";
                break;
            default:
                statusCode = 500;
                message = "Database error";
                isOperational = false;
        }
    }
    // 4. Handle plain error objects with status/statusCode (legacy support)
    else if (
        typeof err === "object" &&
        err !== null &&
        ("status" in err || "statusCode" in err)
    ) {
        const errObj = err as { status?: number; statusCode?: number; message?: string };
        statusCode = errObj.status || errObj.statusCode || 500;
        message = errObj.message || "Unknown error";
        isOperational = statusCode < 500;
    }
    // 5. Handle standard Error instances
    else if (err instanceof Error) {
        message = isDev ? err.message : "Internal server error";
    }

    // Log errors appropriately
    if (!isOperational) {
        // Non-operational errors are bugs - log loudly
        console.error("🚨 NON-OPERATIONAL ERROR:", err);
    } else if (isDev) {
        // In dev, log all errors for debugging
        console.error("Error:", err);
    }

    // Build response
    const response: { success: false; message: string; stack?: string } = {
        success: false,
        message,
    };

    // Only include stack trace in development
    if (isDev && err instanceof Error) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};
