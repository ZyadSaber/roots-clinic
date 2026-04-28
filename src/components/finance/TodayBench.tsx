"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getTodayPaymentsDetail, getTodayExpensesDetail } from "@/services/finance";

const categoryColors: Record<string, string> = {
  fixed:     "bg-blue-500/20 text-blue-500",
  inventory: "bg-purple-500/20 text-purple-500",
  personnel: "bg-orange-500/20 text-orange-500",
  service:   "bg-chart-5/20 text-chart-5",
  utility:   "bg-yellow-500/20 text-yellow-500",
  other:     "bg-muted text-muted-foreground",
};

const methodLabels: Record<string, string> = {
  cash:         "Cash",
  card:         "Card",
  insurance:    "Insurance",
  bank_transfer: "Bank Transfer",
};

function fmt(amount: number, currency: string) {
  return (
    new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) +
    " " + currency
  );
}

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-EG", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  onNewExpense: () => void;
}

export function TodayBench({ onNewExpense }: Props) {
  const commonT = useTranslations("Common");
  const currency = commonT("currency");

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ["today-expenses-detail"],
    queryFn: getTodayExpensesDetail,
    staleTime: 30_000,
  });

  const { data: payments = [], isLoading: payLoading } = useQuery({
    queryKey: ["today-payments-detail"],
    queryFn: getTodayPaymentsDetail,
    staleTime: 30_000,
  });

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome   = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Today's Expenses ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Today's Expenses</h3>
            <p className="text-xs text-muted-foreground text-destructive font-medium">
              -{fmt(totalExpenses, currency)}
            </p>
          </div>
          <Button onClick={onNewExpense} size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm">
                    No expenses recorded today
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="text-sm font-medium">{exp.title}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-none ${categoryColors[exp.category] ?? categoryColors.other}`}>
                        {exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-destructive">
                      -{fmt(exp.amount, currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Today's Income ── */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm">Today's Income</h3>
          <p className="text-xs text-primary font-medium">
            +{fmt(totalIncome, currency)}
          </p>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                    No payments received today
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((pay) => (
                  <TableRow key={pay.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{pay.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{pay.patient_code}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{pay.invoice_number}</TableCell>
                    <TableCell className="text-sm">{methodLabels[pay.method] ?? pay.method}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-primary">
                      +{fmt(pay.amount, currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {payments.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Last payment at {fmtTime(payments[0].paid_at)}
          </p>
        )}
      </div>
    </div>
  );
}
