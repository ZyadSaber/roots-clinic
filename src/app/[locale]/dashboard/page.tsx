import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/${locale}`)

    const username =
        user.user_metadata?.full_name?.split(" ")[0] ||
        user.email?.split("@")[0] ||
        "Doctor"

    return <DashboardClient locale={locale} username={username} />
}
