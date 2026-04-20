"use client"

import { format } from "date-fns"
import { useTranslations } from "next-intl"
import { User as UserIcon, Stethoscope, ClipboardList } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusUpdateDialog } from "@/components/appointments/StatusUpdateDialog"
import { StartVisitDialog } from "@/components/appointments/StartVisitDialog"
import { Appointment } from "@/types/appointments"
import { statusColors, priorityColors, ACTIONABLE_STATUSES as ACTIONABLE } from "@/constants/appointments"

interface AppointmentListViewProps {
    appointments: Appointment[]
    variant?: "admin" | "doctor"
    onSelect?: (a: Appointment) => void
    onViewRecord?: (a: Appointment) => void
    emptyText?: string
}

export function AppointmentListView({ appointments, variant = "admin", onSelect, onViewRecord, emptyText }: AppointmentListViewProps) {
    const t = useTranslations("Appointments")
    const commonT = useTranslations("Common")

    if (appointments.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">{emptyText ?? commonT("ndf")}</div>
    }

    if (variant === "doctor") {
        return (
            <div className="space-y-2">
                {appointments.map(a => (
                    <div
                        key={a.id}
                        onClick={() => ACTIONABLE.includes(a.status) && onSelect?.(a)}
                        onDoubleClick={() => a.status === "completed" && onViewRecord?.(a)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card transition-all ${
                            ACTIONABLE.includes(a.status) ? "cursor-pointer hover:border-primary/30 hover:bg-accent/30"
                            : a.status === "completed" ? "cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/5"
                            : "opacity-70"
                        }`}
                    >
                        <div className="text-center w-14 shrink-0">
                            <p className="text-sm font-black tabular-nums text-foreground">
                                {format(new Date(a.appointment_date), "hh:mm")}
                            </p>
                            <p className="text-xs text-muted-foreground font-bold uppercase">
                                {format(new Date(a.appointment_date), "a")}
                            </p>
                        </div>
                        <div className="w-px h-10 bg-border/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-black text-foreground truncate">{a.patient_name}</p>
                                {a.priority === "urgent" && (
                                    <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] font-black">URGENT</Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium truncate">
                                {a.procedure_type} · {a.duration_mins} min · {a.patient_code}
                            </p>
                        </div>
                        <Badge className={`${statusColors[a.status]} border-0 font-bold text-xs capitalize shrink-0`}>
                            {a.status.replace("_", " ")}
                        </Badge>
                        {ACTIONABLE.includes(a.status) && (
                            a.status === "arrived"
                                ? <StartVisitDialog appointment={a} />
                                : a.status === "in_chair"
                                    ? <Button size="sm" variant="outline" onClick={() => onSelect?.(a)} className="rounded-xl font-bold text-xs shrink-0 border-amber-500/40 text-amber-600 hover:bg-amber-500/10">
                                        Resume Visit
                                    </Button>
                                    : <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs shrink-0">
                                        Mark Arrived
                                    </Button>
                        )}
                        {a.status === "completed" && onViewRecord && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); onViewRecord(a) }}
                                className="rounded-xl font-bold text-xs shrink-0 gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                            >
                                <ClipboardList className="w-3.5 h-3.5" />
                                {t("record")}
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {appointments.map(a => (
                <div
                    key={a.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-border transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-20 text-center">
                            <p className="text-sm font-bold text-foreground">
                                {a.appointment_date ? format(new Date(a.appointment_date), "HH:mm") : "-"}
                            </p>
                        </div>
                        <div className="w-20 text-center">
                            <p className="text-sm font-bold text-foreground">
                                {a.arrived_at ? format(new Date(a.arrived_at), "HH:mm") : "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {a.completed_at ? format(new Date(a.completed_at), "HH:mm") : ""}
                            </p>
                        </div>
                        <div className="h-10 w-px bg-border/50" />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-primary" />
                                <span className="font-bold text-foreground">{a.patient_name} - {a.patient_code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{a.doctor_name}</span>
                            </div>
                        </div>
                    </div>
                    {a.notes && (
                        <div className="flex items-center gap-2 pl-24 sm:pl-0">
                            <span className="text-sm text-muted-foreground">{a.notes}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 pl-24 sm:pl-0">
                        <Badge variant="outline" className="border-border/50 text-muted-foreground">
                            {a.procedure_type}
                        </Badge>
                        <StatusUpdateDialog appointment={a} statusColors={statusColors} />
                        <Badge variant="outline" className={priorityColors[a.priority] || "bg-secondary"}>
                            {t(`priorities.${a.priority}`)}
                        </Badge>
                        {a.status === "completed" && onViewRecord && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onViewRecord(a)}
                                className="rounded-xl font-bold text-xs gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                            >
                                <ClipboardList className="w-3.5 h-3.5" />
                                {t("record")}
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
