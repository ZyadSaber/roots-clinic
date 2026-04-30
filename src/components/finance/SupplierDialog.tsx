"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormManager } from "@/hooks";
import { createSupplier, updateSupplier } from "@/services/inventory";
import type { Supplier, CreateSupplierPayload } from "@/types/inventory";
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
  supplier?: Supplier | null;
}

const initialData: CreateSupplierPayload = {
  name: "",
  phone: "",
  responsible_person: "",
  initial_balance: 0,
  notes: "",
};

export function SupplierDialog({ open, onOpenChange, supplier }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!supplier;
  const { formData, handleChange, setFormData, resetForm } = useFormManager({ initialData });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        phone: supplier.phone ?? "",
        responsible_person: supplier.responsible_person ?? "",
        initial_balance: supplier.initial_balance,
        notes: supplier.notes ?? "",
      });
    } else {
      resetForm();
    }
  }, [supplier, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (isEdit && supplier) {
        return updateSupplier(supplier.id, {
          name: formData.name,
          phone: formData.phone || undefined,
          responsible_person: formData.responsible_person || undefined,
          initial_balance: Number(formData.initial_balance),
          notes: formData.notes || undefined,
        });
      }
      return createSupplier({
        name: formData.name,
        phone: formData.phone || undefined,
        responsible_person: formData.responsible_person || undefined,
        initial_balance: Number(formData.initial_balance),
        notes: formData.notes || undefined,
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        toast.success(isEdit ? "Supplier updated" : "Supplier added");
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Failed");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { toast.error("Supplier name is required"); return; }
    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Supplier Name *</Label>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. MedSupply Co" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+20 1xx xxx xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Responsible Person</Label>
              <Input name="responsible_person" value={formData.responsible_person} onChange={handleChange} placeholder="Contact name" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Initial Balance (EGP)</Label>
            <Input type="number" min={0} step="0.01" name="initial_balance" value={formData.initial_balance} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Optional notes..." rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
