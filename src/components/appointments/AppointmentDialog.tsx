"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { 
  Clock, 
  User as UserIcon, 
  UserPlus, 
  Calendar as CalendarIcon, 
  Phone, 
  Mail, 
  Check 
} from "lucide-react"

// Services
import { createAppointment } from "@/services/appointments"
import { fetchAllPatients } from "@/services/patients"
import { getAllStaff } from "@/services/staff"

// Components
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import Textarea from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PatientForm } from "@/components/patients/PatientForm"

// Types
import { AppointmentPayload } from "@/types/appointments"
import { PatientSummary } from "@/types/patients"
import { User } from "@/types/staff"

const appointmentTypes = [
    "Check-up",
    "Consultation",
    "Follow-up",
    "X-Ray Review",
    "Lab Results",
    "Surgery Prep",
    "Emergency",
    "Vaccination",
]

const durations = ["15 min", "30 min", "45 min", "60 min", "90 min"]

const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM",
]

interface AppointmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialDate?: string
    onSuccess?: () => void
}

export function AppointmentDialog({ open, onOpenChange, initialDate, onSuccess }: AppointmentDialogProps) {
    const queryClient = useQueryClient()
    const t = useTranslations("Appointments")
    const commonT = useTranslations("Common")

    // Form state
    const [selectedPatientId, setSelectedPatientId] = useState("")
    const [selectedDoctorId, setSelectedDoctorId] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [selectedDuration, setSelectedDuration] = useState("30 min")
    const [selectedType, setSelectedType] = useState("")
    const [appointmentNotes, setAppointmentNotes] = useState("")
    const [showNewPatient, setShowNewPatient] = useState(false)

    // Data Fetching
    const { data: patients = [] } = useQuery<PatientSummary[]>({
        queryKey: ["patients"],
        queryFn: fetchAllPatients,
        enabled: open,
    })

    const { data: staff = [] } = useQuery<User[]>({
        queryKey: ["staff"],
        queryFn: getAllStaff,
        enabled: open,
    })

    const doctors = useMemo(() => (staff as User[]).filter(s => s.role === "doctor"), [staff])
    const selectedPatientData = patients.find(p => p.patient_id === selectedPatientId)

    const createMutation = useMutation({
        mutationFn: createAppointment,
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ["appointments"] })
                onOpenChange(false)
                resetAppointmentForm()
                onSuccess?.()
            }
        }
    })

    const resetAppointmentForm = () => {
        setSelectedPatientId("")
        setSelectedDoctorId("")
        setSelectedTime("")
        setSelectedDuration("30 min")
        setSelectedType("")
        setAppointmentNotes("")
    }

    const handleCreateAppointment = () => {
        const payload: AppointmentPayload = {
            patient_id: selectedPatientId,
            doctor_id: selectedDoctorId,
            appointment_date: initialDate || new Date().toISOString().split("T")[0],
            start_time: selectedTime,
            duration: selectedDuration,
            type: selectedType,
            notes: appointmentNotes,
        }
        createMutation.mutate(payload)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2 text-xl font-black">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                            </div>
                            {t("form.title")}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground pt-1">
                            {t("form.description")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-6">
                        {/* Patient Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <div className="w-1 h-4 bg-primary rounded-full" />
                                    {t("form.patientInfo")}
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowNewPatient(true)}
                                    className="text-primary border-primary/20 hover:bg-primary/5 rounded-lg font-bold"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    {t("form.newPatient")}
                                </Button>
                            </div>

                            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                <SelectTrigger className="bg-secondary/50 border-border h-12 rounded-xl">
                                    <SelectValue placeholder={t("form.selectPatient")} />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    {patients.map((patient: PatientSummary) => (
                                        <SelectItem key={patient.patient_id} value={patient.patient_id}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{patient.full_name}</span>
                                                <span className="text-muted-foreground text-xs opacity-60">#{patient.patient_code}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedPatientData && (
                                <Card className="bg-secondary/20 border-border rounded-xl border-dashed">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <UserIcon className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h4 className="font-black text-foreground truncate">{(selectedPatientData as PatientSummary).full_name}</h4>
                                                    <Badge className={(selectedPatientData as PatientSummary).is_active ? "bg-primary/10 text-primary border-0" : "bg-destructive/10 text-destructive border-0"}>
                                                        {(selectedPatientData as PatientSummary).is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3" />
                                                        {(selectedPatientData as PatientSummary).phone}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3" />
                                                        {(selectedPatientData as PatientSummary).email || "No email"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Appointment Details */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                {t("form.details")}
                            </Label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("form.doctor")}</Label>
                                    <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                                        <SelectTrigger className="bg-secondary/50 border-border h-12 rounded-xl">
                                            <SelectValue placeholder={t("form.selectDoctor")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {doctors.map((doctor: User) => (
                                                <SelectItem key={doctor.id} value={doctor.id}>
                                                    <div className="flex flex-col py-0.5">
                                                        <span className="font-bold">{doctor.full_name}</span>
                                                        <span className="text-[10px] text-muted-foreground opacity-70 uppercase tracking-tighter">{doctor.specialty || "Specialist"}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("form.type")}</Label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger className="bg-secondary/50 border-border h-12 rounded-xl">
                                            <SelectValue placeholder={t("form.selectType")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {appointmentTypes.map((type) => (
                                                <SelectItem key={type} value={type} className="font-medium">{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("form.timeSlot")}</Label>
                                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                                        <SelectTrigger className="bg-secondary/50 border-border h-12 rounded-xl">
                                            <SelectValue placeholder={t("form.selectTime")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {timeSlots.map((time) => (
                                                <SelectItem key={time} value={time}>
                                                    <div className="flex items-center gap-2 font-bold">
                                                        <Clock className="w-3 h-3 text-primary" />
                                                        {time}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("form.duration")}</Label>
                                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                        <SelectTrigger className="bg-secondary/50 border-border h-12 rounded-xl">
                                            <SelectValue placeholder={t("form.selectDuration")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {durations.map((duration) => (
                                                <SelectItem key={duration} value={duration} className="font-medium">{duration}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("form.notes")}</Label>
                                <Textarea
                                    placeholder={t("form.notesPlaceholder")}
                                    value={appointmentNotes}
                                    onChange={(e) => setAppointmentNotes(e.target.value)}
                                    className="bg-secondary/50 border-border resize-none rounded-xl focus:ring-primary/20"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 pt-4 border-t border-border/50">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onOpenChange(false)
                                resetAppointmentForm()
                            }}
                            className="rounded-xl font-bold"
                        >
                            {commonT("cancel")}
                        </Button>
                        <Button
                            onClick={handleCreateAppointment}
                            disabled={!selectedPatientId || !selectedDoctorId || !selectedTime || !selectedType || createMutation.isPending}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20 min-w-40"
                        >
                            {createMutation.isPending ? (
                                "..."
                            ) : (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    {t("form.create")}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Nested Patient Form */}
            <PatientForm
                open={showNewPatient}
                onClose={() => setShowNewPatient(false)}
            />
        </>
    )
}
