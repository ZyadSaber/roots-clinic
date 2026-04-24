"use client";

import { TrendingUp, TrendingDown, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import type { FinanceKPIs, FinancePeriodStats, FinanceTodayStats } from "@/types/finance";
import type { DateRangeValue } from "./DateRangePicker";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " " + currency;
}

function pct(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return parseFloat(((current - prev) / prev * 100).toFixed(1));
}

// ── Monthly stat card with MoM change ────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  subtitle?: string;
  icon: React.ReactNode;
  inverseColor?: boolean;
}

function StatCard({ title, value, change, subtitle, icon, inverseColor }: StatCardProps) {
  const t = useTranslations("Finance.statCards");
  const positive = inverseColor ? change <= 0 : change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-full bg-primary/10 text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {change >= 0 ? (
            <ArrowUpRight className={`h-4 w-4 ${positive ? "text-green-500" : "text-destructive"}`} />
          ) : (
            <ArrowDownRight className={`h-4 w-4 ${positive ? "text-green-500" : "text-destructive"}`} />
          )}
          <span className={`text-xs font-medium ${positive ? "text-green-500" : "text-destructive"}`}>
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-muted-foreground">{t("vsLastMonth")}</span>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ── Period stat card (no change indicator) ───────────────────────────────────

interface PeriodCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: "green" | "red" | "default";
}

function PeriodCard({ title, value, subtitle, icon, accent = "default" }: PeriodCardProps) {
  const accentClass =
    accent === "green" ? "bg-green-500/10 text-green-600" :
    accent === "red"   ? "bg-destructive/10 text-destructive" :
                         "bg-primary/10 text-primary";

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full ${accentClass}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ── Today's bench card (split) ────────────────────────────────────────────────

function TodayBenchCard({ todayStats, currency }: { todayStats: FinanceTodayStats | undefined; currency: string }) {
  const t = useTranslations("Finance.statCards");

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-primary flex items-center gap-1.5">
          <Wallet className="h-4 w-4" />
          {t("todayBench")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex divide-x divide-border">
        <div className="flex-1 pr-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-0.5">{t("income")}</p>
          {todayStats ? (
            <p className="text-lg font-bold text-green-600">{formatCurrency(Number(todayStats.today_income), currency)}</p>
          ) : (
            <Skeleton className="h-6 w-20 mt-0.5" />
          )}
        </div>
        <div className="flex-1 pl-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-destructive mb-0.5">{t("expenses")}</p>
          {todayStats ? (
            <p className="text-lg font-bold text-destructive">{formatCurrency(Number(todayStats.today_expenses), currency)}</p>
          ) : (
            <Skeleton className="h-6 w-20 mt-0.5" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

// ── Period label ──────────────────────────────────────────────────────────────

function periodLabel(dateRange: DateRangeValue | null): string {
  if (!dateRange) return "All time";
  const from = new Date(dateRange.from);
  const to = new Date(dateRange.to);
  if (dateRange.from === dateRange.to) return format(from, "dd MMM yyyy");
  return `${format(from, "dd MMM")} – ${format(to, "dd MMM yyyy")}`;
}

// ── Public component ──────────────────────────────────────────────────────────

interface FinanceStatCardsProps {
  kpis: FinanceKPIs | undefined;
  periodStats: FinancePeriodStats | undefined;
  todayStats: FinanceTodayStats | undefined;
  dateRange: DateRangeValue | null;
}

export function FinanceStatCards({ kpis, periodStats, todayStats, dateRange }: FinanceStatCardsProps) {
  const t = useTranslations("Finance.statCards");
  const commonT = useTranslations("Common");
  const currency = commonT("currency");

  // Current month label: "April 2026"
  const monthLabel = format(new Date(), "MMMM yyyy");

  // ── Monthly section ───────────────────────────────────────────────────────
  const monthlySection = kpis ? (() => {
    const revenue   = Number(kpis.monthly_revenue);
    const prevRev   = Number(kpis.prev_month_revenue);
    const expenses  = Number(kpis.monthly_expenses);
    const prevExp   = Number(kpis.prev_month_expenses);
    const outstanding = Number(kpis.total_outstanding);
    const netProfit   = revenue - expenses;
    const prevNet     = prevRev - prevExp;

    return (
      <>
        <StatCard
          title={t("monthlyRevenue")}
          value={formatCurrency(revenue, currency)}
          change={pct(revenue, prevRev)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title={t("monthlyExpenses")}
          value={formatCurrency(expenses, currency)}
          change={pct(expenses, prevExp)}
          icon={<TrendingDown className="h-4 w-4" />}
          inverseColor
        />
        <StatCard
          title={t("outstanding")}
          value={formatCurrency(outstanding, currency)}
          change={0}
          subtitle={`${kpis.outstanding_invoice_count} ${t("invoices")}`}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          title={t("netProfit")}
          value={formatCurrency(netProfit, currency)}
          change={pct(netProfit, prevNet)}
          icon={<DollarSign className="h-4 w-4" />}
        />
      </>
    );
  })() : (
    <>
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </>
  );

  // ── Period section ────────────────────────────────────────────────────────
  const periodSection = periodStats ? (() => {
    const rev  = Number(periodStats.period_revenue);
    const exp  = Number(periodStats.period_expenses);
    const out  = Number(periodStats.period_outstanding);
    const net  = rev - exp;

    return (
      <>
        <PeriodCard
          title={t("periodRevenue")}
          value={formatCurrency(rev, currency)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="green"
        />
        <PeriodCard
          title={t("periodExpenses")}
          value={formatCurrency(exp, currency)}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="red"
        />
        <PeriodCard
          title={t("periodOutstanding")}
          value={formatCurrency(out, currency)}
          subtitle={`${periodStats.period_outstanding_count} ${t("invoices")}`}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <PeriodCard
          title={t("periodNetProfit")}
          value={formatCurrency(net, currency)}
          icon={<DollarSign className="h-4 w-4" />}
          accent={net >= 0 ? "green" : "red"}
        />
      </>
    );
  })() : (
    <>
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </>
  );

  return (
    <div className="space-y-5">
      {/* ── Monthly section ── */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">{monthLabel}</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {monthlySection}
          <TodayBenchCard todayStats={todayStats} currency={currency} />
        </div>
      </div>

      {/* ── Period section ── */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
          {t("selectedPeriod")}: <span className="text-foreground normal-case font-semibold">{periodLabel(dateRange)}</span>
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {periodSection}
        </div>
      </div>
    </div>
  );
}
