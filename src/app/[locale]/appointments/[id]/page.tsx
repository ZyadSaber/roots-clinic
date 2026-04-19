"use client"

import { useMemo, useState, useEffect } from "react"
import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { AlertTriangle, Calendar, ChevronLeft, CheckCircle2, Clock3, UserCheck, Armchair } from "lucide-react"
import { getAppointmentsByDoctor, getDoctorAppointmentStats } from "@/services/appointments"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import { DatePicker } from "@/components/ui/Date"
import ErrorLayout from "@/components/ErrorLayout"
import { Button } from "@/components/ui/button"
import { AppointmentStatCard } from "@/components/appointments/AppointmentStatCard"
import { AppointmentTabs } from "@/components/appointments/AppointmentTabs"
import { VisitInProgressModal } from "@/components/appointments/VisitInProgressModal"
import { Appointment, AppointmentStatus } from "@/types/appointments"

const SHOWN_STATUSES: AppointmentStatus[] = ["confirmed", "arrived", "in_chair", "completed"]

const PENDING_RADIOLOGY_KEY = "pendingRadiology"

function loadPendingRadiology(): Set<string> {
    if (typeof window === "undefined") return new Set()
    try {
        return new Set(JSON.parse(localStorage.getItem(PENDING_RADIOLOGY_KEY) || "[]"))
    } catch {
        return new Set()
    }
}

function savePendingRadiology(ids: Set<string>) {
    localStorage.setItem(PENDING_RADIOLOGY_KEY, JSON.stringify([...ids]))
}

export default function DoctorAppointmentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const t = useTranslations("Appointments")
    const commonT = useTranslations("Common")
    const errorT = useTranslations("Errors.applicationError.505")
    const router = useRouter()
    const locale = useLocale()

    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [pendingRadiology, setPendingRadiology] = useState<Set<string>>(new Set())
    const [modalOpen, setModalOpen] = useState(false)
    const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null)

    // Load persisted pending-radiology set from localStorage once on mount
    useEffect(() => {
        setPendingRadiology(loadPendingRadiology())
    }, [])

    const {
        data: allAppointments = [],
        isLoading: isLoadingApt,
        error: errorApt,
    } = useQuery<Appointment[]>({
        queryKey: ["appointments", id, selectedDate],
        queryFn: () => getAppointmentsByDoctor(id, selectedDate),
    })

    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ["appointments-stats", id, selectedDate],
        queryFn: () => getDoctorAppointmentStats(id, selectedDate),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchInterval: 30000,
    })

    // Auto-open modal for any in_chair appointment not pending radiology
    useEffect(() => {
        const inChair = allAppointments.find((a) => a.status === "in_chair")
        if (inChair && !pendingRadiology.has(inChair.id)) {
            setActiveAppointment(inChair)
            setModalOpen(true)
        } else if (!inChair) {
            setModalOpen(false)
            setActiveAppointment(null)
        }
    }, [allAppointments, pendingRadiology])

    const handleSendForRadiology = () => {
        if (!activeAppointment) return
        const next = new Set(pendingRadiology)
        next.add(activeAppointment.id)
        setPendingRadiology(next)
        savePendingRadiology(next)
        setModalOpen(false)
    }

    const handleEndVisit = () => {
        if (!activeAppointment) return
        const next = new Set(pendingRadiology)
        next.delete(activeAppointment.id)
        setPendingRadiology(next)
        savePendingRadiology(next)
        setModalOpen(false)
        setActiveAppointment(null)
    }

    // "Resume Visit" — clicked from the appointment list row
    const handleResumeVisit = (apt: Appointment) => {
        if (apt.status !== "in_chair") return
        const next = new Set(pendingRadiology)
        next.delete(apt.id)
        setPendingRadiology(next)
        savePendingRadiology(next)
        setActiveAppointment(apt)
        setModalOpen(true)
    }

    const appointments = useMemo(
        () => allAppointments.filter((apt) => SHOWN_STATUSES.includes(apt.status)),
        [allAppointments]
    )

    const doctorName = allAppointments[0]?.doctor_name ?? ""
    const displayDateStr = useMemo(
        () => new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        [selectedDate]
    )

    const isLoading = isLoadingApt || isLoadingStats

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

            {/* Locked visit modal */}
            {activeAppointment && (
                <VisitInProgressModal
                    appointment={activeAppointment}
                    open={modalOpen}
                    onSendForRadiology={handleSendForRadiology}
                    onEndVisit={handleEndVisit}
                />
            )}

            <div className="flex flex-col w-0 min-w-full h-[calc(100vh-4rem)] overflow-hidden relative">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 scrollbar-hide min-w-0 w-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div className="flex items-start gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/${locale}/appointments`)}
                                className="mt-1 shrink-0 hover:bg-secondary"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight mb-1">
                                    {doctorName || "Doctor"}
                                </h1>
                                <p className="text-muted-foreground font-medium">
                                    Confirmed · Arrived · In Chair · Completed
                                </p>
                            </div>
                        </div>
                        <DatePicker
                            label="Date"
                            icon={Calendar}
                            containerClassName="w-64"
                            placeHolder="Select Date"
                            value={selectedDate}
                            onDateChange={setSelectedDate}
                            showTime={false}
                        />
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <AppointmentStatCard
                            label={t("stats.confirmed")}
                            value={stats?.confirmed ?? 0}
                            icon={UserCheck}
                            color="text-indigo-500"
                            bg="bg-indigo-500/10"
                        />
                        <AppointmentStatCard
                            label={t("stats.arrived")}
                            value={stats?.arrived ?? 0}
                            icon={Clock3}
                            color="text-emerald-500"
                            bg="bg-emerald-500/10"
                        />
                        <AppointmentStatCard
                            label={t("stats.inChair")}
                            value={stats?.in_chair ?? 0}
                            icon={Armchair}
                            color="text-amber-500"
                            bg="bg-amber-500/10"
                        />
                        <AppointmentStatCard
                            label={t("stats.completed")}
                            value={stats?.completed ?? 0}
                            icon={CheckCircle2}
                            color="text-primary"
                            bg="bg-primary/10"
                        />
                    </div>

                    <AppointmentTabs
                        appointments={appointments}
                        doctors={[]}
                        selectedDate={selectedDate}
                        hoursRange={[]}
                        startHour={null}
                        displayDateStr={displayDateStr}
                        showCalendar={false}
                        showExport={false}
                        variant="doctor"
                        onSelect={handleResumeVisit}
                    />
                </div>
            </div>
        </LoadingOverlay>
    )
}
