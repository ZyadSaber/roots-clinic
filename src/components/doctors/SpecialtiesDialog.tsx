"use client";

import * as React from "react";
import {
    Stethoscope,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    Loader2,
    Copy,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Specialty } from "@/types/database";
import {
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
} from "@/services/specialties";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RowState {
    id: string;
    english_name: string;
    arabic_name: string;
    /** true if this row has never been persisted yet */
    isNew?: boolean;
}

interface SpecialtiesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** Initial data fetched server-side */
    specializations: Specialty[];
    /** Called after any successful mutation so parent can refresh its list */
    onDataChange?: (updated: Specialty[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shortId(id: string) {
    return id.slice(0, 8).toUpperCase();
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SpecialtiesDialog({
    isOpen,
    onClose,
    specializations,
    onDataChange,
}: SpecialtiesDialogProps) {
    // Local copy of rows; synced from props when dialog opens
    const [rows, setRows] = React.useState<RowState[]>([]);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editBuf, setEditBuf] = React.useState<{ english_name: string; arabic_name: string }>({
        english_name: "",
        arabic_name: "",
    });
    const [pendingId, setPendingId] = React.useState<string | null>(null); // row being saved/deleted
    const [globalError, setGlobalError] = React.useState<string | null>(null);

    // Sync rows from props each time the dialog opens
    React.useEffect(() => {
        if (isOpen) {
            setRows(specializations.map((s) => ({ ...s })));
            setEditingId(null);
            setGlobalError(null);
        }
    }, [isOpen, specializations]);

    // ── Helpers ──────────────────────────────────────────────────────────────

    function startEdit(row: RowState) {
        setEditingId(row.id);
        setEditBuf({ english_name: row.english_name, arabic_name: row.arabic_name });
        setGlobalError(null);
    }

    function cancelEdit(row: RowState) {
        if (row.isNew) {
            // Remove unsaved new row
            setRows((prev) => prev.filter((r) => r.id !== row.id));
        }
        setEditingId(null);
    }

    function addNewRow() {
        const tempId = `new-${Date.now()}`;
        const newRow: RowState = {
            id: tempId,
            english_name: "",
            arabic_name: "",
            isNew: true,
        };
        setRows((prev) => [newRow, ...prev]);
        setEditingId(tempId);
        setEditBuf({ english_name: "", arabic_name: "" });
        setGlobalError(null);
    }

    // ── Save (create or update) ───────────────────────────────────────────────

    async function saveRow(row: RowState) {
        const { english_name, arabic_name } = editBuf;
        if (!english_name.trim() || !arabic_name.trim()) {
            setGlobalError("Both English and Arabic names are required.");
            return;
        }

        setPendingId(row.id);
        setGlobalError(null);

        if (row.isNew) {
            const res = await createSpecialty(english_name, arabic_name);
            if (!res.success || !res.specialty) {
                setGlobalError(res.error ?? "Failed to create specialty.");
                setPendingId(null);
                return;
            }
            setRows((prev) =>
                prev.map((r) =>
                    r.id === row.id ? { ...res.specialty! } : r,
                ),
            );
            onDataChange?.(
                rows
                    .filter((r) => r.id !== row.id)
                    .concat(res.specialty)
                    .sort((a, b) => a.english_name.localeCompare(b.english_name)),
            );
            toast.success("Specialty created.");
        } else {
            const res = await updateSpecialty(row.id, english_name, arabic_name);
            if (!res.success || !res.specialty) {
                setGlobalError(res.error ?? "Failed to update specialty.");
                setPendingId(null);
                return;
            }
            const updated = res.specialty;
            setRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...updated } : r)),
            );
            onDataChange?.(
                rows
                    .map((r) => (r.id === row.id ? (updated as RowState) : r))
                    .sort((a, b) => a.english_name.localeCompare(b.english_name)),
            );
            toast.success("Specialty updated.");
        }

        setEditingId(null);
        setPendingId(null);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    async function deleteRow(row: RowState) {
        if (row.isNew) {
            setRows((prev) => prev.filter((r) => r.id !== row.id));
            setEditingId(null);
            return;
        }
        setPendingId(row.id);
        setGlobalError(null);
        const res = await deleteSpecialty(row.id);
        if (!res.success) {
            setGlobalError(res.error ?? "Failed to delete specialty.");
            setPendingId(null);
            return;
        }
        const next = rows.filter((r) => r.id !== row.id);
        setRows(next);
        onDataChange?.(next);
        if (editingId === row.id) setEditingId(null);
        setPendingId(null);
        toast.success("Specialty deleted.");
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-175 p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                <div className="bg-background">
                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="h-32 bg-linear-to-br from-primary/10 via-accent/5 to-background border-b border-border/40 relative overflow-hidden">
                        <div className="absolute top-0 inset-e-0 p-8 opacity-10">
                            <Stethoscope className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="p-8 pb-0 flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight mb-1">
                                    Specialties
                                </DialogTitle>
                                <DialogDescription className="font-medium text-muted-foreground">
                                    Add, edit or remove doctor specialties
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={addNewRow}
                                    disabled={!!editingId}
                                    className="rounded-xl h-10 px-4 gap-2 font-bold shadow-lg shadow-primary/20"
                                >
                                    <Plus className="w-4 h-4" /> Add
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-background/80 shadow-xs"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ── Error banner ────────────────────────────────────── */}
                    {globalError && (
                        <div className="mx-6 mt-4 flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-bold text-destructive">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {globalError}
                        </div>
                    )}

                    {/* ── Table ──────────────────────────────────────────── */}
                    <div className="p-6 max-h-105 overflow-y-auto scrollbar-hide">
                        {rows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                <Stethoscope className="w-12 h-12 opacity-20" />
                                <p className="font-bold text-sm">No specialties yet. Click <strong>Add</strong> to create one.</p>
                            </div>
                        ) : (
                            <table className="w-full border-separate border-spacing-y-2">
                                <thead>
                                    <tr>
                                        <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2 ps-3 w-25">
                                            ID
                                        </th>
                                        <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">
                                            English Name
                                        </th>
                                        <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">
                                            Arabic Name
                                        </th>
                                        <th className="w-25" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => {
                                        const isEditing = editingId === row.id;
                                        const isPending = pendingId === row.id;

                                        return (
                                            <tr
                                                key={row.id}
                                                className={`group transition-all ${isEditing
                                                    ? "bg-primary/5 ring-1 ring-primary/20"
                                                    : "bg-accent/30 hover:bg-accent/50"
                                                    } rounded-2xl`}
                                            >
                                                {/* ID */}
                                                <td className="rounded-s-2xl ps-3 pe-2 py-3">
                                                    {row.isNew ? (
                                                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-wider">
                                                            NEW
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            title="Copy full ID"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(row.id);
                                                                toast.info("ID copied!");
                                                            }}
                                                            className="flex items-center gap-1 font-mono text-[10px] font-black text-muted-foreground hover:text-foreground transition-colors group/id"
                                                        >
                                                            <span>{shortId(row.id)}</span>
                                                            <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                                        </button>
                                                    )}
                                                </td>

                                                {/* English Name */}
                                                <td className="py-3 pe-2">
                                                    {isEditing ? (
                                                        <Input
                                                            autoFocus
                                                            value={editBuf.english_name}
                                                            onChange={(e) =>
                                                                setEditBuf((p) => ({ ...p, english_name: e.target.value }))
                                                            }
                                                            placeholder="English name"
                                                            className="h-9 rounded-xl bg-background border-border/50 text-sm font-bold focus-visible:ring-primary/30"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-bold">{row.english_name}</span>
                                                    )}
                                                </td>

                                                {/* Arabic Name */}
                                                <td className="py-3 pe-2">
                                                    {isEditing ? (
                                                        <Input
                                                            value={editBuf.arabic_name}
                                                            onChange={(e) =>
                                                                setEditBuf((p) => ({ ...p, arabic_name: e.target.value }))
                                                            }
                                                            placeholder="الاسم بالعربية"
                                                            dir="rtl"
                                                            className="h-9 rounded-xl bg-background border-border/50 text-sm font-bold focus-visible:ring-primary/30"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-bold" dir="rtl">
                                                            {row.arabic_name}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="rounded-e-2xl py-3 pe-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {isPending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                        ) : isEditing ? (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => saveRow(row)}
                                                                    className="h-8 w-8 rounded-xl text-green-600 hover:bg-green-50 hover:text-green-700"
                                                                    title="Save"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => cancelEdit(row)}
                                                                    className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-accent"
                                                                    title="Cancel"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => startEdit(row)}
                                                                    disabled={!!editingId}
                                                                    className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => deleteRow(row)}
                                                                    disabled={!!editingId}
                                                                    className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* ── Footer ─────────────────────────────────────────── */}
                    <div className="px-6 pb-6">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {rows.length} {rows.length === 1 ? "specialty" : "specialties"} total
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
