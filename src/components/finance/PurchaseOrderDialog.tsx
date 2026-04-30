"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormManager } from "@/hooks";
import { createPurchaseInvoice, getSuppliers } from "@/services/inventory";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Textarea from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const initialData = {
  supplier_id: "",
  ordered_at: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function PurchaseOrderDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const { formData, handleChange, handleFieldChange, resetForm } = useFormManager({ initialData });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
    staleTime: 60_000,
  });

  const selectedSupplier = suppliers.find((s) => s.id === formData.supplier_id);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createPurchaseInvoice({
        supplier_id: formData.supplier_id || undefined,
        supplier: selectedSupplier?.name ?? "Unknown",
        ordered_at: formData.ordered_at,
        notes: formData.notes || undefined,
        created_by: user?.id,
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
        toast.success("Purchase order created");
        resetForm();
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Failed to create purchase order");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id) { toast.error("Please select a supplier"); return; }
    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Supplier *</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(v) => handleFieldChange({ name: "supplier_id", value: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Order Date</Label>
            <Input type="date" name="ordered_at" value={formData.ordered_at} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Optional notes..." rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
