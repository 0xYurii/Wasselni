import { Router } from "express";
import { createRide } from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import { createRideSchema } from "../../core/validators/rides.validators.js";

const ridesRoute = Router();

ridesRoute.post("/", authenticateToken, validate(createRideSchema, "body"), createRide);

export default ridesRoute;
