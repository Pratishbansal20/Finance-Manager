import { describe, expect, it } from "vitest";
import { parseAmfiNavFile } from "./amfi-nav";

describe("parseAmfiNavFile", () => {
  it("parses semicolon-delimited AMFI rows", () => {
    const sample = `Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
120503;INF846K01EW2;INF846K01EX8;Parag Parikh Flexi Cap Fund Direct Growth;85.1234;28-Jun-2026`;

    const map = parseAmfiNavFile(sample);
    expect(map.size).toBe(1);
    const row = map.get("120503");
    expect(row?.name).toContain("Parag Parikh");
    expect(row?.nav).toBeCloseTo(85.1234);
    expect(row?.asOf.getUTCFullYear()).toBe(2026);
  });
});
