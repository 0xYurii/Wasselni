import { Router } from "express";
import {
    createRide,
    myRides,
    cancelRide,
    searchRide,
    rideDetails,
    getRidePassengers,
    updateRide,
} from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
    createRideSchema,
    searchSchema,
    updateRideSchema,
} from "../../core/validators/rides.validators.js";

const ridesRoute = Router();

// GET
ridesRoute.get("/", validate(searchSchema, "query"), searchRide);
ridesRoute.get("/created", authenticateToken, myRides);
ridesRoute.get("/:id", rideDetails);
ridesRoute.get("/:id/passengers", authenticateToken, getRidePassengers);

// POST & PATCH
ridesRoute.post(
    "/",
    authenticateToken,
    validate(createRideSchema, "body"),
    createRide,
);
ridesRoute.patch("/:id/cancel", authenticateToken, cancelRide);
ridesRoute.patch(
    "/:id",
    authenticateToken,
    validate(updateRideSchema, "body"),
    updateRide,
);

export default ridesRoute;
