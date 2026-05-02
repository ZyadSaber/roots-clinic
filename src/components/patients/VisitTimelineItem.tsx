"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
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
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import { VisitRecord } from "@/types/patients"
import { format } from "date-fns"
import isArrayHasData from "@/lib/isArrayHasData"

interface Props {
    visit: VisitRecord
    index: number
    isExpanded: boolean
    onToggleXrays: () => void
}

export function VisitTimelineItem({ visit, index, isExpanded, onToggleXrays }: Props) {
    const t = useTranslations("Patients.details.medicalHistory")
    const commonT = useTranslations("Patients.details")

    const {
        follow_up_date,
        created_at,
        doctor_specialty,
        diagnosis,
        procedure_type,
        procedure_done,
        prescription,
        assets,
        doctor_name
    } = visit

    const isOverdue = format(follow_up_date ? follow_up_date : "", "dd-MM-yyyy")
    const hasAssets = isArrayHasData(assets)

    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.07 }}
            className="relative"
        >
            <div className="absolute -left-6 top-5 w-3 h-3 rounded-full bg-background border-2 border-primary shadow-sm z-10" />

            <Card className="ms-2 rounded-2xl border border-border/50 bg-card shadow-none hover:bg-accent/5 transition-colors">
                <div className="p-4 space-y-4">
                    {/* Date + Doctor + Follow-up */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                    <Calendar className="w-3.5 h-3.5" />
                                </span>
                                <h3 className="text-sm font-black uppercase tracking-widest">
                                    {format(created_at, "dd-MMM-yyy")}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 pl-8">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground">{doctor_name}</span>
                                <Badge variant="secondary" className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-primary/10 text-primary border-none">
                                    {doctor_specialty}
                                </Badge>
                            </div>
                        </div>

                        {follow_up_date && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${isOverdue ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-green-100 text-green-700 border-green-200"}`}>
                                <Clock className="w-3 h-3" />
                                {t("labels.followUp")}: {format(follow_up_date, "dd-MMM-yyyy")}
                                {isOverdue && <span className="ml-0.5 animate-pulse">!</span>}
                            </div>
                        )}
                    </div>

                    {/* Clinical fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:pl-8">
                        <div className="space-y-3">
                            <Field icon={<Activity className="w-3 h-3 text-primary" />} label={t("labels.diagnosis")}>
                                <p className="text-sm font-bold bg-accent/5 p-3 rounded-xl border border-border/50">
                                    {diagnosis || commonT("noDiagnosis")}
                                </p>
                            </Field>

                            <Field icon={<Stethoscope className="w-3 h-3 text-primary" />} label={`${t("labels.procedureType")} / ${t("labels.performed")}`}>
                                <div className="space-y-1.5">
                                    {procedure_type && (
                                        <span className="inline-block px-2.5 py-1 bg-primary/5 rounded-full text-[10px] font-black uppercase text-primary border border-primary/20">
                                            {procedure_type}
                                        </span>
                                    )}
                                    <p className="text-sm font-bold bg-accent/5 p-3 rounded-xl border border-border/50">
                                        {procedure_done || commonT("noProcedure")}
                                    </p>
                                </div>
                            </Field>
                        </div>

                        <Field icon={<ClipboardList className="w-3 h-3 text-primary" />} label={t("labels.prescription")}>
                            <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 min-h-24 relative overflow-hidden group/rx">
                                <Activity className="absolute top-1 right-3 w-14 h-14 text-primary/10 transition-transform group-hover/rx:-rotate-12" />
                                <p className="text-sm font-bold whitespace-pre-wrap relative z-10 leading-relaxed">
                                    {prescription || commonT("noPrescription")}
                                </p>
                            </div>
                        </Field>
                    </div>

                    {/* X-rays */}
                    <div className="sm:pl-8 pt-1">
                        <AnimatePresence>
                            {isExpanded && hasAssets ? (
                                <motion.div
                                    key="expanded"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-3">
                                        {assets!.map((asset) => (
                                            <div key={asset.id} className="group/img relative overflow-hidden rounded-xl aspect-square bg-muted border border-border/50">
                                                <Image src={asset.image_url} alt={asset.image_type} fill className="object-cover transition-transform duration-500 group-hover/img:scale-110" unoptimized />
                                                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 translate-y-full group-hover/img:translate-y-0 transition-transform z-10">
                                                    <p className="text-[10px] uppercase font-black text-white/70 tracking-widest">{asset.image_type}</p>
                                                    {asset.notes && <p className="text-xs font-bold text-white mt-0.5 line-clamp-2">{asset.notes}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={onToggleXrays} className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border-t border-border/30">
                                        <ChevronUp className="w-4 h-4" />
                                        {t("collapseXrays")}
                                    </button>
                                </motion.div>
                            ) : (
                                <button
                                    key="collapsed"
                                    onClick={onToggleXrays}
                                    disabled={!hasAssets}
                                    className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all ${hasAssets ? "bg-accent/20 text-primary hover:bg-primary hover:text-white" : "bg-accent/5 text-muted-foreground/30 cursor-not-allowed"}`}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    {hasAssets ? t("expandXrays", { count: assets.length }) : t("noXrays")}
                                    {hasAssets && <ChevronDown className="w-4 h-4" />}
                                </button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1.5 flex items-center gap-1.5">
                {icon}{label}
            </p>
            {children}
        </div>
    )
}
