// Shared types and labels for bank accounts & manual assets.
// This file is safe to import in client components (no Prisma dependency).

import type { BankAccountType, AssetCategory } from "@/generated/prisma";

// -------- Bank account --------

export type BankAccountView = {
  id: string;
  bankName: string;
  accountType: BankAccountType;
  nickname: string | null;
  last4: string | null;
  balanceInr: number;
  asOf: Date;
};

export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  SAVINGS: "Savings",
  CURRENT: "Current",
  SALARY: "Salary",
  FIXED_DEPOSIT: "Fixed Deposit",
  OTHER: "Other",
};

// -------- Manual asset --------

export type ManualAssetView = {
  id: string;
  name: string;
  category: AssetCategory;
  valueInr: number;
  asOf: Date;
  notes: string | null;
};

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  CASH: "Cash",
  FIXED_DEPOSIT: "Fixed Deposit",
  GOLD: "Gold",
  EPF: "EPF",
  PPF: "PPF",
  REAL_ESTATE: "Real Estate",
  OTHER: "Other",
};
