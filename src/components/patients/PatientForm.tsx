"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { SelectField } from "@/components/ui/select"
import {
    UserPlus,
    Phone,
    CreditCard,
    Check,
    X,
    ChevronRight,
    ChevronLeft
} from "lucide-react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { PatientSummary } from "@/types/patients"
import { useFormManager } from "@/hooks"
import { DatePicker } from "@/components/ui/Date"
import { getGenderList } from "@/constants/gender"
import Textarea from "@/components/ui/textarea"
import { patientFormSchema } from "@/validation/patients"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createPatient, updatePatient } from "@/services/patients"
import { getInsuranceProviders } from "@/services/finance"
import { toast } from "sonner"

interface AddPatientModuleProps {
    open: boolean
    onClose: () => void;
    selectedPatient?: PatientSummary
    onNewPatient?: (patientId: string) => void
}

function calculateAge(dob: Date): number {
    if (!dob) return 0
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
}

type Step = "personal" | "contact" | "insurance"
const steps: Step[] = ["personal", "contact", "insurance"]

export function PatientForm({ open, onClose, selectedPatient, onNewPatient }: AddPatientModuleProps) {
    const t = useTranslations("Patients.form")
    const [step, setStep] = useState<Step>("personal")

    const queryClient = useQueryClient()

    const { data: insuranceProviders = [] } = useQuery({
        queryKey: ["insurance-providers"],
        queryFn: getInsuranceProviders,
        staleTime: 60_000,
    })

    const insuranceOptions = insuranceProviders.map((p) => ({ key: p.id, label: p.name }))

    const { mutate, isPending: loading } = useMutation({
        mutationFn: () =>
            selectedPatient ? updatePatient(selectedPatient.patient_id, formData) : createPatient(formData),
        onSuccess: (res) => {
            if (!res || !res.success) {
                return toast.error(t("error"))
            }
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            if (!selectedPatient && res.patient_id) {
                onNewPatient?.(res.patient_id)
            }
            resetForm()
            onClose()
            toast.success(t("success"))
        },
        onError: () => toast.error(t("error"))
    })


    const {
        formData,
        handleChange,
        handleChangeMultiInputs,
        resetForm,
        handleToggle,
        validate,
        errors
    } = useFormManager({
        initialData: {
            full_name: "",
            gender: undefined,
            dob: undefined,
            age: 0,
            phone: "",
            email: "",
            address: "",
            emergency_contact_name: "",
            emergency_contact_phone: "",
            insurance_company_id: "",
            insurance_number: "",
            notes: "",
            ...selectedPatient
        },
        schema: patientFormSchema
    })

    const handleDobChange = (dob: Date) => {
        const age = calculateAge(dob)
        handleChangeMultiInputs({
            dob,
            age
        })
    }

    const handleAgeChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

        const age = event.target.value

        const digits = parseInt(age.replace(/\D/g, ""), 10)
        if (age === "") {
            handleChangeMultiInputs({
                age: 0,
                dob: ""
            })
            return
        }

        if (isNaN(+age) || +age < 0 || +age > 130) {
            return
        }
        const birthYear = new Date().getFullYear() - digits
        const dob = `${birthYear}-01-01`
        handleChangeMultiInputs({
            age: digits,
            dob: new Date(dob)
        })
    }

    const isContactValid = formData.phone.trim() !== ""
    const isFormSaveable = isContactValid

    const handleClose = () => {
        onClose();
        resetForm()
        setStep("personal")
    }

    const handleSave = () => {
        if (!validate()) return
        mutate()
    }

    const currentIndex = steps.indexOf(step)

    const isPersonalValid = !!formData.full_name && !!formData.age && !!formData.gender

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl border shadow-lg bg-background max-h-[85vh] flex flex-col">
                <div className="relative flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                        <div>
                            <DialogTitle className="text-lg font-bold tracking-tight">
                                {t("registerTitle")}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {t("registerDesc")}
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="rounded-full cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide min-h-0">
                        {/* Step indicator */}
                        <div className="flex items-center justify-between p-1.5 bg-accent/30 rounded-2xl">
                            {steps.map((s, i) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        if (i <= currentIndex || (i === 1 && isPersonalValid)) setStep(s)
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${step === s
                                        ? "bg-background shadow-lg text-primary scale-105"
                                        : i < currentIndex
                                            ? "text-primary/60 hover:text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === s ? "border-primary bg-primary text-primary-foreground" :
                                        i < currentIndex ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary"
                                        }`}>
                                        {i < currentIndex ? <Check className="w-3 h-3" /> : i + 1}
                                    </span>
                                    <span className="hidden sm:inline text-xs uppercase tracking-widest font-black">
                                        {t(`steps.${s}`)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="min-h-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {step === "personal" && (
                                        <div className="space-y-6">
                                            <SectionHeader
                                                icon={<UserPlus className="w-5 h-5 text-primary" />}
                                                title={t("sections.personalInfo")}
                                                subtitle={t("sections.personalDesc")}
                                            />
                                            <div className="grid grid-cols-2 gap-6">
                                                <Input
                                                    label={t("fields.name")}
                                                    placeholder={t("placeholders.name")}
                                                    value={formData.full_name}
                                                    onChange={handleChange}
                                                    name="full_name"
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-6">
                                                <DatePicker
                                                    value={formData.dob as Date}
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    label={t("fields.dob")}
                                                    onDateChange={handleDobChange}
                                                />
                                                <Input
                                                    label={t("fields.age")}
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder={t("placeholders.age")}
                                                    value={formData.age}
                                                    name="age"
                                                    onChange={handleAgeChange}
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    maxLength={3}
                                                    error={errors.age}
                                                />
                                                <SelectField
                                                    options={getGenderList(t)}
                                                    label={t("fields.gender")}
                                                    placeholder={t("placeholders.selectGender")}
                                                    onValueChange={handleToggle("gender")}
                                                    name="gender"
                                                    value={formData.gender}
                                                    hideClear
                                                    className="rounded-2xl h-12 data-[size=default]:h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    error={errors.gender}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {step === "contact" && (
                                        <div className="space-y-6">
                                            <SectionHeader
                                                icon={<Phone className="w-5 h-5 text-primary" />}
                                                title={t("sections.contactDetails")}
                                                subtitle={t("sections.contactDesc")}
                                            />
                                            <div className="grid grid-cols-2 gap-6">
                                                <Input
                                                    label={t("fields.phone")}
                                                    placeholder={t("placeholders.phone")}
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    name="phone"
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    error={errors.phone}
                                                />
                                                <Input
                                                    label={t("fields.email")}
                                                    placeholder={t("placeholders.email")}
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    name="email"
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    error={errors.email}
                                                />
                                            </div>
                                            <Textarea
                                                label={t("fields.address")}
                                                placeholder={t("placeholders.address")}
                                                value={formData.address}
                                                onChange={handleChange}
                                                name="address"
                                                className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                error={errors.address}
                                            />
                                            <div className="grid grid-cols-2 gap-6">
                                                <Input
                                                    label={t("fields.emergencyContact")}
                                                    placeholder={t("placeholders.emergencyContact")}
                                                    value={formData.emergency_contact_name}
                                                    onChange={handleChange}
                                                    name="emergency_contact_name"
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    error={errors.emergency_contact_name}
                                                />
                                                <Input
                                                    label={t("fields.phone") + t("fields.emergencyContact")}
                                                    placeholder={t("placeholders.phone") + t("placeholders.emergencyContact")}
                                                    value={formData.emergency_contact_phone}
                                                    onChange={handleChange}
                                                    name="emergency_contact_phone"
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    error={errors.emergency_contact_phone}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {step === "insurance" && (
                                        <div className="space-y-6">
                                            <SectionHeader
                                                icon={<CreditCard className="w-5 h-5 text-primary" />}
                                                title={t("sections.insuranceDetails")}
                                                subtitle={t("sections.insuranceDesc")}
                                            />
                                            <div className="grid grid-cols-2 gap-6">
                                                <SelectField
                                                    label={t("fields.insuranceProvider")}
                                                    placeholder={t("placeholders.insuranceProvider")}
                                                    options={insuranceOptions}
                                                    value={formData.insurance_company_id}
                                                    onValueChange={handleToggle("insurance_company_id")}
                                                    name="insurance_company_id"
                                                    showSearch
                                                    className="rounded-2xl h-12 data-[size=default]:h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    error={errors.insurance_company_id}
                                                />
                                                <Input
                                                    label={t("fields.policyNumber")}
                                                    placeholder={t("placeholders.policyNumber")}
                                                    value={formData.insurance_number}
                                                    onChange={handleChange}
                                                    name="insurance_number"
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    error={errors.insurance_number}
                                                />
                                            </div>
                                            <Textarea
                                                label={t("fields.notes")}
                                                placeholder={t("placeholders.notes")}
                                                value={formData.notes}
                                                onChange={handleChange}
                                                name="notes"
                                                className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                error={errors.notes}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3 pt-4 border-t border-border/40 bg-background relative z-10">
                            {currentIndex > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(steps[currentIndex - 1])}
                                    className="flex-1 h-10 rounded-xl font-bold uppercase tracking-widest text-xs border-border/50 hover:bg-accent transition-all gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" /> {t("buttons.back")}
                                </Button>
                            )}
                            {currentIndex < steps.length - 1 ? (
                                <Button
                                    type="button"
                                    disabled={currentIndex === 0 ? !formData.full_name : currentIndex === 1 ? !isContactValid : false}
                                    onClick={() => setStep(steps[currentIndex + 1])}
                                    className="flex-1 h-10 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-[1.02]"
                                >
                                    {t("buttons.next")} <ChevronRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!isFormSaveable || loading}
                                    className="flex-1 h-10 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-[1.02]"
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                                            {t("buttons.saving")}
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            {t("buttons.register")}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                {icon}
            </div>
            <div>
                <h4 className="font-black text-lg tracking-tight">{title}</h4>
                <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
            </div>
        </div>
    )
}
