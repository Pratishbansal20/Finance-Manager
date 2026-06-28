import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma";
import { buildPortfolio } from "./valuation";

describe("buildPortfolio", () => {
  it("uses live price when available and computes P/L", () => {
    const portfolio = buildPortfolio(
      [
        {
          id: "h1",
          source: "GROWW",
          quantity: new Prisma.Decimal(10),
          avgBuyPrice: new Prisma.Decimal(100),
          instrument: {
            symbol: "INFY",
            name: "Infosys",
            type: "IN_STOCK",
            country: "IN",
            currency: "INR",
          },
          latestPrice: new Prisma.Decimal(120),
        },
      ],
      { usdInr: new Prisma.Decimal(86), fxIsLive: true },
    );

    expect(portfolio.summary.hasLivePrices).toBe(true);
    expect(portfolio.summary.totalValueInr).toBe(1200);
    expect(portfolio.summary.investedInr).toBe(1000);
    expect(portfolio.summary.pnlInr).toBe(200);
    expect(portfolio.holdings[0].hasLivePrice).toBe(true);
  });

  it("falls back to cost basis when no live price", () => {
    const portfolio = buildPortfolio(
      [
        {
          id: "h1",
          source: "MANUAL",
          quantity: new Prisma.Decimal(5),
          avgBuyPrice: new Prisma.Decimal(200),
          instrument: {
            symbol: "AAPL",
            name: "Apple",
            type: "US_STOCK",
            country: "US",
            currency: "USD",
          },
          latestPrice: null,
        },
      ],
      { usdInr: new Prisma.Decimal(86), fxIsLive: false },
    );

    expect(portfolio.summary.hasLivePrices).toBe(false);
    expect(portfolio.summary.fxIsLive).toBe(false);
    expect(portfolio.summary.pnlInr).toBe(0);
    expect(portfolio.holdings[0].hasLivePrice).toBe(false);
    expect(portfolio.holdings[0].currentValueInr).toBe(
      portfolio.holdings[0].investedInr,
    );
  });
});
