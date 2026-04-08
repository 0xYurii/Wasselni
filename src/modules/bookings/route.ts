import { Router } from "express";
import {
    createBooking,
    myBookings,
    bookingDetails,
    cancelBooking,
} from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import { createBookingSchema } from "../../core/validators/bookings.validators.js";

const bookingsRoute = Router();

bookingsRoute.get("/my-bookings", authenticateToken, myBookings);
bookingsRoute.get("/:id", authenticateToken, bookingDetails);
bookingsRoute.post(
    "/",
    authenticateToken,
    validate(createBookingSchema, "body"),
    createBooking,
);
bookingsRoute.patch("/:id/cancel", authenticateToken, cancelBooking);

export default bookingsRoute;
