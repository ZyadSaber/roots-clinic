"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Pencil, Phone, User, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { deleteSupplier } from "@/services/inventory";
import { toast } from "sonner";
import type { Supplier } from "@/types/inventory";
import isArrayHasData from "@/lib/isArrayHasData";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import DeleteDialog from "@/components/shared/delete-dialog";
import { SupplierDialog } from "./SupplierDialog";

interface Props {
    isOpen: boolean;
    onClose: (v: boolean) => void;
    suppliers: Supplier[];
}

function fmtCurrency(n: number) {
    return new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(n) + " EGP";
}

export function SuppliersDialog({ isOpen, onClose, suppliers }: Props) {
    const queryClient = useQueryClient();
    const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
        mutationFn: (id: string) => deleteSupplier(id),
        onSuccess: (res) => {
            if (!res.success) {
                setGlobalError(res.error ?? "Failed to delete supplier");
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Supplier deleted");
        },
        onError: () => setGlobalError("Something went wrong"),
    });

    const openAdd = () => {
        setEditSupplier(null);
        setFormOpen(true);
    };

    const openEdit = (s: Supplier) => {
        setEditSupplier(s);
        setFormOpen(true);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <div className="bg-background">
                        {/* ── Header ── */}
                        <div className="h-32 bg-linear-to-br from-primary/10 via-accent/5 to-background border-b border-border/40 relative overflow-hidden">
                            <div className="absolute top-0 inset-e-0 p-8 opacity-10">
                                <Building2 className="w-32 h-32 rotate-12" />
                            </div>
                            <div className="p-8 pb-0 flex justify-between items-start">
                                <div>
                                    <DialogTitle className="text-3xl font-black tracking-tight mb-1">
                                        Suppliers
                                    </DialogTitle>
                                    <DialogDescription className="font-medium text-muted-foreground">
                                        Manage your clinic suppliers and their contact details
                                    </DialogDescription>
                                </div>
                                <Button
                                    type="button"
                                    onClick={openAdd}
                                    className="relative z-10 rounded-xl h-10 px-4 gap-2 font-bold shadow-lg shadow-primary/20"
                                >
                                    <Plus className="w-4 h-4" /> Add
                                </Button>
                            </div>
                        </div>

                        {/* ── Error banner ── */}
                        {globalError && (
                            <div className="mx-6 mt-4 flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-bold text-destructive">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {globalError}
                            </div>
                        )}

                        {/* ── Table ── */}
                        <div className="p-6 max-h-[26rem] overflow-y-auto scrollbar-hide">
                            <LoadingOverlay loading={isDeleting}>
                                {!isArrayHasData(suppliers) ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                        <Building2 className="w-12 h-12 opacity-20" />
                                        <p className="font-bold text-sm">
                                            No suppliers yet. Click <strong>Add</strong> to create one.
                                        </p>
                                    </div>
                                ) : (
                                    <table className="w-full border-separate border-spacing-y-2">
                                        <thead>
                                            <tr>
                                                <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2 ps-3">
                                                    Name
                                                </th>
                                                <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" /> Responsible
                                                    </span>
                                                </th>
                                                <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> Phone
                                                    </span>
                                                </th>
                                                <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">
                                                    <span className="flex items-center gap-1">
                                                        <Wallet className="w-3 h-3" /> Balance
                                                    </span>
                                                </th>
                                                <th className="w-20" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {suppliers.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="group bg-accent/30 hover:bg-accent/50 transition-all rounded-2xl"
                                                >
                                                    <td className="rounded-s-2xl ps-3 pe-2 py-3">
                                                        <span className="text-sm font-bold">{s.name}</span>
                                                    </td>
                                                    <td className="py-3 pe-2">
                                                        <span className="text-sm text-muted-foreground">
                                                            {s.responsible_person ?? "—"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pe-2">
                                                        <span className="text-sm text-muted-foreground font-mono">
                                                            {s.phone ?? "—"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pe-2">
                                                        <span className="text-sm font-medium">
                                                            {fmtCurrency(s.initial_balance)}
                                                        </span>
                                                    </td>
                                                    <td className="rounded-e-2xl py-3 pe-3">
                                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => openEdit(s)}
                                                                className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <DeleteDialog
                                                                deleteAction={() => mutateDelete(s.id)}
                                                                deleteLoading={isDeleting}
                                                                deleteClassName="h-8 w-8 rounded-xl opacity-100 hover:bg-primary/10 hover:text-primary"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </LoadingOverlay>
                        </div>

                        {/* ── Footer ── */}
                        <div className="px-6 pb-6 mt-2">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create / edit form — nested outside the list dialog */}
            {formOpen && (
                <SupplierDialog
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    supplier={editSupplier}
                />
            )}
        </>
    );
}
