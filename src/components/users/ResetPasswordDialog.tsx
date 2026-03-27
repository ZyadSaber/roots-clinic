"use client"

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
    Key,
    Check,
    Lock
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useFormManager } from "@/hooks"
import { ResetPasswordSchema } from "@/validation/staff"
import { useMutation } from "@tanstack/react-query"
import { resetUserPassword } from "@/services/staff"
import { toast } from "sonner"
import { User } from "@/types/staff"

interface ResetPasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    handleClose: () => void
}

const ResetPasswordDialog = ({ open, onOpenChange, user, handleClose }: ResetPasswordDialogProps) => {
    const t = useTranslations("Users")
    const tCommon = useTranslations("Common")

    const {
        formData,
        handleChange,
        validate,
        errors,
        resetForm
    } = useFormManager({
        initialData: {
            password: "",
            confirmPassword: "",
        },
        schema: ResetPasswordSchema
    })

    const { mutate, isPending: isLoading } = useMutation({
        mutationFn: () => resetUserPassword(user?.id || "", formData.password),
        onSuccess: (res) => {
            if (!res || !res.success) {
                toast.error(tCommon("error"))
                return;
            }
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

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-100 p-0 overflow-hidden border-none bg-background/80 backdrop-blur-xl shadow-2xl rounded-[2rem]">
                <div className="relative">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

                    <DialogHeader className="p-8 pb-0 relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive shadow-inner border border-destructive/20">
                                <Key className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">
                                    {t("resetPassword")}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-medium">
                                    {user.full_name}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-8 pb-8 relative z-10 space-y-6">
                        <div className="space-y-4">
                            <Input
                                label={t("password")}
                                type="password"
                                placeholder="••••••••"
                                className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                icon={Lock}
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password ? t(errors.password) : undefined}
                                name="password"
                            />

                            <Input
                                label={t("confirmPassword")}
                                type="password"
                                placeholder="••••••••"
                                className="h-12 rounded-2xl bg-secondary/30 border-none transition-all focus:ring-2 focus:ring-primary/20"
                                icon={Lock}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={errors.confirmPassword ? t(errors.confirmPassword) : undefined}
                                name="confirmPassword"
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                onClick={handleSubmit}
                                className="w-full rounded-2xl h-12 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold group"
                                disabled={isLoading}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {tCommon("confirm")}
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ResetPasswordDialog
