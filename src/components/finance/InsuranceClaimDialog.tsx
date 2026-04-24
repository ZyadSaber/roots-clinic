"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormManager } from "@/hooks";
import { createInsuranceClaim, updateInsuranceClaim } from "@/services/finance";
import type { Invoice, InsuranceClaim, InsuranceClaimStatus } from "@/types/finance";
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice?: Invoice | null;
  claim?: InsuranceClaim | null;
}

export function InsuranceClaimDialog({ open, onOpenChange, invoice, claim }: Props) {
  const t = useTranslations("Finance.insurance.form");
  const statusT = useTranslations("Finance.insurance.statuses");
  const commonT = useTranslations("Common");
  const queryClient = useQueryClient();
  const isUpdateMode = !!claim;

  const { formData, handleFieldChange, setFormData, errors, setErrors, resetForm } = useFormManager({
    initialData: {
      provider: "",
      policy_number: "",
      claimed_amount: invoice?.total ?? 0,
      notes: "",
      status: "submitted" as InsuranceClaimStatus,
      approved_amount: 0,
    },
  });

  const validate = () => {
    if (isUpdateMode) return true;
    const newErrors: Record<string, string> = {};
    if (!formData.provider.trim()) newErrors.provider = "Provider is required";
    if (formData.claimed_amount <= 0) newErrors.claimed_amount = "Amount must be greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (claim) {
      setFormData({
        provider: claim.provider,
        policy_number: claim.policy_number ?? "",
        claimed_amount: claim.claimed_amount,
        notes: claim.notes ?? "",
        status: claim.status,
        approved_amount: claim.approved_amount,
      });
    } else {
      resetForm();
      if (invoice) {
        handleFieldChange({ name: "claimed_amount", value: invoice.total });
      }
    }
  }, [claim, invoice, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (isUpdateMode && claim) {
        return updateInsuranceClaim(
          claim.id,
          formData.status,
          formData.approved_amount > 0 ? formData.approved_amount : undefined,
        );
      }
      if (!invoice) throw new Error("No invoice selected");
      return createInsuranceClaim({
        invoice_id: invoice.id,
        patient_id: invoice.patient_id,
        provider: formData.provider,
        policy_number: formData.policy_number || undefined,
        claimed_amount: formData.claimed_amount,
        notes: formData.notes || undefined,
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(commonT("success"));
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
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
    if (!isUpdateMode && !validate()) return;
    mutate();
  };

  const statusOptions: { value: InsuranceClaimStatus; label: string }[] = [
    { value: "submitted", label: statusT("submitted") },
    { value: "approved", label: statusT("approved") },
    { value: "rejected", label: statusT("rejected") },
    { value: "partial", label: statusT("partial") },
  ];

  const showApprovedAmount = formData.status === "approved" || formData.status === "partial";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isUpdateMode ? t("updateTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Read-only invoice context */}
          {invoice && !isUpdateMode && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <p className="font-medium">{invoice.invoice_number}</p>
              <p className="text-muted-foreground">{invoice.patient_name}</p>
            </div>
          )}

          {!isUpdateMode && (
            <>
              <div className="space-y-1">
                <Label>{t("provider")}</Label>
                <Input
                  value={formData.provider}
                  onChange={(e) => handleFieldChange({ name: "provider", value: e.target.value })}
                  placeholder="e.g. MetLife, Bupa"
                />
                {errors.provider && <p className="text-xs text-destructive">{errors.provider}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t("policyNumber")}</Label>
                  <Input
                    value={formData.policy_number}
                    onChange={(e) => handleFieldChange({ name: "policy_number", value: e.target.value })}
                    placeholder="e.g. POL-123456"
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t("claimedAmount")}</Label>
                  <Input
                    type="number" min={0.01} step={0.01}
                    value={formData.claimed_amount}
                    onChange={(e) => handleFieldChange({ name: "claimed_amount", value: parseFloat(e.target.value) || 0 })}
                  />
                  {errors.claimed_amount && <p className="text-xs text-destructive">{errors.claimed_amount}</p>}
                </div>
              </div>
            </>
          )}

          {isUpdateMode && (
            <>
              <div className="space-y-1">
                <Label>{t("status")}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleFieldChange({ name: "status", value: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showApprovedAmount && (
                <div className="space-y-1">
                  <Label>{t("approvedAmount")}</Label>
                  <Input
                    type="number" min={0} step={0.01}
                    value={formData.approved_amount}
                    onChange={(e) => handleFieldChange({ name: "approved_amount", value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
            </>
          )}

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
            {isPending
              ? t("submitting")
              : isUpdateMode
              ? t("update")
              : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
