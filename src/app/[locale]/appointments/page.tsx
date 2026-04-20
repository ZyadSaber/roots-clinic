"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { AlertTriangle, Calendar } from "lucide-react"
import { getAllAppointments, getAppointmentsStatsByDate } from "@/services/appointments"
import { getDoctorAppointments } from "@/services/doctors"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import { DatePicker } from "@/components/ui/Date"
import ErrorLayout from "@/components/ErrorLayout"
import { Card, CardContent } from "@/components/ui/card"
import { AppointmentDialog } from "@/components/appointments/AppointmentDialog"
import { AppointmentTabs } from "@/components/appointments/AppointmentTabs"
import { VisitInProgressModal } from "@/components/appointments/VisitInProgressModal"
import { Appointment, AppointmentStats } from "@/types/appointments"
import { DoctorAppointments } from "@/types/doctors"
import { timeToDecimal } from "@/lib/timeToDecimal"

export default function AppointmentsPage() {
    const t = useTranslations("Appointments")
    const commonT = useTranslations("Common")
    const errorT = useTranslations("Errors.applicationError.505")
    const tTitle = useTranslations("Routes")
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [recordAppointment, setRecordAppointment] = useState<Appointment | null>(null)

    const {
        data: appointments = [],
        isLoading: isLoadingApt,
        error: errorApt,
    } = useQuery<Appointment[]>({
        queryKey: ["appointments", selectedDate],
        queryFn: () => getAllAppointments(selectedDate),
    })

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
        const d = new Date(selectedDate)
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }, [selectedDate])

    const startHour = useMemo(() => {
        if (!statsData?.start_time) return null
        return Math.floor(timeToDecimal(statsData.start_time))
    }, [statsData])

    const endHour = useMemo(() => {
        if (!statsData?.end_time) return null
        return Math.ceil(timeToDecimal(statsData.end_time))
    }, [statsData])

    const hoursRange = useMemo(() => {
        if (startHour === null || endHour === null) return []
        const range = []
        for (let h = startHour; h < endHour; h++) range.push(h)
        return range
    }, [startHour, endHour])

    const isLoading = isLoadingApt || isLoadingStaff || isLoadingStats

    return (
        <LoadingOverlay loading={isLoading}>
            {errorApt && (
                <ErrorLayout
                    code="505"
                    icon={<AlertTriangle className="w-full h-full" />}
                    title={errorT("title")}
                    description={errorT("description")}
                    backText={commonT("backToHome")}
                    errorDetails={errorApt instanceof Error ? errorApt.message : "An unexpected error occurred"}
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
                            <AppointmentDialog initialDate={selectedDate} />
                        </div>
                    </div>

                    {statsData && (statsData.start_time || statsData.end_time) && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                            {(
                                [
                                    { key: "total", label: t("stats.todayTotal"), color: "text-foreground" },
                                    { key: "pending", label: t("stats.pending"), color: "text-blue-500" },
                                    { key: "confirmed", label: t("stats.confirmed"), color: "text-indigo-500" },
                                    { key: "arrived", label: t("stats.arrived"), color: "text-emerald-500" },
                                    { key: "in_chair", label: t("stats.inChair"), color: "text-amber-500" },
                                    { key: "completed", label: t("stats.completed"), color: "text-primary" },
                                    { key: "no_show", label: t("stats.noShow"), color: "text-rose-500" },
                                    { key: "cancelled", label: t("stats.cancelled"), color: "text-destructive" },
                                ] as const
                            ).map(({ key, label, color }) => (
                                <Card key={key} className="bg-card border-border shadow-sm">
                                    <CardContent className="p-4 text-center sm:text-left">
                                        <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{label}</p>
                                        <p className={`text-xl sm:text-2xl font-bold ${color}`}>{statsData?.[key] || 0}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <AppointmentTabs
                        appointments={appointments}
                        doctors={doctors}
                        selectedDate={selectedDate}
                        hoursRange={hoursRange}
                        startHour={startHour}
                        displayDateStr={displayDateStr}
                        onViewRecord={setRecordAppointment}
                    />

                    {recordAppointment && (
                        <VisitInProgressModal
                            appointment={recordAppointment}
                            open={!!recordAppointment}
                            readOnly
                            onSendForRadiology={() => {}}
                            onEndVisit={() => {}}
                            onClose={() => setRecordAppointment(null)}
                        />
                    )}
                </div>
            </div>
        </LoadingOverlay>
    )
}
