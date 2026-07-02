"use client";

import * as React from "react";
import { useActionState, useMemo, useRef, useState } from "react";
import { Upload, FileDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatQuantity } from "@/lib/money";
import { INSTRUMENT_TYPE_LABELS } from "@/lib/holdings/schema";
import { parseHoldingsCsv } from "@/lib/holdings/csv";
import {
  importHoldingsCsv,
  initialImportState,
} from "@/lib/holdings/import-actions";

const SAMPLE_CSV = `type,symbol,name,quantity,avgBuyPrice,source,externalId
IN_STOCK,INFY,Infosys Ltd,10,1450.50,GROWW,
US_STOCK,AAPL,Apple Inc,2.5,190.10,INDMONEY,
MUTUAL_FUND,PPFAS,Parag Parikh Flexi Cap Direct Growth,120.35,72.40,GROWW,122639`;

const PREVIEW_LIMIT = 8;

export function CsvImport() {
  const [csv, setCsv] = useState("");
  const [state, formAction, pending] = useActionState(
    importHoldingsCsv,
    initialImportState,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // Local preview — same parser the server uses, so what you see is what imports.
  const preview = useMemo(() => parseHoldingsCsv(csv), [csv]);
  const hasInput = csv.trim().length > 0;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "holdings-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paste or upload a CSV</CardTitle>
          <CardDescription>
            Columns: <code className="text-xs">symbol</code>,{" "}
            <code className="text-xs">name</code>,{" "}
            <code className="text-xs">quantity</code>,{" "}
            <code className="text-xs">avgBuyPrice</code> (required) ·{" "}
            <code className="text-xs">type</code>,{" "}
            <code className="text-xs">source</code>,{" "}
            <code className="text-xs">externalId</code> (optional). Common broker
            header names are recognised automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            spellCheck={false}
            placeholder={SAMPLE_CSV}
            className="border-input bg-transparent dark:bg-input/30 min-h-40 w-full rounded-lg border p-3 font-mono text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" />
              Choose file
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={downloadTemplate}
            >
              <FileDown className="size-4" />
              Download template
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCsv(SAMPLE_CSV)}
            >
              Load sample
            </Button>
            {csv && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCsv("")}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hasInput && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>
                  {preview.rows.length} valid ·{" "}
                  {preview.errors.length} with errors ·{" "}
                  {preview.totalDataRows} total rows
                </CardDescription>
              </div>
              <form action={formAction}>
                <input type="hidden" name="csv" value={csv} />
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={pending || preview.rows.length === 0}
                >
                  <CheckCircle2 className="size-4" />
                  {pending
                    ? "Importing…"
                    : `Import ${preview.rows.length} holding${preview.rows.length === 1 ? "" : "s"}`}
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {preview.errors.length > 0 && (
              <div className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500 flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="size-3.5" />
                  {preview.errors.length} row
                  {preview.errors.length === 1 ? "" : "s"} will be skipped
                </div>
                {preview.errors.slice(0, 5).map((e) => (
                  <div key={e.line}>
                    Row {e.line}: {e.message}
                  </div>
                ))}
                {preview.errors.length > 5 && (
                  <div>…and {preview.errors.length - 5} more.</div>
                )}
              </div>
            )}

            {preview.rows.length > 0 && (
              <div className="border-border overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Instrument</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Avg buy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.slice(0, PREVIEW_LIMIT).map((r) => (
                      <TableRow key={r.line}>
                        <TableCell>
                          <div className="font-medium">{r.values.name}</div>
                          <div className="text-muted-foreground font-mono text-xs">
                            {r.values.symbol}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px]"
                          >
                            {INSTRUMENT_TYPE_LABELS[r.values.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {(r.values.source || "MANUAL").replace("_", " ")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatQuantity(r.values.quantity)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.values.avgBuyPrice}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.rows.length > PREVIEW_LIMIT && (
                  <div className="text-muted-foreground border-border border-t px-3 py-2 text-xs">
                    …and {preview.rows.length - PREVIEW_LIMIT} more will be
                    imported.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {state.status !== "idle" && (
        <div
          className={`flex flex-col gap-1 rounded-lg border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-gain/30 bg-gain/10 text-gain"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {state.status === "success" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            {state.message}
          </div>
          {state.rowErrors.length > 0 && (
            <ul className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-xs">
              {state.rowErrors.slice(0, 8).map((e) => (
                <li key={e.line}>
                  Row {e.line}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
