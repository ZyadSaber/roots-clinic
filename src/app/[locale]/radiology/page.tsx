"use client"

import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useSelector } from "react-redux"
import { AlertTriangle, Calendar, Image, Eye, Download, User, ScanLine, Clock } from "lucide-react"
import { getRadiologyAssets, getRadiologyStats, getPendingRadiologyRequests } from "@/services/radiology"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import ErrorLayout from "@/components/ErrorLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/Date"
import { UploadRadiologyDialog } from "@/components/radiology/UploadRadiologyDialog"
import { RadiologyViewer } from "@/components/radiology/RadiologyViewer"
import { RadiologyRequest } from "@/types/radiology"
import { RootState } from "@/store/store"
import { format } from "date-fns"

const imageTypeColors: Record<string, string> = {
    panoramic: "bg-primary/15 text-primary",
    bitewing: "bg-chart-2/15 text-chart-2",
    periapical: "bg-chart-5/15 text-chart-5",
}

export default function RadiologyPage() {
    const t = useTranslations("Radiology")
    const errorT = useTranslations("Errors.applicationError.505")
    const commonT = useTranslations("Common")
    const tTitle = useTranslations("Routes")

    const queryClient = useQueryClient()
    const staffId = useSelector((s: RootState) => s.auth.user?.id ?? "")
    const search = useSelector((s: RootState) => s.uiShared.searchQuery)

    const today = useMemo(() => new Date(), [])
    const [dateFrom, setDateFrom] = useState<Date>(today)
    const [dateTo, setDateTo] = useState<Date>(today)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [activeRequest, setActiveRequest] = useState<RadiologyRequest | null>(null)
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [viewerSrc, setViewerSrc] = useState<string | null>(null)

    const { data: records = [], isLoading: loadingRecords, error } = useQuery({
        queryKey: ["radiology-assets", dateFrom, dateTo],
        queryFn: () => getRadiologyAssets(dateFrom, dateTo),
    })

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ["radiology-stats", dateFrom, dateTo],
        queryFn: () => getRadiologyStats(dateFrom, dateTo),
    })

    const { data: pendingRequests = [], isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
        queryKey: ["radiology-requests-pending"],
        queryFn: () => getPendingRadiologyRequests(),
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    })

    const isLoading = loadingRecords || loadingStats || loadingRequests

    const filtered = useMemo(() => {
        if (!search.trim()) return records
        const q = search.toLowerCase()
        return records.filter(
            (r) =>
                r.patient_name.toLowerCase().includes(q) ||
                r.patient_code.toLowerCase().includes(q) ||
                r.image_type.toLowerCase().includes(q),
        )
    }, [records, search])

    const selected = useMemo(
        () => filtered.find((r) => r.id === selectedId) ?? null,
        [filtered, selectedId],
    )

    const handleUploadSuccess = () => {
        refetchRequests()
        queryClient.invalidateQueries({ queryKey: ["radiology-assets"] })
        queryClient.invalidateQueries({ queryKey: ["radiology-stats"] })
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

            <UploadRadiologyDialog
                open={uploadDialogOpen}
                request={activeRequest}
                onClose={() => { setUploadDialogOpen(false); setActiveRequest(null) }}
                onSuccess={handleUploadSuccess}
                uploadedBy={staffId}
            />

            {viewerSrc && (
                <RadiologyViewer
                    src={viewerSrc}
                    onClose={() => setViewerSrc(null)}
                />
            )}

            <div className="flex flex-col w-0 min-w-full h-[calc(100vh-4rem)] overflow-hidden relative">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 scrollbar-hide min-w-0 w-full">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-2">{tTitle("radiologyTitle")}</h1>
                            <p className="text-muted-foreground font-medium">{tTitle("radiologyDesc")}</p>
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

                    {/* Pending Requests */}
                    <Card className="bg-card border-border mb-8">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <ScanLine className="w-4 h-4 text-amber-500" />
                                <CardTitle className="text-foreground text-base">{t("pendingRequests")}</CardTitle>
                                {pendingRequests.length > 0 && (
                                    <Badge className="bg-amber-500/15 text-amber-600 border-0 text-xs font-black ms-auto">
                                        {pendingRequests.length}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {pendingRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                                    <ScanLine className="w-8 h-8 opacity-20" />
                                    <p className="text-sm">{t("noPendingRequests")}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {pendingRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm leading-tight truncate">{req.patient_name}</p>
                                                    <p className="font-mono text-xs text-muted-foreground">{req.patient_code}</p>
                                                </div>
                                                <Badge className="bg-amber-500/15 text-amber-600 border-0 text-[10px] font-black shrink-0">
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            {req.procedure_type && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <User className="w-3 h-3" />
                                                    {req.doctor_name ?? "—"} · {req.procedure_type}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                {t("requestedAt")}: {format(new Date(req.requested_at), "hh:mm a")}
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => { setActiveRequest(req); setUploadDialogOpen(true) }}
                                                className="w-full h-8 rounded-xl font-bold text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                                            >
                                                <ScanLine className="w-3.5 h-3.5" />
                                                {t("uploadXray")}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {(
                            [
                                { key: "total" as const, color: "text-foreground" },
                                { key: "panoramic" as const, color: "text-primary" },
                                { key: "bitewing" as const, color: "text-chart-2" },
                                { key: "periapical" as const, color: "text-chart-5" },
                            ] as const
                        ).map(({ key, color }) => (
                            <Card key={key} className="bg-card border-border shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-muted-foreground">{t(`stats.${key}`)}</p>
                                    <p className={`text-2xl font-bold ${color}`}>{stats?.[key] ?? 0}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Content grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Records list */}
                        <Card className="lg:col-span-2 bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">{tTitle("radiologyTitle")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {filtered.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                        <Image className="w-12 h-12 opacity-30" />
                                        <p className="text-sm">{t("noRecords")}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filtered.map((record) => (
                                            <div
                                                key={record.id}
                                                onClick={() => setSelectedId(record.id)}
                                                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                                    selectedId === record.id
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                                                }`}
                                            >
                                                <div className="flex gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setViewerSrc(record.image_url) }}
                                                        className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
                                                    >
                                                        {record.image_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={record.image_url}
                                                                alt={record.image_type}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Image className="w-8 h-8 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                    <div className="flex-1 space-y-2 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-mono text-xs text-muted-foreground truncate">
                                                                {record.patient_code}
                                                            </span>
                                                            <Badge
                                                                variant="secondary"
                                                                className={imageTypeColors[record.image_type] ?? "bg-muted text-muted-foreground"}
                                                            >
                                                                {t(`imageTypes.${record.image_type}`) ?? record.image_type}
                                                            </Badge>
                                                        </div>
                                                        <p className="font-medium text-foreground truncate">{record.patient_name}</p>
                                                        {record.uploaded_by_name && (
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <User className="w-3 h-3" />
                                                                {record.uploaded_by_name}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(record.taken_at).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                {record.notes && (
                                                    <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground line-clamp-2">
                                                        {record.notes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Preview panel */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">{t("preview")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {selected ? (
                                    <div className="space-y-4">
                                        <div className="aspect-square rounded-lg bg-secondary overflow-hidden flex items-center justify-center">
                                            {selected.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={selected.image_url}
                                                    alt={selected.image_type}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <Image className="w-16 h-16 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-muted-foreground">
                                                <span className="text-foreground font-medium">{t("table.patient")}: </span>
                                                {selected.patient_name}
                                            </p>
                                            <p className="text-muted-foreground">
                                                <span className="text-foreground font-medium">{t("table.imageType")}: </span>
                                                {t(`imageTypes.${selected.image_type}`) ?? selected.image_type}
                                            </p>
                                            {selected.uploaded_by_name && (
                                                <p className="text-muted-foreground">
                                                    <span className="text-foreground font-medium">{t("table.uploadedBy")}: </span>
                                                    {selected.uploaded_by_name}
                                                </p>
                                            )}
                                            <p className="text-muted-foreground">
                                                <span className="text-foreground font-medium">{t("table.takenAt")}: </span>
                                                {new Date(selected.taken_at).toLocaleString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                            {selected.notes && (
                                                <p className="text-muted-foreground">
                                                    <span className="text-foreground font-medium">{t("table.notes")}: </span>
                                                    {selected.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setViewerSrc(selected.image_url)}
                                            >
                                                <Eye className="w-4 h-4 me-1" />
                                                {t("view")}
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1" asChild>
                                                <a href={selected.image_url} download>
                                                    <Download className="w-4 h-4 me-1" />
                                                    {t("download")}
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-square rounded-lg bg-secondary/50 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <Image className="w-12 h-12 opacity-30" />
                                        <p className="text-sm">{t("selectToPreview")}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </LoadingOverlay>
    )
}
