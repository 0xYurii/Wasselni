import { z } from "zod";

export const createBookingSchema = z.object({
    rideId: z.number({
        required_error: "rideId is required",
        invalid_type_error: "rideId must be a number",
    })
    .int("rideId must be an integer")
    .positive("rideId must be a positive number"),
});