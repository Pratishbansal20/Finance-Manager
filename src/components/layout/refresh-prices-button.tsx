"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshPricesAction } from "@/lib/pricing/actions";
import type { PricingStatus } from "@/lib/pricing/queries";

export function RefreshPricesButton({ status }: { status: PricingStatus }) {
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`hidden text-xs sm:inline ${
          status.isStale || !status.hasLivePrices
            ? "text-muted-foreground"
            : "text-gain"
        }`}
        title={
          status.lastRefreshedAt
            ? `Last price data: ${status.lastRefreshedAt.toLocaleDateString("en-IN")}`
            : undefined
        }
      >
        {flash ?? status.label}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={pending}
        onClick={() => {
          setFlash(null);
          startTransition(async () => {
            const result = await refreshPricesAction();
            setFlash(result.message);
            setTimeout(() => setFlash(null), 4000);
          });
        }}
      >
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Refreshing…" : "Refresh"}
      </Button>
    </div>
  );
}
