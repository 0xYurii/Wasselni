import { z } from "zod";

export const createRideSchema = z.object({
    origin: z.string().min(1, "Origin is required"),
    destination: z.string().min(1, "Destination is required"),
    departure: z.string().datetime({ message: "Invalid departure datetime" }),
    price: z.number().positive("Price must be positive"),
    seats: z.number().int().positive("Seats must be a positive integer"),
});

export const searchSchema = z.object({
    origin: z.string().optional(),
    destination: z.string().optional(),
    departure: z.coerce.date().optional(),
    seats: z.coerce.number().optional(),
    price: z.coerce.number().optional(),
});
