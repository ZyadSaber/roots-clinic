"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/routing"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    const toggleLocale = () => {
        const nextLocale = locale === "en" ? "ar" : "en"
        router.replace(pathname, { locale: nextLocale })
    }

    return (
        <Button variant="ghost" size="sm" onClick={toggleLocale}>
            {locale === "en" ? "العربية" : "English"}
        </Button>
    )
}
