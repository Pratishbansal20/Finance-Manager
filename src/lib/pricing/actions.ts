"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { refreshPortfolioPrices } from "@/lib/portfolio/refresh";
import { writeDailyNetWorthSnapshot } from "@/lib/networth/snapshot";

export type RefreshPricesResult = {
  ok: boolean;
  message: string;
};

export async function refreshPricesAction(): Promise<RefreshPricesResult> {
  const user = await requireUser();

  const result = await refreshPortfolioPrices();

  // Record today's net worth so the trend chart accrues history on each refresh.
  await writeDailyNetWorthSnapshot(user.id);

  revalidatePath("/dashboard");
  revalidatePath("/holdings");

  const parts: string[] = [];
  if (result.pricesUpdated > 0) {
    parts.push(`${result.pricesUpdated} price${result.pricesUpdated > 1 ? "s" : ""} updated`);
  }
  if (result.fxUpdated) parts.push("FX updated");
  if (result.pricesSkipped > 0) {
    parts.push(`${result.pricesSkipped} skipped (no quote found)`);
  }

  const message =
    parts.length > 0
      ? parts.join(" · ")
      : result.errors[0] ?? "Nothing to refresh";

  return { ok: result.ok, message };
}
