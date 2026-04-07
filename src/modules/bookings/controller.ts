import { Request, Response } from "express";
import prisma from "../../config/prisma.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { AppError } from "../../core/errors/AppError.js";

export const createBooking = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = Number(req.userId);
        const rideId = parseInt(req.body.rideId, 10);

        if (!userId || isNaN(userId))
            return res.status(401).json({ message: "Unauthorized" });
        if (!rideId || isNaN(rideId))
            return res
                .status(400)
                .json({ message: "rideId must be a valid number" });

        const booking = await prisma.$transaction(async (tx) => {
            const ride = await tx.ride.findUnique({
                where: { id: rideId },
                include: {
                    _count: {
                        select: {
                            bookings: {
                                where: { status: { not: "CANCELLED" } },
                            },
                        },
                    },
                },
            });

            if (!ride) throw AppError.notFound("Ride");
            if (ride.driverId === userId)
                throw AppError.forbidden("Cannot book your own ride");
            if (new Date() >= ride.departure)
                throw AppError.badRequest(
                    "Cannot book a ride that has already departed",
                );

            const invalidStatuses = [
                "CANCELLED",
                "COMPLETED",
                "IN_PROGRESS",
                "FULL",
            ];
            if (invalidStatuses.includes(ride.status)) {
                const messages: Record<string, string> = {
                    CANCELLED: "Ride is cancelled",
                    COMPLETED: "Ride is already completed",
                    IN_PROGRESS: "Ride is already in progress",
                    FULL: "No available seats",
                };
                throw AppError.badRequest(messages[ride.status]);
            }

            // Check seat availability
            const availableSeats = ride.seats - ride._count.bookings;
            if (availableSeats <= 0)
                throw AppError.badRequest("No available seats");

            // Prevent double booking
            const existingBooking = await tx.booking.findFirst({
                where: {
                    rideId,
                    passengerId: userId,
                    status: { not: "CANCELLED" },
                },
            });
            if (existingBooking)
                throw AppError.badRequest("You already booked this ride");

            const newBooking = await tx.booking.create({
                data: { rideId, passengerId: userId },
                include: {
                    ride: {
                        include: {
                            driver: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });

            if (availableSeats - 1 === 0) {
                await tx.ride.update({
                    where: { id: rideId },
                    data: { status: "FULL" },
                });
            }

            return newBooking;
        });

        return res.status(201).json({ message: "Booking created", booking });
    },
);

export const myBookings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId || isNaN(Number(userId)))
        return res.status(401).json({ message: "Unauthorized" });

    const bookings = await prisma.booking.findMany({
        where: { passengerId: userId },
        include: {
            ride: {
                include: {
                    driver: {
                        select: { id: true, fullName: true, avatar: true },
                    },
                },
            },
        },
        orderBy: { ride: { departure: "asc" } },
    });

    return res.status(200).json({ message: "My Bookings", bookings });
});

export const bookingDetails = asyncHandler(
    async (req: Request, res: Response) => {
        const { id: rideId } = req.params;
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!rideId || Array.isArray(rideId))
            return res.status(400).json({ message: "Invalid rideId" });

        const parsedId = parseInt(rideId, 10);
        if (isNaN(parsedId))
            return res
                .status(400)
                .json({ message: "Booking id must be a valid number" });

        const booking = await prisma.booking.findUnique({
            where: { id: parsedId },
            include: {
                ride: {
                    include: {
                        driver: {
                            select: { id: true, fullName: true, avatar: true },
                        },
                    },
                },
                passenger: {
                    select: { id: true, fullName: true, avatar: true },
                },
            },
        });

        if (!booking)
            return res.status(404).json({ message: "Booking not found" });
        if (booking.passengerId !== userId)
            return res.status(403).json({ message: "Unauthorized" });

        return res.status(200).json({ message: "Booking details", booking });
    },
);

export const cancelBooking = asyncHandler(
    async (req: Request, res: Response) => {
        const { id: rideId } = req.params;
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!rideId || Array.isArray(rideId))
            return res.status(400).json({ message: "Invalid rideId" });

        const parsedId = parseInt(rideId, 10);
        if (isNaN(parsedId))
            return res
                .status(400)
                .json({ message: "Booking id must be a valid number" });

        await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: parsedId },
                include: { ride: true },
            });

            if (!booking) throw AppError.notFound("Booking");
            if (booking.passengerId !== userId)
                throw AppError.forbidden("Unauthorized");
            if (booking.status === "CANCELLED")
                throw AppError.badRequest("Booking already cancelled");
            if (new Date() >= booking.ride.departure)
                throw AppError.badRequest(
                    "Cannot cancel after ride has departed",
                );

            await tx.booking.update({
                where: { id: parsedId },
                data: { status: "CANCELLED" },
            });

            //if ride was FULL set back to ACTIVE
            if (booking.ride.status === "FULL") {
                await tx.ride.update({
                    where: { id: booking.rideId },
                    data: { status: "ACTIVE" },
                });
            }
        });

        return res.status(200).json({ message: "Booking cancelled" });
    },
);
