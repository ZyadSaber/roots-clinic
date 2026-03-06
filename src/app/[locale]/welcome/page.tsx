import WelcomeClient from "./WelcomeClient";
import { createClient } from "@/lib/supabase/server";
import { getStaffById } from "@/services/staff";
import { redirect } from "next/navigation";

export default async function ManagementPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { id } = user || {};

    const staffUser = await getStaffById(id || "")

    if (!id) {
        redirect(`/${locale}`);
    }

    return (
        <WelcomeClient
            username={staffUser?.full_name || ""}
        />
    );
}
