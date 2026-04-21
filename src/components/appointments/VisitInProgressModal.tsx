"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
import {
    Stethoscope, User, Clock, ScanLine, CheckCircle,
    Save, ImageIcon, FileText, Pill, CalendarCheck, ClipboardList, X,
    Printer, Download, Sheet,
} from "lucide-react"
import { updateAppointmentStatus } from "@/services/appointments"
import { getVisitByAppointmentId, getRadiologyByVisitId, updateVisitRecord } from "@/services/visits"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Textarea from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
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
    onSendForRadiology: (visitId: string) => Promise<void>
    onEndVisit: () => void
    onClose?: () => void
    readOnly?: boolean
}

export function VisitInProgressModal({
    appointment,
    open,
    onSendForRadiology,
    onEndVisit,
    onClose,
    readOnly = false,
}: VisitInProgressModalProps) {
    const t = useTranslations("Appointments.visitModal")
    const queryClient = useQueryClient()

    // ── Form state ──
    const { formData, handleChange, setFormData } = useFormManager({ initialData: FORM_DEFAULTS })

    const [sendingRadiology, setSendingRadiology] = useState(false)

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
            if (res.success) toast.success(t("toastSaved"))
            else toast.error(res.error ?? t("toastSaveFailed"))
        },
        onError: () => toast.error(t("toastError")),
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
                toast.success(t("toastCompleted", { name: appointment.patient_name }))
                onEndVisit()
            } else {
                toast.error(res.error ?? t("toastEndFailed"))
            }
        },
        onError: () => toast.error(t("toastError")),
    })

    const isPending = saveMutation.isPending || endMutation.isPending

    const handleImageClick = (url: string) => {
        setLightboxUrl(url)
        openLightbox()
    }

    const buildVisitRows = () => [
        [t("diagnosis"), formData.diagnosis || "—"],
        [t("procedureDone"), formData.procedure_done || "—"],
        [t("procedureNotes"), formData.procedure_notes || "—"],
        [t("prescription"), formData.prescription || "—"],
        [t("followUpDate"), formData.follow_up_date || "—"],
    ]

    const handlePrint = () => {
        const rows = buildVisitRows()
        const win = window.open("", "_blank", "width=800,height=600")
        if (!win) return
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Visit – ${appointment.patient_name}</title>
<style>
  body{font-family:sans-serif;padding:32px;color:#111}
  h2{margin-bottom:4px}p.sub{color:#666;font-size:13px;margin-top:0}
  table{width:100%;border-collapse:collapse;margin-top:24px}
  th,td{text-align:left;padding:10px 14px;border:1px solid #e5e7eb;font-size:14px}
  th{background:#f9fafb;font-weight:700;width:200px}
  @media print{button{display:none}}
</style></head><body>
<h2>${appointment.patient_name} <span style="font-weight:400;font-size:15px">(${appointment.patient_code})</span></h2>
<p class="sub">${appointment.procedure_type} · ${format(new Date(appointment.appointment_date), "PPP · hh:mm a")}</p>
<table>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${(v as string).replace(/\n/g, "<br/>")}</td></tr>`).join("")}</table>
</body></html>`)
        win.document.close()
        win.focus()
        win.print()
    }

    const handleExportPDF = async () => {
        const { default: jsPDF } = await import("jspdf")
        const { default: autoTable } = await import("jspdf-autotable")
        const doc = new jsPDF()
        doc.setFontSize(16)
        doc.text(`${appointment.patient_name} (${appointment.patient_code})`, 14, 18)
        doc.setFontSize(10)
        doc.setTextColor(120)
        doc.text(`${appointment.procedure_type} · ${format(new Date(appointment.appointment_date), "PPP · hh:mm a")}`, 14, 26)
        autoTable(doc, {
            startY: 34,
            head: [[t("field"), t("value")]],
            body: buildVisitRows(),
            styles: { fontSize: 11 },
            headStyles: { fillColor: [79, 70, 229] },
        })
        doc.save(`visit-${appointment.patient_code}-${appointment.id.slice(0, 8)}.pdf`)
    }

    const handleExportExcel = () => {
        const rows = buildVisitRows()
        const header = `${t("field")}\t${t("value")}\n`
        const body = rows.map(([k, v]) => `${k}\t${v}`).join("\n")
        const blob = new Blob(["\uFEFF" + header + body], { type: "text/tab-separated-values;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `visit-${appointment.patient_code}-${appointment.id.slice(0, 8)}.xls`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={readOnly ? onClose : () => { }}>
                <DialogContent
                    onInteractOutside={(e) => { if (!readOnly) e.preventDefault() }}
                    onEscapeKeyDown={(e) => { if (!readOnly) e.preventDefault() }}
                    className="min-w-[80vw] w-[80vw] max-w-7xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-background [&>button]:hidden max-h-[95vh] flex flex-col"
                >
                    {/* ── Top bar ── */}
                    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/40 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${readOnly ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                                    <Stethoscope className={`w-5 h-5 ${readOnly ? "text-emerald-500" : "text-amber-500"}`} />
                                </div>
                                {!readOnly && <span className="absolute -top-0.5 -inset-e-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />}
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-black tracking-tight leading-tight">
                                    {readOnly ? t("titleCompleted") : t("titleInProgress")}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground font-medium">
                                    {readOnly ? t("descCompleted") : t("descInProgress")}
                                </DialogDescription>
                            </div>
                        </div>

                        {readOnly && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="text-xs font-black text-emerald-600 uppercase tracking-wide">{t("completedBadge")}</span>
                            </div>
                        )}

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
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(appointment.arrived_at), "hh:mm a")}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Stethoscope className="w-3 h-3" />
                                    {appointment.procedure_type}
                                </span>
                            </div>
                            {appointment.priority === "urgent" && (
                                <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] font-black">
                                    {t("urgent")}
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
                                <span className="text-sm font-black">{t("clinicalNotes")}</span>
                            </div>

                            <LoadingOverlay loading={visitLoading}>
                                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-hide">
                                    <>
                                        <Textarea
                                            icon={FileText}
                                            label={t("diagnosis")}
                                            name="diagnosis"
                                            placeholder={t("diagnosisPlaceholder")}
                                            rows={2}
                                            className="rounded-xl resize-none text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-70 disabled:cursor-default"
                                            value={formData.diagnosis}
                                            onChange={handleChange}
                                            disabled={readOnly}
                                        />

                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                name="procedure_done"
                                                placeholder={t("procedureDonePlaceholder")}
                                                className="rounded-xl text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                                value={formData.procedure_done}
                                                onChange={handleChange}
                                                disabled={readOnly}
                                                icon={Stethoscope}
                                                label={t("procedureDone")}
                                            />
                                            <Input
                                                icon={CalendarCheck}
                                                label={t("followUpDate")}
                                                name="follow_up_date"
                                                type="date"
                                                className="rounded-xl text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                                value={formData.follow_up_date}
                                                onChange={handleChange}
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <Textarea
                                            icon={FileText}
                                            label={t("procedureNotes")}
                                            name="procedure_notes"
                                            placeholder={t("procedureNotesPlaceholder")}
                                            rows={3}
                                            className="rounded-xl resize-none text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-70 disabled:cursor-default"
                                            value={formData.procedure_notes}
                                            onChange={handleChange}
                                            disabled={readOnly}
                                        />
                                        <Textarea
                                            icon={Pill}
                                            label={t("prescription")}
                                            name="prescription"
                                            placeholder={t("prescriptionPlaceholder")}
                                            rows={2}
                                            className="rounded-xl resize-none text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-70 disabled:cursor-default"
                                            value={formData.prescription}
                                            onChange={handleChange}
                                            disabled={readOnly}
                                        />

                                        {!readOnly && (
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
                                                {t("saveNotes")}
                                            </Button>
                                        )}
                                    </>
                                </div>
                            </LoadingOverlay>
                        </div>

                        {/* ── Radiology Panel (end side) ── */}
                        <div className="w-96 shrink-0 flex flex-col overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-indigo-500/5 shrink-0">
                                <ImageIcon className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-black text-indigo-600">{t("radiology")}</span>
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
                                            <p className="text-xs font-black text-muted-foreground">{t("noImages")}</p>
                                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                                                {t("noImagesDesc")}
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
                        {readOnly ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handlePrint}
                                    className="h-11 rounded-2xl font-black gap-2 px-5 border-border/50 text-foreground hover:bg-accent/50"
                                >
                                    <Printer className="w-4 h-4" />
                                    {t("print")}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleExportPDF}
                                    className="h-11 rounded-2xl font-black gap-2 px-5 border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                                >
                                    <Download className="w-4 h-4" />
                                    {t("exportPdf")}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleExportExcel}
                                    className="h-11 rounded-2xl font-black gap-2 px-5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                >
                                    <Sheet className="w-4 h-4" />
                                    {t("exportExcel")}
                                </Button>
                                <Button
                                    onClick={onClose}
                                    className="flex-1 h-11 rounded-2xl font-black gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                >
                                    <X className="w-4 h-4" />
                                    {t("close")}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        if (!visit?.id) return
                                        setSendingRadiology(true)
                                        try { await onSendForRadiology(visit.id) }
                                        finally { setSendingRadiology(false) }
                                    }}
                                    disabled={isPending || sendingRadiology || !visit?.id}
                                    className="flex-1 h-11 rounded-2xl font-black gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50"
                                >
                                    {sendingRadiology
                                        ? <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                        : <ScanLine className="w-4 h-4" />
                                    }
                                    {sendingRadiology ? t("sendingForRadiology") : t("sendForRadiology")}
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
                                            {t("endVisit")}
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
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
