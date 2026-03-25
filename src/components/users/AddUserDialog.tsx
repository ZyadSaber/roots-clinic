"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    UserPlus,
    Mail,
    Phone,
    Shield,
    Key,
    User as UserIcon,
    ArrowRight,
    Check
} from "lucide-react"
import { useTranslations } from "next-intl"
import { SelectField } from "../ui/select"
import { cn } from "@/lib/utils"
import { useFormManager } from "@/hooks"
import { CreateUserSchema } from "@/validation/staff"
import { getAllSpecialties } from "@/services/specialties"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createUser } from "@/services/staff"
import { toast } from "sonner"

interface AddUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    handleClose: () => void
}

const AddUserDialog = ({ open, onOpenChange, handleClose }: AddUserDialogProps) => {
    const t = useTranslations("Users")
    const tCommon = useTranslations("Common")
    const [step, setStep] = useState(1)

    const {
        formData,
        handleChange,
        validate,
        handleToggle,
        errors,
        setErrors,
        handleChangeMultiInputs,
        resetForm
    } = useFormManager({
        initialData: {
            full_name: "",
            email: "",
            phone: "",
            role: "admin",
            password: "",
            username: "",
            specialty_id: "",
        },
        schema: CreateUserSchema
    })

    const queryClient = useQueryClient()
    const { mutate, isPending: isLoading } = useMutation({
        mutationFn: () => createUser(formData),
        onSuccess: (res) => {
            if (!res || !res.success) {
                toast.error(tCommon("error"))
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['staff'] })
            resetForm()
            handleClose()
            toast.success(tCommon("success"))
        },
        onError: () => toast.error(tCommon("error"))
    })

    const handleSubmit = () => {
        if (validate()) {
            mutate()
        }
    }

    const roleOptions = [
        { key: "admin", label: t("admin") },
        { key: "doctor", label: t("doctor") },
        { key: "receptionist", label: t("receptionist") },
        { key: "finance", label: t("finance") },
    ]

    const { data: specialties = [], isLoading: specialtiesLoading } = useQuery({
        queryKey: ["specialties"],
        queryFn: getAllSpecialties,
    });

    const handleNextStep = () => {
        const result = CreateUserSchema.safeParse(formData)

        if (result.success) {
            setStep(2)
            setErrors({})
            return
        }

        const issues = result.error.issues
        const realErrors = issues.filter(i => i.path[0] !== 'password')

        if (realErrors.length === 0) {
            setStep(2)
            setErrors({})
        } else {
            const formattedErrors: Record<string, string> = {}
            realErrors.forEach(i => formattedErrors[i.path.join('.')] = i.message)
            setErrors(formattedErrors)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-150 p-0 overflow-hidden border-none bg-background/80 backdrop-blur-xl shadow-2xl rounded-[2rem]">
                <div className="relative">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

                    <DialogHeader className="p-8 pb-0 relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                                <UserPlus className="w-7 h-7" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight">
                                    {t("addUser")}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-medium">
                                    {t("addUserDesc")}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-8">
                            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", step >= 1 ? "bg-primary" : "bg-secondary")} />
                            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", step >= 2 ? "bg-primary" : "bg-secondary")} />
                        </div>
                    </DialogHeader>

                    <div className="px-8 pb-8 relative z-10 space-y-6">
                        {step === 1 ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        icon={UserIcon}
                                        label={t("fullName")}
                                        placeholder={t("fullNamePlaceholder")}
                                        className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        error={errors.full_name ? t(errors.full_name) : undefined}
                                        name="full_name"
                                    />

                                    <Input
                                        label={t("username")}
                                        type="text"
                                        placeholder={t("usernamePlaceholder")}
                                        className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                        icon={Mail}
                                        value={formData.username}
                                        onChange={handleChange}
                                        error={errors.username ? t(errors.username) : undefined}
                                        name="username"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        placeholder={t("phonePlaceholder")}
                                        className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                        icon={Phone}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        error={errors.phone ? t(errors.phone) : undefined}
                                        name="phone"
                                        label={t("phone") || ""}
                                    />

                                    <Input
                                        label={t("email")}
                                        type="email"
                                        placeholder={t("emailPlaceholder")}
                                        className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                        icon={Mail}
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={errors.email ? t(errors.email) : undefined}
                                        name="email"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SelectField
                                        options={roleOptions}
                                        label={t("role")}
                                        placeholder={t("rolePlaceholder")}
                                        className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                        onValueChange={(val) => {
                                            handleChangeMultiInputs({
                                                role: val,
                                                specialty_id: val !== "doctor" ? "" : formData.specialty_id
                                            })
                                        }}
                                        name="role"
                                        hideClear
                                        icon={Shield}
                                        value={formData.role}
                                        error={errors.role ? t(errors.role) : undefined}
                                    />
                                    <SelectField
                                        options={specialties}
                                        label={t("specialty")}
                                        placeholder={t("specialtyPlaceholder")}
                                        className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                        onValueChange={handleToggle("specialty_id")}
                                        name="specialty_id"
                                        hideClear
                                        icon={Shield}
                                        disabled={formData.role !== "doctor"}
                                        value={formData.specialty_id}
                                        error={errors.specialty_id ? t(errors.specialty_id) : undefined}
                                        loading={specialtiesLoading}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="p-6 rounded-3xl bg-secondary/20 border border-primary/10 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Key className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">{t("securitySetup")}</p>
                                            <p className="text-xs text-muted-foreground">{t("securitySetupDesc")}</p>
                                        </div>
                                    </div>

                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-12 rounded-2xl bg-background border-none transition-all focus:ring-2 focus:ring-primary/20"
                                        value={formData.password}
                                        onChange={handleChange}
                                        error={errors.password ? t(errors.password) : undefined}
                                        name="password"
                                        label={t("password")}
                                    />
                                    <p className="text-[10px] text-muted-foreground ml-2">{t("passwordHint")}</p>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 text-primary">
                                    <Shield className="w-5 h-5 shrink-0" />
                                    <p className="text-xs font-medium leading-relaxed">
                                        {t("permissionNote")}
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-4 flex items-center justify-between sm:justify-between w-full">
                            {step === 2 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="rounded-2xl h-12 px-6"
                                >
                                    {tCommon("back")}
                                </Button>
                            )}
                            <div className="flex-1" />
                            {step === 1 ? (
                                <Button
                                    onClick={handleNextStep}
                                    className="rounded-2xl h-12 px-8 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold group"
                                >
                                    {tCommon("continue")}
                                    <ArrowRight className="rtl:-scale-x-100 w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    className="rounded-2xl h-12 px-10 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold group"
                                    disabled={isLoading}
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    {t("confirmAccount")}
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    )
}

export default AddUserDialog
