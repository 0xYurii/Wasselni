export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);

        Object.setPrototypeOf(this, AppError.prototype);
    }

    static badRequest(message: string): AppError {
        return new AppError(message, 400);
    }

    static unauthorized(message = "Unauthorized"): AppError {
        return new AppError(message, 401);
    }

    static forbidden(message = "Forbidden"): AppError {
        return new AppError(message, 403);
    }

    static notFound(resource = "Resource"): AppError {
        return new AppError(`${resource} not found`, 404);
    }

    static conflict(message: string): AppError {
        return new AppError(message, 409);
    }

    static internal(message = "Internal server error"): AppError {
        return new AppError(message, 500, false);
    }
}

export const badRequest = (message: string) => AppError.badRequest(message);
export const unauthorized = (message?: string) =>
    AppError.unauthorized(message);
export const forbidden = (message?: string) => AppError.forbidden(message);
export const notFound = (resource?: string) => AppError.notFound(resource);
