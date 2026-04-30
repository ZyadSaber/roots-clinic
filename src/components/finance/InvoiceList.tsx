"use client";

import { useTranslations } from "next-intl";
import { FileText, MoreHorizontal, ChevronsRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SelectField, } from "@/components/ui/select";
import type { Invoice, InvoiceFilters, InvoiceStatus } from "@/types/finance";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInvoices } from "@/services/finance";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import isArrayHasData from "@/lib/isArrayHasData";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { format } from "date-fns";

const statusColors: Record<InvoiceStatus, string> = {
  paid: "bg-primary/20 text-primary",
  pending: "bg-chart-5/20 text-chart-5",
  partial: "bg-blue-500/20 text-blue-500",
  overdue: "bg-destructive/20 text-destructive",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " " + currency;
}

// Valid manual status transitions (payment transitions are handled automatically by recordPayment)
const NEXT_STATUSES: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = {
  draft: ["pending", "cancelled"],
  pending: ["overdue", "cancelled"],
  partial: ["overdue", "cancelled"],
  overdue: ["cancelled"],
};

interface Props {
  onViewDetails: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onCreateClaim: (invoice: Invoice) => void;
  onUpdateStatus: (invoice: Invoice, status: InvoiceStatus) => void;
  onNewInvoice: () => void;
}

export function InvoiceList({
  onViewDetails,
  onRecordPayment,
  onCreateClaim,
  onUpdateStatus,
  onNewInvoice,
}: Props) {

  const globalSearch = useSelector((state: RootState) => state?.uiShared.searchQuery);
  const dateRange = useSelector((state: RootState) => state.finance.dateRange);
  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all')

  const invoiceFilters = {
    status,
    dateFrom: dateRange?.from || "",
    dateTo: dateRange?.to || "",
  } as InvoiceFilters

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", invoiceFilters],
    queryFn: () => getInvoices(invoiceFilters),
    staleTime: 60_000,
  });

  const invoices = data || []

  const t = useTranslations("Finance.invoices");
  const commonT = useTranslations("Common");
  const currency = commonT("currency");

  const statusOptions = [
    { key: "all", label: t("statuses.all") },
    { key: "draft", label: t("statuses.draft") },
    { key: "pending", label: t("statuses.pending") },
    { key: "partial", label: t("statuses.partial") },
    { key: "paid", label: t("statuses.paid") },
    { key: "overdue", label: t("statuses.overdue") },
    { key: "cancelled", label: t("statuses.cancelled") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center justify-between">
        <SelectField
          options={statusOptions}
          label={commonT("status")}
          onValueChange={setStatus}
          value={status}
          name=""
          containerClassName="w-[15%]"
          hideClear
        />
        <Button onClick={onNewInvoice} size="sm" className="gap-2 shrink-0">
          <FileText className="h-4 w-4" />
          {t("form.create")}
        </Button>
      </div>

      <LoadingOverlay loading={isLoading}>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoiceNumber")}</TableHead>
                <TableHead>{t("patient")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
                <TableHead className="text-right">{t("outstanding")}</TableHead>
                <TableHead className="text-center">Claims</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isArrayHasData(invoices) ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    {t("noInvoices")}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/50 cursor-pointer" onDoubleClick={() => onViewDetails(inv)}>
                    <TableCell className="font-mono text-sm font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{inv.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{inv.patient_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(inv.created_at, "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.due_date ? format(inv.due_date, "MMM dd, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-none ${statusColors[inv.status]}`}>
                        {t(`statuses.${inv.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCurrency(inv.total, currency)}
                    </TableCell>
                    <TableCell className={`text-right text-sm font-medium ${inv.outstanding > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {formatCurrency(inv.outstanding, currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      {inv.claims_count > 0 ? (
                        <Badge className={`text-xs border-none ${inv.has_active_claim ? "bg-blue-500/20 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                          {inv.claims_count}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(inv)}>{t("viewDetails")}</DropdownMenuItem>
                          {inv.status !== "paid" && inv.status !== "cancelled" && (
                            <DropdownMenuItem onClick={() => onRecordPayment(inv)}>{t("recordPayment")}</DropdownMenuItem>
                          )}
                          {NEXT_STATUSES[inv.status] && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <ChevronsRight className="h-3.5 w-3.5 mr-2 opacity-50" />
                                  {t("updateStatus")}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {NEXT_STATUSES[inv.status]!.map((s) => (
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={() => onUpdateStatus(inv, s)}
                                    >
                                      {t(`statuses.${s}`)}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => !inv.has_active_claim && onCreateClaim(inv)}
                            disabled={inv.has_active_claim}
                            className={inv.has_active_claim ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            {t("createClaim")}
                            {inv.has_active_claim && (
                              <span className="ms-auto text-xs text-muted-foreground">Active claim</span>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </LoadingOverlay>

    </div>
  );
}
