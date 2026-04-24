import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Props {
    icon: React.ReactNode
    iconBg: string
    label: string
    value: number
    badge?: { label: string; className: string }
    sub?: React.ReactNode
    href: string
}

export function StatCard({ icon, iconBg, label, value, badge, sub, href }: Props) {
    return (
        <Link href={href}>
            <Card className="rounded-3xl border border-border/50 shadow-sm bg-card hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                            {icon}
                        </div>
                        {badge && (
                            <Badge className={`rounded-lg text-[10px] px-2 py-0.5 font-bold border-none ${badge.className}`}>
                                {badge.label}
                            </Badge>
                        )}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                    <p className="text-3xl font-black tabular-nums leading-none">{value}</p>
                    <div className="mt-2">{sub}</div>
                </CardContent>
            </Card>
        </Link>
    )
}
