"use client"

import { useRef } from "react"
import { useTranslations } from "next-intl"
import { Clock, FileSpreadsheet, Printer, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { downloadExcel, downloadPDF } from "@/helpers/exportHelpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentListView } from "@/components/appointments/AppointmentListView"
import { Appointment } from "@/types/appointments"
import { DoctorAppointments } from "@/types/doctors"
import { typeColors } from "@/constants/appointments"

const ROW_HEIGHT = 64

function durationToMinutes(dur: string): number {
    const n = parseInt(dur, 10)
    return isNaN(n) ? 30 : n
}

interface AppointmentTabsProps {
    appointments: Appointment[]
    doctors: DoctorAppointments[]
    selectedDate: Date
    hoursRange: number[]
    startHour: number | null
    displayDateStr: string
    showExport?: boolean
    showCalendar?: boolean
    variant?: "admin" | "doctor"
    onSelect?: (a: Appointment) => void
    onViewRecord?: (a: Appointment) => void
}

export function AppointmentTabs({
    appointments,
    doctors,
    selectedDate,
    hoursRange,
    startHour,
    displayDateStr,
    showExport = true,
    showCalendar = true,
    variant,
    onSelect,
    onViewRecord,
}: AppointmentTabsProps) {
    const t = useTranslations("Appointments")
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const scrollGrid = (direction: "left" | "right") => {
        scrollContainerRef.current?.scrollBy({
            left: direction === "left" ? -500 : 500,
            behavior: "smooth",
        })
    }

    const handleDownloadExcel = () => {
        if (!appointments.length) return
        const headers = ["Time", "Patient Name", "Code", "Doctor", "Procedure", "Status", "Priority", "Notes"]
        const rows = appointments.map(apt => [
            apt.appointment_date ? format(new Date(apt.appointment_date), "HH:mm") : "-",
            apt.patient_name,
            apt.patient_code,
            apt.doctor_name,
            apt.procedure_type,
            apt.status,
            apt.priority,
            apt.notes || "",
        ])
        const dateStr = format(new Date(selectedDate), "yyyy-MM-dd")
        downloadExcel(headers, rows, `appointments_${dateStr}.csv`)
    }

    const handleDownloadPDF = () => {
        if (!appointments.length) return
        const headers = ["Time", "Patient Name", "Code", "Doctor", "Procedure", "Status", "Priority", "Notes"]
        const rows = appointments.map(apt => [
            apt.appointment_date ? format(new Date(apt.appointment_date), "HH:mm") : "-",
            apt.patient_name,
            apt.patient_code,
            apt.doctor_name,
            apt.procedure_type,
            apt.status,
            apt.priority,
            apt.notes || "",
        ])
        const dateStr = format(new Date(selectedDate), "yyyy-MM-dd")
        downloadPDF(headers, rows, "Appointments Report", `appointments_${dateStr}.pdf`)
    }

    return (
        <Tabs defaultValue="list" className="space-y-4">
            <TabsList className="bg-secondary p-1 rounded-xl">
                <TabsTrigger value="list" className="rounded-lg px-6">{t("tabs.list")}</TabsTrigger>
                {showCalendar && (
                    <TabsTrigger value="calendar" className="rounded-lg px-6">{t("tabs.calendar")}</TabsTrigger>
                )}
            </TabsList>

            {/* List Tab */}
            <TabsContent value="list" className="space-y-4">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-foreground text-lg font-bold">
                            {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </CardTitle>
                        {showExport && (
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleDownloadExcel}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 gap-2 rounded-lg font-bold border-border bg-secondary/30 hover:bg-secondary/50 text-xs sm:text-sm"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    <span className="hidden sm:inline">Excel</span>
                                </Button>
                                <Button
                                    onClick={handleDownloadPDF}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 gap-2 rounded-lg font-bold border-border bg-secondary/30 hover:bg-secondary/50 text-xs sm:text-sm"
                                >
                                    <Printer className="w-4 h-4 text-primary" />
                                    <span className="hidden sm:inline">PDF</span>
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent id="appointments-list-container">
                        <AppointmentListView appointments={appointments} variant={variant} onSelect={onSelect} onViewRecord={onViewRecord} />
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Calendar Tab */}
            {showCalendar && (
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
                                        onClick={() => scrollGrid("left")}
                                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <div className="h-4 w-px bg-border mx-0.5" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => scrollGrid("right")}
                                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 pb-4 relative w-full max-w-full! overflow-hidden min-w-0">
                            <div className="w-full relative overflow-hidden flex flex-col min-w-0">
                                <div ref={scrollContainerRef} className="overflow-x-hidden w-full">
                                    <div
                                        className="relative"
                                        style={{
                                            width: doctors.length > 5 ? `${80 + 230 * doctors.length}px` : "100%",
                                            minWidth: "100%",
                                        }}
                                    >
                                        {/* Header */}
                                        <div
                                            className="grid border-b border-border"
                                            style={{ gridTemplateColumns: `80px repeat(${doctors.length}, minmax(0, 1fr))` }}
                                        >
                                            <div className="py-4 px-4 text-xs text-muted-foreground font-black uppercase tracking-wider sticky left-0 bg-card z-30 border-r border-border/50">
                                                Time
                                            </div>
                                            {doctors.map((doc) => (
                                                <div key={doc.doctor_id} className="py-3 px-4 border-l border-border">
                                                    <p className="text-sm font-bold text-foreground truncate">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.specialty_name}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Body */}
                                        <div
                                            className="grid relative"
                                            style={{ gridTemplateColumns: `80px repeat(${doctors.length}, minmax(0, 1fr))` }}
                                        >
                                            {hoursRange.map((hour) => (
                                                <div key={hour} className="contents">
                                                    <div
                                                        className="flex items-start justify-end pr-4 pt-1 text-xs text-muted-foreground/60 font-medium select-none sticky left-0 bg-card z-20 border-r border-border/50"
                                                        style={{ height: ROW_HEIGHT }}
                                                    >
                                                        {`${String(hour).padStart(2, "0")}:00`}
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

                                            {appointments.map((apt) => {
                                                const docIndex = doctors.findIndex((d) => d.doctor_id === apt.doctor_id)
                                                if (docIndex === -1 || startHour === null) return null

                                                const startDecimal = (() => {
                                                    const d = new Date(apt.appointment_date)
                                                    return d.getHours() + d.getMinutes() / 60
                                                })()
                                                const durationMins = durationToMinutes(apt.duration_mins)
                                                const topPx = (startDecimal - startHour) * ROW_HEIGHT
                                                const heightPx = Math.max((durationMins / 60) * ROW_HEIGHT, 32)
                                                const colors = typeColors[apt.status]

                                                return (
                                                    <div
                                                        key={apt.id}
                                                        title={`${apt.patient_name} — ${apt.type}`}
                                                        className={`absolute rounded-lg border-l-4 px-3 py-2 overflow-hidden cursor-pointer shadow-sm transition-all hover:z-20 hover:shadow-xl hover:scale-[1.01] ${colors.bg} ${colors.border}`}
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
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {format(new Date(apt.appointment_date), "hh:mm a")}
                                                                </span>
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
            )}
        </Tabs>
    )
}
