import { z } from "zod";

// A SIP is a recurring investment into a mutual fund. The user identifies the
// fund by symbol + name (an Instrument is found/created, like holdings).
export const sipSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(40)
    .transform((s) => s.toUpperCase()),
  name: z.string().trim().min(1, "Fund name is required").max(120),
  amountInr: z.coerce.number().positive("Amount must be greater than 0").finite(),
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY"]),
  dayOfMonth: z.coerce
    .number()
    .int()
    .min(1, "Day must be 1–31")
    .max(31, "Day must be 1–31"),
  source: z.string().trim().max(40).optional(),
});

export type SipValues = z.infer<typeof sipSchema>;

// Next occurrence (today or later) of the given day-of-month, clamped to month length.
export function nextDateForDay(dayOfMonth: number, from = new Date()): Date {
  const clamp = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.min(dayOfMonth, lastDay);
  };
  const y = from.getFullYear();
  const m = from.getMonth();
  const thisMonth = new Date(y, m, clamp(y, m));
  if (thisMonth >= new Date(y, m, from.getDate())) return thisMonth;
  const nm = new Date(y, m + 1, 1);
  return new Date(nm.getFullYear(), nm.getMonth(), clamp(nm.getFullYear(), nm.getMonth()));
}
