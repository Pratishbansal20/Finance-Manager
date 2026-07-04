import type { HoldingView } from "./valuation";
import type { InstrumentType, Country } from "@/generated/prisma";

export type AllocationSlice = {
  key: string;
  label: string;
  valueInr: number;
  pct: number;
};

const ASSET_CLASS_LABELS: Record<InstrumentType, string> = {
  IN_STOCK: "Indian Stocks",
  MUTUAL_FUND: "Mutual Funds",
  US_STOCK: "US Stocks",
};

const COUNTRY_LABELS: Record<Country, string> = {
  IN: "India",
  US: "United States",
};

function toSlices(map: Map<string, { label: string; value: number }>): AllocationSlice[] {
  const total = [...map.values()].reduce((a, x) => a + x.value, 0);
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      label: v.label,
      valueInr: v.value,
      pct: total > 0 ? (v.value / total) * 100 : 0,
    }))
    .sort((a, b) => b.valueInr - a.valueInr);
}

export function allocationByAssetClass(
  holdings: HoldingView[],
): AllocationSlice[] {
  const map = new Map<string, { label: string; value: number }>();
  for (const h of holdings) {
    const cur = map.get(h.type) ?? { label: ASSET_CLASS_LABELS[h.type], value: 0 };
    cur.value += h.currentValueInr;
    map.set(h.type, cur);
  }
  return toSlices(map);
}

export function allocationByCountry(holdings: HoldingView[]): AllocationSlice[] {
  const map = new Map<string, { label: string; value: number }>();
  for (const h of holdings) {
    const cur = map.get(h.country) ?? { label: COUNTRY_LABELS[h.country], value: 0 };
    cur.value += h.currentValueInr;
    map.set(h.country, cur);
  }
  return toSlices(map);
}
