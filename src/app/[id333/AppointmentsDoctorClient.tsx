"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarDays, List, Users, UserCheck, Armchair, CheckCircle2 } from "lucide-react"
import { getAppointmentsByDoctor, getDoctorAppointmentStats } from "@/services/appointments"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/Date"
import { CallPatientDialog } from "@/components/appointments/CallPatientDialog"
import { AppointmentStatCard } from "@/components/appointments/AppointmentStatCard"
import { AppointmentListView } from "@/components/appointments/AppointmentListView"
import { AppointmentTimelineView } from "@/components/appointments/AppointmentTimelineView"
import { Appointment } from "@/types/appointments"

interface Props { doctorId: string }

export default function AppointmentsDoctorClient({ doctorId }: Props) {
    const [date, setDate] = useState<Date>(new Date())
    const [view, setView] = useState<"list" | "timeline">("list")
    const [selected, setSelected] = useState<Appointment | null>(null)
    const queryClient = useQueryClient()

    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ["doctor-appointments", doctorId, date.toDateString()],
        queryFn: () => getAppointmentsByDoctor(doctorId, date),
    })

    const { data: stats } = useQuery({
        queryKey: ["doctor-appointment-stats", doctorId, date.toDateString()],
        queryFn: () => getDoctorAppointmentStats(doctorId, date),
    })

    const handleActionDone = () => {
        queryClient.invalidateQueries({ queryKey: ["doctor-appointments", doctorId] })
        queryClient.invalidateQueries({ queryKey: ["doctor-appointment-stats", doctorId] })
        setSelected(null)
    }

    const statCards = [
        { label: "Confirmed", value: stats?.confirmed ?? 0, icon: UserCheck,   color: "text-indigo-500",  bg: "bg-indigo-500/10" },
        { label: "Arrived",   value: stats?.arrived   ?? 0, icon: Users,        color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "In Chair",  value: stats?.in_chair  ?? 0, icon: Armchair,     color: "text-amber-500",   bg: "bg-amber-500/10" },
        { label: "Completed", value: stats?.completed ?? 0, icon: CheckCircle2, color: "text-primary",     bg: "bg-primary/10" },
    ]

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight">My Appointments</h2>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        {format(date, "EEEE, MMMM d, yyyy")} · {stats?.total ?? 0} total
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DatePicker value={date} onDateChange={setDate} label="" className="h-10 rounded-xl bg-accent/30 border-none" />
                    <div className="flex items-center bg-accent/30 rounded-xl p-1 gap-1">
                        <Button
                            variant={view === "list" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("list")}
                            className="rounded-lg h-8 px-3 gap-1.5 font-bold"
                        >
                            <List className="w-4 h-4" /> List
                        </Button>
                        <Button
                            variant={view === "timeline" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("timeline")}
                            className="rounded-lg h-8 px-3 gap-1.5 font-bold"
                        >
                            <CalendarDays className="w-4 h-4" /> Timeline
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <AppointmentStatCard key={card.label} {...card} />
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground font-medium">Loading…</div>
            ) : view === "list" ? (
                <AppointmentListView
                    appointments={appointments}
                    variant="doctor"
                    onSelect={setSelected}
                    emptyText="No appointments for this day"
                />
            ) : (
                <AppointmentTimelineView
                    appointments={appointments}
                    onSelect={setSelected}
                />
            )}

            <CallPatientDialog
                appointment={selected}
                open={!!selected}
                onClose={() => setSelected(null)}
                onDone={handleActionDone}
            />
        </div>
    )
}
