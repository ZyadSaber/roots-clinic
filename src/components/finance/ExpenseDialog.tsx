"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormManager } from "@/hooks";
import { createExpenseSchema } from "@/validation/finance";
import { createExpense, updateExpense } from "@/services/finance";
import type { Expense, ExpenseCategory, ExpenseStatus } from "@/types/finance";
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
  expense?: Expense | null;
}

const initialData = {
  title: "",
  description: "",
  category: "other" as ExpenseCategory,
  department: "",
  amount: 0,
  status: "pending" as ExpenseStatus,
  expense_date: new Date().toISOString().slice(0, 10),
};

export function ExpenseDialog({ open, onOpenChange, expense }: Props) {
  const t = useTranslations("Finance.expenses.form");
  const commonT = useTranslations("Common");
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const isEdit = !!expense;

  const { formData, setFormData, handleFieldChange, validate, errors, resetForm } = useFormManager({
    initialData,
    schema: createExpenseSchema,
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        title: expense.title,
        description: expense.description ?? "",
        category: expense.category,
        department: expense.department ?? "",
        amount: expense.amount,
        status: expense.status,
        expense_date: expense.expense_date.slice(0, 10),
      });
    } else {
      resetForm();
    }
  }, [expense, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (isEdit && expense) {
        return updateExpense(expense.id, {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          department: formData.department || undefined,
          amount: formData.amount,
          status: formData.status,
          expense_date: formData.expense_date,
        });
      }
      return createExpense({
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        department: formData.department || undefined,
        amount: formData.amount,
        status: formData.status,
        expense_date: formData.expense_date,
        added_by: user?.id,
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(commonT("success"));
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
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

  const expT = useTranslations("Finance.expenses");

  const categoryOptions: { value: ExpenseCategory; label: string }[] = [
    { value: "fixed", label: expT("categories.fixed") },
    { value: "inventory", label: expT("categories.inventory") },
    { value: "personnel", label: expT("categories.personnel") },
    { value: "service", label: expT("categories.service") },
    { value: "utility", label: expT("categories.utility") },
    { value: "other", label: expT("categories.other") },
  ];

  const statusOptions: { value: ExpenseStatus; label: string }[] = [
    { value: "paid", label: expT("statuses.paid") },
    { value: "pending", label: expT("statuses.pending") },
    { value: "overdue", label: expT("statuses.overdue") },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t("title")}</Label>
            <Input
              value={formData.title}
              onChange={(e) => handleFieldChange({ name: "title", value: e.target.value })}
              placeholder="e.g. Office rent"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t("category")}</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => handleFieldChange({ name: "category", value: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-1">
              <Label>{t("date")}</Label>
              <Input
                type="date"
                value={formData.expense_date}
                onChange={(e) => handleFieldChange({ name: "expense_date", value: e.target.value })}
              />
              {errors.expense_date && <p className="text-xs text-destructive">{errors.expense_date}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("department")}</Label>
            <Input
              value={formData.department}
              onChange={(e) => handleFieldChange({ name: "department", value: e.target.value })}
              placeholder="e.g. Radiology, Admin"
            />
          </div>

          <div className="space-y-1">
            <Label>{t("description")}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleFieldChange({ name: "description", value: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            {commonT("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? t("saving") : isEdit ? t("save") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
