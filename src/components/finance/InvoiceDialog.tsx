"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { useFormManager } from "@/hooks";
import { createInvoiceSchema } from "@/validation/finance";
import { createInvoice, addInvoiceItem, getInvoiceDetail } from "@/services/finance";
import { fetchAllPatients } from "@/services/patients";
import type { Invoice, InvoiceDetail, AddInvoiceItemPayload } from "@/types/finance";
import type { PatientSummary } from "@/types/patients";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice?: Invoice | null;
}

type ItemDraft = Omit<AddInvoiceItemPayload, "invoice_id"> & { _key: number };

const emptyItem = (): ItemDraft => ({
  _key: Date.now(),
  service_name: "",
  doctor_id: "",
  quantity: 1,
  unit_price: 0,
  discount_pct: 0,
});

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(amount) + " " + currency;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

function itemTotal(item: ItemDraft) {
  return parseFloat((item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100)).toFixed(2));
}

// ── View mode ─────────────────────────────────────────────────────────────

function InvoiceDetailView({ invoiceId, currency }: { invoiceId: string; currency: string }) {
  const t = useTranslations("Finance.invoices");
  const pt = useTranslations("Finance.payments");

  const { data: detail, isLoading } = useQuery<InvoiceDetail>({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: () => getInvoiceDetail(invoiceId) as Promise<InvoiceDetail>,
    enabled: !!invoiceId,
    staleTime: 30_000,
  });

  if (isLoading) return <div className="space-y-3 py-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>;
  if (!detail) return null;

  const subtotal = detail.items.reduce((s, i) => s + i.total, 0);

  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-5 pr-2">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Invoice #</div>
          <div className="font-mono font-medium">{detail.invoice_number}</div>
          <div className="text-muted-foreground">Patient</div>
          <div>{detail.patient_name} <span className="text-muted-foreground text-xs">({detail.patient_code})</span></div>
          <div className="text-muted-foreground">Status</div>
          <div><Badge className="text-xs border-none">{detail.status}</Badge></div>
          <div className="text-muted-foreground">Total</div>
          <div className="font-medium">{formatCurrency(detail.total, currency)}</div>
          <div className="text-muted-foreground">Paid</div>
          <div className="text-green-600 font-medium">{formatCurrency(detail.amount_paid, currency)}</div>
          <div className="text-muted-foreground">Outstanding</div>
          <div className={`font-medium ${detail.outstanding > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {formatCurrency(detail.outstanding, currency)}
          </div>
          {detail.due_date && <>
            <div className="text-muted-foreground">Due Date</div>
            <div>{formatDate(detail.due_date)}</div>
          </>}
        </div>

        {/* Line items */}
        {detail.items.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">{t("form.itemsStep")}</p>
            <div className="rounded border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("form.serviceName")}</TableHead>
                    <TableHead className="text-xs">{t("form.quantity")}</TableHead>
                    <TableHead className="text-xs">{t("form.unitPrice")}</TableHead>
                    <TableHead className="text-xs text-right">{t("form.lineTotal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        <div>{item.service_name}</div>
                        {item.doctor_name && <div className="text-xs text-muted-foreground">{item.doctor_name}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{item.quantity}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(item.unit_price, currency)}</TableCell>
                      <TableCell className="text-sm text-right font-medium">{formatCurrency(item.total, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-2 gap-8 text-sm pr-2">
              <span className="text-muted-foreground">{t("form.subtotal")}</span>
              <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
            </div>
          </div>
        )}

        {/* Payments */}
        {detail.payments.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Payments</p>
            <div className="space-y-2">
              {detail.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm rounded border p-2 bg-muted/30">
                  <div>
                    <span className="font-mono text-xs">{p.payment_ref}</span>
                    <span className="ml-2 capitalize text-muted-foreground text-xs">{p.method.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-600">{formatCurrency(p.amount, currency)}</span>
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insurance claims */}
        {detail.insurance_claims.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Insurance Claims</p>
            <div className="space-y-2">
              {detail.insurance_claims.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm rounded border p-2 bg-muted/30">
                  <div>
                    <span className="font-medium">{c.provider}</span>
                    {c.policy_number && <span className="ml-2 text-xs text-muted-foreground">{c.policy_number}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs border-none capitalize">{c.status}</Badge>
                    <span className="text-sm">{formatCurrency(c.claimed_amount, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ── Create mode ────────────────────────────────────────────────────────────

export function InvoiceDialog({ open, onOpenChange, invoice }: Props) {
  const t = useTranslations("Finance.invoices.form");
  const commonT = useTranslations("Common");
  const currency = commonT("currency");
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const isViewMode = !!invoice;

  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);

  const { formData, handleFieldChange, validate, errors, resetForm } = useFormManager({
    initialData: {
      patient_id: "",
      visit_id: "",
      due_date: "",
      notes: "",
      discount: 0,
      tax: 0,
    },
    schema: createInvoiceSchema,
  });

  const { data: patients = [] } = useQuery<PatientSummary[]>({
    queryKey: ["patients"],
    queryFn: fetchAllPatients,
    enabled: open && !isViewMode,
    staleTime: 60_000,
  });

  const patientOptions = patients.map((p) => ({
    key: p.patient_id,
    label: `${p.full_name} (${p.patient_code})`,
  }));

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const result = await createInvoice({
        patient_id: formData.patient_id,
        visit_id: formData.visit_id || undefined,
        due_date: formData.due_date || undefined,
        notes: formData.notes || undefined,
        discount: formData.discount,
        tax: formData.tax,
        created_by: user?.id,
      });

      if (!result.success || !result.invoiceId) throw new Error(result.error ?? "Failed");

      const validItems = items.filter((i) => i.service_name.trim());
      await Promise.all(
        validItems.map((item) =>
          addInvoiceItem({
            invoice_id: result.invoiceId!,
            service_name: item.service_name,
            doctor_id: item.doctor_id || undefined,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_pct: item.discount_pct,
          }),
        ),
      );
    },
    onSuccess: () => {
      toast.success(commonT("success"));
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      handleClose();
    },
    onError: (err: Error) => toast.error(err.message ?? commonT("error")),
  });

  const handleClose = () => {
    resetForm();
    setStep(1);
    setItems([emptyItem()]);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep(2);
  };

  const handleSubmit = () => mutate();

  const updateItem = (key: number, field: keyof Omit<ItemDraft, "_key">, value: string | number) => {
    setItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, [field]: value } : i)),
    );
  };

  const removeItem = (key: number) => setItems((prev) => prev.filter((i) => i._key !== key));

  const subtotal = items.reduce((s, i) => s + itemTotal(i), 0);
  const grandTotal = subtotal + (formData.tax ?? 0) - (formData.discount ?? 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isViewMode ? t("viewTitle") : step === 1 ? t("headerStep") : t("itemsStep")}
          </DialogTitle>
        </DialogHeader>

        {/* VIEW MODE */}
        {isViewMode && invoice && (
          <InvoiceDetailView invoiceId={invoice.id} currency={currency} />
        )}

        {/* CREATE: STEP 1 — Header */}
        {!isViewMode && step === 1 && (
          <div className="space-y-4">
            <SelectField
              label={t("selectPatient")}
              name="patient_id"
              options={patientOptions}
              value={formData.patient_id}
              onValueChange={(v) => handleFieldChange({ name: "patient_id", value: v })}
              showSearch
              searchPlaceholder="Search patients..."
              error={errors.patient_id}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("dueDate")}</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleFieldChange({ name: "due_date", value: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("discount")}</Label>
                <Input
                  type="number" min={0} step={0.01}
                  value={formData.discount}
                  onChange={(e) => handleFieldChange({ name: "discount", value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("tax")}</Label>
                <Input
                  type="number" min={0} step={0.01}
                  value={formData.tax}
                  onChange={(e) => handleFieldChange({ name: "tax", value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t("notes")}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange({ name: "notes", value: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* CREATE: STEP 2 — Line items */}
        {!isViewMode && step === 2 && (
          <div className="space-y-4">
            <ScrollArea className="max-h-72">
              <div className="space-y-3 pr-2">
                {items.map((item) => (
                  <div key={item._key} className="grid grid-cols-12 gap-2 items-end border rounded p-3">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">{t("serviceName")}</Label>
                      <Input
                        value={item.service_name}
                        onChange={(e) => updateItem(item._key, "service_name", e.target.value)}
                        placeholder="e.g. Scaling"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">{t("quantity")}</Label>
                      <Input
                        type="number" min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item._key, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">{t("unitPrice")}</Label>
                      <Input
                        type="number" min={0} step={0.01}
                        value={item.unit_price}
                        onChange={(e) => updateItem(item._key, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">{t("discountPct")}</Label>
                      <Input
                        type="number" min={0} max={100} step={1}
                        value={item.discount_pct}
                        onChange={(e) => updateItem(item._key, "discount_pct", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label className="text-xs">{t("lineTotal")}</Label>
                      <p className="text-sm font-medium pt-2">{formatCurrency(itemTotal(item), currency)}</p>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item._key)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              variant="outline" size="sm" className="gap-2 w-full"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
            >
              <Plus className="h-4 w-4" />
              {t("addItem")}
            </Button>

            <div className="flex justify-end gap-8 text-sm border-t pt-3">
              <div className="space-y-1 text-right">
                <div className="flex gap-8">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                {(formData.discount ?? 0) > 0 && (
                  <div className="flex gap-8">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">-{formatCurrency(formData.discount ?? 0, currency)}</span>
                  </div>
                )}
                {(formData.tax ?? 0) > 0 && (
                  <div className="flex gap-8">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(formData.tax ?? 0, currency)}</span>
                  </div>
                )}
                <div className="flex gap-8 font-semibold text-base border-t pt-1">
                  <span>{t("grandTotal")}</span>
                  <span>{formatCurrency(grandTotal, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {isViewMode ? (
            <Button variant="outline" onClick={handleClose}>{commonT("cancel")}</Button>
          ) : step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>{commonT("cancel")}</Button>
              <Button onClick={handleNext}>{t("next")}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>{t("back")}</Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? t("creating") : t("create")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
