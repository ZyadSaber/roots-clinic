"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, CheckCircle2, ArrowRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPurchaseInvoices, getPurchaseItems, addPurchaseItem, receivePurchaseOrder, updatePurchaseStatus,
} from "@/services/inventory";
import { getInventoryItems } from "@/services/inventory";
import type { PurchaseInvoice, PurchaseStatus } from "@/types/inventory";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const statusColors: Record<PurchaseStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-blue-500/20 text-blue-600",
  received: "bg-primary/20 text-primary",
  cancelled: "bg-destructive/20 text-destructive",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(n) + " EGP";
}

interface AddItemRowProps {
  purchaseId: string;
}

function AddItemRow({ purchaseId }: AddItemRowProps) {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: () => getInventoryItems(),
    staleTime: 60_000,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      addPurchaseItem({ purchase_id: purchaseId, item_id: itemId || undefined, item_name: itemName, quantity, unit_price: unitPrice }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["purchase-items", purchaseId] });
        queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
        setItemId(""); setItemName(""); setQuantity(1); setUnitPrice(0);
        toast.success("Item added");
      } else {
        toast.error(res.error ?? "Failed");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const handleSelectItem = (id: string) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (item) {
      setItemId(item.id);
      setItemName(item.name);
      setUnitPrice(item.unit_price);
    }
  };

  return (
    <TableRow className="bg-secondary/20">
      <TableCell colSpan={4}>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            className="h-8 rounded-md border border-border bg-background text-sm px-2 flex-1 min-w-32"
            value={itemId}
            onChange={(e) => handleSelectItem(e.target.value)}
          >
            <option value="">Select existing item (optional)</option>
            {inventoryItems.map((i) => (
              <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
            ))}
          </select>
          <Input
            className="h-8 text-sm w-40"
            placeholder="Item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Input
            className="h-8 text-sm w-20"
            type="number"
            min={1}
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <Input
            className="h-8 text-sm w-24"
            type="number"
            min={0}
            step="0.01"
            placeholder="Unit price"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
          />
          <Button size="sm" className="h-8 gap-1" onClick={() => mutate()} disabled={isPending || !itemName}>
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface OrderRowProps {
  order: PurchaseInvoice;
}

function OrderRow({ order }: OrderRowProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["purchase-items", order.id],
    queryFn: () => getPurchaseItems(order.id),
    enabled: expanded,
    staleTime: 30_000,
  });

  const { mutate: receive, isPending: receiving } = useMutation({
    mutationFn: () => receivePurchaseOrder(order.id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] });
        toast.success("Purchase order received — stock updated");
      } else {
        toast.error(res.error ?? "Failed");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const { mutate: markOrdered, isPending: ordering } = useMutation({
    mutationFn: () => updatePurchaseStatus(order.id, "ordered"),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
        toast.success("Order marked as ordered");
      }
    },
  });

  const canReceive = order.status === "ordered";
  const canOrder = order.status === "draft";

  return (
    <>
      <TableRow
        className="hover:bg-muted/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="w-8">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="font-mono text-sm font-medium">{order.purchase_number}</TableCell>
        <TableCell className="text-sm">{order.supplier}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{formatDate(order.ordered_at)}</TableCell>
        <TableCell>
          <Badge className={`text-xs border-none ${statusColors[order.status]}`}>{order.status}</Badge>
        </TableCell>
        <TableCell className="text-right font-medium text-sm">{formatCurrency(order.total)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1 justify-end">
            {canOrder && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                onClick={() => markOrdered()} disabled={ordering}>
                <ArrowRight className="w-3 h-3" />
                Mark Ordered
              </Button>
            )}
            {canReceive && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => receive()} disabled={receiving}>
                <CheckCircle2 className="w-3 h-3" />
                {receiving ? "Receiving..." : "Receive"}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <>
          <TableRow className="bg-muted/20">
            <TableCell />
            <TableCell colSpan={6} className="py-2">
              <LoadingOverlay loading={itemsLoading}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs">
                      <th className="text-left py-1 font-medium">Item</th>
                      <th className="text-right py-1 font-medium">Qty</th>
                      <th className="text-right py-1 font-medium">Unit Price</th>
                      <th className="text-right py-1 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-border/30">
                        <td className="py-1">{item.item_name}</td>
                        <td className="text-right py-1">{item.quantity}</td>
                        <td className="text-right py-1">{formatCurrency(item.unit_price)}</td>
                        <td className="text-right py-1 font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {items.length === 0 && !itemsLoading && (
                      <tr>
                        <td colSpan={4} className="py-2 text-center text-muted-foreground text-xs">No items yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </LoadingOverlay>
            </TableCell>
          </TableRow>
          {(order.status === "draft" || order.status === "ordered") && (
            <AddItemRow purchaseId={order.id} />
          )}
        </>
      )}
    </>
  );
}

interface Props {
  onNewOrder: () => void;
}

export function PurchaseOrderList({ onNewOrder }: Props) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: getPurchaseInvoices,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={onNewOrder} className="gap-2">
          <Plus className="w-4 h-4" />
          New Purchase Order
        </Button>
      </div>

      <LoadingOverlay loading={isLoading}>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No purchase orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => <OrderRow key={order.id} order={order} />)
              )}
            </TableBody>
          </Table>
        </div>
      </LoadingOverlay>
    </div>
  );
}
