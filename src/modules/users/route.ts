import { Router } from "express";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";

const usersRoute = Router();

usersRoute.get("/me/stats", authenticateToken, usersRoute);

export default usersRoute;
