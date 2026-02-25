import { z } from "zod";

export const loginBodySchema = z.object({
    email: z.string().trim().email(),
    password: z.string().trim().min(5).max(20),
});

export const signupBodySchema = z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    password: z.string().trim().min(5).max(20),
});

export const usernameParamSchema = z.object({
    username: z
        .string()
        .min(3, "Too short")
        .max(10, "max length")
        .regex(/^[a-zA-Z0-9_.]+$/, "Alphanumeric only"),
});
