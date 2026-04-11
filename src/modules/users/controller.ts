import { Request, Response } from "express";
import prisma from "../../config/prisma.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { AppError } from "../../core/errors/AppError.js";

export const stats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (req.userRole !== "DRIVER")
        throw AppError.forbidden("Only drivers can see stats");

    const totalRides = await prisma.$transaction([
        prisma.ride.count({
            where: { driverId: userId },
        }),
    ]);

    return res.status(200).json({ totalRides });
});
