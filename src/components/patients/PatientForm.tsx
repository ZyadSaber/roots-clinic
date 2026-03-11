"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    UserPlus,
    Phone,
    Heart,
    AlertCircle,
    CreditCard,
    Check,
    X,
    ChevronRight,
    ChevronLeft
} from "lucide-react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"

const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    ageInput: "",
    gender: "",
    address: "",
    emergencyContact: "",
    bloodType: "",
    allergies: "",
    condition: "",
    insuranceProvider: "",
    insuranceNumber: "",
}

interface AddPatientModuleProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onPatientCreated?: (patient: typeof emptyForm) => void
}

function calculateAge(dob: string): number {
    if (!dob) return 0
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
}

type Step = "personal" | "contact" | "medical" | "insurance"
const steps: Step[] = ["personal", "contact", "medical", "insurance"]

export function PatientForm({ open, onOpenChange, onPatientCreated }: AddPatientModuleProps) {
    const t = useTranslations("Patients.form")
    const [formData, setFormData] = useState({ ...emptyForm })
    const [step, setStep] = useState<Step>("personal")
    const [saving, setSaving] = useState(false)

    const set = (field: string, value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }))

    const handleDobChange = (dob: string) => {
        const age = calculateAge(dob)
        setFormData((prev) => ({
            ...prev,
            dateOfBirth: dob,
            ageInput: dob ? String(age) : "",
        }))
    }

    const handleAgeChange = (raw: string) => {
        const digits = raw.replace(/\D/g, "")
        if (digits === "") {
            setFormData((prev) => ({ ...prev, ageInput: "", dateOfBirth: "" }))
            return
        }
        const age = parseInt(digits, 10)
        if (isNaN(age) || age < 0 || age > 130) {
            setFormData((prev) => ({ ...prev, ageInput: digits }))
            return
        }
        const birthYear = new Date().getFullYear() - age
        const dob = `${birthYear}-01-01`
        setFormData((prev) => ({ ...prev, ageInput: digits, dateOfBirth: dob }))
    }

    const isPersonalValid = formData.firstName.trim() !== "" && formData.lastName.trim() !== ""
    const isContactValid = formData.phone.trim() !== ""
    const isFormSaveable = isPersonalValid && isContactValid

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(() => {
            setFormData({ ...emptyForm })
            setStep("personal")
        }, 300)
    }

    const handleSave = () => {
        if (!isFormSaveable) return
        setSaving(true)
        // Simulate save
        setTimeout(() => {
            setSaving(false)
            onPatientCreated?.({ ...formData })
            handleClose()
        }, 1000)
    }

    const currentIndex = steps.indexOf(step)

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background max-h-[85vh] flex flex-col">
                <div className="relative">
                    {/* Header with Gradient Background */}
                    <div className="h-32 bg-linear-to-br from-primary/10 via-accent/5 to-background border-b border-border/40 relative overflow-hidden p-8">
                        <div className="absolute top-0 inset-e-0 p-8 opacity-10">
                            <UserPlus className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight mb-1">
                                    {t("registerTitle")}
                                </DialogTitle>
                                <DialogDescription className="font-medium text-muted-foreground">
                                    {t("registerDesc")}
                                </DialogDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClose}
                                className="rounded-full hover:bg-background/80 shadow-xs cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
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
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.firstName")}</Label>
                                                    <Input
                                                        placeholder={t("placeholders.firstName")}
                                                        value={formData.firstName}
                                                        onChange={(e) => set("firstName", e.target.value)}
                                                        className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.lastName")}</Label>
                                                    <Input
                                                        placeholder={t("placeholders.lastName")}
                                                        value={formData.lastName}
                                                        onChange={(e) => set("lastName", e.target.value)}
                                                        className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-2 col-span-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.dob")}</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.dateOfBirth}
                                                        onChange={(e) => handleDobChange(e.target.value)}
                                                        className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.age")}</Label>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder={t("placeholders.age")}
                                                        value={formData.ageInput}
                                                        onChange={(e) => handleAgeChange(e.target.value)}
                                                        className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                        maxLength={3}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.gender")}</Label>
                                                <Select value={formData.gender} onValueChange={(v) => set("gender", v)}>
                                                    <SelectTrigger className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20">
                                                        <SelectValue placeholder={t("placeholders.selectGender")} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                                                        <SelectItem value="Male">{t("genders.male")}</SelectItem>
                                                        <SelectItem value="Female">{t("genders.female")}</SelectItem>
                                                        <SelectItem value="Non-binary">{t("genders.nonBinary")}</SelectItem>
                                                        <SelectItem value="Prefer not to say">{t("genders.notSpecified")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.phone")}</Label>
                                                    <Input
                                                        placeholder={t("placeholders.phone")}
                                                        value={formData.phone}
                                                        onChange={(e) => set("phone", e.target.value)}
                                                        className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.email")}</Label>
                                                    <Input
                                                        type="email"
                                                        placeholder={t("placeholders.email")}
                                                        value={formData.email}
                                                        onChange={(e) => set("email", e.target.value)}
                                                        className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.address")}</Label>
                                                <Textarea
                                                    placeholder={t("placeholders.address")}
                                                    value={formData.address}
                                                    onChange={(e) => set("address", e.target.value)}
                                                    className="rounded-2xl bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.emergencyContact")}</Label>
                                                <Input
                                                    placeholder={t("placeholders.emergencyContact")}
                                                    value={formData.emergencyContact}
                                                    onChange={(e) => set("emergencyContact", e.target.value)}
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {step === "medical" && (
                                        <div className="space-y-6">
                                            <SectionHeader
                                                icon={<Heart className="w-5 h-5 text-primary" />}
                                                title={t("sections.medicalInfo")}
                                                subtitle={t("sections.medicalDesc")}
                                            />
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.bloodType")}</Label>
                                                    <Select value={formData.bloodType} onValueChange={(v) => set("bloodType", v)}>
                                                        <SelectTrigger className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20">
                                                            <SelectValue placeholder={t("placeholders.selectBlood")} />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                                                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                                                                <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.condition")}</Label>
                                                    <Input
                                                        placeholder={t("placeholders.condition")}
                                                        value={formData.condition}
                                                        onChange={(e) => set("condition", e.target.value)}
                                                        className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.allergies")}</Label>
                                                <Textarea
                                                    placeholder={t("placeholders.allergies")}
                                                    value={formData.allergies}
                                                    onChange={(e) => set("allergies", e.target.value)}
                                                    className="rounded-2xl bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                                                    rows={4}
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
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.insuranceProvider")}</Label>
                                                <Input
                                                    placeholder={t("placeholders.insuranceProvider")}
                                                    value={formData.insuranceProvider}
                                                    onChange={(e) => set("insuranceProvider", e.target.value)}
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1">{t("fields.policyNumber")}</Label>
                                                <Input
                                                    placeholder={t("placeholders.policyNumber")}
                                                    value={formData.insuranceNumber}
                                                    onChange={(e) => set("insuranceNumber", e.target.value)}
                                                    className="rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            {isPersonalValid && (
                                                <Card className="rounded-[2rem] bg-linear-to-br from-primary/5 to-accent/5 border border-primary/10 shadow-lg shadow-black/5 mt-4">
                                                    <CardContent className="p-6 space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <AlertCircle className="w-4 h-4 text-primary" />
                                                            <p className="text-xs font-black uppercase tracking-widest text-primary">
                                                                {t("summary")}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                                            <SummaryRow label={t("fields.firstName")} value={`${formData.firstName} ${formData.lastName}`} />
                                                            {formData.ageInput && <SummaryRow label={t("fields.age")} value={`${formData.ageInput}`} />}
                                                            {formData.gender && <SummaryRow label={t("fields.gender")} value={formData.gender} />}
                                                            {formData.phone && <SummaryRow label={t("fields.phone")} value={formData.phone} />}
                                                            {formData.bloodType && <SummaryRow label={t("fields.bloodType")} value={formData.bloodType} />}
                                                            {formData.condition && <SummaryRow label={t("fields.condition")} value={formData.condition} />}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-4 pt-4 border-t border-border/40 bg-background relative z-10">
                            {currentIndex > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(steps[currentIndex - 1])}
                                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-border/50 hover:bg-accent transition-all gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" /> {t("buttons.back")}
                                </Button>
                            )}
                            {currentIndex < steps.length - 1 ? (
                                <Button
                                    type="button"
                                    disabled={currentIndex === 0 ? !isPersonalValid : currentIndex === 1 ? !isContactValid : false}
                                    onClick={() => setStep(steps[currentIndex + 1])}
                                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-[1.02]"
                                >
                                    {t("buttons.next")} <ChevronRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!isFormSaveable || saving}
                                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-[1.02]"
                                >
                                    {saving ? (
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

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider ltr:text-left rtl:text-right">{label}</span>
            <span className="text-foreground font-bold truncate ltr:text-left rtl:text-right">{value}</span>
        </div>
    )
}
