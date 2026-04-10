import { Router } from "express";
import {
    createRide,
    myRides,
    cancelRide,
    searchRide,
    rideDetails,
} from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
    createRideSchema,
    searchSchema,
} from "../../core/validators/rides.validators.js";

const ridesRoute = Router();

// GET
ridesRoute.get("/", validate(searchSchema, "query"), searchRide);

ridesRoute.get("/created", authenticateToken, myRides);

ridesRoute.get("/:id", rideDetails);

// POST
ridesRoute.post(
    "/",
    authenticateToken,
    validate(createRideSchema, "body"),
    createRide,
);

ridesRoute.patch("/:id/cancel", authenticateToken, cancelRide);

export default ridesRoute;
