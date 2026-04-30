"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormManager } from "@/hooks";
import { createInventoryItem } from "@/services/inventory";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const initialData = {
  name: "",
  sku: "",
  category: "",
  unit: "",
  supplier: "",
  current_stock: 0,
  reorder_level: 0,
  unit_price: 0,
  expiry_date: "",
};

export function AddItemDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { formData, handleChange, resetForm } = useFormManager({ initialData });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createInventoryItem({
        name: formData.name,
        sku: formData.sku,
        category: formData.category || undefined,
        unit: formData.unit || undefined,
        supplier: formData.supplier || undefined,
        current_stock: Number(formData.current_stock),
        reorder_level: Number(formData.reorder_level),
        unit_price: Number(formData.unit_price),
        expiry_date: formData.expiry_date || undefined,
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });
        toast.success("Item added successfully");
        resetForm();
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Failed to add item");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      toast.error("Name and SKU are required");
      return;
    }
    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Name *</Label>
              <Input name="name" value={formData.name} onChange={handleChange} placeholder="Item name" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="SKU-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input name="category" value={formData.category} onChange={handleChange} placeholder="Consumables" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input name="unit" value={formData.unit} onChange={handleChange} placeholder="pcs / boxes" />
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Input name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Supplier name" />
            </div>
            <div className="space-y-1.5">
              <Label>Current Stock</Label>
              <Input type="number" min={0} name="current_stock" value={formData.current_stock} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label>Reorder Level</Label>
              <Input type="number" min={0} name="reorder_level" value={formData.reorder_level} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Price</Label>
              <Input type="number" min={0} step="0.01" name="unit_price" value={formData.unit_price} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
