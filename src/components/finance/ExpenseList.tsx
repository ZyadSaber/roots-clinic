"use client";

import { useTranslations } from "next-intl";
import { Plus, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import DeleteDialog from "@/components/shared/delete-dialog";
import type { Expense, ExpenseCategory, ExpenseFilters, ExpenseStatus } from "@/types/finance";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExpense } from "@/services/finance";
import { toast } from "sonner";

const statusColors: Record<ExpenseStatus, string> = {
  paid: "bg-primary/20 text-primary",
  pending: "bg-chart-5/20 text-chart-5",
  overdue: "bg-destructive/20 text-destructive",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " " + currency;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

interface Props {
  expenses: Expense[];
  total: number;
  filters: ExpenseFilters;
  onFilterChange: (f: Partial<ExpenseFilters>) => void;
  onNewExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  isLoading: boolean;
}

export function ExpenseList({
  expenses, total, filters, onFilterChange,
  onNewExpense, onEditExpense, isLoading,
}: Props) {
  const t = useTranslations("Finance.expenses");
  const finT = useTranslations("Finance");
  const commonT = useTranslations("Common");
  const currency = commonT("currency");
  const queryClient = useQueryClient();

  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      // expenses don't have a search filter in the service, skip or add later
    }, 300);
    return () => clearTimeout(timeout);
  }, [localSearch]);

  const pageSize = filters.pageSize ?? 10;
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const { mutate: doDelete, isPending: deleteLoading } = useMutation({
    mutationFn: deleteExpense,
    onSuccess: (res) => {
      if (res.success) {
        toast.success(commonT("success"));
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      } else {
        toast.error(res.error ?? commonT("error"));
      }
    },
    onError: () => toast.error(commonT("error")),
  });

  const statusOptions = [
    { value: "all", label: t("statuses.all") },
    { value: "paid", label: t("statuses.paid") },
    { value: "pending", label: t("statuses.pending") },
    { value: "overdue", label: t("statuses.overdue") },
  ];

  const categoryOptions = [
    { value: "all", label: t("categories.all") },
    { value: "fixed", label: t("categories.fixed") },
    { value: "inventory", label: t("categories.inventory") },
    { value: "personnel", label: t("categories.personnel") },
    { value: "service", label: t("categories.service") },
    { value: "utility", label: t("categories.utility") },
    { value: "other", label: t("categories.other") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) => onFilterChange({ status: v as ExpenseFilters["status"], page: 1 })}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.category ?? "all"}
            onValueChange={(v) => onFilterChange({ category: v as ExpenseCategory | "all", page: 1 })}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onNewExpense} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {finT("addExpense")}
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("expenseTitle")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("department")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{t("amount")}</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t("noExpenses")}</TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow key={exp.id} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="font-medium text-sm">{exp.title}</p>
                    {exp.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-48">{exp.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {t(`categories.${exp.category}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{exp.department ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(exp.expense_date)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs border-none ${statusColors[exp.status]}`}>
                      {t(`statuses.${exp.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    {formatCurrency(exp.amount, currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditExpense(exp)}>
                            {commonT("edit")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DeleteDialog
                        deleteLoading={deleteLoading}
                        deleteAction={() => doDelete(exp.id)}
                      />
                    </div>
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
