import { Router } from "express";
import { login, signup, getCurrentUser,googleAuth } from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
    loginBodySchema,
    signupBodySchema,
} from "../../core/validators/user.validators.js";

const authRoute = Router();

authRoute.post("/login", validate(loginBodySchema, "body"), login);
authRoute.post("/signup", validate(signupBodySchema, "body"), signup);
authRoute.post("/google", googleAuth);

authRoute.get("/me", authenticateToken, getCurrentUser);

export default authRoute;
