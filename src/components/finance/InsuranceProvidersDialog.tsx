"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Plus, Pencil, Phone, User, AlertCircle, CalendarRange, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { deleteInsuranceProvider } from "@/services/finance";
import { toast } from "sonner";
import type { InsuranceProvider } from "@/types/finance";
import isArrayHasData from "@/lib/isArrayHasData";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import DeleteDialog from "@/components/shared/delete-dialog";
import { InsuranceProviderDialog } from "./InsuranceProviderDialog";
import { format } from "date-fns";

interface Props {
  isOpen: boolean;
  onClose: (v: boolean) => void;
  providers: InsuranceProvider[];
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return format(new Date(d), "yyyy/MM/dd"); } catch { return d; }
}

export function InsuranceProvidersDialog({ isOpen, onClose, providers }: Props) {
  const queryClient = useQueryClient();
  const [editProvider, setEditProvider] = useState<InsuranceProvider | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteInsuranceProvider(id),
    onSuccess: (res) => {
      if (!res.success) {
        setGlobalError(res.error ?? "Failed to delete provider");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["insurance-providers"] });
      toast.success("Provider deleted");
    },
    onError: () => setGlobalError("Something went wrong"),
  });

  const openAdd = () => {
    setEditProvider(null);
    setFormOpen(true);
  };

  const openEdit = (p: InsuranceProvider) => {
    setEditProvider(p);
    setFormOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <div className="bg-background">
            {/* ── Header ── */}
            <div className="h-32 bg-linear-to-br from-primary/10 via-accent/5 to-background border-b border-border/40 relative overflow-hidden">
              <div className="absolute top-0 inset-e-0 p-8 opacity-10">
                <ShieldCheck className="w-32 h-32 rotate-12" />
              </div>
              <div className="p-8 pb-0 flex justify-between items-start">
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tight mb-1">
                    Insurance Providers
                  </DialogTitle>
                  <DialogDescription className="font-medium text-muted-foreground">
                    Manage providers and their contract details
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
            <div className="p-6 max-h-[28rem] overflow-y-auto scrollbar-hide">
              <LoadingOverlay loading={isDeleting}>
                {!isArrayHasData(providers) ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <ShieldCheck className="w-12 h-12 opacity-20" />
                    <p className="font-bold text-sm">
                      No providers yet. Click <strong>Add</strong> to create one.
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
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                        </th>
                        <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">
                          <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3" /> Hotline</span>
                        </th>
                        <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">
                          <span className="flex items-center gap-1"><CalendarRange className="w-3 h-3" /> Contract</span>
                        </th>
                        <th className="text-[10px] uppercase font-black tracking-widest text-muted-foreground text-start pb-2">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Representative</span>
                        </th>
                        <th className="w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map((p) => (
                        <tr
                          key={p.id}
                          className="group bg-accent/30 hover:bg-accent/50 transition-all rounded-2xl"
                        >
                          <td className="rounded-s-2xl ps-3 pe-2 py-3">
                            <span className="text-sm font-bold">{p.name}</span>
                          </td>
                          <td className="py-3 pe-2">
                            <span className="text-sm text-muted-foreground font-mono">{p.phone ?? "—"}</span>
                          </td>
                          <td className="py-3 pe-2">
                            <span className="text-sm text-muted-foreground font-mono">{p.hotline ?? "—"}</span>
                          </td>
                          <td className="py-3 pe-2">
                            <span className="text-xs text-muted-foreground">
                              {fmtDate(p.date_from)} → {fmtDate(p.date_to)}
                            </span>
                          </td>
                          <td className="py-3 pe-2">
                            <span className="text-sm text-muted-foreground">{p.representative_person ?? "—"}</span>
                          </td>
                          <td className="rounded-e-2xl py-3 pe-3">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEdit(p)}
                                className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <DeleteDialog
                                deleteAction={() => mutateDelete(p.id)}
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
                {providers.length} provider{providers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {formOpen && (
        <InsuranceProviderDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          provider={editProvider}
        />
      )}
    </>
  );
}
