"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Stethoscope, Plus, Pencil, Check,
    X, Loader2, Copy, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createSpecialty, updateSpecialty, deleteSpecialty } from "@/services/specialties";
import { toast } from "sonner";
import useFormManager from "@/hooks/useFormManager";
import { specialtySchema } from "@/validation/specialties";

import { SpecialtyRow, SpecialtiesDialogProps } from "@/types/specialties";
import isArrayHasData from "@/lib/isArrayHasData";
import { useTranslations } from "next-intl";
import DeleteDialog from "../shared/delete-dialog";
import { LoadingOverlay } from "../ui/LoadingOverlay";


function shortId(id: string) {
    return id.slice(24).toUpperCase();
}

export function SpecialtiesDialog({
    isOpen,
    onClose,
    specializations,
}: SpecialtiesDialogProps) {
    const queryClient = useQueryClient()
    const t = useTranslations("Common")
    const tSpecialty = useTranslations("Doctors.specializations")

    const [rows, setRows] = useState<SpecialtyRow[]>(specializations || []);

    const {
        formData: {
            english_name,
            arabic_name,
            globalError,
            id,
            isNew
        },
        handleChangeMultiInputs,
        handleChange,
        resetForm,
        validate,
        handleFieldChange,
        errors,
    } = useFormManager({
        initialData: {
            english_name: "",
            arabic_name: "",
            globalError: null,
            editingId: null,
            id: null,
            isNew: false
        },
        schema: specialtySchema,
    });


    const { mutate, isPending: isLoading } = useMutation({
        mutationFn: ({ english_name, arabic_name, id }: { english_name: string; arabic_name: string; id: string }) =>
            isNew ? createSpecialty(english_name, arabic_name) : updateSpecialty(id, english_name, arabic_name),
        onSuccess: (res, variables) => {
            if (!res.success || !res.specialty) {
                handleFieldChange({ name: "globalError", value: res.error ?? t("error") })
                return;
            }
            setRows((prev) => prev.map((r) => (r.id === variables.id ? { ...res.specialty! } : r)))
            queryClient.invalidateQueries({ queryKey: ['specialties'] })
            resetForm()
            toast.success(t("success"))
        },
        onError: () => handleFieldChange({ name: "globalError", value: t("error") })
    })

    const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
        mutationFn: (id: string) => deleteSpecialty(id),
        onSuccess: (res, id) => {
            if (!res.success) {
                handleFieldChange({ name: "globalError", value: res.error ?? t("error") })
                return;
            }
            setRows((prev) => prev.filter((r) => r.id !== id))
            queryClient.invalidateQueries({ queryKey: ['specialties'] })
            toast.success("Specialty deleted.")
        },
        onError: () => handleFieldChange({ name: "globalError", value: t("error") }),
    })

    const isPending = isLoading || isDeleting

    function startEdit(row: SpecialtyRow) {
        handleChangeMultiInputs({
            english_name: row.english_name,
            arabic_name: row.arabic_name,
            id: row.id,
            globalError: null
        });
    }

    function cancelEdit(row: SpecialtyRow) {
        if (row.isNew) setRows((prev) => prev.filter((r) => r.id !== row.id));
        handleFieldChange({ name: "id", value: null })
        resetForm();
    }

    const addNewRow = () => {
        const tempId = `new-${Date.now()}`
        setRows((prev) => [{ id: tempId, english_name: "", arabic_name: "", isNew: true }, ...prev]);
        resetForm();
        handleChangeMultiInputs({
            globalError: null,
            id: tempId,
            isNew: true,
        })
    }

    function saveRow() {
        if (!validate()) return;
        handleFieldChange({ name: "globalError", value: null })
        mutate({ english_name, arabic_name, id: id || "" })
    }

    const deleteRow = (row: SpecialtyRow) => () => {
        if (row.isNew) {
            setRows((prev) => prev.filter((r) => r.id !== row.id));
            return;
        }
        mutateDelete(row.id)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-175 p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                <div className="bg-background">
                    <div className="h-32 bg-linear-to-br from-primary/10 via-accent/5 to-background border-b border-border/40 relative overflow-hidden">
                        <div className="absolute top-0 inset-e-0 p-8 opacity-10">
                            <Stethoscope className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="p-8 pb-0 flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight mb-1">
                                    {tSpecialty("specialty")}
                                </DialogTitle>
                                <DialogDescription className="font-medium text-muted-foreground">
                                    {tSpecialty("specialtyDesc")}
                                </DialogDescription>
                            </div>
                            <Button
                                type="button"
                                onClick={addNewRow}
                                className="relative z-10 rounded-xl h-10 px-4 gap-2 font-bold shadow-lg shadow-primary/20"
                                disabled={!!id || isPending}
                            >
                                <Plus className="w-4 h-4" /> {t("add")}
                            </Button>

                        </div>
                    </div>

                    {Boolean(globalError || Object.values(errors).some(Boolean)) && (
                        <div className="mx-6 mt-4 flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-bold text-destructive">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {((globalError || Object.values(errors).find(v => !!v)) as string)}
                        </div>
                    )}


                    <div className="p-6 max-h-105 overflow-y-auto scrollbar-hide">
                        <LoadingOverlay loading={isPending}>
                            {!isArrayHasData(rows) ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                    <Stethoscope className="w-12 h-12 opacity-20" />
                                    <p className="font-bold text-sm">No specialties yet. Click <strong>Add</strong> to create one.</p>
                                </div>
                            ) : (
                                <table className="w-full border-separate border-spacing-y-2">
                                    <thead>
                                        <tr>
                                            <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2 ps-3 w-25">{t("id")}</th>
                                            <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">{t("enName")}</th>
                                            <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">{t("arName")}</th>
                                            <th className="w-25" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => {
                                            const isEditing = id === row.id;
                                            const isRowPending = isPending && id === row.id;

                                            return (
                                                <tr
                                                    key={row.id}
                                                    className={`group transition-all ${isEditing
                                                        ? "bg-primary/5 ring-1 ring-primary/20"
                                                        : "bg-accent/30 hover:bg-accent/50"
                                                        } rounded-2xl`}
                                                >
                                                    <td className="rounded-s-2xl ps-3 pe-2 py-3">
                                                        {row.isNew ? (
                                                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-wider">NEW</span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => { navigator.clipboard.writeText(row.id); toast.info("ID copied!"); }}
                                                                className="flex items-center gap-1 font-mono text-[10px] font-black text-muted-foreground hover:text-foreground transition-colors group/id"
                                                            >
                                                                <span>{shortId(row.id)}</span>
                                                                <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pe-2">
                                                        {isEditing ? (
                                                            <Input
                                                                autoFocus
                                                                name="english_name"
                                                                value={english_name}
                                                                onChange={handleChange}
                                                                className={`h-9 rounded-xl bg-background border-border/50 text-sm font-bold focus-visible:ring-primary/30 ${errors.english_name ? 'ring-2 ring-destructive' : ''}`}
                                                            />
                                                        ) : (

                                                            <span className="text-sm font-bold">{row.english_name}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pe-2">
                                                        {isEditing ? (
                                                            <Input
                                                                name="arabic_name"
                                                                value={arabic_name}
                                                                onChange={handleChange}
                                                                dir="rtl"
                                                                className={`h-9 rounded-xl bg-background border-border/50 text-sm font-bold focus-visible:ring-primary/30 ${errors.arabic_name ? 'ring-2 ring-destructive' : ''}`}
                                                            />
                                                        ) : (

                                                            <span className="text-sm font-bold" dir="rtl">{row.arabic_name}</span>
                                                        )}
                                                    </td>
                                                    <td className="rounded-e-2xl py-3 pe-3">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {isRowPending ? (
                                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                            ) : isEditing ? (
                                                                <>
                                                                    <Button size="icon" variant="ghost" onClick={saveRow}
                                                                        className="h-8 w-8 rounded-xl text-green-600 hover:bg-green-50 hover:text-green-700">
                                                                        <Check className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" onClick={() => cancelEdit(row)}
                                                                        className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-accent">
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button size="icon" variant="ghost" onClick={() => startEdit(row)}
                                                                        disabled={!!id || isPending}
                                                                        className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary">
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <DeleteDialog
                                                                        deleteAction={deleteRow(row)}
                                                                        deleteLoading={isDeleting}
                                                                        deleteClassName="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                                                                    />
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
                        </LoadingOverlay>
                    </div>

                    <div className="px-6 pb-6 mt-5">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {rows.length} {tSpecialty("specialty")}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}