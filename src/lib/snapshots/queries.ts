import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { getUserPortfolio } from "@/lib/holdings/queries";

// Daily portfolio snapshots power the performance curve. There's no background
// cron at personal scale, so we record lazily: each dashboard load upserts
// today's point (idempotent per UTC day), and the curve fills in over time.

export type SnapshotPoint = {
  date: string; // YYYY-MM-DD (UTC)
  totalValueInr: number;
  investedInr: number;
};

function startOfUtcDay(d = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Upsert today's portfolio snapshot for a user. No-op when the user has no
 * holdings, so the curve never accumulates meaningless zero points.
 */
export async function recordDailySnapshot(userId: string): Promise<void> {
  const { summary } = await getUserPortfolio(userId);
  if (summary.holdingsCount === 0) return;

  const asOf = startOfUtcDay();
  const totalValueInr = new Prisma.Decimal(summary.totalValueInr.toFixed(2));
  const investedInr = new Prisma.Decimal(summary.investedInr.toFixed(2));

  await prisma.portfolioSnapshot.upsert({
    where: { userId_asOf: { userId, asOf } },
    create: { userId, asOf, totalValueInr, investedInr },
    update: { totalValueInr, investedInr },
  });
}

/** Recent snapshots (oldest → newest) for charting. */
export async function getSnapshots(
  userId: string,
  days = 90,
): Promise<SnapshotPoint[]> {
  const since = startOfUtcDay();
  since.setUTCDate(since.getUTCDate() - days);

  const rows = await prisma.portfolioSnapshot.findMany({
    where: { userId, asOf: { gte: since } },
    orderBy: { asOf: "asc" },
  });

  return rows.map((r) => ({
    date: r.asOf.toISOString().slice(0, 10),
    totalValueInr: r.totalValueInr.toNumber(),
    investedInr: r.investedInr.toNumber(),
  }));
}
