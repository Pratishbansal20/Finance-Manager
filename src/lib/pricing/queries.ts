import { prisma } from "@/lib/db/prisma";
import { getUserPortfolio } from "@/lib/holdings/queries";

export type PricingStatus = {
  hasLivePrices: boolean;
  fxIsLive: boolean;
  isStale: boolean;
  lastRefreshedAt: Date | null;
  label: string;
};

function staleAfterMs(): number {
  const hours = Number(process.env.PRICE_STALE_HOURS ?? 24);
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * 3_600_000;
}

export async function getPricingStatus(userId: string): Promise<PricingStatus> {
  const [latestPrice, portfolio] = await Promise.all([
    prisma.price.findFirst({ orderBy: { asOf: "desc" }, select: { asOf: true } }),
    getUserPortfolio(userId),
  ]);

  const lastRefreshedAt = latestPrice?.asOf ?? null;
  const isStale =
    !lastRefreshedAt ||
    Date.now() - lastRefreshedAt.getTime() > staleAfterMs();

  let label: string;
  if (!portfolio.summary.hasLivePrices) {
    label = "Cost basis · tap Refresh for live prices";
  } else if (isStale) {
    label = "Prices may be stale · tap Refresh";
  } else if (!portfolio.summary.fxIsLive) {
    label = "Live prices · fallback FX rate";
  } else {
    label = "Live prices & FX";
  }

  return {
    hasLivePrices: portfolio.summary.hasLivePrices,
    fxIsLive: portfolio.summary.fxIsLive,
    isStale,
    lastRefreshedAt,
    label,
  };
}
