"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { format } from "date-fns"
import {
    Users, CalendarCheck2, Stethoscope, ScanLine,
    CalendarPlus, UserPlus, Receipt, Clock,
    CheckCircle2, Circle, AlertCircle, Loader2,
    ChevronRight, Activity, TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import {
    getDashboardStats,
    getDashboardAppointments,
    getPendingRadiologyQueue,
    type DashboardStats,
    type DashboardAppointment,
    type PendingRadiologyItem,
} from "@/services/dashboard"

interface Props {
    locale: string
    username: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending:   { label: "Pending",   className: "bg-muted/60 text-muted-foreground border-border/40" },
    confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700 border-blue-200" },
    arrived:   { label: "Arrived",   className: "bg-amber-100 text-amber-700 border-amber-200" },
    in_chair:  { label: "In Chair",  className: "bg-primary/10 text-primary border-primary/20" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700 border-green-200" },
}

function greeting(name: string) {
    const h = new Date().getHours()
    const salutation = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"
    return `${salutation}, ${name}!`
}

export default function DashboardClient({ locale, username }: Props) {
    const today = useMemo(() => new Date(), [])
    const [calDate, setCalDate] = useState<Date | undefined>(today)

    const { data: stats } = useQuery<DashboardStats>({
        queryKey: ["dashboard-stats", today.toDateString()],
        queryFn: () => getDashboardStats(today),
        staleTime: 1000 * 60,
    })

    const { data: appointments = [] } = useQuery<DashboardAppointment[]>({
        queryKey: ["dashboard-appointments", today.toDateString()],
        queryFn: () => getDashboardAppointments(today),
        staleTime: 1000 * 60,
    })

    const { data: radiology = [] } = useQuery<PendingRadiologyItem[]>({
        queryKey: ["dashboard-radiology-queue"],
        queryFn: () => getPendingRadiologyQueue(),
        staleTime: 1000 * 30,
    })

    const s = stats ?? {
        total_appointments: 0, pending: 0, confirmed: 0, arrived: 0,
        in_chair: 0, completed: 0, cancelled: 0, no_show: 0,
        total_visits: 0, pending_radiology: 0,
    }

    const activeCount  = s.arrived + s.in_chair
    const progressPct  = s.total_appointments > 0
        ? Math.round((s.completed / s.total_appointments) * 100)
        : 0

    return (
        <div className="flex flex-col w-0 min-w-full h-[calc(100vh-4rem)] overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide p-8 space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {format(today, "EEEE, MMMM d, yyyy")}
                        </p>
                        <h1 className="text-3xl font-black tracking-tight">{greeting(username)}</h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Here&apos;s what&apos;s happening at the clinic today.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/${locale}/patients`}>
                            <Button className="rounded-2xl h-11 px-5 gap-2 font-bold shadow-lg shadow-primary/20 text-sm">
                                <UserPlus className="w-4 h-4" /> Register Patient
                            </Button>
                        </Link>
                        <Link href={`/${locale}/appointments`}>
                            <Button variant="outline" className="rounded-2xl h-11 px-5 gap-2 font-bold bg-background shadow-xs text-sm">
                                <CalendarPlus className="w-4 h-4" /> Book Appointment
                            </Button>
                        </Link>
                        <Link href={`/${locale}/finance`}>
                            <Button variant="outline" className="rounded-2xl h-11 px-5 gap-2 font-bold bg-background shadow-xs text-sm">
                                <Receipt className="w-4 h-4" /> Finance
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Users className="w-5 h-5" />}
                        iconBg="bg-primary/10 text-primary"
                        label="Today's Appointments"
                        value={s.total_appointments}
                        sub={
                            <div className="flex gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">Pending <b className="text-foreground">{s.pending + s.confirmed}</b></span>
                                <span className="text-xs text-muted-foreground">Done <b className="text-green-600">{s.completed}</b></span>
                            </div>
                        }
                        href={`/${locale}/appointments`}
                        locale={locale}
                    />
                    <StatCard
                        icon={<Activity className="w-5 h-5" />}
                        iconBg="bg-amber-100 text-amber-600"
                        label="Active Right Now"
                        value={activeCount}
                        badge={s.in_chair > 0 ? { label: `${s.in_chair} in chair`, className: "bg-primary/10 text-primary" } : undefined}
                        sub={
                            <span className="text-xs text-muted-foreground">{s.arrived} arrived, waiting</span>
                        }
                        href={`/${locale}/appointments`}
                        locale={locale}
                    />
                    <StatCard
                        icon={<CalendarCheck2 className="w-5 h-5" />}
                        iconBg="bg-green-100 text-green-600"
                        label="Completed Visits"
                        value={s.total_visits}
                        badge={progressPct > 0 ? { label: `${progressPct}% done`, className: "bg-green-100 text-green-700" } : undefined}
                        sub={
                            <span className="text-xs text-muted-foreground">visit records saved</span>
                        }
                        href={`/${locale}/records`}
                        locale={locale}
                    />
                    <StatCard
                        icon={<ScanLine className="w-5 h-5" />}
                        iconBg="bg-chart-5/10 text-chart-5"
                        label="Pending Imaging"
                        value={s.pending_radiology}
                        badge={s.pending_radiology > 0 ? { label: "Awaiting", className: "bg-orange-100 text-orange-600" } : undefined}
                        sub={
                            <span className="text-xs text-muted-foreground">radiology requests</span>
                        }
                        href={`/${locale}/radiology`}
                        locale={locale}
                    />
                </div>

                {/* ── Status Pipeline ── */}
                <div className="grid grid-cols-5 gap-2">
                    {[
                        { key: "pending",   label: "Pending",   count: s.pending,   color: "bg-muted/50 text-muted-foreground" },
                        { key: "confirmed", label: "Confirmed", count: s.confirmed, color: "bg-blue-100 text-blue-700" },
                        { key: "arrived",   label: "Arrived",   count: s.arrived,   color: "bg-amber-100 text-amber-700" },
                        { key: "in_chair",  label: "In Chair",  count: s.in_chair,  color: "bg-primary/10 text-primary" },
                        { key: "completed", label: "Completed", count: s.completed, color: "bg-green-100 text-green-700" },
                    ].map(({ key, label, count, color }, i) => (
                        <div key={key} className="relative">
                            <div className={`rounded-2xl px-4 py-3 flex flex-col items-center gap-1 ${color}`}>
                                <span className="text-2xl font-black tabular-nums">{count}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
                            </div>
                            {i < 4 && (
                                <ChevronRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-border z-10" />
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Appointments Table */}
                    <div className="lg:col-span-8">
                        <Card className="rounded-3xl border border-border/50 shadow-sm bg-card">
                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Stethoscope className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-base">Today&apos;s Schedule</h2>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {format(today, "MMMM d")} · {s.total_appointments} appointments
                                        </p>
                                    </div>
                                </div>
                                <Link href={`/${locale}/appointments`}>
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold text-primary hover:bg-primary/5 gap-1 text-xs">
                                        View all <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </div>

                            <CardContent className="p-0">
                                {appointments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                        <CalendarCheck2 className="w-10 h-10 opacity-20" />
                                        <p className="text-sm font-medium">No appointments scheduled today</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {appointments.map((appt) => (
                                            <AppointmentRow key={appt.id} appt={appt} />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-5">

                        {/* Calendar */}
                        <Card className="rounded-3xl border border-border/50 shadow-sm bg-card p-4">
                            <Calendar
                                mode="single"
                                selected={calDate}
                                onSelect={setCalDate}
                                defaultMonth={today}
                                className="rounded-2xl border-none p-0 mx-auto"
                                classNames={{
                                    head_cell: "text-muted-foreground rounded-md w-9 font-bold text-[10px] uppercase tracking-widest",
                                    cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:z-20",
                                    day: "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-accent rounded-xl transition-all",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-lg shadow-primary/20",
                                    day_today: "bg-accent/50 text-accent-foreground font-black",
                                    day_outside: "text-muted-foreground opacity-30",
                                    nav_button: "hover:bg-accent rounded-lg p-1 transition-all",
                                }}
                            />
                        </Card>

                        {/* Pending Radiology */}
                        <Card className="rounded-3xl border border-border/50 shadow-sm bg-card">
                            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/40">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-chart-5/10 text-chart-5 flex items-center justify-center">
                                        <ScanLine className="w-4 h-4" />
                                    </div>
                                    <h2 className="font-black text-sm">Imaging Queue</h2>
                                </div>
                                <Link href={`/${locale}/radiology`}>
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold text-primary hover:bg-primary/5 gap-1 text-xs h-7 px-2">
                                        View <ChevronRight className="w-3 h-3" />
                                    </Button>
                                </Link>
                            </div>
                            <CardContent className="p-3">
                                {radiology.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground">
                                        <CheckCircle2 className="w-8 h-8 opacity-20" />
                                        <p className="text-xs font-medium">No pending requests</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {radiology.map((item) => (
                                            <RadiologyQueueItem key={item.id} item={item} />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Links */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Patients", icon: Users, href: `/${locale}/patients`, color: "text-primary bg-primary/10" },
                                { label: "Records", icon: CalendarCheck2, href: `/${locale}/records`, color: "text-chart-2 bg-chart-2/10" },
                                { label: "Radiology", icon: ScanLine, href: `/${locale}/radiology`, color: "text-chart-5 bg-chart-5/10" },
                                { label: "Doctors", icon: Stethoscope, href: `/${locale}/doctors`, color: "text-amber-600 bg-amber-100" },
                            ].map(({ label, icon: Icon, href, color }) => (
                                <Link key={label} href={href}>
                                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/50 bg-card hover:bg-accent/30 hover:border-primary/20 transition-all cursor-pointer group">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-4.5 h-4.5" />
                                        </div>
                                        <span className="text-xs font-black">{label}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Sub-components ── */

function StatCard({
    icon, iconBg, label, value, badge, sub, href,
}: {
    icon: React.ReactNode
    iconBg: string
    label: string
    value: number
    badge?: { label: string; className: string }
    sub?: React.ReactNode
    href: string
    locale: string
}) {
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

function AppointmentRow({ appt }: { appt: DashboardAppointment }) {
    const time = format(new Date(appt.appointment_date), "h:mm a")
    const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending
    const initials = appt.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)

    return (
        <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-accent/20 transition-colors group">
            {/* Time */}
            <div className="w-16 shrink-0">
                <p className="text-xs font-black tabular-nums">{time}</p>
                <p className="text-[10px] text-muted-foreground">{appt.duration_mins}m</p>
            </div>

            {/* Patient */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-8 h-8 rounded-xl border border-background shadow-xs shrink-0">
                    <AvatarFallback className="text-[10px] font-black">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="text-sm font-black truncate leading-tight">{appt.patient_name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{appt.patient_code}</p>
                </div>
            </div>

            {/* Procedure */}
            <div className="hidden md:block w-32 shrink-0 min-w-0">
                <p className="text-xs font-medium truncate">{appt.procedure_type ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground truncate italic">{appt.doctor_name}</p>
            </div>

            {/* Priority + Status */}
            <div className="flex items-center gap-2 shrink-0">
                {appt.priority === "urgent" && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
                <Badge className={`rounded-lg text-[10px] px-2 py-0.5 font-bold border ${cfg.className}`}>
                    {cfg.label}
                </Badge>
            </div>
        </div>
    )
}

function RadiologyQueueItem({ item }: { item: PendingRadiologyItem }) {
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
