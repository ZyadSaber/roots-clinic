"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Stethoscope, User, Clock, ArrowRight } from "lucide-react"
import { startVisit } from "@/services/appointments"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Appointment } from "@/types/appointments"
import { toast } from "sonner"

interface StartVisitDialogProps {
    appointment: Appointment
    onDone?: () => void
}

export function StartVisitDialog({ appointment, onDone }: StartVisitDialogProps) {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: () => startVisit(appointment.id, appointment.patient_id, appointment.doctor_id),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`Visit started for ${appointment.patient_name}`)
                queryClient.invalidateQueries({ queryKey: ["appointments"] })
                queryClient.invalidateQueries({ queryKey: ["appointments-stats"] })
                setOpen(false)
                onDone?.()
            } else {
                toast.error(res.error ?? "Failed to start visit")
            }
        },
        onError: () => toast.error("Something went wrong"),
    })

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                onClick={() => setOpen(true)}
                className="rounded-xl font-bold text-xs shrink-0 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
            >
                Start Visit
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-background">
                    <div className="flex flex-col gap-6 p-8">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                            <Stethoscope className="w-7 h-7 text-emerald-500" />
                        </div>

                        <div className="text-center space-y-1">
                            <DialogTitle className="text-xl font-black tracking-tight">Start Visit</DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium">
                                This will move the patient to the chair and open a visit record.
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
                                    <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] font-black ms-auto shrink-0">
                                        URGENT
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(appointment.appointment_date), "hh:mm a")}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Stethoscope className="w-3.5 h-3.5" />
                                    {appointment.procedure_type}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <Badge className="capitalize font-bold border-0 bg-muted text-muted-foreground">
                                    arrived
                                </Badge>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                                <Badge className="capitalize font-bold border-0 bg-emerald-500/10 text-emerald-600">
                                    in chair
                                </Badge>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={mutation.isPending}
                                className="flex-1 h-11 rounded-2xl font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => mutation.mutate()}
                                disabled={mutation.isPending}
                                className="flex-1 h-11 rounded-2xl font-black shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                                {mutation.isPending
                                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    : "Start Visit"
                                }
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
