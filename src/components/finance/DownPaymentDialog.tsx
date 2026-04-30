"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFormManager } from "@/hooks";
import { recordDownPayment } from "@/services/finance";
import type { Invoice, PaymentMethod } from "@/types/finance";
import type { PatientSummary } from "@/types/patients";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patient: PatientSummary;
  invoice?: Invoice | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/20 text-yellow-700",
  partial: "bg-blue-500/20 text-blue-700",
  overdue: "bg-destructive/20 text-destructive",
  paid: "bg-primary/20 text-primary",
  cancelled: "bg-muted text-muted-foreground",
};

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(n) + " EGP";
}

export function DownPaymentDialog({ open, onOpenChange, patient, invoice }: Props) {
  const t = useTranslations("Finance.downPayments.dialog");
  const commonT = useTranslations("Common");
  const paymentMethodsT = useTranslations("Finance.payments.form.methods");
  const invoiceStatusT = useTranslations("Finance.invoices.statuses");
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);

  const isDeposit = !invoice;

  const { formData, handleFieldChange, resetForm } = useFormManager({
    initialData: {
      amount: invoice?.outstanding ?? 0,
      method: "cash" as PaymentMethod,
      transaction_ref: "",
      notes: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      recordDownPayment({
        patient_id: patient.patient_id,
        invoice_id: invoice?.id,
        amount: formData.amount,
        method: formData.method,
        transaction_ref: formData.transaction_ref || undefined,
        notes: formData.notes || undefined,
        received_by: user?.id,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(t("success"));
        queryClient.invalidateQueries({ queryKey: ["patient-invoices", patient.patient_id] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
        handleClose();
      } else {
        toast.error(res.error ?? t("error"));
      }
    },
    onError: () => toast.error(commonT("error")),
  });

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const showTransactionRef = formData.method === "card" || formData.method === "bank_transfer";

  const methodOptions: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: paymentMethodsT("cash") },
    { value: "card", label: paymentMethodsT("card") },
    { value: "bank_transfer", label: paymentMethodsT("bank_transfer") },
    { value: "insurance", label: paymentMethodsT("insurance") },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isDeposit ? t("newTitle") : t("payTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient / invoice summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{patient.full_name}</span>
              <span className="font-mono text-xs text-muted-foreground">{patient.patient_code}</span>
            </div>

            {invoice ? (
              <div className="grid grid-cols-2 gap-1 text-muted-foreground mt-2">
                <span>{t("invoiceLabel")}</span>
                <span className="font-mono text-foreground">{invoice.invoice_number}</span>
                <span>{t("totalLabel")}</span>
                <span className="text-foreground">{fmtCurrency(invoice.total)}</span>
                <span>{t("paidLabel")}</span>
                <span className="text-foreground">{fmtCurrency(invoice.amount_paid)}</span>
                <span>{t("outstandingLabel")}</span>
                <span className="font-medium text-destructive">{fmtCurrency(invoice.outstanding)}</span>
                <span>{t("statusLabel")}</span>
                <Badge className={`text-xs border-none w-fit ${statusColors[invoice.status]}`}>
                  {invoiceStatusT(invoice.status)}
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs mt-1">{t("depositNote")}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label>{t("amount")}</Label>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={formData.amount}
              onChange={(e) =>
                handleFieldChange({ name: "amount", value: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          {/* Method */}
          <div className="space-y-1">
            <Label>{t("method")}</Label>
            <Select
              value={formData.method}
              onValueChange={(v) => handleFieldChange({ name: "method", value: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methodOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction ref */}
          {showTransactionRef && (
            <div className="space-y-1">
              <Label>{t("transactionRef")}</Label>
              <Input
                value={formData.transaction_ref}
                onChange={(e) =>
                  handleFieldChange({ name: "transaction_ref", value: e.target.value })
                }
                placeholder="e.g. TXN-123456"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label>{t("notes")}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange({ name: "notes", value: e.target.value })}
              rows={2}
              placeholder={isDeposit ? t("notesPlaceholder") : ""}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            {commonT("cancel")}
          </Button>
          <Button onClick={() => mutate()} disabled={isPending || formData.amount <= 0}>
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
