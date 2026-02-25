"use client"

import * as React from "react"
import { z } from "zod"
import {
    X,
    User,
    Stethoscope,
    DollarSign,
    Briefcase,
    Camera,
    Save,
    Loader2,
    Activity,
    Plus
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import useFormManager from "@/hooks/useFormManager"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define the schema for validation


export type DoctorFormData = {
    name: string;
    specialty: string;
    fee: number;
    status: string;
    image?: string;
    exp: number;
    schedule: {
        day: string;
        startTime: string;
        endTime: string;
        active: boolean;
    }[];
}

interface DoctorFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: DoctorFormData) => void
    initialData?: Partial<DoctorFormData>
    mode: "add" | "edit"
}

export function DoctorForm({ isOpen, onClose, onSubmit, initialData, mode }: DoctorFormProps) {
    const defaultSchedule = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    ].map(day => ({ day, startTime: "09:00", endTime: "17:00", active: true }))

    const defaultData: DoctorFormData = {
        name: "",
        specialty: "",
        fee: 0,
        status: "Available",
        image: "",
        exp: 0,
        schedule: defaultSchedule,
        ...initialData
    }

    const t = useTranslations("Doctors")
    const tc = useTranslations("Common")

    const doctorSchema = z.object({
        name: z.string().min(2, t("form.validation.nameRequired")),
        specialty: z.string().min(1, t("form.validation.specialtyRequired")),
        fee: z.number().min(0, t("form.validation.feePositive")),
        status: z.string(),
        image: z.string().url(t("form.validation.invalidUrl")).optional().or(z.literal("")),
        exp: z.number().min(0, t("form.validation.expPositive")),
        schedule: z.array(z.object({
            day: z.string(),
            startTime: z.string(),
            endTime: z.string(),
            active: z.boolean(),
        }))
    })

    const {
        formData,
        handleChange,
        handleFieldChange,
        validate,
        errors,
        resetForm
    } = useFormManager<DoctorFormData>({
        initialData: defaultData,
        schema: doctorSchema
    })
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Reset form when initialData changes or modal opens
    React.useEffect(() => {
        if (isOpen) {
            // Merge initialData with default behavior
            const mergedData = {
                ...defaultData,
                ...initialData
            }
            Object.entries(mergedData).forEach(([key, value]) => {
                handleFieldChange({ name: key, value })
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (validate()) {
            setIsSubmitting(true)
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800))
            onSubmit(formData)
            setIsSubmitting(false)
            onClose()
            resetForm()
        }
    }

    const specializations = [
        "generaldentistry",
        "orthodontics",
        "radiology",
        "periodontics",
        "oralsurgery",
        "endodontics",
        "pediatricdentistry"
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                <div className="bg-background relative">
                    {/* Header with Gradient Background */}
                    <div className="h-32 bg-linear-to-br from-primary/10 via-accent/5 to-background border-b border-border/40 relative overflow-hidden">
                        <div className="absolute top-0 inset-e-0 p-8 opacity-10">
                            <Stethoscope className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="p-8 pb-0 flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight mb-1">
                                    {mode === "add" ? t("form.registerTitle") : t("form.editTitle")}
                                </DialogTitle>
                                <DialogDescription className="font-medium text-muted-foreground">
                                    {mode === "add"
                                        ? t("form.registerDesc")
                                        : t("form.editDesc")
                                    }
                                </DialogDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full hover:bg-background/80 shadow-xs"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 pb-4">
                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="bg-accent/30 p-1.5 rounded-2xl h-14 mb-8 grid grid-cols-2">
                                <TabsTrigger value="profile" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">{t("form.profileTab")}</TabsTrigger>
                                <TabsTrigger value="availability" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">{t("form.availabilityTab")}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="space-y-8 mt-0 focus-visible:outline-none">
                                {/* Avatar / Profile Section */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 rounded-3xl border-4 border-background shadow-xl">
                                            <AvatarImage src={formData.image} />
                                            <AvatarFallback className="bg-accent text-2xl font-black">
                                                {formData.name ? formData.name.charAt(0) : <Camera className="w-8 h-8 opacity-20" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="text-white w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1">{t("form.avatarUrl")}</Label>
                                        <Input
                                            name="image"
                                            value={formData.image}
                                            onChange={handleChange}
                                            placeholder={t("form.placeholders.avatarUrl")}
                                            className={`rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.image ? 'ring-2 ring-destructive' : ''}`}
                                        />
                                        {errors.image && <p className="text-[10px] text-destructive font-bold px-1">{errors.image}</p>}
                                    </div>
                                </div>

                                {/* Basic Info Grid */}
                                <div className="grid grid-cols-2 gap-6 focus-visible:outline-none">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                            <User className="w-3 h-3" /> {t("form.fullName")}
                                        </Label>
                                        <Input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder={t("form.placeholders.fullName")}
                                            className={`rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.name ? 'ring-2 ring-destructive' : ''}`}
                                        />
                                        {errors.name && <p className="text-[10px] text-destructive font-bold px-1">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                            <Stethoscope className="w-3 h-3" /> {t("form.specialty")}
                                        </Label>
                                        <Select
                                            value={formData.specialty}
                                            onValueChange={(val) => handleFieldChange({ name: "specialty", value: val })}
                                        >
                                            <SelectTrigger className={`rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.specialty ? 'ring-2 ring-destructive' : ''}`}>
                                                <SelectValue placeholder={t("form.selectSpecialty")} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                                                {specializations.map(spec => (
                                                    <SelectItem key={spec} value={spec} className="rounded-xl focus:bg-primary/10">
                                                        {t(`specializations.${spec.toLowerCase().replace(/\s+/g, '')}`)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.specialty && <p className="text-[10px] text-destructive font-bold px-1">{errors.specialty}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                            <DollarSign className="w-3 h-3" /> {t("form.consultationFee")}
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute inset-s-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground/60">{tc("currency")}</span>
                                            <Input
                                                type="number"
                                                name="fee"
                                                value={formData.fee}
                                                onChange={handleChange}
                                                className={`rounded-2xl h-12 bg-accent/30 border-none ps-8 transition-all focus:ring-2 focus:ring-primary/20 ${errors.fee ? 'ring-2 ring-destructive' : ''}`}
                                            />
                                        </div>
                                        {errors.fee && <p className="text-[10px] text-destructive font-bold px-1">{errors.fee}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" /> {t("form.yearsExp")}
                                        </Label>
                                        <Input
                                            type="number"
                                            name="exp"
                                            value={formData.exp}
                                            onChange={handleChange}
                                            className={`rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.exp ? 'ring-2 ring-destructive' : ''}`}
                                        />
                                        {errors.exp && <p className="text-[10px] text-destructive font-bold px-1">{errors.exp}</p>}
                                    </div>
                                </div>

                                {/* Status Section */}
                                <div className="space-y-3">
                                    <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                        <Activity className="w-3 h-3" /> {t("form.availabilityStatus")}
                                    </Label>
                                    <div className="flex gap-2">
                                        {["Available", "On Break", "Away"].map((status) => (
                                            <Button
                                                key={status}
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleFieldChange({ name: "status", value: status })}
                                                className={`flex-1 rounded-2xl h-12 font-bold transition-all ${formData.status === status
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-accent/30 border-none hover:bg-accent/50'
                                                    }`}
                                            >
                                                {t(status.toLowerCase().replace(/\s+/g, ''))}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="availability" className="mt-0 focus-visible:outline-none">
                                <div className="mb-4">
                                    <p className="text-sm font-bold text-muted-foreground px-1 mb-6 flex items-center gap-2">
                                        {t("form.scheduleDesc")}
                                    </p>

                                    <ScrollArea className="h-[380px] pe-4 -me-4">
                                        <div className="space-y-4 pb-4">
                                            {formData.schedule.map((slot, index) => (
                                                <div
                                                    key={slot.day}
                                                    className={`p-5 rounded-[2rem] border transition-all ${slot.active
                                                        ? 'bg-background border-primary/20 shadow-xl shadow-primary/5'
                                                        : 'bg-accent/10 border-border/40 opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${slot.active ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-muted-foreground/30'}`} />
                                                            <h5 className="font-black text-lg">{t(`days.${slot.day}`)}</h5>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant={slot.active ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => {
                                                                const newSchedule = [...formData.schedule]
                                                                newSchedule[index].active = !newSchedule[index].active
                                                                handleFieldChange({ name: "schedule", value: newSchedule })
                                                            }}
                                                            className={`rounded-xl px-4 h-9 font-bold transition-all ${!slot.active ? 'text-[10px] uppercase tracking-wider' : ''
                                                                }`}
                                                        >
                                                            {slot.active ? t("form.active") : t("form.inactive")}
                                                        </Button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {slot.active && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden grid grid-cols-2 gap-4"
                                                            >
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1 ms-1">{t("form.startTime")}</Label>
                                                                    <Input
                                                                        type="time"
                                                                        value={slot.startTime}
                                                                        onChange={(e) => {
                                                                            const newSchedule = [...formData.schedule]
                                                                            newSchedule[index].startTime = e.target.value
                                                                            handleFieldChange({ name: "schedule", value: newSchedule })
                                                                        }}
                                                                        className="rounded-xl h-11 bg-accent/20 border-none focus:ring-1 focus:ring-primary/20"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground/60 px-1 ms-1">{t("form.endTime")}</Label>
                                                                    <Input
                                                                        type="time"
                                                                        value={slot.endTime}
                                                                        onChange={(e) => {
                                                                            const newSchedule = [...formData.schedule]
                                                                            newSchedule[index].endTime = e.target.value
                                                                            handleFieldChange({ name: "schedule", value: newSchedule })
                                                                        }}
                                                                        className="rounded-xl h-11 bg-accent/20 border-none focus:ring-1 focus:ring-primary/20"
                                                                    />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}

                                            {/* Weekend Days Adder */}
                                            {!formData.schedule.find(s => s.day === "Saturday") && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const newSchedule = [...formData.schedule,
                                                        { day: "Saturday", startTime: "10:00", endTime: "14:00", active: false },
                                                        { day: "Sunday", startTime: "10:00", endTime: "14:00", active: false }
                                                        ]
                                                        handleFieldChange({ name: "schedule", value: newSchedule })
                                                    }}
                                                    className="w-full h-12 rounded-2xl border-dashed border-2 hover:bg-accent/30 font-bold gap-2 opacity-60 hover:opacity-100 transition-all"
                                                >
                                                    <Plus className="w-4 h-4" /> {t("form.includeWeekend")}
                                                </Button>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Submit Actions */}
                        <div className="flex gap-4 pt-4 mt-4 relative z-10 bg-background">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-xs border-border/50 hover:bg-accent transition-all"
                            >
                                {tc("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-[1.02]"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {mode === "add" ? t("form.registerButton") : t("form.updateButton")}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
