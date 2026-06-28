import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { getUserPortfolio } from "@/lib/holdings/queries";
import {
  getBankAccounts,
  getManualAssets,
  sumBalances,
  sumAssetValues,
} from "@/lib/accounts/queries";
import { getCreditCards, sumOutstanding, dueCards } from "@/lib/cards/queries";
import {
  getLatestCreditScore,
  scoreBand,
  CREDIT_BUREAU_LABELS,
} from "@/lib/credit/queries";
import { getSipPlans, monthlySipTotal } from "@/lib/sips/queries";
import { consolidateBySource } from "@/lib/holdings/consolidation";
import { computeNetWorth } from "@/lib/networth/compute";
import { formatInr, formatPct } from "@/lib/money";

function nwClass(value: number): string {
  if (value > 0) return "text-foreground";
  if (value < 0) return "text-loss";
  return "text-muted-foreground";
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

export default async function DashboardPage() {
  const user = await requireUser();
  const [portfolio, banks, assets, cards, creditScore, sips] =
    await Promise.all([
      getUserPortfolio(user.id),
      getBankAccounts(user.id),
      getManualAssets(user.id),
      getCreditCards(user.id),
      getLatestCreditScore(user.id),
      getSipPlans(user.id),
    ]);

  const bankInr = sumBalances(banks);
  const otherAssetsInr = sumAssetValues(assets);
  const cardOutstandingInr = sumOutstanding(cards);
  const investmentsInr = portfolio.summary.totalValueInr;
  const investmentsInvestedInr = portfolio.summary.investedInr;

  const nw = computeNetWorth({
    investmentsInr,
    bankInr,
    otherAssetsInr,
    cardOutstandingInr,
  });

  const totalInvestedInr = investmentsInvestedInr + bankInr + otherAssetsInr;

  const consolidation = consolidateBySource(portfolio.holdings);
  const upcomingSips = sips.filter((s) => s.active).slice(0, 5);
  const upcomingDues = dueCards(cards).slice(0, 5);
  const monthlySip = monthlySipTotal(sips);

  // Reminders check: identify items that haven't been updated in over 15 days
  const STALE_DAYS = 15;
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS);

  const reminders: { id: string; message: string; href: string }[] = [];

  // 1. Bank accounts check
  const staleBanks = banks.filter((b) => new Date(b.asOf) < staleThreshold);
  if (staleBanks.length > 0) {
    reminders.push({
      id: "banks",
      message: `${staleBanks.length} bank account balance${staleBanks.length > 1 ? "s" : ""} haven't been updated for 15+ days.`,
      href: "/accounts",
    });
  }

  // 2. Manual assets check
  const staleAssets = assets.filter((a) => new Date(a.asOf) < staleThreshold);
  if (staleAssets.length > 0) {
    reminders.push({
      id: "assets",
      message: `${staleAssets.length} other asset value${staleAssets.length > 1 ? "s" : ""} haven't been updated for 15+ days.`,
      href: "/accounts",
    });
  }

  // 3. Credit score check
  if (creditScore && new Date(creditScore.asOf) < staleThreshold) {
    reminders.push({
      id: "credit",
      message: `Your credit score was last updated over 15 days ago.`,
      href: "/settings",
    });
  }

  // 4. Cards check
  const staleCards = cards.filter((c) => new Date(c.utilizationPct >= 0 ? new Date() : new Date()) < staleThreshold); // Cards are usually dynamic but let's check due card dates or static outstanding updates if any
  
  const everythingEmpty =
    nw.totalAssetsInr === 0 && cardOutstandingInr === 0 && !creditScore;

  if (everythingEmpty) {
    return <OverviewEmpty name={user.name} />;
  }

  const composition = [
    { label: "Investments", value: investmentsInr, href: "/holdings" },
    { label: "Bank balances", value: bankInr, href: "/accounts" },
    { label: "Other assets", value: otherAssetsInr, href: "/accounts" },
  ].filter((c) => c.value > 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Reminders section */}
      {reminders.length > 0 && (
        <div className="flex flex-col gap-2">
          {reminders.map((r) => (
            <div
              key={r.id}
              className="bg-amber-500/10 border-amber-500/20 text-amber-500 flex items-center justify-between rounded-lg border px-4 py-2.5 text-xs font-medium"
            >
              <span>{r.message}</span>
              <Link href={r.href} className="underline hover:opacity-80">
                Update now
              </Link>
            </div>
          ))}
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        {user.name ? `${user.name.split(" ")[0]}'s` : "Your"} finances, all in
        one place.
      </p>

      {/* Hero tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Tile
          label="Net worth"
          value={formatInr(nw.netWorthInr)}
          valueClass={nwClass(nw.netWorthInr)}
          hint="Assets − liabilities"
        />
        <Tile
          label="Total assets"
          value={formatInr(nw.totalAssetsInr)}
          hint="Investments + cash + more"
        />
        <Tile
          label="Total invested"
          value={formatInr(totalInvestedInr)}
          hint="Cost basis of assets"
        />
        <Tile
          label="Liabilities"
          value={formatInr(nw.totalLiabilitiesInr)}
          valueClass={nw.totalLiabilitiesInr > 0 ? "text-loss" : undefined}
          hint="Credit-card outstanding"
        />
        <div className="col-span-2 lg:col-span-1">
          <CreditScoreTile score={creditScore} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset composition</CardTitle>
            <CardDescription>What makes up your assets</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {composition.length === 0 ? (
              <p className="text-muted-foreground text-sm">No assets yet.</p>
            ) : (
              composition.map((c) => {
                const pct =
                  nw.totalAssetsInr > 0
                    ? (c.value / nw.totalAssetsInr) * 100
                    : 0;
                return (
                  <Link
                    key={c.label}
                    href={c.href}
                    className="group flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground group-hover:text-foreground">
                        {c.label}
                      </span>
                      <span className="tabular-nums">{formatInr(c.value)}</span>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* App-wise consolidation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Where it lives</CardTitle>
                <CardDescription>Investments by app</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                nativeButton={false}
                render={<Link href="/holdings" />}
              >
                Details <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {consolidation.groups.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No investments yet.
              </p>
            ) : (
              consolidation.groups.map((g) => (
                <div
                  key={g.source}
                  className="flex items-center justify-between gap-4 py-1.5"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{g.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {g.count} holding{g.count > 1 ? "s" : ""} ·{" "}
                      {g.weightPct.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-sm">{formatInr(g.valueInr)}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatPct(g.pnlPct)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming SIPs & card dues */}
      {(upcomingSips.length > 0 || upcomingDues.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {upcomingSips.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">Upcoming SIPs</CardTitle>
                    <CardDescription>
                      {formatInr(monthlySip)} / month committed
                    </CardDescription>
                  </div>
                  <CalendarClock className="text-muted-foreground size-5" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {upcomingSips.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-4 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {s.fundName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {dateFmt.format(s.nextDate)} · day {s.dayOfMonth}
                      </div>
                    </div>
                    <span className="text-sm tabular-nums">
                      {formatInr(s.amountInr)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {upcomingDues.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">Card dues</CardTitle>
                    <CardDescription>Due within 7 days</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    nativeButton={false}
                    render={<Link href="/cards" />}
                  >
                    Cards <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {upcomingDues.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-4 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {c.nickname ?? c.issuer}
                        {c.last4 ? ` · •• ${c.last4}` : ""}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {c.currentDueDate
                          ? dateFmt.format(c.currentDueDate)
                          : c.dueDay
                            ? `Day ${c.dueDay}`
                            : "—"}
                      </div>
                    </div>
                    <span className="text-loss text-sm tabular-nums">
                      {formatInr(c.currentOutstanding)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  valueClass,
  hint,
}: {
  label: string;
  value: string;
  valueClass?: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={`text-2xl font-semibold tabular-nums ${valueClass ?? ""}`}
        >
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

function CreditScoreTile({
  score,
}: {
  score: { bureau: keyof typeof CREDIT_BUREAU_LABELS; score: number } | null;
}) {
  if (!score) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Credit score</CardDescription>
          <CardTitle className="text-2xl font-semibold">—</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Add it in Settings</p>
        </CardContent>
      </Card>
    );
  }
  const band = scoreBand(score.score);
  const color =
    band === "excellent" || band === "good"
      ? "text-gain"
      : band === "poor"
        ? "text-loss"
        : "text-foreground";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Credit score</CardDescription>
        <CardTitle className={`text-2xl font-semibold tabular-nums ${color}`}>
          {score.score}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs capitalize">
          {band} · {CREDIT_BUREAU_LABELS[score.bureau]}
        </p>
      </CardContent>
    </Card>
  );
}

function OverviewEmpty({ name }: { name?: string | null }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Welcome{name ? `, ${name.split(" ")[0]}` : ""} — let&apos;s build your
        net worth.
      </p>
      <div className="border-border flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-medium">Nothing here yet</p>
          <p className="text-muted-foreground max-w-sm text-sm text-balance">
            Add investments, bank balances, and other assets to see your full
            net worth in one place.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button nativeButton={false} render={<Link href="/holdings" />}>
            Add investments
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/accounts" />}
          >
            Add accounts
          </Button>
        </div>
      </div>
    </div>
  );
}
