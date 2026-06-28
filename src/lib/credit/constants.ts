// Shared types and labels for credit scores.
// This file is safe to import in client components (no Prisma dependency).

import type { CreditBureau } from "@/generated/prisma";

export type CreditScoreView = {
  id: string;
  bureau: CreditBureau;
  score: number;
  asOf: Date;
};

export const CREDIT_BUREAU_LABELS: Record<CreditBureau, string> = {
  CIBIL: "CIBIL",
  EXPERIAN: "Experian",
  CRIF: "CRIF High Mark",
  EQUIFAX: "Equifax",
};

// CIBIL-style band (300–900) for color/labeling.
export function scoreBand(score: number): "poor" | "fair" | "good" | "excellent" {
  if (score >= 800) return "excellent";
  if (score >= 750) return "good";
  if (score >= 650) return "fair";
  return "poor";
}
