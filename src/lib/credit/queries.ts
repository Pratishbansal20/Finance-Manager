import { prisma } from "@/lib/db/prisma";

// Re-export shared types and labels so server-side callers that already
// import from this file continue to work without changing their imports.
export {
  type CreditScoreView,
  CREDIT_BUREAU_LABELS,
  scoreBand,
} from "./constants";

import type { CreditScoreView } from "./constants";
import type { CreditBureau } from "@/generated/prisma";

// Latest score per bureau, most recent first.
export async function getCreditScores(
  userId: string,
): Promise<CreditScoreView[]> {
  const rows = await prisma.creditScore.findMany({
    where: { userId },
    orderBy: { asOf: "desc" },
  });
  const latestByBureau = new Map<CreditBureau, CreditScoreView>();
  for (const r of rows) {
    if (!latestByBureau.has(r.bureau)) {
      latestByBureau.set(r.bureau, {
        id: r.id,
        bureau: r.bureau,
        score: r.score,
        asOf: r.asOf,
      });
    }
  }
  return [...latestByBureau.values()];
}

// The single most recent score across all bureaus (for the headline tile).
export async function getLatestCreditScore(
  userId: string,
): Promise<CreditScoreView | null> {
  const scores = await getCreditScores(userId);
  return scores.sort((a, b) => b.asOf.getTime() - a.asOf.getTime())[0] ?? null;
}
