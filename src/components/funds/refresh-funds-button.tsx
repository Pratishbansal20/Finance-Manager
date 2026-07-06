"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshFundsAction } from "@/lib/funds/actions";

export function RefreshFundsButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onClick() {
    setMsg(null);
    startTransition(async () => {
      const r = await refreshFundsAction();
      setMsg(r.message);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-muted-foreground text-xs">{msg}</span>}
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={onClick}
        disabled={pending}
      >
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Refreshing…" : "Refresh holdings"}
      </Button>
    </div>
  );
}
