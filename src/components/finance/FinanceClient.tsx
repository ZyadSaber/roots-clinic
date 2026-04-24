"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceStatCards } from "./FinanceStatCards";
import { InvoiceList } from "./InvoiceList";
import { ExpenseList } from "./ExpenseList";
import { InvoiceDialog } from "./InvoiceDialog";
import { PaymentDialog } from "./PaymentDialog";
import { ExpenseDialog } from "./ExpenseDialog";
import { InsuranceClaimDialog } from "./InsuranceClaimDialog";
import { DateRangePicker, type DateRangeValue } from "./DateRangePicker";
import { getFinanceStats, getFinancePeriodStats, getTodayStats, getInvoices, getExpenses } from "@/services/finance";
import type {
  Invoice,
  InvoiceFilters,
  ExpenseFilters,
  Expense,
} from "@/types/finance";

const DEFAULT_INVOICE_FILTERS: InvoiceFilters = { status: "all", page: 1, pageSize: 10 };
const DEFAULT_EXPENSE_FILTERS: ExpenseFilters = { status: "all", category: "all", page: 1, pageSize: 10 };

function defaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export function FinanceClient() {
  const t = useTranslations("Finance");
  const tabsT = useTranslations("Finance.tabs");
  const commonT = useTranslations("Common");

  // ── Global search (Header search bar → Redux) ─────────────────────────────
  const globalSearch = useSelector((state: RootState) => state.uiShared.searchQuery);

  // ── Date range ────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(defaultDateRange);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceFilters>(DEFAULT_INVOICE_FILTERS);
  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilters>(DEFAULT_EXPENSE_FILTERS);

  // Sync global search into invoice filter with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      setInvoiceFilters((prev) => ({ ...prev, search: globalSearch || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [globalSearch]);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimInvoice, setClaimInvoice] = useState<Invoice | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: kpis } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: () => getFinanceStats(),
    staleTime: 60_000,
  });

  const { data: periodStats } = useQuery({
    queryKey: ["finance-period-stats", dateRange?.from, dateRange?.to],
    queryFn: () => getFinancePeriodStats(dateRange!.from, dateRange!.to),
    enabled: !!dateRange,
    staleTime: 60_000,
  });

  const { data: todayStats } = useQuery({
    queryKey: ["finance-today-stats"],
    queryFn: () => getTodayStats(),
    staleTime: 30_000,
  });

  const invoiceFiltersWithRange: InvoiceFilters = {
    ...invoiceFilters,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  };

  const expenseFiltersWithRange: ExpenseFilters = {
    ...expenseFilters,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  };

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", invoiceFiltersWithRange],
    queryFn: () => getInvoices(invoiceFiltersWithRange),
    staleTime: 60_000,
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", expenseFiltersWithRange],
    queryFn: () => getExpenses(expenseFiltersWithRange),
    staleTime: 60_000,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInvoiceFilterChange = (f: Partial<InvoiceFilters>) =>
    setInvoiceFilters((prev) => ({ ...prev, ...f }));

  const handleExpenseFilterChange = (f: Partial<ExpenseFilters>) =>
    setExpenseFilters((prev) => ({ ...prev, ...f }));

  const openViewInvoice = (invoice: Invoice) => {
    setViewInvoice(invoice);
    setInvoiceDialogOpen(true);
  };

  const openRecordPayment = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const openCreateClaim = (invoice: Invoice) => {
    setClaimInvoice(invoice);
    setClaimDialogOpen(true);
  };

  const openNewInvoice = () => {
    setViewInvoice(null);
    setInvoiceDialogOpen(true);
  };

  const openNewExpense = () => {
    setEditExpense(null);
    setExpenseDialogOpen(true);
  };

  const openEditExpense = (expense: Expense) => {
    setEditExpense(expense);
    setExpenseDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <FinanceStatCards kpis={kpis} periodStats={periodStats} todayStats={todayStats} dateRange={dateRange} />

      {/* Tabs */}
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">{tabsT("invoices")}</TabsTrigger>
          <TabsTrigger value="expenses">{tabsT("expenses")}</TabsTrigger>
          <TabsTrigger value="insurance">{tabsT("insurance")}</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <InvoiceList
            invoices={invoicesData?.data ?? []}
            total={invoicesData?.total ?? 0}
            filters={invoiceFiltersWithRange}
            onFilterChange={handleInvoiceFilterChange}
            onViewDetails={openViewInvoice}
            onRecordPayment={openRecordPayment}
            onCreateClaim={openCreateClaim}
            onUpdateStatus={openViewInvoice}
            onNewInvoice={openNewInvoice}
            isLoading={invoicesLoading}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ExpenseList
            expenses={expensesData?.data ?? []}
            total={expensesData?.total ?? 0}
            filters={expenseFiltersWithRange}
            onFilterChange={handleExpenseFilterChange}
            onNewExpense={openNewExpense}
            onEditExpense={openEditExpense}
            isLoading={expensesLoading}
          />
        </TabsContent>

        <TabsContent value="insurance" className="mt-4">
          <div className="text-center py-16 text-muted-foreground text-sm">
            {tabsT("insurance")} — {commonT("ndf")}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={(v) => {
          setInvoiceDialogOpen(v);
          if (!v) setViewInvoice(null);
        }}
        invoice={viewInvoice}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={(v) => {
          setPaymentDialogOpen(v);
          if (!v) setPaymentInvoice(null);
        }}
        invoice={paymentInvoice}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={(v) => {
          setExpenseDialogOpen(v);
          if (!v) setEditExpense(null);
        }}
        expense={editExpense}
      />

      <InsuranceClaimDialog
        open={claimDialogOpen}
        onOpenChange={(v) => {
          setClaimDialogOpen(v);
          if (!v) setClaimInvoice(null);
        }}
        invoice={claimInvoice}
      />
    </div>
  );
}
