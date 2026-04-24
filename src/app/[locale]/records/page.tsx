"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { useSelector } from "react-redux"
import {
    AlertTriangle, Calendar, FileText, ClipboardList,
    Pill, CalendarCheck, ScanLine, User, Stethoscope,
} from "lucide-react"
import { getVisitRecords, getVisitRecordStats } from "@/services/visits"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import ErrorLayout from "@/components/ErrorLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DatePicker } from "@/components/ui/Date"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RootState } from "@/store/store"
import { getLocalizedValue } from "@/lib/localize"
import { VisitRecordRow } from "@/types/records"
import RecordDetails from "@/components/records/RecordDetails"
import { format } from "date-fns"
import useVisibility from "@/hooks/useVisibility"

const STATS = [
    { key: "total" as const, icon: FileText, color: "text-foreground" },
    { key: "with_follow_up" as const, icon: CalendarCheck, color: "text-primary" },
    { key: "with_prescription" as const, icon: Pill, color: "text-chart-2" },
    { key: "with_radiology" as const, icon: ScanLine, color: "text-chart-5" },
] as const

export default function RecordsPage() {
    const t = useTranslations("Records")
    const tStats = useTranslations("Records.stats")
    const errorT = useTranslations("Errors.applicationError.505")
    const commonT = useTranslations("Common")
    const tTitle = useTranslations("Routes")
    const locale = useLocale()

    const search = useSelector((s: RootState) => s.uiShared.searchQuery)

    const today = useMemo(() => new Date(), [])
    const [dateFrom, setDateFrom] = useState<Date>(today)
    const [dateTo, setDateTo] = useState<Date>(today)
    const [selectedRecord, setSelectedRecord] = useState<VisitRecordRow | null>(null)

    const { visible: detailsOpen, handleOpen: openDetails, handleClose: closeDetails } = useVisibility()

    const { data: records = [], isLoading: loadingRecords, error } = useQuery({
        queryKey: ["visit-records", dateFrom, dateTo],
        queryFn: () => getVisitRecords(dateFrom, dateTo),
    })

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ["visit-record-stats", dateFrom, dateTo],
        queryFn: () => getVisitRecordStats(dateFrom, dateTo),
    })

    const isLoading = loadingRecords || loadingStats

    const filtered = useMemo(() => {
        if (!search.trim()) return records
        const q = search.toLowerCase()
        return records.filter(r =>
            r.patient_name.toLowerCase().includes(q) ||
            r.doctor_name.toLowerCase().includes(q) ||
            r.specialty_en.toLowerCase().includes(q) ||
            r.specialty_ar.toLowerCase().includes(q) ||
            (r.diagnosis ?? "").toLowerCase().includes(q)
        )
    }, [records, search])

    const handleSelect = (record: VisitRecordRow) => {
        setSelectedRecord(record)
        openDetails()
    }

    const handleClose = () => {
        closeDetails()
        setSelectedRecord(null)
    }

    return (
        <LoadingOverlay loading={isLoading}>
            {error && (
                <ErrorLayout
                    code="505"
                    icon={<AlertTriangle className="w-full h-full" />}
                    title={errorT("title")}
                    description={errorT("description")}
                    backText={commonT("backToHome")}
                    errorDetails={error instanceof Error ? error.message : "An unexpected error occurred"}
                />
            )}

            <div className="flex flex-col w-0 min-w-full h-[calc(100vh-4rem)] overflow-hidden relative">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 scrollbar-hide min-w-0 w-full">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-2">{tTitle("recordsTitle")}</h1>
                            <p className="text-muted-foreground font-medium">{tTitle("recordsDesc")}</p>
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                            <DatePicker
                                label={t("dateFrom")}
                                icon={Calendar}
                                containerClassName="w-48"
                                placeHolder={t("dateFrom")}
                                value={dateFrom}
                                onDateChange={setDateFrom}
                                showTime={false}
                            />
                            <DatePicker
                                label={t("dateTo")}
                                icon={Calendar}
                                containerClassName="w-48"
                                placeHolder={t("dateTo")}
                                value={dateTo}
                                onDateChange={setDateTo}
                                showTime={false}
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {STATS.map(({ key, icon: Icon, color }) => (
                            <Card key={key} className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-accent/40 shrink-0`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">{tStats(
                                            key === "with_follow_up" ? "withFollowUp"
                                            : key === "with_prescription" ? "withPrescription"
                                            : key === "with_radiology" ? "withRadiology"
                                            : "total"
                                        )}</p>
                                        <p className={`text-2xl font-black tabular-nums ${color}`}>
                                            {stats?.[key] ?? 0}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Records list */}
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                            <FileText className="w-14 h-14 opacity-20" />
                            <p className="text-sm font-medium">{t("noRecords")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filtered.map((record) => (
                                <RecordCard
                                    key={record.id}
                                    record={record}
                                    locale={locale}
                                    isSelected={selectedRecord?.id === record.id}
                                    onClick={() => handleSelect(record)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail panel */}
                {detailsOpen && selectedRecord && (
                    <RecordDetails record={selectedRecord} onClose={handleClose} />
                )}
            </div>
        </LoadingOverlay>
    )
}

function RecordCard({
    record,
    locale,
    isSelected,
    onClick,
}: {
    record: VisitRecordRow
    locale: string
    isSelected: boolean
    onClick: () => void
}) {
    const specialty = getLocalizedValue({ en: record.specialty_en, ar: record.specialty_ar }, locale)

    return (
        <div
            onClick={onClick}
            className={`p-5 rounded-3xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-accent/5 ${
                isSelected
                    ? "border-2 border-primary bg-primary/5 ring-4 ring-primary/5 shadow-lg shadow-primary/5"
                    : "border-border/50 bg-card hover:border-primary/40"
            }`}
        >
            {/* Patient row */}
            <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-11 h-11 rounded-2xl border-2 border-background shadow-md shrink-0">
                    <AvatarFallback className="text-sm font-black">
                        {record.patient_name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="font-black text-sm leading-tight truncate">{record.patient_name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{record.patient_code}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(record.created_at), "MMM d")}
                </p>
            </div>

            {/* Doctor + specialty */}
            <div className="flex items-center gap-2 mb-3">
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs font-bold text-muted-foreground truncate">{record.doctor_name}</p>
                {specialty && (
                    <>
                        <Stethoscope className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        <p className="text-xs text-muted-foreground/60 truncate">{specialty}</p>
                    </>
                )}
            </div>

            {/* Diagnosis */}
            {record.diagnosis && (
                <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-foreground truncate font-medium">{record.diagnosis}</p>
                </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/40">
                {record.follow_up_date && (
                    <Badge className="rounded-lg text-[10px] px-2 py-0.5 font-bold border-none bg-primary/10 text-primary gap-1">
                        <CalendarCheck className="w-3 h-3" /> Follow-up
                    </Badge>
                )}
                {record.prescription && (
                    <Badge className="rounded-lg text-[10px] px-2 py-0.5 font-bold border-none bg-chart-2/10 text-chart-2 gap-1">
                        <Pill className="w-3 h-3" /> Rx
                    </Badge>
                )}
                {record.radiology_count > 0 && (
                    <Badge className="rounded-lg text-[10px] px-2 py-0.5 font-bold border-none bg-chart-5/10 text-chart-5 gap-1">
                        <ScanLine className="w-3 h-3" /> {record.radiology_count} X-ray{record.radiology_count > 1 ? "s" : ""}
                    </Badge>
                )}
            </div>
        </div>
    )
}
