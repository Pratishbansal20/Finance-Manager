import { z } from "zod";

export const bankAccountSchema = z.object({
  bankName: z.string().trim().min(1, "Bank name is required").max(80),
  accountType: z.enum([
    "SAVINGS",
    "CURRENT",
    "SALARY",
    "FIXED_DEPOSIT",
    "OTHER",
  ]),
  nickname: z.string().trim().max(60).optional(),
  last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter exactly 4 digits")
    .optional()
    .or(z.literal("")),
  balanceInr: z.coerce.number().min(0, "Balance can't be negative").finite(),
  accountNumber: z.string().trim().max(30).optional().or(z.literal("")),
  ifsc: z
    .string()
    .trim()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Invalid IFSC format")
    .optional()
    .or(z.literal("")),
});

export const manualAssetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.enum([
    "CASH",
    "FIXED_DEPOSIT",
    "GOLD",
    "EPF",
    "PPF",
    "REAL_ESTATE",
    "OTHER",
  ]),
  valueInr: z.coerce.number().min(0, "Value can't be negative").finite(),
  notes: z.string().trim().max(200).optional(),
});

export type BankAccountValues = z.infer<typeof bankAccountSchema>;
export type ManualAssetValues = z.infer<typeof manualAssetSchema>;
