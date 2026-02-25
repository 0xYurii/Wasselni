import { z } from "zod";

export const authPayloadSchema = z.object({
    sub: z.string().regex(/^\d+$/),
    role: z.enum(["PASSENGER", "DRIVER"]),
});
