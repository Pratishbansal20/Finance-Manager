import { z } from "zod";

const dayOfMonth = z.coerce
  .number()
  .int()
  .min(1, "Day must be 1–31")
  .max(31, "Day must be 1–31");

export const creditCardSchema = z.object({
  issuer: z.string().trim().min(1, "Issuer is required").max(80),
  network: z.enum([
    "VISA",
    "MASTERCARD",
    "RUPAY",
    "AMEX",
    "DINERS",
    "OTHER",
  ]),
  nickname: z.string().trim().max(60).optional(),
  last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter exactly 4 digits")
    .optional()
    .or(z.literal("")),
  creditLimit: z.coerce
    .number()
    .min(0, "Limit can't be negative")
    .finite(),
  currentOutstanding: z.coerce
    .number()
    .min(0, "Outstanding can't be negative")
    .finite(),
  statementDay: z
    .union([dayOfMonth, z.literal(""), z.nan()])
    .optional()
    .transform((v) => (v === "" || Number.isNaN(v) ? undefined : v)),
  dueDay: z
    .union([dayOfMonth, z.literal(""), z.nan()])
    .optional()
    .transform((v) => (v === "" || Number.isNaN(v) ? undefined : v)),
  currentDueDate: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  notes: z.string().trim().max(200).optional(),
});

export type CreditCardValues = z.infer<typeof creditCardSchema>;
