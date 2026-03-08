"use client"

import { useEffect } from "react"
import { getDoctorSchema } from "@/validation/doctorSchema"
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
    Plus,
    Phone
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import useFormManager from "@/hooks/useFormManager"
import { useLocale, useTranslations } from "next-intl"
import { DOCTOR_STATUSES } from "@/constants/status"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Specialty, DoctorScheduleRecord } from "@/types/database"
import isArrayHasData from "@/lib/isArrayHasData"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DoctorSummary, DoctorFormData } from "@/types/doctors"
import { getDoctorSchedule } from "@/services/doctors"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { getLocalizedValue } from "@/lib/localize"
import days from "@/constants/days"
import { toast } from "sonner"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import { createDoctor, updateDoctor } from "@/services/doctors";

interface DoctorFormProps {
    visible: boolean
    onClose: () => void
    specializations: Specialty[]
    selectedDoctor?: DoctorSummary
}

export function DoctorForm({ visible, onClose, selectedDoctor, specializations }: DoctorFormProps) {
    const locale = useLocale()

    const queryClient = useQueryClient()
    const { data: doctorSchedule = [] } = useQuery({
        queryKey: ['doctorSchedule', selectedDoctor?.id],
        queryFn: () => getDoctorSchedule(selectedDoctor!.id),
        enabled: !!selectedDoctor?.id && visible,
        staleTime: 1000 * 60 * 5,
    });

    const computedSchedule = useMemo(() => {
        const defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

        if (!isArrayHasData(doctorSchedule)) {
            return defaultDays.map(day => ({ day, startTime: "09:00", endTime: "17:00", active: true }));
        }

        const hasWeekend = doctorSchedule.some((s: DoctorScheduleRecord) => s.day_of_week === 0 || s.day_of_week === 6);
        const daysToMap = hasWeekend
            ? days.map(d => d.en)
            : defaultDays;

        return daysToMap.map(dayName => {
            const dayIndex = days.find(d => d.en === dayName)?.id ?? 0;
            const foundSlot = doctorSchedule.find((slot: DoctorScheduleRecord) => slot.day_of_week === dayIndex);

            if (foundSlot) {
                return {
                    day: dayName,
                    startTime: foundSlot.start_time.substring(0, 5),
                    endTime: foundSlot.end_time.substring(0, 5),
                    active: foundSlot.is_active
                };
            }

            return {
                day: dayName,
                startTime: "09:00",
                endTime: "17:00",
                active: false
            };
        });
    }, [doctorSchedule]);

    const computedSpecialtyList = useMemo(() =>
        specializations.map(specialty => ({
            key: specialty.id,
            label: getLocalizedValue({ en: specialty.english_name, ar: specialty.arabic_name }, locale)
        }))
        , [specializations, locale])

    const t = useTranslations("Doctors")
    const tc = useTranslations("Common")

    const {
        formData,
        handleChange,
        handleFieldChange,
        validate,
        errors,
        resetForm,
        handleToggle
    } = useFormManager<DoctorFormData>({
        initialData: {
            name: "",
            specialty_id: "",
            status: "Available",
            avatar_url: "",
            years_experience: 0,
            schedule: computedSchedule,
            phone: "",
            ...selectedDoctor,
            consultation_fee: selectedDoctor ? selectedDoctor?.consultation_fee : 0,
        },
        schema: getDoctorSchema(t)
    })

    useEffect(() => {
        if (doctorSchedule && doctorSchedule.length > 0) {
            handleFieldChange({ name: "schedule", value: computedSchedule });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedSchedule]);

    const { mutate, isPending: isLoading } = useMutation({
        mutationFn: () =>
            selectedDoctor ? updateDoctor(formData) : createDoctor(formData),
        onSuccess: (res) => {
            if (!res.success) {
                handleFieldChange({ name: "globalError", value: t("error") })
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['doctorSchedule', selectedDoctor?.id] })
            queryClient.invalidateQueries({ queryKey: ['doctors'] })
            resetForm()
            onClose()
            toast.success(t("success"))
        },
        onError: () => handleFieldChange({ name: "globalError", value: t("error") })
    })

    const handleSubmit = async () => {
        if (validate()) {
            mutate()
        }
    }

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-162.5 p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl"
            >
                <LoadingOverlay loading={isLoading} >
                    <div className="bg-background relative">
                        {/* Header with Gradient Background */}
                        <div className="h-32 bg-linear-to-br from-primary/10 via-accent/5 to-background border-b border-border/40 relative overflow-hidden">
                            <div className="absolute top-0 inset-e-0 p-8 opacity-10">
                                <Stethoscope className="w-32 h-32 rotate-12" />
                            </div>
                            <div className="p-8 pb-0 flex justify-between items-start relative z-10">
                                <div>
                                    <DialogTitle className="text-3xl font-black tracking-tight mb-1">
                                        {selectedDoctor ? t("form.editTitle") : t("form.registerTitle")}
                                    </DialogTitle>
                                    <DialogDescription className="font-medium text-muted-foreground">
                                        {selectedDoctor
                                            ? t("form.editDesc")
                                            : t("form.registerDesc")
                                        }
                                    </DialogDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-background/80 shadow-xs cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-8 pb-4">
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
                                                <AvatarImage src={formData.avatar_url} />
                                                <AvatarFallback className="bg-accent text-2xl font-black">
                                                    {formData.name ? formData.name.charAt(0) : <Camera className="w-8 h-8 opacity-20" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <Camera className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                        <Input
                                            name="avatar_url"
                                            value={formData.avatar_url}
                                            onChange={handleChange}
                                            placeholder={t("form.placeholders.avatarUrl")}
                                            className={`rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.image ? 'ring-2 ring-destructive' : ''}`}
                                            containerClassName="w-full"
                                            error={errors.avatar_url}
                                            label={t("form.avatarUrl")}
                                        />
                                    </div>

                                    {/* Basic Info Grid */}
                                    <div className="grid grid-cols-2 gap-6 focus-visible:outline-none">
                                        <Input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder={t("form.placeholders.fullName")}
                                            icon={User}
                                            className={`rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.name ? 'ring-2 ring-destructive' : ''}`}
                                            label={t("form.fullName")}
                                            error={errors.name}
                                        />

                                        <SelectField
                                            name="specialty_id"
                                            value={formData.specialty_id}
                                            onValueChange={handleToggle("specialty_id")}
                                            options={computedSpecialtyList}
                                            placeholder={t("form.selectSpecialty")}
                                            label={t("form.specialty")}
                                            icon={Stethoscope}
                                            error={errors.specialty_id}
                                            showSearch
                                        />

                                        <div className="col-span-2 grid grid-cols-3 gap-6">
                                            <Input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                icon={Phone}
                                                className={`rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.name ? 'ring-2 ring-destructive' : ''}`}
                                                label={t("form.phone")}
                                                error={errors.name}
                                            />

                                            <Input
                                                type="number"
                                                name="consultation_fee"
                                                value={formData.consultation_fee}
                                                onChange={handleChange}
                                                icon={DollarSign}
                                                className={`rounded-2xl h-12 bg-accent/30 border-none ps-8 transition-all focus:ring-2 focus:ring-primary/20 ${errors.consultation_fee ? 'ring-2 ring-destructive' : ''}`}
                                                label={t("form.consultationFee")}
                                                error={errors.consultation_fee}
                                            />

                                            <Input
                                                type="number"
                                                name="years_experience"
                                                value={formData.years_experience}
                                                onChange={handleChange}
                                                icon={Briefcase}
                                                className={`rounded-2xl h-12 bg-accent/30 border-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.exp ? 'ring-2 ring-destructive' : ''}`}
                                                label={t("form.yearsExp")}
                                            />
                                        </div>
                                    </div>

                                    {/* Status Section */}
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> {t("form.availabilityStatus")}
                                        </Label>
                                        <div className="flex gap-2">
                                            {DOCTOR_STATUSES.map((status) => (
                                                <Button
                                                    key={status.value}
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => handleFieldChange({ name: "status", value: status.value })}
                                                    className={`flex-1 rounded-2xl h-12 font-bold transition-all ${formData.status === status.value
                                                        ? 'bg-primary border-primary shadow-lg shadow-primary/20'
                                                        : 'bg-accent/30 text-muted-foreground hover:text-foreground border-none hover:bg-accent/50'
                                                        }`}
                                                >
                                                    {getLocalizedValue(status, locale)}
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

                                        <ScrollArea className="h-95 pe-4 -me-4">
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
                                    className="flex-1 h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-[1.02]"
                                    onClick={handleSubmit}
                                >
                                    {false ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {selectedDoctor ? t("form.updateButton") : t("form.registerButton")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </LoadingOverlay>
            </DialogContent>
        </Dialog>
    )
}
