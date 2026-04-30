"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import type { RootState, AppDispatch } from "@/store/store";
import { setInvoiceFilters, setDateRange } from "@/store/slices/financeSlice";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceStatCards } from "@/components/finance/FinanceStatCards";
import { InvoiceList } from "@/components/finance/InvoiceList";
import { TodayBench } from "@/components/finance/TodayBench";
import { InsuranceClaimList } from "@/components/finance/InsuranceClaimList";
import { PurchasesTab } from "@/components/finance/PurchasesTab";
import { DownPaymentsTab } from "@/components/finance/DownPaymentsTab";
import { InvoiceDialog } from "@/components/finance/InvoiceDialog";
import { PaymentDialog } from "@/components/finance/PaymentDialog";
import { ExpenseDialog } from "@/components/finance/ExpenseDialog";
import { InsuranceClaimDialog } from "@/components/finance/InsuranceClaimDialog";
import { DateRangePicker, type DateRangeValue } from "@/components/ui/DateRangePicker";
import {
  getFinanceStats,
  getFinancePeriodStats,
  getInvoices,
  updateInvoiceStatus,
} from "@/services/finance";
import type {
  Invoice,
  InvoiceFilters,
  InvoiceStatus,
  Expense,
} from "@/types/finance";
import { useFormManager, useVisibility } from "@/hooks";



interface InitialValuesType {
  viewInvoice: Invoice | null;
  editExpense: Expense | null;
}

export default function FinancePage() {
  const t = useTranslations("Finance");
  const tabsT = useTranslations("Finance.tabs");
  const commonT = useTranslations("Common");

  const globalSearch = useSelector((state: RootState) => state?.uiShared.searchQuery);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const {
    visible: invoiceDialogOpen,
    handleOpen: handleOpenInvoiceDialogOpen,
    handleStateChange: setInvoiceDialogOpen
  } = useVisibility()

  const {
    visible: paymentDialogOpen,
    handleOpen: handleOpenPaymentDialogOpen,
    handleStateChange: setPaymentDialogOpen
  } = useVisibility()

  const {
    visible: expenseDialogOpen,
    handleOpen: handleOpenExpenseDialogOpen,
    handleStateChange: setExpenseDialogOpen
  } = useVisibility()

  const {
    visible: claimDialogOpen,
    handleOpen: handleOpenClaimDialogOpen,
    handleStateChange: setClaimDialogOpen
  } = useVisibility()

  const {
    formData: {
      viewInvoice,
      editExpense,
    },
    handleFieldChange
  } = useFormManager<InitialValuesType>({
    initialData: {
      viewInvoice: null,
      editExpense: null,
    }
  })

  const dispatch = useDispatch<AppDispatch>();
  const invoiceFilters = useSelector((state: RootState) => state.finance.invoiceFilters);
  const dateRange = useSelector((state: RootState) => state.finance.dateRange);

  const queryClient = useQueryClient();

  // ── Invoice status mutation ───────────────────────────────────────────────
  const { mutate: changeInvoiceStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      updateInvoiceStatus(id, status),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
        toast.success(commonT("success"));
      } else {
        toast.error(res.error ?? commonT("error"));
      }
    },
    onError: () => toast.error(commonT("error")),
  });

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: kpis } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: getFinanceStats,
    staleTime: 60_000,
  });

  const { data: periodStats } = useQuery({
    queryKey: ["finance-period-stats", dateRange?.from, dateRange?.to],
    queryFn: () => getFinancePeriodStats(dateRange!.from, dateRange!.to),
    enabled: !!dateRange,
    staleTime: 60_000,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInvoiceFilterChange = (f: Partial<InvoiceFilters>) =>
    dispatch(setInvoiceFilters(f));

  const handleDateRangeChange = (value: DateRangeValue | null) => {
    if (value) dispatch(setDateRange(value));
  };

  const openViewInvoice = (invoice: Invoice) => {
    handleFieldChange({ name: "viewInvoice", value: invoice })
    handleOpenInvoiceDialogOpen()
  };

  const openRecordPayment = (invoice: Invoice) => {
    handleFieldChange({ name: "viewInvoice", value: invoice })
    handleOpenPaymentDialogOpen()
  };

  const openCreateClaim = (invoice: Invoice) => {
    handleFieldChange({ name: "viewInvoice", value: invoice })
    handleOpenClaimDialogOpen()
  };

  const openNewInvoice = () => {
    handleFieldChange({ name: "viewInvoice", value: null })
    handleOpenInvoiceDialogOpen()
  };

  const openNewExpense = () => {
    handleOpenExpenseDialogOpen()
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
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <FinanceStatCards
        kpis={kpis}
        periodStats={periodStats}
        dateRange={dateRange}
      />

      {/* Tabs */}
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">{tabsT("invoices")}</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="insurance">{tabsT("insurance")}</TabsTrigger>
          <TabsTrigger value="purchases">{tabsT("purchases")}</TabsTrigger>
          <TabsTrigger value="down-payments">{tabsT("downPayments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <InvoiceList
            onViewDetails={openViewInvoice}
            onRecordPayment={openRecordPayment}
            onCreateClaim={openCreateClaim}
            onUpdateStatus={(inv, status) => changeInvoiceStatus({ id: inv.id, status })}
            onNewInvoice={openNewInvoice}
          />
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <TodayBench onNewExpense={openNewExpense} />
        </TabsContent>

        <TabsContent value="insurance" className="mt-4">
          <InsuranceClaimList />
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          <PurchasesTab />
        </TabsContent>

        <TabsContent value="down-payments" className="mt-4">
          <DownPaymentsTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {invoiceDialogOpen &&
        <InvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          invoice={viewInvoice}
        />
      }

      {paymentDialogOpen &&
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={viewInvoice}
        />
      }

      {expenseDialogOpen &&
        <ExpenseDialog
          open={expenseDialogOpen}
          onOpenChange={setExpenseDialogOpen}
          expense={editExpense}
        />
      }

      {claimDialogOpen &&
        <InsuranceClaimDialog
          open={claimDialogOpen}
          onOpenChange={setClaimDialogOpen}
          invoice={viewInvoice}
        />
      }
    </div>
  );
}
