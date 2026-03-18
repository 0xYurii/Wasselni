import { Router } from "express";
import { createRide, myRides, deleteRide } from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import { createRideSchema } from "../../core/validators/rides.validators.js";

const ridesRoute = Router();

ridesRoute.post(
    "/",
    authenticateToken,
    validate(createRideSchema, "body"),
    createRide,
);
ridesRoute.get("/created", authenticateToken, myRides);
ridesRoute.delete("/:id", authenticateToken, deleteRide);
export default ridesRoute;
