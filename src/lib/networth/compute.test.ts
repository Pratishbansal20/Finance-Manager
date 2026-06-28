import { describe, expect, it } from "vitest";
import { computeNetWorth } from "./compute";

describe("computeNetWorth", () => {
  it("sums assets and subtracts liabilities", () => {
    const nw = computeNetWorth({
      investmentsInr: 500_000,
      bankInr: 100_000,
      otherAssetsInr: 50_000,
      cardOutstandingInr: 25_000,
    });
    expect(nw.totalAssetsInr).toBe(650_000);
    expect(nw.totalLiabilitiesInr).toBe(25_000);
    expect(nw.netWorthInr).toBe(625_000);
  });

  it("handles zero across the board", () => {
    const nw = computeNetWorth({
      investmentsInr: 0,
      bankInr: 0,
      otherAssetsInr: 0,
      cardOutstandingInr: 0,
    });
    expect(nw.netWorthInr).toBe(0);
  });

  it("allows negative net worth when liabilities exceed assets", () => {
    const nw = computeNetWorth({
      investmentsInr: 10_000,
      bankInr: 0,
      otherAssetsInr: 0,
      cardOutstandingInr: 50_000,
    });
    expect(nw.netWorthInr).toBe(-40_000);
  });
});
