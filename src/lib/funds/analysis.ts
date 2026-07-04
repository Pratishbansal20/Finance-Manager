// Pure mutual-fund analysis engine. All inputs are plain numbers so this is
// trivially unit-testable and reusable across pages.

// One constituent (a stock the fund owns), weight is % of that fund (0–100).
export type Constituent = {
  stock: string;
  sector: string;
  weightPct: number;
};

// A fund the user holds, with how much money is in it and its constituents.
export type FundConstituents = {
  instrumentId: string;
  fundName: string;
  valueInr: number;
  constituents: Constituent[];
};

// Fund disclosures spell the same company differently ("HDFC Bank Ltd." vs
// "HDFC Bank"); normalize to a match key so overlap actually lines up.
export function normalizeStock(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|the|inc|co)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Overlap: how much of two funds is the same. Sum of min(weight) over shared
// stocks → the % of a fund duplicated by the other. 0 = no overlap, 100 = same.
// ---------------------------------------------------------------------------

export type OverlapPair = {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  overlapPct: number;
  commonStocks: number;
};

export function pairwiseOverlap(
  a: FundConstituents,
  b: FundConstituents,
): { overlapPct: number; commonStocks: number } {
  const bMap = new Map<string, number>();
  for (const c of b.constituents) {
    bMap.set(normalizeStock(c.stock), (bMap.get(normalizeStock(c.stock)) ?? 0) + c.weightPct);
  }
  let overlap = 0;
  let common = 0;
  const seen = new Set<string>();
  const aAgg = new Map<string, number>();
  for (const c of a.constituents) {
    const k = normalizeStock(c.stock);
    aAgg.set(k, (aAgg.get(k) ?? 0) + c.weightPct);
  }
  for (const [k, aw] of aAgg) {
    const bw = bMap.get(k);
    if (bw !== undefined && !seen.has(k)) {
      overlap += Math.min(aw, bw);
      common += 1;
      seen.add(k);
    }
  }
  return { overlapPct: overlap, commonStocks: common };
}

export function overlapMatrix(funds: FundConstituents[]): OverlapPair[] {
  const pairs: OverlapPair[] = [];
  for (let i = 0; i < funds.length; i++) {
    for (let j = i + 1; j < funds.length; j++) {
      const { overlapPct, commonStocks } = pairwiseOverlap(funds[i], funds[j]);
      pairs.push({
        aId: funds[i].instrumentId,
        bId: funds[j].instrumentId,
        aName: funds[i].fundName,
        bName: funds[j].fundName,
        overlapPct,
        commonStocks,
      });
    }
  }
  return pairs.sort((x, y) => y.overlapPct - x.overlapPct);
}

// ---------------------------------------------------------------------------
// True company exposure across the whole MF sleeve: for each stock, sum
// (money in fund × its weight in that fund). "You actually own ₹X of HDFC Bank."
// ---------------------------------------------------------------------------

export type CompanyExposure = {
  stock: string;
  sector: string;
  valueInr: number;
  pctOfMf: number;
  fundCount: number;
};

export function companyWeightage(funds: FundConstituents[]): CompanyExposure[] {
  const totalMf = funds.reduce((a, f) => a + f.valueInr, 0);
  const map = new Map<
    string,
    { display: string; sector: string; valueInr: number; funds: Set<string> }
  >();

  for (const f of funds) {
    for (const c of f.constituents) {
      const k = normalizeStock(c.stock);
      const cur =
        map.get(k) ??
        { display: c.stock, sector: c.sector, valueInr: 0, funds: new Set<string>() };
      cur.valueInr += f.valueInr * (c.weightPct / 100);
      cur.funds.add(f.instrumentId);
      if ((cur.sector === "Unknown" || !cur.sector) && c.sector) cur.sector = c.sector;
      map.set(k, cur);
    }
  }

  return [...map.values()]
    .map((v) => ({
      stock: v.display,
      sector: v.sector,
      valueInr: v.valueInr,
      pctOfMf: totalMf > 0 ? (v.valueInr / totalMf) * 100 : 0,
      fundCount: v.funds.size,
    }))
    .sort((a, b) => b.valueInr - a.valueInr);
}

// ---------------------------------------------------------------------------
// Sector allocation across the MF sleeve.
// ---------------------------------------------------------------------------

export type SectorExposure = { sector: string; valueInr: number; pct: number };

export function sectorWeightage(funds: FundConstituents[]): SectorExposure[] {
  const totalMf = funds.reduce((a, f) => a + f.valueInr, 0);
  const map = new Map<string, number>();
  for (const f of funds) {
    for (const c of f.constituents) {
      map.set(c.sector, (map.get(c.sector) ?? 0) + f.valueInr * (c.weightPct / 100));
    }
  }
  return [...map.entries()]
    .map(([sector, valueInr]) => ({
      sector,
      valueInr,
      pct: totalMf > 0 ? (valueInr / totalMf) * 100 : 0,
    }))
    .sort((a, b) => b.valueInr - a.valueInr);
}
