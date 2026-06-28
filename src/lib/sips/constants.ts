// Shared types and labels for SIP plans.
// This file is safe to import in client components (no Prisma dependency).

import type { SipFrequency } from "@/generated/prisma";

export type SipView = {
  id: string;
  instrumentId: string;
  fundName: string;
  fundSymbol: string;
  amountInr: number;
  frequency: SipFrequency;
  dayOfMonth: number;
  nextDate: Date;
  active: boolean;
  source: string;
};

export const SIP_FREQUENCY_LABELS: Record<SipFrequency, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};
