import { z } from "zod";

export const creditScoreSchema = z.object({
  bureau: z.enum(["CIBIL", "EXPERIAN", "CRIF", "EQUIFAX"]),
  // Indian bureaus use a 300–900 band.
  score: z.coerce
    .number()
    .int("Score must be a whole number")
    .min(300, "Score must be ≥ 300")
    .max(900, "Score must be ≤ 900"),
});

export type CreditScoreValues = z.infer<typeof creditScoreSchema>;
