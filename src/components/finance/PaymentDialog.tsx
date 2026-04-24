"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormManager } from "@/hooks";
import { recordPaymentSchema } from "@/validation/finance";
import { recordPayment } from "@/services/finance";
import type { Invoice, PaymentMethod } from "@/types/finance";
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: Invoice | null;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(amount) + " " + currency;
}

export function PaymentDialog({ open, onOpenChange, invoice }: Props) {
  const t = useTranslations("Finance.payments.form");
  const commonT = useTranslations("Common");
  const currency = commonT("currency");
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);

  const { formData, handleFieldChange, validate, errors, resetForm } = useFormManager({
    initialData: {
      amount: invoice?.outstanding ?? 0,
      method: "cash" as PaymentMethod,
      transaction_ref: "",
      notes: "",
    },
    schema: recordPaymentSchema,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      recordPayment({
        invoice_id: invoice!.id,
        patient_id: invoice!.patient_id,
        amount: formData.amount,
        method: formData.method,
        transaction_ref: formData.transaction_ref || undefined,
        notes: formData.notes || undefined,
        received_by: user?.id,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(commonT("success"));
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
        if (invoice?.id) queryClient.invalidateQueries({ queryKey: ["invoice-detail", invoice.id] });
        handleClose();
      } else {
        toast.error(res.error ?? commonT("error"));
      }
    },
    onError: () => toast.error(commonT("error")),
  });

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    mutate();
  };

  const showTransactionRef = formData.method === "card" || formData.method === "bank_transfer";

  const methodOptions: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: t("methods.cash") },
    { value: "card", label: t("methods.card") },
    { value: "insurance", label: t("methods.insurance") },
    { value: "bank_transfer", label: t("methods.bank_transfer") },
  ];

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <p className="font-medium">{t("invoiceSummary")}</p>
            <div className="grid grid-cols-2 gap-1 text-muted-foreground">
              <span>Invoice</span>
              <span className="font-mono text-foreground">{invoice.invoice_number}</span>
              <span>Patient</span>
              <span className="text-foreground">{invoice.patient_name}</span>
              <span>Total</span>
              <span className="text-foreground">{formatCurrency(invoice.total, currency)}</span>
              <span>Outstanding</span>
              <span className="font-medium text-destructive">{formatCurrency(invoice.outstanding, currency)}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label>{t("amount")}</Label>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={formData.amount}
              onChange={(e) => handleFieldChange({ name: "amount", value: parseFloat(e.target.value) || 0 })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Payment method */}
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
                onChange={(e) => handleFieldChange({ name: "transaction_ref", value: e.target.value })}
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
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            {commonT("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
