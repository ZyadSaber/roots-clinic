"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { jsPDF } from "jspdf"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Calendar,
    Stethoscope,
    Activity,
    ClipboardList,
    Clock,
    User,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    FileDown,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations, useLocale } from "next-intl"
import { PatientDetails, PatientSummary, VisitRecord } from "@/types/patients"
import { fetchPatientDetails } from "@/services/patients"
import { useQuery } from "@tanstack/react-query"
import isArrayHasData from "@/lib/isArrayHasData"

interface MedicalHistoryModalProps {
    selectedPatient: PatientSummary
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MedicalHistoryModal({
    selectedPatient,
    open,
    onOpenChange,
}: MedicalHistoryModalProps) {
    const t = useTranslations("Patients.details.medicalHistory")
    const commonT = useTranslations("Patients.details")
    const locale = useLocale()
    const [exporting, setExporting] = useState(false)
    const [expandedVisits, setExpandedVisits] = useState<string[]>([])
    const reportRef = useRef<HTMLDivElement>(null)

    const { patient_id } = selectedPatient

    const { data: patient, isLoading: loading } = useQuery<PatientDetails | null>({
        queryKey: ["patientDetails", patient_id],
        queryFn: () => fetchPatientDetails(patient_id),
        enabled: open && !!patient_id,
    });

    const history = patient?.visits || [];

    const toggleXrays = (visitId: string) => {
        setExpandedVisits(prev =>
            prev.includes(visitId)
                ? prev.filter(id => id !== visitId)
                : [...prev, visitId]
        )
    }

    const isOverdue = (dateStr: string | null) => {
        if (!dateStr) return false
        return new Date(dateStr) < new Date()
    }

    const handleExportPDF = () => {
        if (!isArrayHasData(history)) return
        setExporting(true)
        try {
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
            const pageW = doc.internal.pageSize.getWidth()
            const pageH = doc.internal.pageSize.getHeight()
            const margin = 18
            const contentW = pageW - margin * 2
            let y = margin

            const checkPage = (needed: number) => {
                if (y + needed > pageH - margin) {
                    doc.addPage()
                    y = margin
                }
            }

            const addText = (
                text: string,
                x: number,
                fontSize: number,
                color: [number, number, number] = [30, 30, 30],
                style: "normal" | "bold" = "normal",
                maxWidth?: number
            ) => {
                doc.setFontSize(fontSize)
                doc.setFont("helvetica", style)
                doc.setTextColor(...color)
                if (maxWidth) {
                    const lines = doc.splitTextToSize(text, maxWidth)
                    doc.text(lines, x, y)
                    y += (lines.length * fontSize * 0.4) + 1
                } else {
                    doc.text(text, x, y)
                    y += fontSize * 0.4 + 1
                }
            }

            // ── Header ──────────────────────────────────────
            doc.setFillColor(59, 130, 246)
            doc.roundedRect(0, 0, pageW, 36, 0, 0, "F")
            doc.setFontSize(16)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(255, 255, 255)
            doc.text("Medical History Report", margin, 14)
            doc.setFontSize(9)
            doc.setFont("helvetica", "normal")
            doc.text(`Patient: ${selectedPatient.full_name}  |  ID: ${selectedPatient.patient_code}`, margin, 22)
            doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, 29)
            y = 44

            // ── Visits ──────────────────────────────────────
            history.forEach((visit, index) => {
                checkPage(40)

                // Visit separator card
                doc.setFillColor(245, 247, 255)
                doc.roundedRect(margin - 3, y - 4, contentW + 6, 10, 2, 2, "F")
                doc.setFontSize(10)
                doc.setFont("helvetica", "bold")
                doc.setTextColor(59, 130, 246)
                const dateLabel = new Date(visit.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
                doc.text(`Visit ${history.length - index}  —  ${dateLabel}`, margin, y + 3)
                y += 12

                // Doctor
                checkPage(8)
                addText(`Treated by: ${visit.doctor_name}${visit.doctor_specialty_en ? ` (${visit.doctor_specialty_en})` : ""}`, margin, 9, [80, 80, 100])

                // Procedure type pill
                if (visit.procedure_type) {
                    checkPage(7)
                    addText(`Procedure Type: ${visit.procedure_type}`, margin, 9, [100, 60, 200])
                }

                y += 2

                // Diagnosis
                if (visit.diagnosis) {
                    checkPage(14)
                    addText("Diagnosis", margin, 8, [120, 120, 140], "bold")
                    addText(visit.diagnosis, margin, 9, [30, 30, 50], "normal", contentW)
                    y += 2
                }

                // Procedure done
                if (visit.procedure_done) {
                    checkPage(14)
                    addText("Procedure Performed", margin, 8, [120, 120, 140], "bold")
                    addText(visit.procedure_done, margin, 9, [30, 30, 50], "normal", contentW)
                    if (visit.procedure_notes) {
                        addText(`Notes: ${visit.procedure_notes}`, margin, 8, [100, 100, 120], "normal", contentW)
                    }
                    y += 2
                }

                // Prescription
                if (visit.prescription) {
                    checkPage(14)
                    addText("Prescription", margin, 8, [120, 120, 140], "bold")
                    addText(visit.prescription, margin, 9, [30, 30, 50], "normal", contentW)
                    y += 2
                }

                // Follow-up date
                if (visit.follow_up_date) {
                    checkPage(8)
                    const isOvr = new Date(visit.follow_up_date) < new Date()
                    const fDate = new Date(visit.follow_up_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
                    addText(`Follow-up: ${fDate}${isOvr ? "  ⚠ OVERDUE" : ""}`, margin, 9, isOvr ? [200, 100, 0] : [0, 130, 80])
                }

                // X-rays count
                if (visit.assets && visit.assets.length > 0) {
                    checkPage(7)
                    addText(`X-ray Images Attached: ${visit.assets.length} (${visit.assets.map(a => a.image_type).join(", ")})`, margin, 8, [100, 100, 140])
                }

                // Divider
                y += 4
                checkPage(4)
                doc.setDrawColor(220, 220, 235)
                doc.line(margin, y, pageW - margin, y)
                y += 6
            })

            // ── Footer on every page ─────────────────────────
            const totalPages = doc.getNumberOfPages()
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p)
                doc.setFontSize(7)
                doc.setTextColor(160, 160, 180)
                doc.text("Roots Clinic — Confidential Medical Record", margin, pageH - 6)
                doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 6, { align: "right" })
            }

            doc.save(`Medical_History_${selectedPatient.full_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`)
        } catch (err) {
            console.error("PDF Export failed:", err)
        } finally {
            setExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl w-[92vw] h-[92vh] p-0 gap-0 overflow-hidden rounded-[2rem] sm:rounded-[3rem] border-none shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 bg-linear-to-b from-accent/20 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <ClipboardList className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{t("title")}</h2>
                            <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {selectedPatient.full_name}
                                <span className="w-1 h-1 rounded-full bg-border" />
                                {selectedPatient.patient_code}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleExportPDF}
                        disabled={exporting || history.length === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {exporting ? (
                            <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileDown className="w-4 h-4" />
                        )}
                        {exporting ? t("exporting") : t("exportPdf")}
                    </button>
                </div>

                <ScrollArea className="flex-1 pb-12">
                    <div ref={reportRef} className="px-8 pt-4 pb-12 bg-background">
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Clock className="w-8 h-8 text-primary/40" />
                                </motion.div>
                            </div>
                        ) : history.length > 0 ? (
                            <div className="relative pt-4 pl-4 sm:pl-8 before:absolute before:left-4 sm:before:left-8 before:top-8 before:bottom-0 before:w-0.5 before:bg-linear-to-b before:from-primary/30 before:via-primary/10 before:to-transparent">
                                <div className="space-y-8">
                                    {history.map((visit, index) => (
                                        <TimelineItem
                                            key={visit.id}
                                            visit={visit}
                                            index={index}
                                            locale={locale}
                                            t={t}
                                            commonT={commonT}
                                            isOverdue={isOverdue}
                                            isExpanded={expandedVisits.includes(visit.id)}
                                            onToggleXrays={() => toggleXrays(visit.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-4 bg-accent/5 rounded-[2.5rem]">
                                <div className="mx-auto w-16 h-16 rounded-3xl bg-accent flex items-center justify-center text-muted-foreground">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-lg font-black">{t("noHistory")}</p>
                                    <p className="text-muted-foreground font-medium">{t("noHistoryDesc")}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function TimelineItem({
    visit,
    index,
    locale,
    t,
    commonT,
    isOverdue,
    isExpanded,
    onToggleXrays
}: {
    visit: VisitRecord,
    index: number,
    locale: string,
    t: (key: string, data?: Record<string, string | number | Date>) => string,
    commonT: (key: string) => string,
    isOverdue: (d: string | null) => boolean,
    isExpanded: boolean,
    onToggleXrays: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
        >
            {/* Dot */}
            <div className="absolute -left-6 sm:-left-8 top-6 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-sm z-10" />

            <Card className="rounded-[2.5rem] border-none bg-accent/5 overflow-hidden shadow-none group transition-all hover:bg-accent/10">
                <div className="p-5 sm:p-6 space-y-6">
                    {/* Header: Date + Doctor */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Calendar className="w-4 h-4" />
                                </span>
                                <h3 className="text-sm font-black uppercase tracking-widest">
                                    {new Date(visit.created_at).toLocaleDateString(locale, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 pl-11">
                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    {visit.doctor_name}
                                </span>
                                <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[9px] font-black uppercase bg-primary/20 text-primary border-none">
                                    {locale === 'ar' ? visit.doctor_specialty_ar : visit.doctor_specialty_en}
                                </Badge>
                            </div>
                        </div>

                        {visit.follow_up_date && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border ${isOverdue(visit.follow_up_date)
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-green-100 text-green-700 border-green-200"
                                }`}>
                                <Clock className="w-3.5 h-3.5" />
                                {t("labels.followUp")}: {new Date(visit.follow_up_date).toLocaleDateString(locale)}
                                {isOverdue(visit.follow_up_date) && (
                                    <span className="ml-1 animate-pulse">!</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content: Diagnosis + Procedure */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 sm:pl-11">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5 text-primary" />
                                    {t("labels.diagnosis")}
                                </p>
                                <p className="text-sm font-bold bg-background p-4 rounded-3xl border border-border/50 text-foreground">
                                    {visit.diagnosis || commonT("noDiagnosis")}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                                    <Stethoscope className="w-3.5 h-3.5 text-primary" />
                                    {t("labels.procedureType")} / {t("labels.performed")}
                                </p>
                                <div className="space-y-2">
                                    {visit.procedure_type && (
                                        <div className="inline-block px-3 py-1 bg-primary/5 rounded-full text-[10px] font-black uppercase text-primary border border-primary/20">
                                            {visit.procedure_type}
                                        </div>
                                    )}
                                    <p className="text-sm font-bold bg-background p-4 rounded-3xl border border-border/50 text-foreground">
                                        {visit.procedure_done || commonT("noProcedure")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                                    <ClipboardList className="w-3.5 h-3.5 text-primary" />
                                    {t("labels.prescription")}
                                </p>
                                <div className="bg-primary/5 p-4 rounded-3xl border border-primary/20 min-h-35 relative overflow-hidden group/rx">
                                    <div className="absolute top-2 right-4 text-primary/10 transition-transform group-hover/rx:-rotate-12">
                                        <Activity className="w-20 h-20" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground whitespace-pre-wrap relative z-10 leading-relaxed">
                                        {visit.prescription || commonT("noPrescription")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* X-Rays / Assets */}
                    <div className="pl-0 sm:pl-11 pt-2">
                        <AnimatePresence>
                            {isExpanded && visit.assets && visit.assets.length > 0 ? (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                        {visit.assets.map((asset) => (
                                            <div key={asset.id} className="group/img relative overflow-hidden rounded-[2rem] aspect-square bg-muted border border-border/50">
                                                <Image
                                                    src={asset.image_url}
                                                    alt={asset.image_type}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover/img:scale-110"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-full group-hover/img:translate-y-0 transition-transform z-10">
                                                    <p className="text-[10px] uppercase font-black text-white/70 tracking-widest">{asset.image_type}</p>
                                                    {asset.notes && <p className="text-xs font-bold text-white mt-1 line-clamp-2">{asset.notes}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={onToggleXrays}
                                        className="w-full py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border-t border-border/30"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                        {t("collapseXrays")}
                                    </button>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={onToggleXrays}
                                    disabled={!visit.assets || visit.assets.length === 0}
                                    className={`w-full h-16 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all ${visit.assets && visit.assets.length > 0
                                        ? "bg-accent/20 text-primary hover:bg-primary hover:text-white shadow-lg shadow-primary/5"
                                        : "bg-accent/5 text-muted-foreground/30 cursor-not-allowed"
                                        }`}
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    {visit.assets && visit.assets.length > 0
                                        ? t("expandXrays", { count: visit.assets.length })
                                        : t("noXrays")}
                                    {visit.assets && visit.assets.length > 0 && <ChevronDown className="w-5 h-5" />}
                                </button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
