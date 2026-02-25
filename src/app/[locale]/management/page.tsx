import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

export default async function ManagementDashboard() {
    const t = await getTranslations("Common");

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/welcome" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to Welcome
                </Link>
                <h1 className="text-4xl font-black mb-4">Management Dashboard</h1>
                <p className="text-muted-foreground text-xl">
                    This module is currently under construction. Please check back later for full clinic management features.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    <div className="p-8 rounded-3xl bg-accent/20 border border-border">
                        <h3 className="text-xl font-bold mb-2">Patients Module</h3>
                        <p className="text-sm text-muted-foreground">Manage patient records, history, and charts.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-accent/20 border border-border">
                        <h3 className="text-xl font-bold mb-2">Appointments</h3>
                        <p className="text-sm text-muted-foreground">Schedule and track patient visits.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
