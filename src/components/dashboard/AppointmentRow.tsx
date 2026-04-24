import { format } from "date-fns"
import { AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { statusColors } from "@/constants/appointments"
import type { AppointmentStatus } from "@/types/appointments"
import type { DashboardAppointment } from "@/services/dashboard"

export function AppointmentRow({ appt }: { appt: DashboardAppointment }) {
    const time = format(new Date(appt.appointment_date), "h:mm a")
    const statusClass = statusColors[appt.status as AppointmentStatus] ?? statusColors.pending
    const statusLabel = appt.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    const initials = appt.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)

    return (
        <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-accent/20 transition-colors group">
            <div className="w-16 shrink-0">
                <p className="text-xs font-black tabular-nums">{time}</p>
                <p className="text-[10px] text-muted-foreground">{appt.duration_mins}m</p>
            </div>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-8 h-8 rounded-xl border border-background shadow-xs shrink-0">
                    <AvatarFallback className="text-[10px] font-black">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="text-sm font-black truncate leading-tight">{appt.patient_name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{appt.patient_code}</p>
                </div>
            </div>
            <div className="hidden md:block w-32 shrink-0 min-w-0">
                <p className="text-xs font-medium truncate">{appt.procedure_type ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground truncate italic">{appt.doctor_name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {appt.priority === "urgent" && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
                <Badge className={`rounded-lg text-[10px] px-2 py-0.5 font-bold border ${statusClass}`}>
                    {statusLabel}
                </Badge>
            </div>
        </div>
    )
}
