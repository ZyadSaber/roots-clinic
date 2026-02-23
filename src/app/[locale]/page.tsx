"use client"

// import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Lock, ArrowLeft } from "lucide-react"
import { Link, useRouter } from "@/i18n/routing"
import { motion } from "framer-motion"
import Logo from "@/components/logo"

// import { login } from "@/services/user"
import { toast } from "sonner"
import { useFormManager } from "@/hooks"
// import { loginSchema } from "@/validations/login"

export default function LoginPage() {
  const t = useTranslations("Auth")
  const commonT = useTranslations("Common")
  const router = useRouter()
  // const [isPending, startTransition] = useTransition()
  const isPending = false

  const { formData, handleChange, validate, errors } = useFormManager({
    initialData: {
      username: "",
      password: "",
    },
    // schema: loginSchema,
  })

  const handleLogin = async () => {
    if (!validate()) return
    // startTransition(async () => {
    //   try {
    //     const result = await login(formData)
    //     if (result.success) {
    //       toast.success(commonT("success"))
    //       const target = "/management"
    //       router.push(target)
    //     } else {
    //       toast.error(result.error)
    //     }
    //   } catch (error: unknown) {
    //     const message = error instanceof Error ? error.message : "Login failed"
    //     toast.error(`${commonT("error")}: ${message}`)
    //   }
    // })
  }


  return (
    <div className="min-h-screen bg-accent/20 flex flex-col items-center justify-center p-4">
      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden w-full max-w-md">
        <CardHeader className="text-center pt-10">
          <Logo className="w-full h-24 mx-auto mb-6 rounded-3xl" />
          <CardTitle className="text-3xl font-black tracking-tight">{t("login")}</CardTitle>
          <CardDescription>Access the SmartDine Management Suite</CardDescription>
        </CardHeader>
        <CardContent className="p-8 flex flex-col gap-5">
          <Input
            name="username"
            type="text"
            placeholder="admin"
            value={formData.username}
            onChange={handleChange}
            className="h-12 rounded-xl"
            required
            label={t("userName")}
            error={errors.username}
          />
          <Input
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className="h-12 rounded-xl"
            required
            error={errors.password}
            label={t("password")}
          />
          <Button
            className="w-full h-14 rounded-2xl text-lg group mt-8"
            disabled={isPending}
            onClick={handleLogin}
            isLoading={isPending}
          >
            {t("signIn")}
            <Lock className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
