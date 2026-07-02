"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { deriveCountryCurrency } from "./schema";
import { parseHoldingsCsv } from "./csv";

export type ImportActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  imported: number;
  updated: number;
  failed: number;
  rowErrors: { line: number; message: string }[];
};

export const initialImportState: ImportActionState = {
  status: "idle",
  imported: 0,
  updated: 0,
  failed: 0,
  rowErrors: [],
};

/**
 * Bulk-import holdings from a pasted/uploaded CSV. The client previews locally,
 * but this action re-parses and re-validates server-side (never trust the
 * client) before upserting. Rows are independent: a bad row is reported and
 * skipped, it never aborts the whole import.
 */
export async function importHoldingsCsv(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const user = await requireUser();
  const csv = String(formData.get("csv") ?? "");

  if (!csv.trim()) {
    return {
      ...initialImportState,
      status: "error",
      message: "Paste or upload a CSV first.",
    };
  }

  const { rows, errors, totalDataRows } = parseHoldingsCsv(csv);

  if (totalDataRows === 0) {
    return {
      ...initialImportState,
      status: "error",
      message:
        "No data rows found — include a header row plus at least one holding.",
    };
  }

  let imported = 0;
  let updated = 0;
  const rowErrors = [...errors];

  for (const { line, values } of rows) {
    try {
      const { country, currency } = deriveCountryCurrency(values.type);
      const externalId =
        values.type === "MUTUAL_FUND" && values.externalId?.trim()
          ? values.externalId.trim()
          : undefined;

      const instrument = await prisma.instrument.upsert({
        where: { type_symbol: { type: values.type, symbol: values.symbol } },
        create: {
          type: values.type,
          symbol: values.symbol,
          name: values.name,
          country,
          currency,
          externalId: externalId ?? null,
        },
        update: {
          name: values.name,
          ...(externalId !== undefined ? { externalId } : {}),
        },
      });

      const source = values.source?.trim() || "MANUAL";
      const key = {
        userId_instrumentId_source: {
          userId: user.id,
          instrumentId: instrument.id,
          source,
        },
      };
      const existing = await prisma.holding.findUnique({
        where: key,
        select: { id: true },
      });

      await prisma.holding.upsert({
        where: key,
        create: {
          userId: user.id,
          instrumentId: instrument.id,
          source,
          quantity: new Prisma.Decimal(String(values.quantity)),
          avgBuyPrice: new Prisma.Decimal(String(values.avgBuyPrice)),
        },
        update: {
          quantity: new Prisma.Decimal(String(values.quantity)),
          avgBuyPrice: new Prisma.Decimal(String(values.avgBuyPrice)),
        },
      });

      if (existing) updated++;
      else imported++;
    } catch (e) {
      rowErrors.push({
        line,
        message: e instanceof Error ? e.message : "import failed",
      });
    }
  }

  revalidatePath("/holdings");
  revalidatePath("/dashboard");
  revalidatePath("/import");

  const failed = rowErrors.length;
  const parts: string[] = [];
  if (imported) parts.push(`${imported} added`);
  if (updated) parts.push(`${updated} updated`);
  if (failed) parts.push(`${failed} skipped`);

  return {
    status: imported + updated > 0 ? "success" : "error",
    message: parts.join(" · ") || "Nothing to import.",
    imported,
    updated,
    failed,
    rowErrors,
  };
}
