import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

// USD→INR from the latest FxRate row, with a documented fallback when none exists.
export const FALLBACK_USD_INR = new Prisma.Decimal("86");

export async function getUsdInrRate(): Promise<{
  rate: Prisma.Decimal;
  isLive: boolean;
}> {
  const row = await prisma.fxRate.findFirst({
    where: { base: "USD", quote: "INR" },
    orderBy: { asOf: "desc" },
  });
  return row
    ? { rate: row.rate, isLive: true }
    : { rate: FALLBACK_USD_INR, isLive: false };
}
