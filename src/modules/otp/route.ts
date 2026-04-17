import { Router } from "express";
import { send, verify } from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import { phoneBodySchema } from "../../core/validators/user.validators.js";

const route = Router();

route.post("/send", authenticateToken, validate(phoneBodySchema, "body"), send);
route.post(
    "/verify",
    authenticateToken,
    validate(phoneBodySchema, "body"),
    verify,
);
export default route;
