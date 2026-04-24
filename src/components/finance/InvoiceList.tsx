"use client";

import { useTranslations } from "next-intl";
import { FileText, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Invoice, InvoiceFilters, InvoiceStatus } from "@/types/finance";
import { useCallback } from "react";

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

interface Props {
  invoices: Invoice[];
  total: number;
  filters: InvoiceFilters;
  onFilterChange: (f: Partial<InvoiceFilters>) => void;
  onViewDetails: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onCreateClaim: (invoice: Invoice) => void;
  onUpdateStatus: (invoice: Invoice) => void;
  onNewInvoice: () => void;
  isLoading: boolean;
}

export function InvoiceList({
  invoices, total, filters, onFilterChange,
  onViewDetails, onRecordPayment, onCreateClaim, onUpdateStatus,
  onNewInvoice, isLoading,
}: Props) {
  const t = useTranslations("Finance.invoices");
  const commonT = useTranslations("Common");
  const currency = commonT("currency");

  const pageSize = filters.pageSize ?? 10;
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusOptions = [
    { value: "all", label: t("statuses.all") },
    { value: "draft", label: t("statuses.draft") },
    { value: "pending", label: t("statuses.pending") },
    { value: "partial", label: t("statuses.partial") },
    { value: "paid", label: t("statuses.paid") },
    { value: "overdue", label: t("statuses.overdue") },
    { value: "cancelled", label: t("statuses.cancelled") },
  ];

  const handleStatusChange = useCallback(
    (val: string) => onFilterChange({ status: val as InvoiceFilters["status"], page: 1 }),
    [onFilterChange],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center justify-between">
        <Select value={filters.status ?? "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onNewInvoice} size="sm" className="gap-2 shrink-0">
          <FileText className="h-4 w-4" />
          {t("form.create")}
        </Button>
      </div>

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
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  {t("noInvoices")}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{inv.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.patient_code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.due_date ? formatDate(inv.due_date) : "—"}
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
                        <DropdownMenuItem onClick={() => onUpdateStatus(inv)}>{t("updateStatus")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCreateClaim(inv)}>{t("createClaim")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}</span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onFilterChange({ page: page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => onFilterChange({ page: page + 1 })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
