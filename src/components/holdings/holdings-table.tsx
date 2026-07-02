"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatInr,
  formatNative,
  formatPct,
  formatQuantity,
  formatSignedInr,
} from "@/lib/money";
import type { HoldingView } from "@/lib/portfolio/valuation";
import type { InstrumentType } from "@/generated/prisma";
import { HoldingFormDialog } from "./holding-form-dialog";
import { DeleteHoldingDialog } from "./delete-holding-dialog";
import { ArrowUpDown } from "lucide-react";

const TYPE_BADGE: Record<InstrumentType, string> = {
  IN_STOCK: "IN",
  MUTUAL_FUND: "MF",
  US_STOCK: "US",
};

function pnlClass(value: number): string {
  if (value > 0) return "text-gain";
  if (value < 0) return "text-loss";
  return "text-muted-foreground";
}

type SortField = "name" | "source" | "quantity" | "invested" | "value" | "pnl" | "weight";
type SortOrder = "asc" | "desc";

// Declared at module scope (not inside the component) so React keeps a stable
// component identity across renders — otherwise the header buttons remount and
// lose focus every time the table re-sorts.
function SortHeader({
  field,
  activeField,
  onSort,
  children,
}: {
  field: SortField;
  activeField: SortField;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = activeField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="group inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
    >
      {children}
      <ArrowUpDown
        className={`size-3.5 opacity-60 group-hover:opacity-100 ${isActive ? "text-primary opacity-100" : ""}`}
      />
    </button>
  );
}

export function HoldingsTable({ holdings: initialHoldings }: { holdings: HoldingView[] }) {
  const [sortField, setSortField] = React.useState<SortField>("weight");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");

  const sortedHoldings = React.useMemo(() => {
    return [...initialHoldings].sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      switch (sortField) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "source":
          valA = a.source.toLowerCase();
          valB = b.source.toLowerCase();
          break;
        case "quantity":
          valA = a.quantity;
          valB = b.quantity;
          break;
        case "invested":
          valA = a.investedInr;
          valB = b.investedInr;
          break;
        case "value":
          valA = a.currentValueInr;
          valB = b.currentValueInr;
          break;
        case "pnl":
          valA = a.pnlInr;
          valB = b.pnlInr;
          break;
        case "weight":
          valA = a.weightPct;
          valB = b.weightPct;
          break;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [initialHoldings, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc"); // Default to desc for numeric/value fields
    }
  };

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              <SortHeader activeField={sortField} onSort={handleSort} field="name">Instrument</SortHeader>
            </TableHead>
            <TableHead>
              <SortHeader activeField={sortField} onSort={handleSort} field="source">Source</SortHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortHeader activeField={sortField} onSort={handleSort} field="quantity">Qty</SortHeader>
            </TableHead>
            <TableHead className="text-right">Avg buy</TableHead>
            <TableHead className="text-right">
              <SortHeader activeField={sortField} onSort={handleSort} field="invested">Invested</SortHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortHeader activeField={sortField} onSort={handleSort} field="value">Value</SortHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortHeader activeField={sortField} onSort={handleSort} field="pnl">P/L</SortHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortHeader activeField={sortField} onSort={handleSort} field="weight">Weight</SortHeader>
            </TableHead>
            <TableHead className="w-[1%]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHoldings.map((h) => (
            <TableRow key={h.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                     {TYPE_BADGE[h.type]}
                  </Badge>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{h.name}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {h.symbol}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {h.source.replace("_", " ")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatQuantity(h.quantity)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNative(h.avgBuyPrice, h.currency)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatInr(h.investedInr)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <div>{formatInr(h.currentValueInr)}</div>
                {!h.hasLivePrice && (
                  <div className="text-muted-foreground text-[10px]">cost basis</div>
                )}
              </TableCell>
              <TableCell
                className={`text-right tabular-nums ${pnlClass(h.pnlInr)}`}
              >
                <div>{formatSignedInr(h.pnlInr)}</div>
                <div className="text-xs">{formatPct(h.pnlPct)}</div>
              </TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">
                {h.weightPct.toFixed(1)}%
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <HoldingFormDialog
                    mode="edit"
                    initial={h}
                    trigger="icon"
                    label="Edit holding"
                  />
                  <DeleteHoldingDialog id={h.id} name={h.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
