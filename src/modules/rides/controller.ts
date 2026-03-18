import { Request, Response } from "express";
import prisma from "../../config/prisma.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

export const createRide = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "DRIVER") {
        return res.status(403).json({ message: "Only drivers can create rides" });
    }

    const { origin, destination, departure, price, seats } = req.body;

    const ride = await prisma.ride.create({
        data: {
            driverId: userId,
            origin,
            destination,
            departure: new Date(departure),
            price,
            seats,
        },
        include: {
            driver: { select: { id: true, fullName: true, avatar: true } },
        },
    });

    return res.status(201).json({ message: "Ride created", ride });
});
