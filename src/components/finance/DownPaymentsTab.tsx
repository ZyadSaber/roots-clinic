"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search, Plus, CreditCard, User } from "lucide-react";
import { fetchAllPatients } from "@/services/patients";
import { getPatientInvoices } from "@/services/finance";
import type { PatientSummary } from "@/types/patients";
import type { Invoice } from "@/types/finance";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { DownPaymentDialog } from "./DownPaymentDialog";
import { useVisibility } from "@/hooks";

// ── helpers ───────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/20 text-yellow-700",
  partial: "bg-blue-500/20 text-blue-700",
  overdue: "bg-destructive/20 text-destructive",
  paid: "bg-primary/20 text-primary",
  cancelled: "bg-muted text-muted-foreground",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(n) + " EGP";
}

// ── Patient search combobox ────────────────────────────────────────────────

function PatientSearch({
  patients,
  selected,
  onSelect,
}: {
  patients: PatientSummary[];
  selected: PatientSummary | null;
  onSelect: (p: PatientSummary | null) => void;
}) {
  const t = useTranslations("Finance.downPayments");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query.trim()
    ? patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(query.toLowerCase()) ||
          p.patient_code.toLowerCase().includes(query.toLowerCase()),
      )
    : patients.slice(0, 20);

  const handleSelect = (p: PatientSummary) => {
    onSelect(p);
    setQuery("");
    setOpen(false);
  };

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <User className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{selected.full_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{selected.patient_code}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onSelect(null)}>
          {t("change")}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t("noPatients")}</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {filtered.map((p) => (
                <li
                  key={p.patient_id}
                  className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                  onMouseDown={() => handleSelect(p)}
                >
                  <span className="font-medium flex-1">{p.full_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{p.patient_code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Invoice row ────────────────────────────────────────────────────────────

function InvoiceRow({
  invoice,
  onPay,
}: {
  invoice: Invoice;
  onPay: (inv: Invoice) => void;
}) {
  const t = useTranslations("Finance.downPayments");
  const invoiceT = useTranslations("Finance.invoices.statuses");
  const canPay = invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <TableRow>
      <TableCell className="font-mono text-sm font-medium">{invoice.invoice_number}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{fmtDate(invoice.created_at)}</TableCell>
      <TableCell>
        <Badge className={`text-xs border-none ${statusColors[invoice.status]}`}>
          {invoiceT(invoice.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right text-sm">{fmtCurrency(invoice.total)}</TableCell>
      <TableCell className="text-right text-sm">{fmtCurrency(invoice.amount_paid)}</TableCell>
      <TableCell className="text-right font-medium text-sm text-destructive">
        {invoice.outstanding > 0 ? fmtCurrency(invoice.outstanding) : "—"}
      </TableCell>
      <TableCell>
        {canPay && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => onPay(invoice)}
          >
            <CreditCard className="w-3 h-3" /> {t("pay")}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Main DownPaymentsTab ───────────────────────────────────────────────────

export function DownPaymentsTab() {
  const t = useTranslations("Finance.downPayments");
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [targetInvoice, setTargetInvoice] = useState<Invoice | null>(null);

  const {
    visible: dialogOpen,
    handleOpen: openDialog,
    handleStateChange: setDialogOpen,
  } = useVisibility();

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchAllPatients,
    staleTime: 60_000,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["patient-invoices", selectedPatient?.patient_id],
    queryFn: () => getPatientInvoices(selectedPatient!.patient_id),
    enabled: !!selectedPatient,
    staleTime: 30_000,
  });

  const openPayInvoice = (inv: Invoice) => {
    setTargetInvoice(inv);
    openDialog();
  };

  const openNewDeposit = () => {
    setTargetInvoice(null);
    openDialog();
  };

  const handleDialogClose = (v: boolean) => {
    setDialogOpen(v);
    if (!v) setTargetInvoice(null);
  };

  const outstandingInvoices = invoices.filter(
    (i) => i.status !== "paid" && i.status !== "cancelled",
  );

  const outstandingTotal = fmtCurrency(outstandingInvoices.reduce((s, i) => s + i.outstanding, 0));
  const outstandingCount = outstandingInvoices.length;
  const outstandingBanner = outstandingCount === 1
    ? t("outstandingBanner", { count: outstandingCount, total: outstandingTotal })
    : t("outstandingBannerPlural", { count: outstandingCount, total: outstandingTotal });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">{t("hint")}</h3>
        {selectedPatient && (
          <Button size="sm" onClick={openNewDeposit} className="gap-2 h-9">
            <Plus className="w-4 h-4" /> {t("newPayment")}
          </Button>
        )}
      </div>

      {/* Patient search */}
      <LoadingOverlay loading={patientsLoading}>
        <PatientSearch
          patients={patients}
          selected={selectedPatient}
          onSelect={(p) => {
            setSelectedPatient(p);
            setTargetInvoice(null);
          }}
        />
      </LoadingOverlay>

      {/* Invoice list */}
      {selectedPatient && (
        <LoadingOverlay loading={invoicesLoading}>
          {invoices.length === 0 && !invoicesLoading ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
              <p>{t("noInvoices")}</p>
              <p className="mt-1 text-xs">{t("noInvoicesHint")}</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              {outstandingInvoices.length > 0 && (
                <div className="bg-yellow-500/10 border-b px-4 py-2 text-xs text-yellow-700 font-medium">
                  {outstandingBanner}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoice")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("status") ?? "Status"}</TableHead>
                    <TableHead className="text-right">{t("total")}</TableHead>
                    <TableHead className="text-right">{t("paid")}</TableHead>
                    <TableHead className="text-right">{t("outstanding")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <InvoiceRow key={inv.id} invoice={inv} onPay={openPayInvoice} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </LoadingOverlay>
      )}

      {/* Payment dialog */}
      {dialogOpen && selectedPatient && (
        <DownPaymentDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          patient={selectedPatient}
          invoice={targetInvoice}
        />
      )}
    </div>
  );
}
