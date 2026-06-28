import { prisma } from "@/lib/db/prisma";

// Re-export shared types and labels so server-side callers that already
// import from this file continue to work without changing their imports.
export {
  type SipView,
  SIP_FREQUENCY_LABELS,
} from "./constants";

import type { SipView } from "./constants";

export async function getSipPlans(userId: string): Promise<SipView[]> {
  const rows = await prisma.sipPlan.findMany({
    where: { userId },
    include: { instrument: true },
    orderBy: { nextDate: "asc" },
  });
  return rows.map((s) => ({
    id: s.id,
    instrumentId: s.instrumentId,
    fundName: s.instrument.name,
    fundSymbol: s.instrument.symbol,
    amountInr: s.amountInr.toNumber(),
    frequency: s.frequency,
    dayOfMonth: s.dayOfMonth,
    nextDate: s.nextDate,
    active: s.active,
    source: s.source,
  }));
}

// Total monthly SIP commitment (active monthly plans only).
export function monthlySipTotal(sips: SipView[]): number {
  return sips
    .filter((s) => s.active && s.frequency === "MONTHLY")
    .reduce((a, s) => a + s.amountInr, 0);
}
