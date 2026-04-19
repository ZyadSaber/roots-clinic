import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AppointmentStatCardProps {
    label: string
    value: number
    icon: LucideIcon
    color: string
    bg: string
}

export function AppointmentStatCard({ label, value, icon: Icon, color, bg }: AppointmentStatCardProps) {
    return (
        <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                    <p className="text-2xl font-black tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
                </div>
            </CardContent>
        </Card>
    )
}
