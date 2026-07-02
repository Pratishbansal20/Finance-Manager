import { z } from "zod";
import { holdingFormSchema, type HoldingFormValues } from "./schema";

// ---------------------------------------------------------------------------
// CSV bulk-import parsing (Milestone 6). Pure & framework-free so it's unit
// testable and can run on either side of the RSC boundary; the server action is
// the source of truth and re-runs this before touching the DB.
// ---------------------------------------------------------------------------

/**
 * Minimal RFC-4180-ish CSV tokenizer: handles quoted fields, escaped quotes
 * (""), and commas/newlines inside quotes. Returns a matrix of trimmed-free
 * cells (callers trim as needed).
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Normalize newlines and strip a leading BOM (Excel exports love these).
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  // Flush the trailing field/row (files without a final newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty rows (e.g. blank lines between records).
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// Header aliases → canonical field name. Lets users paste broker exports whose
// column names vary ("Avg. Cost", "Units", "Scheme Code", …).
const HEADER_ALIASES: Record<string, keyof HoldingFormValues> = {
  type: "type",
  assettype: "type",
  category: "type",
  symbol: "symbol",
  ticker: "symbol",
  scrip: "symbol",
  name: "name",
  instrument: "name",
  scheme: "name",
  schemename: "name",
  fundname: "name",
  quantity: "quantity",
  qty: "quantity",
  units: "quantity",
  shares: "quantity",
  avgbuyprice: "avgBuyPrice",
  avgprice: "avgBuyPrice",
  avgcost: "avgBuyPrice",
  averageprice: "avgBuyPrice",
  buyprice: "avgBuyPrice",
  price: "avgBuyPrice",
  source: "source",
  broker: "source",
  app: "source",
  platform: "source",
  externalid: "externalId",
  schemecode: "externalId",
  amficode: "externalId",
  isin: "externalId",
};

function normalizeKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Friendly type values → canonical InstrumentType, so a CSV can say "stock",
// "mf", "us" etc. instead of the enum literal.
const TYPE_ALIASES: Record<string, HoldingFormValues["type"]> = {
  in_stock: "IN_STOCK",
  instock: "IN_STOCK",
  stock: "IN_STOCK",
  indianstock: "IN_STOCK",
  equity: "IN_STOCK",
  nse: "IN_STOCK",
  bse: "IN_STOCK",
  mutual_fund: "MUTUAL_FUND",
  mutualfund: "MUTUAL_FUND",
  mf: "MUTUAL_FUND",
  fund: "MUTUAL_FUND",
  sip: "MUTUAL_FUND",
  us_stock: "US_STOCK",
  usstock: "US_STOCK",
  us: "US_STOCK",
  usequity: "US_STOCK",
  etf: "US_STOCK",
};

function normalizeType(raw: string): string {
  const hit = TYPE_ALIASES[normalizeKey(raw)];
  return hit ?? raw.trim().toUpperCase();
}

export type ParsedRow = {
  line: number; // 1-based data-row number (excludes the header) for messaging
  values: HoldingFormValues;
};

export type RowError = {
  line: number;
  message: string;
};

export type CsvParseResult = {
  rows: ParsedRow[];
  errors: RowError[];
  totalDataRows: number;
};

export const REQUIRED_COLUMNS = ["symbol", "name", "quantity", "avgBuyPrice"] as const;

// A CSV row's schema is the manual-entry schema, but `type` is optional here and
// defaults to IN_STOCK when a column is absent (the most common case).
const csvRowSchema = holdingFormSchema.extend({
  type: holdingFormSchema.shape.type.default("IN_STOCK"),
});

/**
 * Parse and validate a CSV string into holding rows. Returns the valid rows
 * plus per-line errors — never throws, so the UI can preview partial imports.
 */
export function parseHoldingsCsv(text: string): CsvParseResult {
  const matrix = parseCsv(text);
  if (matrix.length === 0) {
    return { rows: [], errors: [], totalDataRows: 0 };
  }

  const header = matrix[0].map((h) => HEADER_ALIASES[normalizeKey(h)]);
  const dataRows = matrix.slice(1);

  const rows: ParsedRow[] = [];
  const errors: RowError[] = [];

  dataRows.forEach((cells, idx) => {
    const line = idx + 1;
    const record: Record<string, string> = {};
    header.forEach((field, col) => {
      if (field) record[field] = (cells[col] ?? "").trim();
    });

    if (record.type) record.type = normalizeType(record.type);

    const parsed = csvRowSchema.safeParse({
      type: record.type || undefined,
      symbol: record.symbol,
      name: record.name,
      quantity: record.quantity,
      avgBuyPrice: record.avgBuyPrice,
      source: record.source || undefined,
      externalId: record.externalId ?? "",
    });

    if (parsed.success) {
      rows.push({ line, values: parsed.data });
    } else {
      const first = parsed.error.issues[0];
      const path = first?.path?.join(".") || "row";
      errors.push({ line, message: `${path}: ${first?.message ?? "invalid"}` });
    }
  });

  return { rows, errors, totalDataRows: dataRows.length };
}

// Re-exported so the client preview and the server action agree on the type.
export type { HoldingFormValues };
export const csvRowValidator = z.array(csvRowSchema);
