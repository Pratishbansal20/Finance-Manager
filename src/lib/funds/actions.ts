"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { refreshFundHoldings } from "./refresh";

export type RefreshFundsResult = {
  ok: boolean;
  message: string;
};

export async function refreshFundsAction(): Promise<RefreshFundsResult> {
  await requireUser();
  const r = await refreshFundHoldings();
  revalidatePath("/funds");
  revalidatePath("/dashboard");

  const parts: string[] = [];
  if (r.updated.length) parts.push(`${r.updated.length} fund(s) updated`);
  if (r.failed.length) parts.push(`${r.failed.length} kept previous (fetch failed)`);

  return {
    ok: r.updated.length > 0 || r.failed.length === 0,
    message: parts.join(" · ") || "Nothing to refresh",
  };
}
