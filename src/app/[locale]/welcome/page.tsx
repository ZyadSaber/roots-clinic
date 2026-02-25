import WelcomeClient from "./WelcomeClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ManagementPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}`);
    }

    // You could also fetch the staff name from your PG database here using queryOne
    const username = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";

    return (
        <WelcomeClient
            username={username}
        />
    );
}
