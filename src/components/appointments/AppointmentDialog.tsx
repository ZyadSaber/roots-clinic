"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { User as UserIcon, UserPlus, Calendar as CalendarIcon, Phone, Mail, Check, Plus } from "lucide-react"
import { useVisibility, useFormManager } from "@/hooks"
import { createAppointment } from "@/services/appointments"
import { fetchAllPatients } from "@/services/patients"
import { fetchDoctorsWithScheduleForDay } from "@/services/doctors"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import Textarea from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { SelectField } from "@/components/ui/select"
import { PatientForm } from "@/components/patients/PatientForm"
import { appointmentSchema } from "@/validation/appointments"
import { buildTimeSlots, buildTimestamp } from "@/lib/timeSlots"
import { AppointmentPayload } from "@/types/appointments"
import { PatientSummary } from "@/types/patients"
import { DoctorWithSchedule } from "@/types/doctors"

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

const durations: { label: string; mins: number }[] = [
    { label: "15 min", mins: 15 },
    { label: "30 min", mins: 30 },
    { label: "45 min", mins: 45 },
    { label: "60 min", mins: 60 },
    { label: "90 min", mins: 90 },
]

export function AppointmentDialog({ initialDate }: { initialDate: Date }) {
    const queryClient = useQueryClient()
    const t = useTranslations("Appointments")
    const commonT = useTranslations("Common")
    const locale = useLocale()

    const { visible, handleOpen, handleClose, handleStateChange } = useVisibility()
    const [showNewPatient, setShowNewPatient] = useState(false)

    const { formData, resetForm, handleToggle, handleFieldChange, handleChangeMultiInputs, validate, errors } = useFormManager({
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

    const { data: patients = [] } = useQuery<PatientSummary[]>({
        queryKey: ["patients"],
        queryFn: fetchAllPatients,
        enabled: visible,
    })

    const { data: rawDoctors = [] } = useQuery<DoctorWithSchedule[]>({
        queryKey: ["doctors-with-schedule", initialDate.toDateString()],
        queryFn: () => fetchDoctorsWithScheduleForDay(initialDate),
        enabled: visible,
    })

    const doctorOptions = useMemo(
        () => rawDoctors.map(d => ({
            key: d.id,
            label: locale === "ar" ? (d.ar || d.name) : d.name,
            schedule: buildTimeSlots(d.start_time, d.end_time),
        })),
        [rawDoctors, locale]
    )

    const availableTimeSlots = useMemo(
        () => doctorOptions.find(d => d.key === doctor_id)?.schedule ?? [],
        [doctorOptions, doctor_id]
    )

    const selectedPatientData = useMemo(
        () => patients.find(p => p.patient_id === patient_id),
        [patients, patient_id]
    )

    const handleAddNewPatient = (patientId: string) => {
        handleFieldChange({ name: "patient_id", value: patientId })
        setShowNewPatient(false)
    }

    const handleDoctorChange = (value: string) => {
        handleChangeMultiInputs({ doctor_id: value, start_time: "" })
    }

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
            appointment_date: buildTimestamp(initialDate, start_time),
            duration_mins,
            procedure_type,
            notes,
        }
        createMutation.mutate(payload)
    }

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
                                    options={doctorOptions}
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

            <PatientForm
                open={showNewPatient}
                onClose={() => setShowNewPatient(false)}
                onNewPatient={handleAddNewPatient}
            />
        </>
    )
}
