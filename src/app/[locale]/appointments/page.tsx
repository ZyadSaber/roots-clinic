"use client"

import { useMemo, useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { AlertTriangle, Plus, Clock, User as UserIcon, Stethoscope, Calendar, FileSpreadsheet, Printer, Edit2, ChevronLeft, ChevronRight } from "lucide-react"
import { getAllAppointments, getAppointmentsStatsByDate } from "@/services/appointments"
import { format } from "date-fns"
import { downloadExcel, downloadPDF } from "@/helpers/exportHelpers"
import { getDoctorAppointments } from "@/services/doctors"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import { DatePicker } from "@/components/ui/Date";
import ErrorLayout from "@/components/ErrorLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentDialog } from "@/components/appointments/AppointmentDialog"
import { StatusUpdateDialog } from "@/components/appointments/StatusUpdateDialog"
import { Appointment, AppointmentStats, AppointmentStatus } from "@/types/appointments"
import { useVisibility } from "@/hooks"
import { DoctorAppointments } from "@/types/doctors"

const statusColors: Record<AppointmentStatus, string> = {
    completed: "bg-primary/20 text-primary",
    cancelled: "bg-destructive/20 text-destructive",
    arrived: "bg-emerald-500/20 text-emerald-500",
    in_chair: "bg-amber-500/20 text-amber-500",
    no_show: "bg-rose-500/20 text-rose-500",
    confirmed: "bg-indigo-500/20 text-indigo-500",
    pending: "bg-blue-500/20 text-blue-500",
}

const typeColors: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
    "completed": { bg: "bg-primary/20", border: "border-primary/30", text: "text-primary" },
    "cancelled": { bg: "bg-indigo-500/20", border: "border-indigo-500/30", text: "text-indigo-500" },
    "arrived": { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-500" },
    "in_chair": { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-500" },
    "no_show": { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-500" },
    "confirmed": { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-500" },
    "pending": { bg: "bg-destructive/20", border: "border-destructive/30", text: "text-destructive" },
}

const priorityColors: Record<string, string> = {
    normal: "bg-secondary text-muted-foreground border-transparent",
    urgent: "bg-destructive/10 text-destructive border-destructive/20 font-bold shadow-sm",
}

const ROW_HEIGHT = 64

function timeToDecimal(time: string): number {
    if (!time) return 8;
    const [rawTime, period] = time.split(" ")
    const [h, mString] = rawTime.split(":")
    let hNum = Number(h)
    const mNum = Number(mString)
    if (period === "PM" && hNum !== 12) hNum += 12
    if (period === "AM" && hNum === 12) hNum = 0
    return hNum + (mNum || 0) / 60
}

function durationToMinutes(dur: string): number {
    const n = parseInt(dur, 10)
    return isNaN(n) ? 30 : n
}

export default function AppointmentsPage() {
    // const dispatch = useDispatch()
    const t = useTranslations("Appointments")
    const commonT = useTranslations("Common")
    const errorT = useTranslations("Errors.applicationError.505")
    const tTitle = useTranslations("Routes")
    const [showNewAppointment, setShowNewAppointment] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    const {
        visible: statusUpdateVisible,
        handleClose: handleCloseStatusUpdate,
        handleStateChange: handleStateChangeStatusUpdate,
        handleOpen
    } = useVisibility()

    const handleOpenStatusModal = (appointment: Appointment) => () => {
        setSelectedAppointment(appointment)
        handleOpen()
    }

    const {
        data: appointments = [],
        isLoading: isLoadingApt,
        error: errorApt
    } = useQuery<Appointment[]>({
        queryKey: ["appointments", selectedDate],
        queryFn: () => getAllAppointments(selectedDate)
    })

    const handleDownloadExcel = () => {
        if (!appointments || appointments.length === 0) return;

        const headers = ["Time", "Patient Name", "Code", "Doctor", "Procedure", "Status", "Priority", "Notes"];
        const rows = appointments.map(apt => [
            apt.appointment_date ? format(new Date(apt.appointment_date), "HH:mm") : "-",
            apt.patient_name,
            apt.patient_code,
            apt.doctor_name,
            apt.procedure_type,
            apt.status,
            apt.priority,
            apt.notes || ""
        ]);

        const dateStr = selectedDate ? format(new Date(selectedDate), "yyyy-MM-dd") : "all";
        downloadExcel(headers, rows, `appointments_${dateStr}.csv`);
    };

    const handleDownloadPDF = async () => {
        if (!appointments || appointments.length === 0) return;

        const headers = ["Time", "Patient Name", "Code", "Doctor", "Procedure", "Status", "Priority", "Notes"];
        const rows = appointments.map(apt => [
            apt.appointment_date ? format(new Date(apt.appointment_date), "HH:mm") : "-",
            apt.patient_name,
            apt.patient_code,
            apt.doctor_name,
            apt.procedure_type,
            apt.status,
            apt.priority,
            apt.notes || ""
        ]);

        const dateStr = selectedDate ? format(new Date(selectedDate), "yyyy-MM-dd") : "all";
        downloadPDF(headers, rows, "Appointments Report", `appointments_${dateStr}.pdf`);
    };

    const { data: doctors = [], isLoading: isLoadingStaff } = useQuery<DoctorAppointments[]>({
        queryKey: ["staff", selectedDate],
        queryFn: () => getDoctorAppointments(selectedDate),
    })

    const { data: statsData, isLoading: isLoadingStats } = useQuery<AppointmentStats>({
        queryKey: ["appointments-stats", selectedDate],
        queryFn: () => getAppointmentsStatsByDate(selectedDate),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchInterval: 30000,
    })

    const displayDateStr = useMemo(() => {
        const d = selectedDate ? new Date(selectedDate) : new Date()
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }, [selectedDate])

    const startHour = useMemo(() => {
        if (!statsData?.start_time) return null;
        return Math.floor(timeToDecimal(statsData.start_time));
    }, [statsData]);

    const endHour = useMemo(() => {
        if (!statsData?.end_time) return null;
        return Math.ceil(timeToDecimal(statsData.end_time));
    }, [statsData]);

    const hoursRange = useMemo(() => {
        if (startHour === null || endHour === null) return [];
        const range = [];
        for (let h = startHour; h < endHour; h++) {
            range.push(h);
        }
        return range;
    }, [startHour, endHour]);

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const scrollGrid = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const amount = 500
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
        }
    }

    const isLoading = isLoadingApt || isLoadingStaff || isLoadingStats
    const error = errorApt

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
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-2">{tTitle("appointmentsTitle")}</h1>
                            <p className="text-muted-foreground font-medium">{tTitle("appointmentsDesc")}</p>
                        </div>
                        <div className="flex items-end gap-3">
                            <DatePicker
                                label="Date"
                                icon={Calendar}
                                containerClassName="w-64"
                                placeHolder="Select Date"
                                value={selectedDate}
                                onDateChange={setSelectedDate}
                                showTime={false}
                            />
                            <Button
                                onClick={() => setShowNewAppointment(true)}
                                className="rounded-xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-5 h-5" /> {t("addAppointment")}
                            </Button>
                        </div>
                    </div>
                    {statsData && (statsData.start_time || statsData.end_time) && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 text-center sm:text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{t("stats.todayTotal")}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-foreground">{statsData?.total || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 text-center sm:text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{t("stats.pending")}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-blue-500">{statsData?.pending || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 text-center sm:text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{t("stats.confirmed")}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-indigo-500">{statsData?.confirmed || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 text-center sm:text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{t("stats.arrived")}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-emerald-500">{statsData?.arrived || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 text-center sm:text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{t("stats.inChair")}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-amber-500">{statsData?.in_chair || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 text-center sm:text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{t("stats.completed")}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-primary">{statsData?.completed || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 text-center sm:text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{t("stats.noShow")}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-rose-500">{statsData?.no_show || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="p-4 text-center sm:text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{t("stats.cancelled")}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-destructive">{statsData?.cancelled || 0}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Tabs defaultValue="calendar" className="space-y-4">
                        <TabsList className="bg-secondary p-1 rounded-xl">
                            <TabsTrigger value="list" className="rounded-lg px-6">{t("tabs.list")}</TabsTrigger>
                            <TabsTrigger value="calendar" className="rounded-lg px-6">{t("tabs.calendar")}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="list" className="space-y-4">

                            {/* Appointments List */}
                            <Card className="bg-card border-border">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="text-foreground text-lg font-bold">
                                        {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "All Appointments"}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={handleDownloadExcel} variant="outline" size="sm" className="h-9 px-3 gap-2 rounded-lg font-bold border-border bg-secondary/30 hover:bg-secondary/50 text-xs sm:text-sm">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            <span className="hidden sm:inline">Excel</span>
                                        </Button>
                                        <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="h-9 px-3 gap-2 rounded-lg font-bold border-border bg-secondary/30 hover:bg-secondary/50 text-xs sm:text-sm">
                                            <Printer className="w-4 h-4 text-primary" />
                                            <span className="hidden sm:inline">PDF</span>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3" id="appointments-list-container">
                                    {appointments.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            {commonT("ndf")}
                                        </div>
                                    ) : (
                                        appointments.map((apt: Appointment) => (
                                            <div
                                                key={apt.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-border transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-20 text-center">
                                                        <p className="text-sm font-bold text-foreground">{apt.appointment_date ? format(apt?.appointment_date, "HH:mm") : "-"}</p>
                                                    </div>
                                                    <div className="w-20 text-center">
                                                        <p className="text-sm font-bold text-foreground">{apt.arrived_at ? format(apt?.arrived_at, "HH:mm") : "-"}</p>
                                                        <p className="text-xs text-muted-foreground">{apt.completed_at ? format(apt?.completed_at, "HH:mm") : ""}</p>
                                                    </div>
                                                    <div className="h-10 w-px bg-border/50" />
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="w-4 h-4 text-primary" />
                                                            <span className="font-bold text-foreground">{apt.patient_name} - {apt.patient_code}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Stethoscope className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">{apt.doctor_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 pl-24 sm:pl-0">
                                                    {apt.notes && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground">{apt.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 pl-24 sm:pl-0">
                                                    <Badge variant="outline" className="border-border/50 text-muted-foreground">
                                                        {apt.procedure_type}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 p-1 px-1.5 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer" onClick={handleOpenStatusModal(apt)}>
                                                        <Badge className={`${statusColors[apt.status] || "bg-secondary"} border-0`}>{t(`statuses.${apt.status}`)}</Badge>
                                                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                                                    </div>
                                                    <Badge variant="outline" className={priorityColors[apt.priority] || "bg-secondary"}>
                                                        {t(`priorities.${apt.priority}`)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="calendar" className="w-0 min-w-full overflow-hidden">
                            <Card className="bg-card border-border">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-foreground text-base">
                                            Daily Schedule — {displayDateStr}
                                        </CardTitle>
                                            <div className="flex items-center gap-1.5 bg-background/50 p-1 rounded-xl border border-border shadow-sm">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => scrollGrid('left')}
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <div className="h-4 w-px bg-border mx-0.5" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => scrollGrid('right')}
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 pb-4 relative w-full max-w-full! overflow-hidden min-w-0">
                                    <div className="w-full relative overflow-hidden flex flex-col min-w-0">
                                        <div
                                            ref={scrollContainerRef}
                                            className="overflow-x-hidden w-full"
                                        >
                                            <div
                                                className="relative"
                                                style={{
                                                    width: doctors.length > 5 ? `${80 + 230 * doctors.length}px` : "100%",
                                                    minWidth: "100%"
                                                }}
                                            >
                                                {/* Header Grid */}
                                                <div
                                                    className="grid border-b border-border"
                                                    style={{
                                                        gridTemplateColumns: `80px repeat(${doctors.length}, minmax(0, 1fr))`
                                                    }}
                                                >
                                                    <div className="py-4 px-4 text-xs text-muted-foreground font-black uppercase tracking-wider sticky left-0 bg-card z-30 border-r border-border/50">Time</div>
                                                    {doctors.map((doc) => (
                                                        <div key={doc.doctor_id} className="py-3 px-4 border-l border-border">
                                                            <p className="text-sm font-bold text-foreground truncate">{doc.name}</p>
                                                            <p className="text-xs text-muted-foreground">{doc.specialty_name}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Body Grid */}
                                                <div
                                                    className="grid relative"
                                                    style={{
                                                        gridTemplateColumns: `80px repeat(${doctors.length}, minmax(0, 1fr))`
                                                    }}
                                                >
                                                    {hoursRange.map((hour) => (
                                                        <div key={hour} className="contents">
                                                            <div
                                                                className="flex items-start justify-end pr-4 pt-1 text-xs text-muted-foreground/60 font-medium select-none sticky left-0 bg-card z-20 border-r border-border/50"
                                                                style={{ height: ROW_HEIGHT }}
                                                            >
                                                                {`${String(hour).padStart(2, '0')}:00`}
                                                            </div>
                                                            {doctors.map((doc) => (
                                                                <div
                                                                    key={doc.doctor_id}
                                                                    className="border-l border-t border-border/40 bg-secondary/5"
                                                                    style={{ height: ROW_HEIGHT }}
                                                                />
                                                            ))}
                                                        </div>
                                                    ))}

                                                    {appointments.map((apt: Appointment) => {
                                                        const docIndex = doctors.findIndex((d) => d.doctor_id === apt.doctor_id)
                                                        if (docIndex === -1) return null

                                                        if (startHour === null) return null;
                                                        const startDecimal = timeToDecimal(format(new Date(apt.appointment_date), "hh:mm a"))
                                                        const durationMins = durationToMinutes(apt.duration_mins)
                                                        const topPx = (startDecimal - startHour) * ROW_HEIGHT
                                                        const heightPx = Math.max((durationMins / 60) * ROW_HEIGHT, 32)
                                                        const colors = typeColors[apt.status]

                                                        return (
                                                            <div
                                                                key={apt.id}
                                                                title={`${apt.patient_name} — ${apt.type}`}
                                                                className={`absolute rounded-lg border-l-4 px-3 py-2 overflow-hidden cursor-pointer shadow-sm
                                                                        transition-all hover:z-20 hover:shadow-xl hover:scale-[1.01]
                                                                        ${colors.bg} ${colors.border}`}
                                                                style={{
                                                                    top: topPx,
                                                                    height: heightPx,
                                                                    left: `calc(80px + ${docIndex} * ((100% - 80px) / ${doctors.length}))`,
                                                                    width: `calc((100% - 80px) / ${doctors.length} - 8px)`,
                                                                    marginLeft: 4,
                                                                    zIndex: 10,
                                                                }}
                                                            >
                                                                <p className={`text-xs font-black leading-none truncate mb-1 ${colors.text}`}>
                                                                    {apt.patient_name}
                                                                </p>
                                                                {heightPx > 40 && (
                                                                    <p className="text-[10px] text-muted-foreground/80 font-bold truncate">
                                                                        {apt.type}
                                                                    </p>
                                                                )}
                                                                {heightPx > 60 && (
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                                                                        <span className="text-[10px] text-muted-foreground">{format(new Date(apt.appointment_date), "hh:mm a")}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* New Appointment Modal */}
                    <AppointmentDialog
                        open={showNewAppointment}
                        onOpenChange={setShowNewAppointment}
                    // initialDate={selectedAppointment}
                    />

                    {/* Status Update Modal */}
                    {selectedAppointment && statusUpdateVisible && (
                        <StatusUpdateDialog
                            appointment={selectedAppointment}
                            open={statusUpdateVisible}
                            onOpenChange={handleStateChangeStatusUpdate}
                            onClose={handleCloseStatusUpdate}
                            statusColors={statusColors}
                        />
                    )}
                </div>
            </div>
        </LoadingOverlay >
    )
}