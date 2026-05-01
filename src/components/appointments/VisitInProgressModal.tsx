"use client"

import { useEffect, useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
import {
    Stethoscope, User, Clock, ScanLine, CheckCircle,
    Save, ImageIcon, FileText, Pill, CalendarCheck, ClipboardList, X,
    Printer, Download, Sheet, Package, Plus, ChevronDown, ChevronRight,
    History, CalendarDays,
} from "lucide-react"
import { getVisitByAppointmentId, getRadiologyByVisitId, updateVisitRecord, completeVisitWithInvoice, getPatientVisitHistory } from "@/services/visits"
import type { PatientVisitHistoryItem } from "@/services/visits"
import { getInventoryItems, useInventoryItem } from "@/services/inventory"
import type { InventoryItem } from "@/types/inventory"
import type { AnnotationMap, Dentition, SurfaceId } from "@/types/dentalChart"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Textarea from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import { useFormManager, useVisibility } from "@/hooks"
import { Appointment } from "@/types/appointments"
import { RadiologyViewer } from "@/components/radiology/RadiologyViewer"
import { DentalChart } from "@/components/appointments/DentalChart/DentalChart"
import { ToothDetailPanel } from "@/components/appointments/DentalChart/ToothDetailPanel"
import { DENTITION } from "@/components/appointments/DentalChart/data"
import { toast } from "sonner"

const FORM_DEFAULTS = {
    diagnosis: "",
    procedure_done: "",
    procedure_notes: "",
    prescription: "",
    follow_up_date: "",
}

type ActiveTab = "notes" | "chart" | "history"

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

    // ── Tab ──
    const [activeTab, setActiveTab] = useState<ActiveTab>("notes")

    // ── Form state ──
    const { formData, handleChange, setFormData } = useFormManager({ initialData: FORM_DEFAULTS })

    const [sendingRadiology, setSendingRadiology] = useState(false)

    // ── Items used state ──
    const [itemsExpanded, setItemsExpanded] = useState(false)
    const [selectedItemId, setSelectedItemId] = useState("")
    const [usageQty, setUsageQty] = useState(1)
    const [usedItems, setUsedItems] = useState<Array<{ name: string; qty: number }>>([])

    // ── History state ──
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

    // ── Dental chart state ──
    const [annotations, setAnnotations] = useState<AnnotationMap>({})
    const [selectedFdi, setSelectedFdi] = useState<number | null>(null)
    const [dentition, setDentition] = useState<Dentition>("adult")

    const { data: inventoryItems = [] } = useQuery({
        queryKey: ["inventory-items"],
        queryFn: () => getInventoryItems(),
        staleTime: 60_000,
        enabled: open && !readOnly,
    })

    const { mutate: recordUsage, isPending: recordingUsage } = useMutation({
        mutationFn: async () => {
            if (!visit?.id || !selectedItemId) throw new Error("No visit or item")
            return useInventoryItem({
                item_id: selectedItemId,
                visit_id: visit.id,
                quantity: usageQty,
            })
        },
        onSuccess: (res) => {
            if (res?.success) {
                const item = inventoryItems.find((i) => i.id === selectedItemId)
                if (item) setUsedItems((prev) => [...prev, { name: item.name, qty: usageQty }])
                setSelectedItemId("")
                setUsageQty(1)
                queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
                queryClient.invalidateQueries({ queryKey: ["inventory-kpis"] })
                toast.success("Item recorded")
            } else {
                toast.error(res?.error ?? "Failed to record item usage")
            }
        },
        onError: () => toast.error("Failed to record item usage"),
    })

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

    // ── Patient visit history ──
    const { data: visitHistory = [], isLoading: historyLoading } = useQuery({
        queryKey: ["patient-visit-history", appointment.patient_id, visit?.id],
        queryFn: () => getPatientVisitHistory(appointment.patient_id, visit!.id),
        enabled: !!visit?.id && open,
        staleTime: 60_000,
    })

    const selectedHistoryVisit = visitHistory.find((v) => v.id === selectedHistoryId) ?? null

    // Seed form + tooth chart when visit loads
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
            if (visit.tooth_chart && Object.keys(visit.tooth_chart).length > 0) {
                setAnnotations(visit.tooth_chart)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visit?.id])

    // ── Mutations ──
    const saveMutation = useMutation({
        mutationFn: () => updateVisitRecord(visit!.id, {
            ...formData,
            follow_up_date: formData.follow_up_date || null,
            tooth_chart: Object.keys(annotations).length > 0 ? annotations : null,
        }),
        onSuccess: (res) => {
            if (res.success) toast.success(t("toastSaved"))
            else toast.error(res.error ?? t("toastSaveFailed"))
        },
        onError: () => toast.error(t("toastError")),
    })

    const endMutation = useMutation({
        mutationFn: async () => {
            if (!visit) return { success: false, error: "No visit loaded" }
            return completeVisitWithInvoice({
                visitId: visit.id,
                appointmentId: appointment.id,
                patientId: appointment.patient_id,
                doctorId: appointment.doctor_id,
                procedureType: appointment.procedure_type,
                formData: {
                    ...formData,
                    follow_up_date: formData.follow_up_date || null,
                    tooth_chart: Object.keys(annotations).length > 0 ? annotations : null,
                },
            })
        },
        onSuccess: (res) => {
            if (res?.success) {
                queryClient.invalidateQueries({ queryKey: ["appointments"] })
                queryClient.invalidateQueries({ queryKey: ["appointments-stats"] })
                queryClient.invalidateQueries({ queryKey: ["visit", appointment.id] })
                queryClient.invalidateQueries({ queryKey: ["invoices"] })
                queryClient.invalidateQueries({ queryKey: ["finance-stats"] })
                toast.success(t("toastCompleted", { name: appointment.patient_name }))
                onEndVisit()
            } else {
                toast.error(res?.error ?? t("toastEndFailed"))
            }
        },
        onError: () => toast.error(t("toastError")),
    })

    const isPending = saveMutation.isPending || endMutation.isPending

    // ── Dental chart helpers ──
    const allTeeth = useMemo(() => {
        const set = DENTITION[dentition]
        return [...set.upper, ...set.lower]
    }, [dentition])

    const selectedTooth = useMemo(
        () => allTeeth.find((t) => t.fdi === selectedFdi) ?? null,
        [allTeeth, selectedFdi],
    )

    const chartStats = useMemo(() => {
        const entries = Object.entries(annotations)
        return {
            flagged: entries.filter(([, a]) => a.conditions?.length && !a.conditions.includes("extraction") && !a.conditions.includes("watch")).length,
            watch:   entries.filter(([, a]) => a.conditions?.includes("watch")).length,
            missing: entries.filter(([, a]) => a.conditions?.includes("extraction")).length,
            noted:   entries.filter(([, a]) => (a.note ?? "").trim().length > 0).length,
        }
    }, [annotations])

    const handleSurfaceClick = (fdi: number, _surface: SurfaceId) => {
        setSelectedFdi(fdi)
    }

    // ── Print / export helpers ──
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
        const blob = new Blob(["﻿" + header + body], { type: "text/tab-separated-values;charset=utf-8" })
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

                    {/* ── Tab bar ── */}
                    <div className="flex items-center gap-1 px-6 pt-3 pb-0 border-b border-border/30 shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab("notes")}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-t-xl transition-all border border-b-0 ${
                                activeTab === "notes"
                                    ? "bg-background border-border/40 text-foreground -mb-px"
                                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <ClipboardList className="w-3.5 h-3.5" />
                            {t("clinicalNotes")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("chart")}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-t-xl transition-all border border-b-0 ${
                                activeTab === "chart"
                                    ? "bg-background border-border/40 text-foreground -mb-px"
                                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 2a4 4 0 0 0-4 4c0 1.5.5 2.5 1 4 .5 1.5 1 3.5 1 5.5 0 2 .5 4 2 4s1.5-2 2-4c.5-2 .5-2 1-2s.5 0 1 2c.5 2 .5 4 2 4s2-2 2-4c0-2 .5-4 1-5.5.5-1.5 1-2.5 1-4a4 4 0 0 0-4-4c-1.5 0-2 .5-3 .5s-1.5-.5-3-.5z" />
                            </svg>
                            Dental Chart
                            {Object.keys(annotations).length > 0 && (
                                <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 rounded-full px-1.5 py-0.5">
                                    {Object.keys(annotations).length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("history")}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-t-xl transition-all border border-b-0 ${
                                activeTab === "history"
                                    ? "bg-background border-border/40 text-foreground -mb-px"
                                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <History className="w-3.5 h-3.5" />
                            Previous Visits
                            {visitHistory.length > 0 && (
                                <span className="text-[10px] font-black text-violet-400 bg-violet-400/10 rounded-full px-1.5 py-0.5">
                                    {visitHistory.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* ── Body ── */}
                    {activeTab === "notes" ? (
                        /* ── Notes tab: existing 2-column layout ── */
                        <div className="flex flex-row flex-1 overflow-hidden min-h-0">
                            {/* Clinical Notes */}
                            <div className="flex-1 flex flex-col overflow-hidden border-e border-border/40 min-w-0">
                                <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-secondary/20 shrink-0">
                                    <ClipboardList className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-black">{t("clinicalNotes")}</span>
                                </div>

                                <div className="flex-1 min-h-0">
                                <LoadingOverlay loading={visitLoading}>
                                    <div className="overflow-y-auto h-full px-5 py-4 space-y-3 scrollbar-hide">
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

                                        {/* ── Items Used ── */}
                                        {!readOnly && visit?.id && (
                                            <div className="rounded-xl border border-border/40 overflow-hidden">
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/30 text-sm font-bold hover:bg-secondary/50 transition-colors"
                                                    onClick={() => setItemsExpanded(!itemsExpanded)}
                                                >
                                                    {itemsExpanded
                                                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    }
                                                    <Package className="w-3.5 h-3.5 text-primary" />
                                                    Items Used
                                                    {usedItems.length > 0 && (
                                                        <span className="ms-auto text-xs font-black text-primary bg-primary/10 rounded-full px-2 py-0.5">
                                                            {usedItems.length}
                                                        </span>
                                                    )}
                                                </button>
                                                {itemsExpanded && (
                                                    <div className="px-3 py-3 space-y-3">
                                                        <div className="flex gap-2">
                                                            <select
                                                                className="flex-1 h-8 rounded-lg border border-border/50 bg-background text-sm px-2 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                value={selectedItemId}
                                                                onChange={(e) => setSelectedItemId(e.target.value)}
                                                            >
                                                                <option value="">Select item...</option>
                                                                {inventoryItems.map((i: InventoryItem) => (
                                                                    <option key={i.id} value={i.id} disabled={i.status === "out_of_stock"}>
                                                                        {i.name} ({i.current_stock} {i.unit ?? ""})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={usageQty}
                                                                onChange={(e) => setUsageQty(Number(e.target.value))}
                                                                className="w-16 h-8 rounded-lg border border-border/50 bg-background text-sm px-2 text-center focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                className="h-8 gap-1 rounded-lg"
                                                                disabled={!selectedItemId || recordingUsage}
                                                                onClick={() => recordUsage()}
                                                            >
                                                                {recordingUsage
                                                                    ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                                    : <Plus className="w-3.5 h-3.5" />
                                                                }
                                                            </Button>
                                                        </div>
                                                        {usedItems.length > 0 && (
                                                            <ul className="space-y-1">
                                                                {usedItems.map((u, idx) => (
                                                                    <li key={idx} className="flex justify-between text-xs text-muted-foreground border-t border-border/30 pt-1">
                                                                        <span>{u.name}</span>
                                                                        <span className="font-medium">×{u.qty}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </LoadingOverlay>
                                </div>
                            </div>

                            {/* Radiology Panel */}
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
                    ) : activeTab === "chart" ? (
                        /* ── Dental Chart tab ── */
                        <div className="flex flex-row flex-1 overflow-hidden min-h-0">
                            {/* Main chart area */}
                            <div className="flex-1 flex flex-col overflow-hidden border-e border-border/40 min-w-0">
                                <div className="flex-1 min-h-0">
                                <LoadingOverlay loading={visitLoading}>
                                    <div className="overflow-y-auto h-full px-6 py-5 scrollbar-hide">
                                        <DentalChart
                                            dentition={dentition}
                                            selectedFdi={selectedFdi}
                                            annotations={annotations}
                                            readOnly={readOnly}
                                            onTooth={setSelectedFdi}
                                            onSurface={handleSurfaceClick}
                                            onDentitionChange={setDentition}
                                        />

                                        {/* Stats strip */}
                                        <div className="flex gap-2 mt-4">
                                            {[
                                                { label: "Flagged", value: chartStats.flagged, color: "hsl(0 75% 65%)" },
                                                { label: "Watch",   value: chartStats.watch,   color: "hsl(220 9% 80%)" },
                                                { label: "Missing", value: chartStats.missing, color: "hsl(38 92% 60%)" },
                                                { label: "Notes",   value: chartStats.noted,   color: "hsl(190 80% 60%)" },
                                            ].map(({ label, value, color }) => (
                                                <div key={label} className="flex-1 rounded-xl border border-border/40 bg-secondary/10 px-3 py-2">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
                                                    <p className="text-lg font-black font-mono leading-tight mt-0.5" style={{ color }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </LoadingOverlay>
                                </div>
                            </div>

                            {/* Tooth detail panel */}
                            <div className="w-80 shrink-0 flex flex-col overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-cyan-500/5 shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-cyan-500" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 2a4 4 0 0 0-4 4c0 1.5.5 2.5 1 4 .5 1.5 1 3.5 1 5.5 0 2 .5 4 2 4s1.5-2 2-4c.5-2 .5-2 1-2s.5 0 1 2c.5 2 .5 4 2 4s2-2 2-4c0-2 .5-4 1-5.5.5-1.5 1-2.5 1-4a4 4 0 0 0-4-4c-1.5 0-2 .5-3 .5s-1.5-.5-3-.5z" />
                                    </svg>
                                    <span className="text-sm font-black text-cyan-600">Tooth Details</span>
                                    {selectedFdi && (
                                        <Badge className="ms-auto bg-cyan-500/15 text-cyan-600 border-0 text-[10px] font-black">
                                            #{selectedFdi}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden flex flex-col">
                                    <ToothDetailPanel
                                        fdi={selectedFdi}
                                        tooth={selectedTooth}
                                        annotation={selectedFdi ? annotations[selectedFdi] : undefined}
                                        readOnly={readOnly}
                                        onUpdate={(fdi, ann) => setAnnotations((prev) => ({ ...prev, [fdi]: ann }))}
                                        onClear={(fdi) => setAnnotations((prev) => {
                                            const { [fdi]: _, ...rest } = prev
                                            return rest
                                        })}
                                        onClose={() => setSelectedFdi(null)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : activeTab === "history" ? (
                        /* ── Previous Visits tab ── */
                        <div className="flex flex-row flex-1 overflow-hidden min-h-0">
                            {/* Visit list */}
                            <div className="w-72 shrink-0 flex flex-col overflow-hidden border-e border-border/40">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-violet-500/5 shrink-0">
                                    <History className="w-4 h-4 text-violet-500" />
                                    <span className="text-sm font-black text-violet-600">Visit History</span>
                                    {visitHistory.length > 0 && (
                                        <Badge className="ms-auto bg-violet-500/15 text-violet-600 border-0 text-[10px] font-black">
                                            {visitHistory.length}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-3 py-3 space-y-2">
                                    {historyLoading ? (
                                        <div className="flex items-center justify-center h-24">
                                            <span className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                        </div>
                                    ) : visitHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-dashed border-violet-500/30 flex items-center justify-center">
                                                <History className="w-5 h-5 text-violet-400" />
                                            </div>
                                            <p className="text-xs font-black text-muted-foreground">No previous visits</p>
                                            <p className="text-[11px] text-muted-foreground/60">This is the patient's first visit.</p>
                                        </div>
                                    ) : visitHistory.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setSelectedHistoryId(v.id === selectedHistoryId ? null : v.id)}
                                            className={`w-full text-start rounded-xl border px-3 py-2.5 transition-all ${
                                                selectedHistoryId === v.id
                                                    ? "bg-violet-500/10 border-violet-500/40 shadow-sm"
                                                    : "bg-secondary/10 border-border/30 hover:bg-secondary/30 hover:border-border/50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-[10px] font-black text-muted-foreground flex items-center gap-1">
                                                    <CalendarDays className="w-3 h-3" />
                                                    {format(new Date(v.created_at), "dd MMM yyyy")}
                                                </span>
                                                {v.radiology_count > 0 && (
                                                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                                                        <ImageIcon className="w-2.5 h-2.5" />
                                                        {v.radiology_count}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-black leading-tight truncate">
                                                {v.procedure_type ?? "Visit"}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                {v.doctor_name}
                                                {v.doctor_specialty_en ? ` · ${v.doctor_specialty_en}` : ""}
                                            </p>
                                            {v.diagnosis && (
                                                <p className="text-[11px] text-foreground/70 mt-1 line-clamp-2 leading-relaxed">
                                                    {v.diagnosis}
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visit detail */}
                            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                                {selectedHistoryVisit ? (
                                    <>
                                        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30 bg-secondary/10 shrink-0">
                                            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                                <CalendarDays className="w-4 h-4 text-violet-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black leading-tight">
                                                    {selectedHistoryVisit.procedure_type ?? "Visit"}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {format(new Date(selectedHistoryVisit.created_at), "PPP · hh:mm a")}
                                                    {" · "}{selectedHistoryVisit.doctor_name}
                                                </p>
                                            </div>
                                            {selectedHistoryVisit.radiology_count > 0 && (
                                                <Badge className="ms-auto bg-indigo-500/15 text-indigo-600 border-0 text-[10px] font-black shrink-0">
                                                    <ImageIcon className="w-3 h-3 me-1" />
                                                    {selectedHistoryVisit.radiology_count} image{selectedHistoryVisit.radiology_count > 1 ? "s" : ""}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 scrollbar-hide space-y-4">
                                            {[
                                                { icon: FileText, label: "Diagnosis", value: selectedHistoryVisit.diagnosis },
                                                { icon: Stethoscope, label: "Procedure Done", value: selectedHistoryVisit.procedure_done },
                                                { icon: FileText, label: "Procedure Notes", value: selectedHistoryVisit.procedure_notes },
                                                { icon: Pill, label: "Prescription", value: selectedHistoryVisit.prescription },
                                                { icon: CalendarCheck, label: "Follow-up Date", value: selectedHistoryVisit.follow_up_date
                                                    ? format(new Date(selectedHistoryVisit.follow_up_date), "PPP")
                                                    : null },
                                            ].map(({ icon: Icon, label, value }) => value ? (
                                                <div key={label} className="rounded-xl border border-border/30 bg-secondary/10 px-4 py-3">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</span>
                                                    </div>
                                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>
                                                </div>
                                            ) : null)}

                                            {selectedHistoryVisit.tooth_chart && Object.keys(selectedHistoryVisit.tooth_chart).length > 0 && (() => {
                                                const entries = Object.entries(selectedHistoryVisit.tooth_chart)
                                                const flagged = entries.filter(([, a]) => a.conditions?.length && !a.conditions.includes("extraction") && !a.conditions.includes("watch")).length
                                                const missing = entries.filter(([, a]) => a.conditions?.includes("extraction")).length
                                                const noted   = entries.filter(([, a]) => (a.note ?? "").trim().length > 0).length
                                                return (
                                                    <div className="rounded-xl border border-border/30 bg-secondary/10 px-4 py-3">
                                                        <div className="flex items-center gap-1.5 mb-3">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M9 2a4 4 0 0 0-4 4c0 1.5.5 2.5 1 4 .5 1.5 1 3.5 1 5.5 0 2 .5 4 2 4s1.5-2 2-4c.5-2 .5-2 1-2s.5 0 1 2c.5 2 .5 4 2 4s2-2 2-4c0-2 .5-4 1-5.5.5-1.5 1-2.5 1-4a4 4 0 0 0-4-4c-1.5 0-2 .5-3 .5s-1.5-.5-3-.5z" />
                                                            </svg>
                                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Dental Chart</span>
                                                            <span className="ms-auto text-[10px] font-black text-cyan-500 bg-cyan-500/10 rounded-full px-2 py-0.5">
                                                                {entries.length} teeth annotated
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[
                                                                { label: "Flagged", value: flagged, color: "text-red-400" },
                                                                { label: "Missing", value: missing, color: "text-amber-400" },
                                                                { label: "Notes",   value: noted,   color: "text-cyan-400" },
                                                            ].map(({ label, value, color }) => (
                                                                <div key={label} className="rounded-lg border border-border/30 bg-background px-3 py-2 text-center">
                                                                    <p className={`text-base font-black font-mono ${color}`}>{value}</p>
                                                                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                                        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-dashed border-violet-500/20 flex items-center justify-center">
                                            <History className="w-7 h-7 text-violet-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-muted-foreground">
                                                {visitHistory.length === 0 ? "No history yet" : "Select a visit"}
                                            </p>
                                            <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-56">
                                                {visitHistory.length === 0
                                                    ? "Previous visits will appear here once the patient returns."
                                                    : "Click a visit on the left to view its full clinical details."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

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
                                    className="h-11 rounded-2xl font-black gap-2 px-5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50"
                                >
                                    {sendingRadiology
                                        ? <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                        : <ScanLine className="w-4 h-4" />
                                    }
                                    {sendingRadiology ? t("sendingForRadiology") : t("sendForRadiology")}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => saveMutation.mutate()}
                                    disabled={isPending || !visit}
                                    className="flex-1 h-11 rounded-2xl font-black gap-2 border-primary/40 text-primary hover:bg-primary/5"
                                >
                                    {saveMutation.isPending
                                        ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        : <Save className="w-4 h-4" />
                                    }
                                    Save
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

            {lightboxOpen && (
                <RadiologyViewer
                    src={lightboxUrl}
                    onClose={closeLightbox}
                />
            )}
        </>
    )
}
