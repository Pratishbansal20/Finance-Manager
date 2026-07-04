import { describe, it, expect } from "vitest";
import {
  pairwiseOverlap,
  companyWeightage,
  sectorWeightage,
  normalizeStock,
  type FundConstituents,
} from "./analysis";

const fundA: FundConstituents = {
  instrumentId: "a",
  fundName: "Fund A",
  valueInr: 100000,
  constituents: [
    { stock: "HDFC Bank Ltd.", sector: "Financials", weightPct: 10 },
    { stock: "Infosys Ltd", sector: "IT", weightPct: 8 },
    { stock: "Reliance Industries", sector: "Energy", weightPct: 6 },
  ],
};

const fundB: FundConstituents = {
  instrumentId: "b",
  fundName: "Fund B",
  valueInr: 50000,
  constituents: [
    { stock: "HDFC Bank", sector: "Financials", weightPct: 7 }, // same co, diff spelling
    { stock: "TCS", sector: "IT", weightPct: 9 },
  ],
};

describe("normalizeStock", () => {
  it("matches different spellings of the same company", () => {
    expect(normalizeStock("HDFC Bank Ltd.")).toBe(normalizeStock("HDFC Bank"));
  });
});

describe("pairwiseOverlap", () => {
  it("sums min-weight over shared stocks", () => {
    const { overlapPct, commonStocks } = pairwiseOverlap(fundA, fundB);
    // Only HDFC Bank is shared: min(10, 7) = 7
    expect(commonStocks).toBe(1);
    expect(overlapPct).toBeCloseTo(7, 5);
  });

  it("is zero for disjoint funds", () => {
    const c: FundConstituents = {
      instrumentId: "c",
      fundName: "C",
      valueInr: 1000,
      constituents: [{ stock: "Wipro", sector: "IT", weightPct: 5 }],
    };
    expect(pairwiseOverlap(fundA, c).overlapPct).toBe(0);
  });
});

describe("companyWeightage", () => {
  it("computes true ₹ exposure weighted by money in each fund", () => {
    const result = companyWeightage([fundA, fundB]);
    const hdfc = result.find((r) => normalizeStock(r.stock) === normalizeStock("HDFC Bank"));
    // A: 100000 * 10% = 10000 ; B: 50000 * 7% = 3500 → 13500
    expect(hdfc?.valueInr).toBeCloseTo(13500, 5);
    expect(hdfc?.fundCount).toBe(2);
  });
});

describe("sectorWeightage", () => {
  it("aggregates ₹ by sector across funds", () => {
    const result = sectorWeightage([fundA, fundB]);
    const fin = result.find((r) => r.sector === "Financials");
    // HDFC Bank only: 10000 + 3500 = 13500
    expect(fin?.valueInr).toBeCloseTo(13500, 5);
  });
});
