"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Plus, CheckCircle2, ArrowRight, Building2,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPurchaseInvoices, getPurchaseItems, addPurchaseItem,
  receivePurchaseOrder, updatePurchaseStatus,
  getSuppliers, getInventoryItems,
} from "@/services/inventory";
import type { PurchaseInvoice, PurchaseStatus } from "@/types/inventory";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { useVisibility } from "@/hooks";
import { SuppliersDialog } from "./SuppliersDialog";
import { PurchaseOrderDialog } from "./PurchaseOrderDialog";

// ── helpers ───────────────────────────────────────────────────────────────

const statusColors: Record<PurchaseStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-blue-500/20 text-blue-600",
  received: "bg-primary/20 text-primary",
  cancelled: "bg-destructive/20 text-destructive",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(n) + " EGP";
}

// ── Add-item row (inline inside expanded order) ────────────────────────────

function AddItemRow({ purchaseId }: { purchaseId: string }) {
  const t = useTranslations("Finance.purchases");
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
        toast.success(t("itemAdded"));
      } else {
        toast.error(res.error ?? "Failed");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const handleSelectItem = (id: string) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (item) { setItemId(item.id); setItemName(item.name); setUnitPrice(item.unit_price); }
  };

  return (
    <TableRow className="bg-secondary/20">
      <TableCell />
      <TableCell colSpan={6}>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            className="h-8 rounded-md border border-border bg-background text-sm px-2 flex-1 min-w-32"
            value={itemId}
            onChange={(e) => handleSelectItem(e.target.value)}
          >
            <option value="">{t("selectItem")}</option>
            {inventoryItems.map((i) => (
              <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
            ))}
          </select>
          <Input className="h-8 text-sm w-40" placeholder={t("itemName")} value={itemName}
            onChange={(e) => setItemName(e.target.value)} />
          <Input className="h-8 text-sm w-20" type="number" min={1} placeholder={t("qty")}
            value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <Input className="h-8 text-sm w-28" type="number" min={0} step="0.01" placeholder={t("unitPrice")}
            value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
          <Button size="sm" className="h-8 gap-1" onClick={() => mutate()} disabled={isPending || !itemName}>
            <Plus className="w-3.5 h-3.5" /> {t("add")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Single purchase order row ──────────────────────────────────────────────

function OrderRow({ order }: { order: PurchaseInvoice }) {
  const t = useTranslations("Finance.purchases");
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
        toast.success(t("orderReceived"));
      } else toast.error(res.error ?? "Failed");
    },
    onError: () => toast.error("Something went wrong"),
  });

  const { mutate: markOrdered, isPending: ordering } = useMutation({
    mutationFn: () => updatePurchaseStatus(order.id, "ordered"),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
        toast.success(t("markedOrdered"));
      }
    },
  });

  const displaySupplier = order.supplier_name ?? order.supplier;

  return (
    <>
      <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <TableCell className="w-8">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="font-mono text-sm font-medium">{order.purchase_number}</TableCell>
        <TableCell className="text-sm">{displaySupplier}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{fmtDate(order.ordered_at)}</TableCell>
        <TableCell>
          <Badge className={`text-xs border-none ${statusColors[order.status]}`}>
            {t(`statuses.${order.status}`)}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-medium text-sm">{fmtCurrency(order.total)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1 justify-end">
            {order.status === "draft" && (
              <Button size="sm" variant="outline"
                className="h-7 text-xs gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                onClick={() => markOrdered()} disabled={ordering}>
                <ArrowRight className="w-3 h-3" /> {t("markOrdered")}
              </Button>
            )}
            {order.status === "ordered" && (
              <Button size="sm" variant="outline"
                className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => receive()} disabled={receiving}>
                <CheckCircle2 className="w-3 h-3" />
                {receiving ? t("receiving") : t("receive")}
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
                      <th className="text-left py-1 font-medium">{t("itemName")}</th>
                      <th className="text-right py-1 font-medium w-16">{t("qty")}</th>
                      <th className="text-right py-1 font-medium w-28">{t("unitPrice")}</th>
                      <th className="text-right py-1 font-medium w-28">{t("total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-border/30">
                        <td className="py-1">{item.item_name}</td>
                        <td className="text-right py-1">{item.quantity}</td>
                        <td className="text-right py-1">{fmtCurrency(item.unit_price)}</td>
                        <td className="text-right py-1 font-medium">{fmtCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {items.length === 0 && !itemsLoading && (
                      <tr>
                        <td colSpan={4} className="py-2 text-center text-muted-foreground text-xs">
                          {t("noItems")}
                        </td>
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

// ── Main PurchasesTab ──────────────────────────────────────────────────────

export function PurchasesTab() {
  const t = useTranslations("Finance.purchases");

  const {
    visible: orderDialogOpen,
    handleOpen: openOrderDialog,
    handleStateChange: setOrderDialogOpen,
  } = useVisibility();

  const {
    visible: suppliersOpen,
    handleOpen: openSuppliers,
    handleStateChange: setSuppliersOpen,
  } = useVisibility();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: getPurchaseInvoices,
    staleTime: 60_000,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={openSuppliers}
          className="gap-2 h-9 border-border/60"
        >
          <Building2 className="w-4 h-4" />
          {t("suppliers")}
          {suppliers.length > 0 && (
            <span className="ms-0.5 text-xs font-black text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
              {suppliers.length}
            </span>
          )}
        </Button>

        <Button size="sm" onClick={openOrderDialog} className="gap-2 h-9">
          <Plus className="w-4 h-4" /> {t("newOrder")}
        </Button>
      </div>

      {/* Purchase Orders table */}
      <LoadingOverlay loading={isLoading}>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>{t("poNumber")}</TableHead>
                <TableHead>{t("supplier")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("total")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {t("noPurchases")}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => <OrderRow key={order.id} order={order} />)
              )}
            </TableBody>
          </Table>
        </div>
      </LoadingOverlay>

      {/* Dialogs */}
      {suppliersOpen && (
        <SuppliersDialog
          isOpen={suppliersOpen}
          onClose={setSuppliersOpen}
          suppliers={suppliers}
        />
      )}

      {orderDialogOpen && (
        <PurchaseOrderDialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen} />
      )}
    </div>
  );
}
