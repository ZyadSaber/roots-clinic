import { format } from "date-fns"
import { Clock } from "lucide-react"
import type { PendingRadiologyItem } from "@/services/dashboard"

export function RadiologyQueueItem({ item }: { item: PendingRadiologyItem }) {
    const initials = item.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)
    const time = format(new Date(item.requested_at), "h:mm a")

    return (
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-accent/30 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-chart-5/10 text-chart-5 flex items-center justify-center text-[10px] font-black shrink-0">
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate leading-tight">{item.patient_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.procedure_type ?? "—"}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-medium">{time}</span>
            </div>
        </div>
    )
}
