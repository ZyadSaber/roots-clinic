"use client"

import { useEffect } from "react"
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
    User as UserIcon,
    Shield,
    Check,
    Phone,
    UserCircle,
    Mail
} from "lucide-react"
import { useTranslations } from "next-intl"
import { SelectField } from "../ui/select"
import { useFormManager } from "@/hooks"
import { UpdateUserSchema } from "@/validation/staff"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateUser } from "@/services/staff"
import { toast } from "sonner"
import { User } from "@/types/staff"

interface StaffUpdateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    handleClose: () => void
}

const StaffUpdateDialog = ({ open, onOpenChange, user, handleClose }: StaffUpdateDialogProps) => {
    const t = useTranslations("Users")
    const tCommon = useTranslations("Common")

    const {
        formData,
        setFormData,
        handleChange,
        validate,
        handleToggle,
        errors,
    } = useFormManager({
        initialData: {
            id: user?.id || "",
            full_name: user?.full_name || "",
            username: user?.username || "",
            phone: user?.phone || "",
            role: user?.role || "admin",
            specialty_id: user?.specialty_id || "",
        },
        schema: UpdateUserSchema
    })

    // Update form data when user prop changes
    useEffect(() => {
        if (user && open) {
            setFormData({
                id: user.id,
                full_name: user.full_name,
                username: user.username,
                phone: user.phone || "",
                role: user.role,
                specialty_id: user.specialty_id || "",
            })
        }
    }, [user, open, setFormData])

    const queryClient = useQueryClient()
    const { mutate, isPending: isLoading } = useMutation({
        mutationFn: () => updateUser(formData),
        onSuccess: (res) => {
            if (!res || !res.success) {
                toast.error(tCommon("error"))
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['staff'] })
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
        { key: "receptionist", label: t("receptionist") },
        { key: "finance", label: t("finance") },
    ]

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-150 p-0 overflow-hidden border-none bg-background/80 backdrop-blur-xl shadow-2xl rounded-[2rem]">
                <div className="relative">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

                    <DialogHeader className="p-8 pb-0 relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                                <UserCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight">
                                    {t("editUser")}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-medium">
                                    {t("editUserDesc")}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-8 pb-8 relative z-10 space-y-6">
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

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium ml-2 text-muted-foreground">{t("email")}</label>
                                <div className="h-12 flex items-center px-4 rounded-2xl bg-secondary/10 text-muted-foreground cursor-not-allowed">
                                    <Mail className="w-4 h-4 mr-2" />
                                    <span className="text-sm">{user.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField
                                options={roleOptions}
                                label={t("role")}
                                placeholder={t("rolePlaceholder")}
                                className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                onValueChange={handleToggle("role")}
                                name="role"
                                hideClear
                                icon={Shield}
                                value={formData.role}
                                error={errors.role ? t(errors.role) : undefined}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                onClick={handleSubmit}
                                className="w-full rounded-2xl h-12 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold group"
                                disabled={isLoading}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {tCommon("save")}
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default StaffUpdateDialog
