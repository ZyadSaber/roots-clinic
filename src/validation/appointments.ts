import { z } from "zod"

export const appointmentSchema = z.object({
    patient_id: z.string().min(1, "Please select a patient"),
    doctor_id: z.string().min(1, "Please select a doctor"),
    procedure_type: z.string().min(1, "Please select an appointment type"),
    start_time: z.string().min(1, "Please select a time slot"),
    duration_label: z.string().min(1, "Please select a duration"),
    notes: z.string().optional().or(z.literal("")),
})
