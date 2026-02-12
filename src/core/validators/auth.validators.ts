import { z } from "zod";

export const authPayloadSchema = z.object({
    sub: z.string().regex(/^\d+$/),
});
