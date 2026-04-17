import { Request, Response } from "express";
import prisma from "../../config/prisma.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { AppError } from "../../core/errors/AppError.js";

export const stats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (req.userRole !== "DRIVER")
        throw AppError.forbidden("Only drivers can see stats");

    const totalRides = await prisma.ride.count({ where: { driverId: userId } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const ridesThisMonth = await prisma.ride.count({
        where: { driverId: userId, createdAt: { gte: startOfMonth } },
    });

    return res.status(200).json({ totalRides, ridesThisMonth });
});

export const addReview = asyncHandler(async (req: Request, res: Response) => {
    const reviewerId = req.userId!;
    const { rating, comment, rideId } = req.body;

    const review = await prisma.$transaction(async (tx) => {
        const ride = await tx.ride.findUnique({
            where: { id: rideId },
        });

        if (!ride) throw AppError.notFound("Ride");
        if (ride.status !== "COMPLETED")
            throw AppError.badRequest("Can only review completed rides");

        if (ride.driverId === reviewerId)
            throw AppError.forbidden("Cannot review your own ride");

        const booking = await tx.booking.findFirst({
            where: {
                rideId,
                passengerId: reviewerId,
                status: "CONFIRMED",
            },
        });

        if (!booking)
            throw AppError.forbidden(
                "You must have a confirmed booking to review this ride",
            );

        const existing = await tx.review.findFirst({
            where: { rideId, reviewerId },
        });

        if (existing) throw AppError.conflict("You already reviewed this ride");

        return tx.review.create({
            data: {
                rating,
                comment,
                rideId,
                reviewerId,
                revieweeId: ride.driverId,
            },
        });
    });

    return res.status(201).json({ message: "Review submitted", review });
});

export const getUserReviews = asyncHandler(
    async (req: Request, res: Response) => {
        const { id: userId } = req.params;

        if (!userId || Array.isArray(userId))
            throw AppError.badRequest("Invalid userId");

        const parsedId = parseInt(userId, 10);
        if (isNaN(parsedId)) {
            throw AppError.badRequest("Invalid userId format");
        }

        const reviews = await prisma.review.findMany({
            where: { revieweeId: parsedId },
            include: {
                reviewer: {
                    select: { fullName: true, avatar: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const averageRating =
            reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : null;

        return res.status(200).json({
            reviews,
            averageRating: averageRating
                ? Math.round(averageRating * 10) / 10
                : null,
            totalReviews: reviews.length,
        });
    },
);

export const getMyReviews = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.userId!;

        const reviews = await prisma.review.findMany({
            where: { revieweeId: userId },
            include: {
                reviewer: {
                    select: { fullName: true, avatar: true },
                },
                ride: {
                    select: {
                        origin: true,
                        destination: true,
                        departure: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const averageRating =
            reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : null;

        return res.status(200).json({
            reviews,
            averageRating: averageRating
                ? Math.round(averageRating * 10) / 10
                : null,
            totalReviews: reviews.length,
        });
    },
);

export const updateProfile = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.userId;

        const { fullName, bio, phone, avatar, gender, role } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: Number(userId) },
            data: { fullName, bio, phone, avatar, gender, role },
        });

        if (role && role !== req.userRole) {
            const newToken = jwt.sign(
                {
                    sub: String(updatedUser.id),
                    role: updatedUser.role,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "5d" },
            );

            res.cookie("jwt", newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                avatar: updatedUser.avatar,
                email: updatedUser.email,
                role: updatedUser.role,
            },
        });
    },
);
