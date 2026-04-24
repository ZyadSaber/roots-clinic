"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, User, Stethoscope, Calendar, ClipboardList, Pill, CalendarCheck, ScanLine, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useLocale, useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { getRadiologyByVisitId } from "@/services/visits"
import { RadiologyViewer } from "@/components/radiology/RadiologyViewer"
import { VisitRecordRow } from "@/types/records"
import { getLocalizedValue } from "@/lib/localize"
import { format } from "date-fns"
import { useState } from "react"
import { printMedicalReport } from "@/lib/printMedicalReport"

interface RecordDetailsProps {
    record: VisitRecordRow
    onClose: () => void
}

export default function RecordDetails({ record, onClose }: RecordDetailsProps) {
    const locale = useLocale()
    const t = useTranslations("Records.detail")
    const [viewerSrc, setViewerSrc] = useState<string | null>(null)

    const { data: assets = [] } = useQuery({
        queryKey: ["radiology-by-visit", record.id],
        queryFn: () => getRadiologyByVisitId(record.id),
        staleTime: 1000 * 60 * 5,
    })

    const specialty = getLocalizedValue({ en: record.specialty_en, ar: record.specialty_ar }, locale)

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/20 backdrop-blur-xs z-10"
            />

            {/* Panel */}
            <motion.aside
                initial={{ x: locale === "ar" ? "-100%" : "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: locale === "ar" ? "-100%" : "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-112.5 absolute inset-e-8 top-8 bottom-8 bg-background/80 backdrop-blur-2xl border border-border/50 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[3rem] z-20"
            >
                {/* Actions */}
                <div className="absolute top-6 inset-e-6 z-30 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => printMedicalReport(record, assets, specialty)}
                        className="rounded-full hover:bg-accent/50 h-10 w-10"
                        title="Print / Export PDF"
                    >
                        <Printer className="w-4.5 h-4.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-accent/50 h-10 w-10">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Header */}
                <div className="p-8 border-b border-border/40 bg-accent/10">
                    <div className="flex items-center gap-5 mb-6">
                        <Avatar className="w-20 h-20 rounded-3xl border-4 border-background shadow-2xl">
                            <AvatarFallback className="text-xl font-black">
                                {record.patient_name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">{record.patient_name}</h2>
                            <p className="text-sm font-mono text-muted-foreground">{record.patient_code}</p>
                            <p className="text-sm font-bold text-primary mt-1">{record.doctor_name}</p>
                            {specialty && <p className="text-xs text-muted-foreground">{specialty}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-background border border-border/40 rounded-2xl shadow-xs">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{t("date")}</p>
                            <p className="text-sm font-black">{format(new Date(record.created_at), "MMM d, yyyy")}</p>
                        </div>
                        <div className="p-3 bg-background border border-border/40 rounded-2xl shadow-xs">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{t("procedureType")}</p>
                            <p className="text-sm font-black truncate">{record.procedure_type ?? "—"}</p>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-8 space-y-6">

                        {/* Diagnosis */}
                        {record.diagnosis && (
                            <DetailSection icon={<ClipboardList className="w-4 h-4" />} label={t("diagnosis")}>
                                <Badge className="rounded-xl px-3 py-1 font-bold text-sm border-none bg-primary/10 text-primary">
                                    {record.diagnosis}
                                </Badge>
                            </DetailSection>
                        )}

                        {/* Procedure done */}
                        {record.procedure_done && (
                            <DetailSection icon={<Stethoscope className="w-4 h-4" />} label={t("procedureDone")}>
                                <p className="text-sm font-medium">{record.procedure_done}</p>
                            </DetailSection>
                        )}

                        {/* Clinical notes */}
                        {record.procedure_notes && (
                            <DetailSection icon={<FileText className="w-4 h-4" />} label={t("procedureNotes")}>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{record.procedure_notes}</p>
                            </DetailSection>
                        )}

                        {/* Prescription */}
                        {record.prescription && (
                            <DetailSection icon={<Pill className="w-4 h-4" />} label={t("prescription")}>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{record.prescription}</p>
                            </DetailSection>
                        )}

                        {/* Follow-up */}
                        {record.follow_up_date && (
                            <DetailSection icon={<CalendarCheck className="w-4 h-4" />} label={t("followUp")}>
                                <p className="text-sm font-bold text-primary">
                                    {format(new Date(record.follow_up_date), "MMM d, yyyy")}
                                </p>
                            </DetailSection>
                        )}

                        {/* Radiology */}
                        <DetailSection icon={<ScanLine className="w-4 h-4" />} label={t("radiology")}>
                            {assets.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">{t("noRadiology")}</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {assets.map((asset) => (
                                        <button
                                            key={asset.id}
                                            type="button"
                                            onClick={() => setViewerSrc(asset.image_url)}
                                            className="group relative aspect-video rounded-2xl overflow-hidden border border-border/40 hover:border-primary/40 hover:ring-2 hover:ring-primary/20 transition-all"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={asset.image_url} alt={asset.image_type} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                                            <span className="absolute bottom-1.5 inset-x-1.5 text-center text-[10px] font-black uppercase tracking-wider bg-black/50 text-white rounded-lg py-0.5">
                                                {asset.image_type}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </DetailSection>
                    </div>
                </ScrollArea>
            </motion.aside>

            {viewerSrc && (
                <RadiologyViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
            )}
        </AnimatePresence>
    )
}

function DetailSection({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <p className="text-[11px] uppercase font-black tracking-widest">{label}</p>
            </div>
            <div className="ps-6">{children}</div>
        </div>
    )
}
