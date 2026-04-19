"use client"

import { useMemo } from "react"
import { parseISO } from "date-fns"
import { Clock } from "lucide-react"
import { Appointment } from "@/types/appointments"
import { statusColors, ACTIONABLE_STATUSES as ACTIONABLE } from "@/constants/appointments"

function buildSlots(startHour: number, endHour: number): string[] {
    const slots: string[] = []
    for (let h = startHour; h < endHour; h++) {
        slots.push(`${String(h).padStart(2, "0")}:00`)
        slots.push(`${String(h).padStart(2, "0")}:30`)
    }
    return slots
}

function appointmentSlot(a: Appointment): string {
    const d = parseISO(a.appointment_date)
    return `${String(d.getHours()).padStart(2, "0")}:${d.getMinutes() < 30 ? "00" : "30"}`
}

interface AppointmentTimelineViewProps {
    appointments: Appointment[]
    onSelect?: (a: Appointment) => void
    startHour?: number
    endHour?: number
}

export function AppointmentTimelineView({ appointments, onSelect, startHour = 8, endHour = 20 }: AppointmentTimelineViewProps) {
    const slots = useMemo(() => buildSlots(startHour, endHour), [startHour, endHour])

    const slotMap = useMemo(() => {
        const map: Record<string, Appointment[]> = {}
        appointments.forEach(a => {
            const slot = appointmentSlot(a)
            if (!map[slot]) map[slot] = []
            map[slot].push(a)
        })
        return map
    }, [appointments])

    return (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            {slots.map((slot, i) => {
                const isHour = slot.endsWith(":00")
                const appts = slotMap[slot] ?? []
                return (
                    <div key={slot} className={`flex gap-0 min-h-[52px] ${i < slots.length - 1 ? "border-b border-border/30" : ""}`}>
                        <div className={`w-16 shrink-0 flex items-start justify-end pe-3 pt-3 ${isHour ? "bg-accent/20" : ""}`}>
                            {isHour && (
                                <span className="text-xs font-black text-muted-foreground tabular-nums">{slot}</span>
                            )}
                        </div>
                        <div className="flex-1 p-1.5 flex flex-wrap gap-1.5 items-start">
                            {appts.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => ACTIONABLE.includes(a.status) && onSelect?.(a)}
                                    disabled={!ACTIONABLE.includes(a.status) || !onSelect}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all text-start
                                        ${statusColors[a.status]}
                                        ${ACTIONABLE.includes(a.status) && onSelect ? "cursor-pointer hover:scale-[1.02] border-current/20" : "opacity-60 cursor-default border-transparent"}
                                    `}
                                >
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span className="truncate max-w-[140px]">{a.patient_name}</span>
                                    <span className="opacity-60">· {a.duration_mins}m</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
