"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
import { z } from "zod"
import {
    User as UserIcon,
    UserPlus,
    Calendar as CalendarIcon,
    Phone,
    Mail,
    Check,
    Plus
} from "lucide-react"
import { useVisibility, useFormManager } from "@/hooks"

// Services
import { createAppointment } from "@/services/appointments"
import { fetchAllPatients } from "@/services/patients"
import { fetchAvailableDoctors, fetchDoctorScheduleForDay } from "@/services/doctors"

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
    DialogTrigger,
} from "@/components/ui/dialog"
import { SelectField } from "@/components/ui/select"
import { PatientForm } from "@/components/patients/PatientForm"

// Types
import { AppointmentPayload } from "@/types/appointments"
import { PatientSummary } from "@/types/patients"
import { DoctorSummary } from "@/types/doctors"

// ─── Constants ────────────────────────────────────────────────────────────────

const procedureTypes = [
    "Check-up",
    "Consultation",
    "Follow-up",
    "X-Ray Review",
    "Lab Results",
    "Surgery Prep",
    "Emergency",
    "Vaccination",
]

// duration label → minutes integer
const durations: { label: string; mins: number }[] = [
    { label: "15 min", mins: 15 },
    { label: "30 min", mins: 30 },
    { label: "45 min", mins: 45 },
    { label: "60 min", mins: 60 },
    { label: "90 min", mins: 90 },
]

/** Generates 30-min time slots between "HH:MM:SS" start and end times */
function buildTimeSlots(startTime: string, endTime: string): string[] {
    const toMins = (t: string) => {
        const [h, m] = t.split(":").map(Number)
        return h * 60 + m
    }
    const toLabel = (mins: number) => {
        const h24 = Math.floor(mins / 60)
        const m = mins % 60
        const period = h24 >= 12 ? "PM" : "AM"
        const h12 = h24 % 12 === 0 ? 12 : h24 % 12
        return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`
    }
    const slots: string[] = []
    for (let cur = toMins(startTime); cur < toMins(endTime); cur += 30) {
        slots.push(toLabel(cur))
    }
    return slots
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Combines a Date and a "09:30 AM" time string into a full ISO timestamp */
function buildTimestamp(date: Date, timeSlot: string): string {
    const [time, period] = timeSlot.split(" ")
    const [hStr, mStr] = time.split(":")
    let hours = parseInt(hStr, 10)
    const minutes = parseInt(mStr, 10)
    if (period === "PM" && hours !== 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0
    const dt = new Date(date)
    dt.setHours(hours, minutes, 0, 0)
    return dt.toISOString()
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const appointmentSchema = z.object({
    patient_id: z.string().min(1, "Please select a patient"),
    doctor_id: z.string().min(1, "Please select a doctor"),
    procedure_type: z.string().min(1, "Please select an appointment type"),
    start_time: z.string().min(1, "Please select a time slot"),
    duration_label: z.string().min(1, "Please select a duration"),
    notes: z.string().optional().or(z.literal("")),
})

// ─── Component ────────────────────────────────────────────────────────────────

export function AppointmentDialog({ initialDate }: { initialDate: Date }) {
    const queryClient = useQueryClient()
    const t = useTranslations("Appointments")
    const commonT = useTranslations("Common")

    const { visible, handleOpen, handleClose, handleStateChange } = useVisibility()
    const [showNewPatient, setShowNewPatient] = useState(false)

    const {
        formData,
        resetForm,
        handleToggle,
        validate,
        errors,
    } = useFormManager({
        initialData: {
            patient_id: "",
            doctor_id: "",
            procedure_type: "",
            start_time: "",
            duration_label: "30 min",
            notes: "",
        },
        schema: appointmentSchema,
    })

    const { patient_id, doctor_id, procedure_type, start_time, duration_label, notes } = formData

    const handleCloseForm = () => {
        handleClose()
        resetForm()
    }

    // ── Data fetching (only when dialog is open) ──────────────────────────────

    const { data: patients = [] } = useQuery<PatientSummary[]>({
        queryKey: ["patients"],
        queryFn: fetchAllPatients,
        enabled: visible,
    })

    // Uses fetchAvailableDoctors — returns doctors.id (not staff.id)
    const { data: doctors = [] } = useQuery<DoctorSummary[]>({
        queryKey: ["available-doctors"],
        queryFn: fetchAvailableDoctors,
        enabled: visible,
    })

    // Fetch the selected doctor's schedule for initialDate's day-of-week
    const { data: doctorSchedule } = useQuery({
        queryKey: ["doctor-schedule", doctor_id, initialDate.toDateString()],
        queryFn: () => fetchDoctorScheduleForDay(doctor_id, initialDate),
        enabled: visible && !!doctor_id,
    })

    const availableTimeSlots = useMemo(
        () => doctorSchedule
            ? buildTimeSlots(doctorSchedule.start_time, doctorSchedule.end_time)
            : [],
        [doctorSchedule]
    )

    const handleDoctorChange = (value: string) => {
        handleToggle("doctor_id")(value)
        handleToggle("start_time")("") // clear time slot when doctor changes
    }

    const selectedPatientData = useMemo(
        () => patients.find(p => p.patient_id === patient_id),
        [patients, patient_id]
    )

    // ── Mutation ──────────────────────────────────────────────────────────────

    const createMutation = useMutation({
        mutationFn: createAppointment,
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ["appointments"] })
                handleCloseForm()
            }
        }
    })

    const handleCreateAppointment = () => {
        if (!validate()) return

        const duration_mins = durations.find(d => d.label === duration_label)?.mins ?? 30

        const payload: AppointmentPayload = {
            patient_id,
            doctor_id,
            // Combines initialDate + selected time slot into a single TIMESTAMP
            appointment_date: buildTimestamp(initialDate, start_time),
            duration_mins,
            procedure_type,
            notes,
        }
        createMutation.mutate(payload)
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Dialog open={visible} onOpenChange={handleStateChange}>
                <DialogTrigger asChild>
                    <Button
                        onClick={handleOpen}
                        className="rounded-xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" /> {t("addAppointment")}
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-[60%] sm:max-w-[60%] w-[60%] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2 text-xl font-black">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                            </div>
                            {t("form.title")}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground pt-1">
                            {format(initialDate, "EEEE, MMMM d, yyyy")}
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

                            <SelectField
                                label={t("form.patientInfo")}
                                placeholder={t("form.selectPatient")}
                                name="patient_id"
                                value={patient_id}
                                onValueChange={handleToggle("patient_id")}
                                options={patients.map((p: PatientSummary) => ({
                                    key: p.patient_id,
                                    label: `${p.full_name} — ${p.patient_code}`,
                                }))}
                                showSearch
                                error={errors.patient_id}
                            />

                            {selectedPatientData && (
                                <Card className="bg-secondary/20 border-border rounded-xl border-dashed">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <UserIcon className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h4 className="font-black text-foreground truncate">{selectedPatientData.full_name}</h4>
                                                    <Badge className={selectedPatientData.is_active ? "bg-primary/10 text-primary border-0" : "bg-destructive/10 text-destructive border-0"}>
                                                        {selectedPatientData.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3" />
                                                        {selectedPatientData.phone}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3" />
                                                        {selectedPatientData.email || "No email"}
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
                                <SelectField
                                    label={t("form.doctor")}
                                    placeholder={t("form.selectDoctor")}
                                    name="doctor_id"
                                    value={doctor_id}
                                    onValueChange={handleDoctorChange}
                                    options={doctors.map((d: DoctorSummary) => ({
                                        key: d.id, // doctors.id — correct FK for appointments.doctor_id
                                        label: `${d.name}${d.en ? ` — ${d.en}` : ""}`,
                                    }))}
                                    showSearch
                                    error={errors.doctor_id}
                                    className="bg-secondary/50 border-border h-12 rounded-xl"
                                />

                                <SelectField
                                    label={t("form.type")}
                                    placeholder={t("form.selectType")}
                                    name="procedure_type"
                                    value={procedure_type}
                                    onValueChange={handleToggle("procedure_type")}
                                    options={procedureTypes.map(pt => ({ key: pt, label: pt }))}
                                    error={errors.procedure_type}
                                    className="bg-secondary/50 border-border h-12 rounded-xl"
                                />

                                <SelectField
                                    label={t("form.timeSlot")}
                                    placeholder={
                                        !doctor_id
                                            ? t("form.selectDoctorFirst")
                                            : availableTimeSlots.length === 0
                                                ? t("form.noSlotsAvailable")
                                                : t("form.selectTime")
                                    }
                                    name="start_time"
                                    value={start_time}
                                    onValueChange={handleToggle("start_time")}
                                    options={availableTimeSlots.map(ts => ({ key: ts, label: ts }))}
                                    disabled={!doctor_id || availableTimeSlots.length === 0}
                                    error={errors.start_time}
                                    className="bg-secondary/50 border-border h-12 rounded-xl"
                                />

                                <SelectField
                                    label={t("form.duration")}
                                    placeholder={t("form.selectDuration")}
                                    name="duration_label"
                                    value={duration_label}
                                    onValueChange={handleToggle("duration_label")}
                                    options={durations.map(d => ({ key: d.label, label: d.label }))}
                                    error={errors.duration_label}
                                    className="bg-secondary/50 border-border h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">{t("form.notes")}</Label>
                                <Textarea
                                    placeholder={t("form.notesPlaceholder")}
                                    value={notes}
                                    onChange={(e) => handleToggle("notes")(e.target.value)}
                                    className="bg-secondary/50 border-border resize-none rounded-xl focus:ring-primary/20"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 pt-4 border-t border-border/50">
                        <Button
                            variant="ghost"
                            onClick={handleCloseForm}
                            className="rounded-xl font-bold"
                        >
                            {commonT("cancel")}
                        </Button>
                        <Button
                            onClick={handleCreateAppointment}
                            disabled={createMutation.isPending}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20 min-w-40"
                        >
                            {createMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                                    {commonT("saving")}
                                </span>
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

            {/* New Patient Form — opens without closing the appointment dialog */}
            <PatientForm
                open={showNewPatient}
                onClose={() => setShowNewPatient(false)}
            />
        </>
    )
}
