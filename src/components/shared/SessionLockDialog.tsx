"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeOff, ShieldAlert } from "lucide-react"
import { useFormManager } from "@/hooks"

interface SessionLockDialogProps {
    open: boolean
    onUnlock: () => void
}

export function SessionLockDialog({ open, onUnlock }: SessionLockDialogProps) {
    const user = useSelector((state: RootState) => state.auth.user)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const { formData, handleChange, handleToggle, resetForm, errors, setErrors } = useFormManager({
        initialData: {
            password: "",
            showPassword: false,
        },
    })

    const handleUnlock = async () => {
        if (!formData.password || !user?.email) return
        setLoading(true)
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: formData.password,
        })
        setLoading(false)
        if (authError) {
            setErrors({ password: "Incorrect password. Please try again." })
            handleToggle("password")("")
        } else {
            resetForm()
            onUnlock()
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                className="sm:max-w-sm p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-background"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="flex flex-col items-center gap-6 p-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>

                    <div className="text-center space-y-1">
                        <DialogTitle className="text-2xl font-black tracking-tight">Session Locked</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            {user?.full_name ? `Hi ${user.full_name}, enter` : "Enter"} your password to continue
                        </DialogDescription>
                    </div>

                    <div className="w-full space-y-3">
                        <div className="relative">
                            <Input
                                name="password"
                                type={formData.showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                                className="h-12 rounded-2xl bg-accent/30 border-none pe-12 focus:ring-2 focus:ring-primary/20"
                                autoFocus
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggle("showPassword")(!formData.showPassword)}
                                className="absolute inset-e-1 top-1 h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground"
                            >
                                {formData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>

                        {errors.password && (
                            <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                {errors.password}
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleUnlock}
                        disabled={!formData.password || loading}
                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                    >
                        {loading
                            ? <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                            : "Unlock"
                        }
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
