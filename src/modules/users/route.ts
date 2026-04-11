import { Router } from "express";
import {
    stats,
    addReview,
    getUserReviews,
    getMyReviews,
} from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { createReviewSchema } from "../../core/validators/user.validators.js";
import { validate } from "../../core/middleware/validate.js";

const usersRoute = Router();

// GET
usersRoute.get("/me/stats", authenticateToken, stats);
usersRoute.get("/me/reviews", authenticateToken, getMyReviews);
usersRoute.get("/:id/reviews", getUserReviews);

// POST
usersRoute.post(
    "/reviews",
    validate(createReviewSchema, "body"),
    authenticateToken,
    addReview,
);

export default usersRoute;
