import { prisma } from "@/lib/db/prisma";

// Re-export shared types and labels so server-side callers that already
// import from this file continue to work without changing their imports.
export {
  type BankAccountView,
  type ManualAssetView,
  BANK_ACCOUNT_TYPE_LABELS,
  ASSET_CATEGORY_LABELS,
} from "./constants";

import type { BankAccountView, ManualAssetView } from "./constants";

export async function getBankAccounts(
  userId: string,
): Promise<BankAccountView[]> {
  const rows = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: { balanceInr: "desc" },
  });
  return rows.map((b) => ({
    id: b.id,
    bankName: b.bankName,
    accountType: b.accountType,
    nickname: b.nickname,
    last4: b.last4,
    balanceInr: b.balanceInr.toNumber(),
    asOf: b.asOf,
  }));
}

export async function getManualAssets(
  userId: string,
): Promise<ManualAssetView[]> {
  const rows = await prisma.manualAsset.findMany({
    where: { userId },
    orderBy: { valueInr: "desc" },
  });
  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    valueInr: a.valueInr.toNumber(),
    asOf: a.asOf,
    notes: a.notes,
  }));
}

export function sumBalances(accounts: { balanceInr: number }[]): number {
  return accounts.reduce((a, x) => a + x.balanceInr, 0);
}

export function sumAssetValues(assets: { valueInr: number }[]): number {
  return assets.reduce((a, x) => a + x.valueInr, 0);
}
