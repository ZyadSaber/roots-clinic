"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, ClipboardList, Clock, User, FileDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { PatientDetails, PatientSummary } from "@/types/patients"
import { fetchPatientDetails } from "@/services/patients"
import { useQuery } from "@tanstack/react-query"
import isArrayHasData from "@/lib/isArrayHasData"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import { exportMedicalHistoryPDF } from "@/lib/exportMedicalHistoryPDF"
import { VisitTimelineItem } from "./VisitTimelineItem"

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
    const [exporting, setExporting] = useState(false)
    const [expandedVisits, setExpandedVisits] = useState<string[]>([])

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

    const handleExportPDF = () => {
        if (!isArrayHasData(history)) return
        setExporting(true)
        try {
            exportMedicalHistoryPDF(history, selectedPatient.full_name, selectedPatient.patient_code)
        } catch (err) {
            console.error("PDF Export failed:", err)
        } finally {
            setExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl w-[92vw] h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl flex flex-col">
                <LoadingOverlay loading={loading}>
                    {/* Header */}
                    <div className="px-6 pt-5 pb-4 bg-linear-to-b from-accent/20 to-transparent flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight">{t("title")}</h2>
                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    {selectedPatient.full_name}
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    {selectedPatient.patient_code}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleExportPDF}
                            disabled={exporting || history.length === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-md shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {exporting ? (
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <FileDown className="w-3.5 h-3.5" />
                            )}
                            {exporting ? t("exporting") : t("exportPdf")}
                        </button>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <div className="px-6 pb-8">
                            {isArrayHasData(history) ? (
                                <div className="relative pt-2 pl-6 before:absolute before:left-6 before:top-4 before:bottom-0 before:w-0.5 before:bg-linear-to-b before:from-primary/30 before:via-primary/10 before:to-transparent">
                                    <div className="space-y-4">
                                        {history.map((visit, index) => (
                                            <VisitTimelineItem
                                                key={visit.id}
                                                visit={visit}
                                                index={index}
                                                isExpanded={expandedVisits.includes(visit.id)}
                                                onToggleXrays={() => toggleXrays(visit.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-16 text-center space-y-3 bg-accent/5 rounded-2xl mt-2">
                                    <div className="mx-auto w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-muted-foreground">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black">{t("noHistory")}</p>
                                        <p className="text-sm text-muted-foreground font-medium">{t("noHistoryDesc")}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </LoadingOverlay>
            </DialogContent>
        </Dialog>
    )
}

