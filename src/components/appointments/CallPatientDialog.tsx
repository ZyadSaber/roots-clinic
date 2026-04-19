"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { PhoneCall, User, Clock, Stethoscope, ArrowRight } from "lucide-react"
import { updateAppointmentStatus } from "@/services/appointments"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Appointment, AppointmentStatus } from "@/types/appointments"
import { toast } from "sonner"

const nextStatus: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
    confirmed: "arrived",
    arrived:   "in_chair",
    in_chair:  "completed",
}

const actionLabel: Partial<Record<AppointmentStatus, string>> = {
    confirmed: "Mark as Arrived",
    arrived:   "Start Visit",
    in_chair:  "Complete Visit",
}

const actionColor: Partial<Record<AppointmentStatus, string>> = {
    confirmed: "bg-indigo-500 hover:bg-indigo-600 text-white",
    arrived:   "bg-emerald-500 hover:bg-emerald-600 text-white",
    in_chair:  "bg-primary hover:bg-primary/90 text-primary-foreground",
}

interface CallPatientDialogProps {
    appointment: Appointment | null
    open: boolean
    onClose: () => void
    onDone: () => void
}

export function CallPatientDialog({ appointment, open, onClose, onDone }: CallPatientDialogProps) {
    const mutation = useMutation({
        mutationFn: () => updateAppointmentStatus(appointment!.id, nextStatus[appointment!.status]!),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`${appointment?.patient_name} — ${actionLabel[appointment!.status]} ✓`)
                onDone()
            } else {
                toast.error(res.error ?? "Failed to update status")
            }
        },
        onError: () => toast.error("Something went wrong"),
    })

    if (!appointment) return null

    const next = nextStatus[appointment.status]
    const label = actionLabel[appointment.status]
    const btnColor = actionColor[appointment.status] ?? ""

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-background">
                <div className="flex flex-col gap-6 p-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                        <PhoneCall className="w-7 h-7 text-primary" />
                    </div>

                    <div className="text-center space-y-1">
                        <DialogTitle className="text-xl font-black tracking-tight">Call Patient</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            Confirm the next step for this appointment
                        </DialogDescription>
                    </div>

                    <div className="rounded-2xl bg-accent/30 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black truncate">{appointment.patient_name}</p>
                                <p className="text-xs text-muted-foreground font-medium">{appointment.patient_code}</p>
                            </div>
                            {appointment.priority === "urgent" && (
                                <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] font-black ms-auto shrink-0">URGENT</Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {format(parseISO(appointment.appointment_date), "hh:mm a")}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5" />
                                {appointment.procedure_type}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Badge className="capitalize font-bold border-0 bg-muted text-muted-foreground">
                                {appointment.status.replace("_", " ")}
                            </Badge>
                            {next && (
                                <>
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    <Badge className="capitalize font-bold border-0 bg-primary/10 text-primary">
                                        {next.replace("_", " ")}
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-2xl font-bold"
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending || !next}
                            className={`flex-1 h-11 rounded-2xl font-black shadow-lg ${btnColor}`}
                        >
                            {mutation.isPending
                                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : label
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
