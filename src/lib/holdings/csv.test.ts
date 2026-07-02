import { describe, it, expect } from "vitest";
import { parseCsv, parseHoldingsCsv } from "./csv";

describe("parseCsv", () => {
  it("parses quoted fields with commas and escaped quotes", () => {
    const rows = parseCsv(
      'a,b,c\n"hello, world","she said ""hi""",3\n',
    );
    expect(rows).toEqual([
      ["a", "b", "c"],
      ['hello, world', 'she said "hi"', "3"],
    ]);
  });

  it("strips a BOM and ignores blank lines", () => {
    const rows = parseCsv("﻿x,y\n\n1,2\n");
    expect(rows).toEqual([
      ["x", "y"],
      ["1", "2"],
    ]);
  });
});

describe("parseHoldingsCsv", () => {
  it("maps aliased headers and friendly type values", () => {
    const { rows, errors } = parseHoldingsCsv(
      "Ticker,Scheme Name,Units,Avg. Cost,Broker,Category\nINFY,Infosys,10,1450.5,groww,stock",
    );
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].values).toMatchObject({
      symbol: "INFY",
      name: "Infosys",
      quantity: 10,
      avgBuyPrice: 1450.5,
      type: "IN_STOCK",
      source: "groww",
    });
  });

  it("defaults type to IN_STOCK when the column is absent", () => {
    const { rows } = parseHoldingsCsv("symbol,name,quantity,avgBuyPrice\nTCS,TCS,5,3200");
    expect(rows[0].values.type).toBe("IN_STOCK");
  });

  it("uppercases the symbol so the same instrument resolves once", () => {
    const { rows } = parseHoldingsCsv("symbol,name,quantity,avgBuyPrice\naapl,Apple,1,190");
    expect(rows[0].values.symbol).toBe("AAPL");
  });

  it("collects per-row errors instead of throwing on bad data", () => {
    const { rows, errors, totalDataRows } = parseHoldingsCsv(
      "symbol,name,quantity,avgBuyPrice\nINFY,Infosys,-3,1450\n,Missing,1,10",
    );
    expect(totalDataRows).toBe(2);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(2);
    expect(errors[0].line).toBe(1);
  });
});
