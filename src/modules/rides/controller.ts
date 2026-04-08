import { Request, Response } from "express";
import prisma from "../../config/prisma.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { AppError } from "../../core/errors/AppError.js";

export const createRide = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();

    if (req.userRole !== "DRIVER")
        throw AppError.forbidden("Only drivers can create rides");

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

export const myRides = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();

    if (req.userRole !== "DRIVER")
        throw AppError.forbidden("Only drivers can create rides");

    const rides = await prisma.ride.findMany({
        where: { driverId: userId },
        include: {
            driver: { select: { id: true, fullName: true, avatar: true } },
        },
        orderBy: { departure: "asc" },
    });

    return res.status(200).json({ message: "My Rides", rides });
});

export const cancelRide = asyncHandler(async (req: Request, res: Response) => {
    const { id: rideId } = req.params;
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();
    if (!rideId || Array.isArray(rideId))
        throw AppError.badRequest("Invalid rideId");

    const parsedId = parseInt(rideId, 10);
    if (isNaN(parsedId)) {
        throw AppError.badRequest("Invalid rideId format");
    }

    const ride = await prisma.ride.findUnique({
        where: { id: parsedId },
    });

    if (!ride) {
        throw AppError.notFound("Ride");
    }

    if (ride.driverId !== userId) {
        throw AppError.forbidden("Not authorized to cancel this ride");
    }

    await prisma.$transaction([
        prisma.ride.update({
            where: { id: parsedId },
            data: { status: "CANCELLED" },
        }),
        prisma.booking.updateMany({
            where: { rideId: parsedId, status: { not: "CANCELLED" } },
            data: { status: "CANCELLED" },
        }),
    ]);

    return res.status(200).json({ message: "Ride cancelled" });
});

export const searchRide = asyncHandler(async (req: Request, res: Response) => {
    const { origin, destination, departure, price, seats } = req.query;

    const where: any = {
        status: "ACTIVE",
        departure: { gte: new Date() },
    };

    if (origin) where.origin = { contains: origin, mode: "insensitive" };
    if (destination)
        where.destination = { contains: destination, mode: "insensitive" };
    if (departure) where.departure = { gte: new Date(departure as string) };
    if (seats) where.seats = { gte: Number(seats) };
    if (price) where.price = { lte: Number(price) };

    const rides = await prisma.ride.findMany({ where: where });

    return res.status(200).json({ rides });
});

export const rideDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id: rideId } = req.params;
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();
    if (!rideId || Array.isArray(rideId))
        throw AppError.badRequest("Invalid rideId");

    const parsedId = parseInt(rideId, 10);
    if (isNaN(parsedId)) {
        throw AppError.badRequest("Invalid rideId format");
    }

    const hasBooking = await prisma.booking.findFirst({
        where: {
            rideId: parsedId,
            passengerId: userId,
            status: "CONFIRMED",
        },
    });

    const ride = await prisma.ride.findUnique({
        where: { id: parsedId },
        include: {
            driver: {
                select: {
                    fullName: true,
                    avatar: true,
                    gender: true,
                    phone: hasBooking ? true : false,
                },
            },
        },
    });

    if (!ride) {
        throw AppError.notFound("Ride");
    }
    return res.status(200).json({ message: "Ride details", ride });
});
