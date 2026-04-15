"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Check, Edit2, Loader2 } from "lucide-react"
import { useVisibility } from "@/hooks"
import { updateAppointmentStatus } from "@/services/appointments"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Appointment, AppointmentStatus } from "@/types/appointments"

const LOCKED_STATUSES: AppointmentStatus[] = ["in_chair", "completed"]

interface StatusUpdateDialogProps {
    appointment: Appointment
    statusColors: Record<AppointmentStatus, string>
}

export function StatusUpdateDialog({
    appointment,
    statusColors,
}: StatusUpdateDialogProps) {
    const queryClient = useQueryClient()
    const t = useTranslations("Appointments")
    const commonT = useTranslations("Common")

    const { visible: open, handleClose, handleStateChange } = useVisibility()
    const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(appointment.status)

    const isLocked = LOCKED_STATUSES.includes(appointment.status)

    const statuses: AppointmentStatus[] = [
        "pending",
        "confirmed",
        "arrived",
        "no_show",
        "cancelled",
    ]

    const mutation = useMutation({
        mutationFn: () => updateAppointmentStatus(appointment.id, selectedStatus),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ["appointments"] })
                queryClient.invalidateQueries({ queryKey: ["appointments-stats"] })
                handleClose()
            }
        },
    })

    return (
        <Dialog open={open} onOpenChange={handleStateChange}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLocked}
                >
                    <div className="flex items-center gap-1.5 p-1 px-1.5 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer" >
                        <Badge className={`${statusColors[appointment.status] || "bg-secondary"} border-0`}>{t(`statuses.${appointment.status}`)}</Badge>
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </div>
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground text-xl font-black">
                        {t("statusDialog.title")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-1">
                        {t("statusDialog.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-2 py-4">
                    {statuses.map((status) => (
                        <Button
                            key={status}
                            variant="outline"
                            onClick={() => setSelectedStatus(status)}
                            className={`h-auto py-3 px-4 justify-start gap-3 rounded-xl border-dashed transition-all ${selectedStatus === status
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:border-primary/50 hover:bg-secondary/50"
                                }`}
                        >
                            <div className="flex flex-col items-start gap-1">
                                <Badge className={`${statusColors[status]} border-0 capitalize text-[10px]`}>
                                    {t(`statuses.${status}`)}
                                </Badge>
                                <span className={`text-xs font-bold ${selectedStatus === status ? "text-primary" : "text-muted-foreground"}`}>
                                    {selectedStatus === status && <Check className="w-3 h-3 inline mr-1" />}
                                    {t(`statuses.${status}`)}
                                </span>
                            </div>
                        </Button>
                    ))}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="rounded-xl font-bold"
                    >
                        {commonT("cancel")}
                    </Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || selectedStatus === appointment.status}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 rounded-xl font-black shadow-lg shadow-primary/20 min-w-32"
                    >
                        {mutation.isPending
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : t("statusDialog.submit")
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
