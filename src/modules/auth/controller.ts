import { Request, Response } from "express";
import prisma from "../../config/prisma.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ message: "Google token missing" });
    }

    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new Error("Invalid Google Payload");

    let user = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (!user) {
        await prisma.user.create({
            data: {
                email: payload.email,
                fullName: payload.name || "Google User",
                googleId: payload.sub,
                avatar: payload.picture,
                emailVerified: true,
            },
        });
    }

    const token = jwt.sign(
        { sub: String(user?.id), role: user?.role },
        process.env.JWT_SECRET!,
        {
            expiresIn: "1d",
        },
    );
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: "Google Auth successful",
        user: { id: user!.id, fullName: user!.fullName, email: user!.email },
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const invalidCredentialsMessage = "Invalid email or password";

    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.password) {
        return res.status(400).json({ message: invalidCredentialsMessage });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(400).json({ message: invalidCredentialsMessage });
    }

    const token = jwt.sign(
        { sub: String(user.id), role: user.role },
        process.env.JWT_SECRET!,
        {
            expiresIn: "1d",
        },
    );

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: "Login successful",
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        },
    });
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            message: "Full name, email and password are required",
        });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ message: "Email already used" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            fullName,
            email,
            password: hashedPassword,
        },
    });

    const token = jwt.sign(
        {
            sub: String(user.id),
            role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" },
    );

    return res.status(201).json({
        message: "Signup successful",
        token,
        user: { id: user.id, fullName: user.fullName, email: user.email },
    });
});

export const getCurrentUser = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                phone: true,
                gender: true,
                dateOfBirth: true,
                bio: true,
                avatar: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "About me",
            user: user,
        });
    },
);
