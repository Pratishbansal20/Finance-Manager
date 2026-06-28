import { Prisma } from "@/generated/prisma";
import { FETCH_HEADERS, utcDay, type FxProvider, type FxQuote } from "./types";

const FRANKFURTER_URL = "https://api.frankfurter.app/latest";

type FrankfurterResponse = {
  date?: string;
  rates?: Record<string, number>;
};

export const frankfurterFxProvider: FxProvider = {
  source: "FRANKFURTER",

  async fetchRate(base: string, quote: string): Promise<FxQuote> {
    const url = `${FRANKFURTER_URL}?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`;
    const res = await fetch(url, { headers: FETCH_HEADERS, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Frankfurter FX fetch failed (${res.status})`);
    }

    const json = (await res.json()) as FrankfurterResponse;
    const rate = json.rates?.[quote];
    if (rate === undefined || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Frankfurter returned no ${base}/${quote} rate`);
    }

    const asOf = json.date ? utcDay(new Date(json.date)) : utcDay(new Date());

    return {
      base,
      quote,
      rate: new Prisma.Decimal(String(rate)),
      asOf,
      source: "FRANKFURTER",
    };
  },
};
