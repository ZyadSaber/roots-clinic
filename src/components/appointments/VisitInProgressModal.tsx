"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
    Stethoscope, User, Clock, ScanLine, CheckCircle,
    Save, ImageIcon, FileText, Pill, CalendarCheck, ClipboardList, X,
} from "lucide-react"
import { updateAppointmentStatus } from "@/services/appointments"
import { getVisitByAppointmentId, getRadiologyByVisitId, updateVisitRecord } from "@/services/visits"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Textarea from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormManager, useVisibility } from "@/hooks"
import { Appointment } from "@/types/appointments"
import { toast } from "sonner"

const FORM_DEFAULTS = {
    diagnosis: "",
    procedure_done: "",
    procedure_notes: "",
    prescription: "",
    follow_up_date: "",
}

interface VisitInProgressModalProps {
    appointment: Appointment
    open: boolean
    onSendForRadiology: () => void
    onEndVisit: () => void
}

export function VisitInProgressModal({
    appointment,
    open,
    onSendForRadiology,
    onEndVisit,
}: VisitInProgressModalProps) {
    const queryClient = useQueryClient()

    // ── Form state ──
    const { formData, handleChange, setFormData } = useFormManager({ initialData: FORM_DEFAULTS })

    // ── Lightbox state ──
    const { visible: lightboxOpen, handleOpen: openLightbox, handleClose: closeLightbox } = useVisibility()
    const [lightboxUrl, setLightboxUrl] = useState("")

    // ── Visit record ──
    const { data: visit, isLoading: visitLoading } = useQuery({
        queryKey: ["visit", appointment.id],
        queryFn: () => getVisitByAppointmentId(appointment.id),
        enabled: open,
    })

    // ── Radiology assets — poll every 15 s ──
    const { data: radiology = [] } = useQuery({
        queryKey: ["radiology", visit?.id],
        queryFn: () => getRadiologyByVisitId(visit!.id),
        enabled: !!visit?.id && open,
        refetchInterval: 15000,
        refetchOnWindowFocus: true,
    })

    // Seed form when visit loads (only when visit ID changes)
    useEffect(() => {
        if (visit) {
            setFormData({
                diagnosis: visit.diagnosis ?? "",
                procedure_done: visit.procedure_done ?? "",
                procedure_notes: visit.procedure_notes ?? "",
                prescription: visit.prescription ?? "",
                follow_up_date: visit.follow_up_date
                    ? visit.follow_up_date.toString().slice(0, 10)
                    : "",
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visit?.id])

    // ── Mutations ──
    const saveMutation = useMutation({
        mutationFn: () => updateVisitRecord(visit!.id, {
            ...formData,
            follow_up_date: formData.follow_up_date || null,
        }),
        onSuccess: (res) => {
            if (res.success) toast.success("Notes saved")
            else toast.error(res.error ?? "Failed to save")
        },
        onError: () => toast.error("Something went wrong"),
    })

    const endMutation = useMutation({
        mutationFn: async () => {
            if (visit) {
                await updateVisitRecord(visit.id, {
                    ...formData,
                    follow_up_date: formData.follow_up_date || null,
                })
            }
            return updateAppointmentStatus(appointment.id, "completed")
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ["appointments"] })
                queryClient.invalidateQueries({ queryKey: ["appointments-stats"] })
                queryClient.invalidateQueries({ queryKey: ["visit", appointment.id] })
                toast.success(`Visit completed — ${appointment.patient_name}`)
                onEndVisit()
            } else {
                toast.error(res.error ?? "Failed to end visit")
            }
        },
        onError: () => toast.error("Something went wrong"),
    })

    const isPending = saveMutation.isPending || endMutation.isPending

    const handleImageClick = (url: string) => {
        setLightboxUrl(url)
        openLightbox()
    }

    return (
        <>
            <Dialog open={open} onOpenChange={() => { }}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="min-w-[80vw] w-[80vw] max-w-7xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-background [&>button]:hidden max-h-[95vh] flex flex-col"
                >
                    {/* ── Top bar ── */}
                    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/40 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Stethoscope className="w-5 h-5 text-amber-500" />
                                </div>
                                <span className="absolute -top-0.5 -inset-e-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-black tracking-tight leading-tight">
                                    Visit in Progress
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground font-medium">
                                    Session locked · complete or send for radiology to continue
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Patient summary */}
                        <div className="hidden sm:flex items-center gap-3 rounded-xl bg-accent/30 border border-border/30 px-3 py-2 shrink-0">
                            <div className="w-7 h-7 rounded-lg bg-background border border-border/50 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="text-start">
                                <p className="text-sm font-black leading-tight">{appointment.patient_name}</p>
                                <p className="text-[11px] text-muted-foreground font-medium">{appointment.patient_code}</p>
                            </div>
                            <div className="w-px h-6 bg-border/40 mx-1" />
                            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(appointment.appointment_date), "hh:mm a")}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Stethoscope className="w-3 h-3" />
                                    {appointment.procedure_type}
                                </span>
                            </div>
                            {appointment.priority === "urgent" && (
                                <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] font-black">
                                    URGENT
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* ── Two-column body ── */}
                    {/* flex-row: LTR → notes LEFT, radiology RIGHT | RTL → notes RIGHT, radiology LEFT */}
                    <div className="flex flex-row flex-1 overflow-hidden min-h-0">

                        {/* ── Clinical Notes (start side) ── */}
                        <div className="flex-1 flex flex-col overflow-hidden border-e border-border/40 min-w-0">
                            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-secondary/20 shrink-0">
                                <ClipboardList className="w-4 h-4 text-primary" />
                                <span className="text-sm font-black">Clinical Notes</span>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-hide">
                                {visitLoading ? (
                                    <div className="text-center py-10 text-sm text-muted-foreground animate-pulse">
                                        Loading visit record…
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" /> Diagnosis
                                            </Label>
                                            <Textarea
                                                name="diagnosis"
                                                placeholder="Enter diagnosis…"
                                                rows={2}
                                                className="rounded-xl resize-none text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                                value={formData.diagnosis}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                                                    <Stethoscope className="w-3.5 h-3.5" /> Procedure Done
                                                </Label>
                                                <Input
                                                    name="procedure_done"
                                                    placeholder="e.g. Composite #14"
                                                    className="rounded-xl text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                                    value={formData.procedure_done}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                                                    <CalendarCheck className="w-3.5 h-3.5" /> Follow-up Date
                                                </Label>
                                                <Input
                                                    name="follow_up_date"
                                                    type="date"
                                                    className="rounded-xl text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                                    value={formData.follow_up_date}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" /> Procedure Notes
                                            </Label>
                                            <Textarea
                                                name="procedure_notes"
                                                placeholder="Clinical observations, complications, anesthesia used…"
                                                rows={3}
                                                className="rounded-xl resize-none text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                                value={formData.procedure_notes}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                                                <Pill className="w-3.5 h-3.5" /> Prescription
                                            </Label>
                                            <Textarea
                                                name="prescription"
                                                placeholder="Medications, dosage, duration…"
                                                rows={2}
                                                className="rounded-xl resize-none text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                                value={formData.prescription}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => saveMutation.mutate()}
                                            disabled={isPending || !visit}
                                            className="w-full h-9 rounded-xl font-bold gap-2 border-primary/30 text-primary hover:bg-primary/5"
                                        >
                                            {saveMutation.isPending
                                                ? <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                : <Save className="w-3.5 h-3.5" />
                                            }
                                            Save Notes
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── Radiology Panel (end side) ── */}
                        <div className="w-96 shrink-0 flex flex-col overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-indigo-500/5 shrink-0">
                                <ImageIcon className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-black text-indigo-600">Radiology</span>
                                {radiology.length > 0 && (
                                    <Badge className="ms-auto bg-indigo-500/15 text-indigo-600 border-0 text-[10px] font-black">
                                        {radiology.length}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
                                {radiology.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-dashed border-indigo-500/30 flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-muted-foreground">No images yet</p>
                                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                                                Images uploaded by radiology staff will appear here automatically
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {radiology.map((asset) => (
                                            <div key={asset.id} className="rounded-xl overflow-hidden border border-border/40 bg-secondary/10">
                                                <button
                                                    type="button"
                                                    className="block w-full"
                                                    onClick={() => handleImageClick(asset.image_url)}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={asset.image_url}
                                                        alt={asset.image_type}
                                                        className="w-full aspect-video object-cover hover:opacity-90 transition-opacity"
                                                    />
                                                </button>
                                                <div className="px-3 py-2 space-y-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                                                            {asset.image_type}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground/60">
                                                            {format(new Date(asset.taken_at), "hh:mm a")}
                                                        </p>
                                                    </div>
                                                    {asset.notes && (
                                                        <p className="text-xs text-foreground/80 leading-relaxed">{asset.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Action bar ── */}
                    <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-border/40 bg-secondary/10">
                        <Button
                            variant="outline"
                            onClick={onSendForRadiology}
                            disabled={isPending}
                            className="flex-1 h-11 rounded-2xl font-black gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50"
                        >
                            <ScanLine className="w-4 h-4" />
                            Send for Radiology
                        </Button>
                        <Button
                            onClick={() => endMutation.mutate()}
                            disabled={isPending}
                            className="flex-1 h-11 rounded-2xl font-black gap-2 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {endMutation.isPending ? (
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    End Visit & Save
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Image lightbox (useVisibility) ── */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-200 bg-black/90 flex items-center justify-center p-6"
                    onClick={closeLightbox}
                >
                    <button
                        type="button"
                        onClick={closeLightbox}
                        className="absolute top-4 inset-e-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxUrl}
                        alt="Radiology"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    )
}
