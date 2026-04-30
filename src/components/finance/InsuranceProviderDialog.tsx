"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFormManager } from "@/hooks";
import { createInsuranceProvider, updateInsuranceProvider } from "@/services/finance";
import type { InsuranceProvider, CreateInsuranceProviderPayload } from "@/types/finance";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Textarea from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  provider?: InsuranceProvider | null;
}

const initialData: CreateInsuranceProviderPayload = {
  name: "",
  phone: "",
  hotline: "",
  date_from: "",
  date_to: "",
  representative_person: "",
  notes: "",
  insurance_instructions: "",
};

export function InsuranceProviderDialog({ open, onOpenChange, provider }: Props) {
  const t = useTranslations("Finance.insuranceProviders");
  const commonT = useTranslations("Common");
  const queryClient = useQueryClient();
  const isEdit = !!provider;
  const { formData, handleChange, setFormData, resetForm } = useFormManager({ initialData });

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        phone: provider.phone ?? "",
        hotline: provider.hotline ?? "",
        date_from: provider.date_from ?? "",
        date_to: provider.date_to ?? "",
        representative_person: provider.representative_person ?? "",
        notes: provider.notes ?? "",
        insurance_instructions: provider.insurance_instructions ?? "",
      });
    } else {
      resetForm();
    }
  }, [provider, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload: CreateInsuranceProviderPayload = {
        name: formData.name,
        phone: formData.phone || undefined,
        hotline: formData.hotline || undefined,
        date_from: formData.date_from || undefined,
        date_to: formData.date_to || undefined,
        representative_person: formData.representative_person || undefined,
        notes: formData.notes || undefined,
        insurance_instructions: formData.insurance_instructions || undefined,
      };
      if (isEdit && provider) return updateInsuranceProvider(provider.id, payload);
      return createInsuranceProvider(payload);
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["insurance-providers"] });
        toast.success(isEdit ? commonT("success") : commonT("success"));
        onOpenChange(false);
      } else {
        toast.error(res.error ?? commonT("error"));
      }
    },
    onError: () => toast.error(commonT("error")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error(t("nameRequired")); return; }
    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("name")} *</Label>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder={t("namePlaceholder")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("phone")}</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} placeholder={t("phonePlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("hotline")}</Label>
              <Input name="hotline" value={formData.hotline} onChange={handleChange} placeholder={t("hotlinePlaceholder")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("contractStart")}</Label>
              <Input type="date" name="date_from" value={formData.date_from} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("contractEnd")}</Label>
              <Input type="date" name="date_to" value={formData.date_to} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("representative")}</Label>
            <Input name="representative_person" value={formData.representative_person} onChange={handleChange} placeholder={t("representativePlaceholder")} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("instructions")}</Label>
            <Textarea name="insurance_instructions" value={formData.insurance_instructions} onChange={handleChange} placeholder={t("instructionsPlaceholder")} rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("notes")}</Label>
            <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t("notesPlaceholder")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {commonT("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : isEdit ? t("save") : t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
