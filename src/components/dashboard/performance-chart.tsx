"use client";

import * as React from "react";
import { useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatInr, formatSignedInr, formatPct } from "@/lib/money";
import type { SnapshotPoint } from "@/lib/snapshots/queries";

// SVG viewBox space; the chart scales responsively to its container width.
const W = 720;
const H = 240;
const PAD = { top: 16, right: 16, bottom: 24, left: 16 };

function niceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function PerformanceChart({ points }: { points: SnapshotPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const geom = useMemo(() => {
    if (points.length < 2) return null;

    const values = points.flatMap((p) => [p.totalValueInr, p.investedInr]);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      // Flat series — pad so the line sits mid-plane instead of on an edge.
      min -= 1;
      max += 1;
    }
    const range = max - min;
    const padded = { lo: min - range * 0.08, hi: max + range * 0.08 };

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (i / (points.length - 1)) * innerW;
    const y = (v: number) =>
      PAD.top + (1 - (v - padded.lo) / (padded.hi - padded.lo)) * innerH;

    const line = (key: "totalValueInr" | "investedInr") =>
      points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p[key])}`).join(" ");

    const valueLine = line("totalValueInr");
    const area = `${valueLine} L${x(points.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;

    return { x, y, valueLine, investedLine: line("investedInr"), area, baselineY: PAD.top + innerH };
  }, [points]);

  const latest = points[points.length - 1];
  const first = points[0];
  const pnl = latest ? latest.totalValueInr - latest.investedInr : 0;
  const pnlPct = latest && latest.investedInr > 0 ? (pnl / latest.investedInr) * 100 : 0;
  const periodChange = latest && first ? latest.totalValueInr - first.totalValueInr : 0;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || points.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, idx)));
  }

  const active = hover !== null ? points[hover] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Portfolio performance</CardTitle>
            <CardDescription>
              Value vs invested{" "}
              {points.length >= 2
                ? `· ${niceDate(first.date)} – ${niceDate(latest.date)}`
                : ""}
            </CardDescription>
          </div>
          {points.length >= 2 && (
            <div className="text-right">
              <div className="text-xl font-semibold tabular-nums">
                {formatInr(latest.totalValueInr)}
              </div>
              <div
                className={`text-xs tabular-nums ${pnl >= 0 ? "text-gain" : "text-loss"}`}
              >
                {formatSignedInr(pnl)} ({formatPct(pnlPct)}) overall
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!geom ? (
          <div className="border-border text-muted-foreground flex h-40 flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 text-center text-sm">
            <p>Your performance curve is being recorded.</p>
            <p className="text-xs">
              A point is saved each day you open the dashboard — check back
              after a couple of days (or tap Refresh) to see the trend.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Legend — identity is never color-alone (labels + line style). */}
            <div className="text-muted-foreground mb-2 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-4 rounded-full"
                  style={{ background: "var(--chart-1)" }}
                />
                Value
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0 w-4 border-t-2 border-dashed"
                  style={{ borderColor: "var(--muted-foreground)" }}
                />
                Invested
              </span>
              {active && (
                <span className="ml-auto tabular-nums">
                  {niceDate(active.date)} · {formatInr(active.totalValueInr)}
                </span>
              )}
            </div>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="h-56 w-full touch-none"
              preserveAspectRatio="none"
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            >
              {/* Recessive baseline */}
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={geom.baselineY}
                y2={geom.baselineY}
                stroke="var(--border)"
                strokeWidth={1}
              />
              {/* Area fill under Value */}
              <path d={geom.area} fill="var(--chart-1)" opacity={0.12} />
              {/* Invested — dashed neutral reference line (secondary encoding) */}
              <path
                d={geom.investedLine}
                fill="none"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
              {/* Value — solid 2px */}
              <path
                d={geom.valueLine}
                fill="none"
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Hover crosshair + markers */}
              {hover !== null && (
                <g>
                  <line
                    x1={geom.x(hover)}
                    x2={geom.x(hover)}
                    y1={PAD.top}
                    y2={geom.baselineY}
                    stroke="var(--muted-foreground)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={geom.x(hover)}
                    cy={geom.y(points[hover].investedInr)}
                    r={4}
                    fill="var(--muted-foreground)"
                    stroke="var(--card)"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={geom.x(hover)}
                    cy={geom.y(points[hover].totalValueInr)}
                    r={4.5}
                    fill="var(--chart-1)"
                    stroke="var(--card)"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}
            </svg>

            {active && (
              <div
                className="border-border bg-popover pointer-events-none absolute top-8 z-10 -translate-x-1/2 rounded-lg border px-3 py-2 text-xs shadow-md"
                style={{
                  left: `${(geom.x(hover!) / W) * 100}%`,
                }}
              >
                <div className="text-muted-foreground mb-1">
                  {niceDate(active.date)}
                </div>
                <div className="flex items-center justify-between gap-3 tabular-nums">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: "var(--chart-1)" }}
                    />
                    Value
                  </span>
                  <span className="font-medium">
                    {formatInr(active.totalValueInr)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 tabular-nums">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full border border-dashed" />
                    Invested
                  </span>
                  <span>{formatInr(active.investedInr)}</span>
                </div>
              </div>
            )}

            <p className="text-muted-foreground mt-2 text-xs">
              {periodChange >= 0 ? "Up " : "Down "}
              <span className={periodChange >= 0 ? "text-gain" : "text-loss"}>
                {formatSignedInr(periodChange)}
              </span>{" "}
              since {niceDate(first.date)}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
