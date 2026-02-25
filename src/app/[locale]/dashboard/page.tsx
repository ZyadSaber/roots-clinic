import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Plus,
    CalendarPlus,
    Receipt,
    Users,
    AlertCircle,
    TrendingUp,
    MoreHorizontal,
    Bell,
    FileDigit,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}`);
    }

    const username = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || "Doctor";

    return (
        <div className="p-8 flex flex-col gap-8 max-w-screen-2xl mx-auto">
            {/* Header / Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Good Morning, {username}!</h1>
                    <p className="text-muted-foreground font-medium">Here&apos;s what&apos;s happening at the clinic today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="rounded-xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5" /> Register Patient
                    </Button>
                    <Button variant="outline" className="rounded-xl h-12 px-6 gap-2 font-bold bg-background shadow-xs">
                        <CalendarPlus className="w-5 h-5" /> Book Appointment
                    </Button>
                    <Button variant="outline" className="rounded-xl h-12 px-6 gap-2 font-bold bg-background shadow-xs">
                        <Receipt className="w-5 h-5" /> Add Expense
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="rounded-3xl border-none shadow-xl shadow-accent/5 bg-background overflow-hidden relative group transition-all hover:shadow-2xl hover:scale-[1.02]">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100/80 rounded-lg gap-1 font-bold">
                                        <TrendingUp className="w-3 h-3" /> +12%
                                    </Badge>
                                </div>
                                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-4">Today&apos;s Patients</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black tabular-nums">14</div>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs font-bold text-muted-foreground">Pending: <b className="text-foreground">11</b></span>
                                    <span className="text-xs font-bold text-muted-foreground">Completed: <b className="text-foreground">3</b></span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-none shadow-xl shadow-accent/5 bg-background overflow-hidden relative group transition-all hover:shadow-2xl hover:scale-[1.02]">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <Badge variant="destructive" className="bg-red-100 text-red-600 hover:bg-red-100/80 rounded-lg gap-1 font-bold border-none">
                                        <AlertCircle className="w-3 h-3" /> Low
                                    </Badge>
                                </div>
                                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-4">Low Stock Alerts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black tabular-nums">4</div>
                                <div className="text-xs font-bold text-muted-foreground mt-2">
                                    Critical: <span className="text-red-500 underline underline-offset-4 decoration-2">Dental Composites</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-none shadow-xl shadow-accent/5 bg-background overflow-hidden relative group transition-all hover:shadow-2xl hover:scale-[1.02]">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="p-2 rounded-xl bg-green-100 text-green-600">
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100/80 rounded-lg gap-1 font-bold">
                                        <TrendingUp className="w-3 h-3" /> +5%
                                    </Badge>
                                </div>
                                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest pt-4">Revenue Today</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black tabular-nums">$4,250.00</div>
                                <div className="text-xs font-bold text-muted-foreground mt-2">5 invoices pending payment</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Appointments Table */}
                    <Card className="rounded-3xl border-none shadow-xl shadow-accent/5 bg-background p-6">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <CardHeader className="p-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <CalendarPlus className="w-5 h-5" />
                                    </div>
                                    <CardTitle className="text-xl font-black">Today&apos;s Appointments</CardTitle>
                                </div>
                            </CardHeader>
                            <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 rounded-xl">View All</Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] h-10">Time</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] h-10">Patient</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] h-10">Service</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] h-10">Doctor</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] h-10">Status</TableHead>
                                    <TableHead className="text-right h-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="group border-border/40 hover:bg-accent/30 transition-colors">
                                    <TableCell className="font-bold">09:00 AM</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 rounded-lg border-2 border-background shadow-xs">
                                                <AvatarFallback className="bg-accent text-[10px] font-black">JD</AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold text-sm">John Doe</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">Root Canal</TableCell>
                                    <TableCell className="text-sm font-medium text-muted-foreground italic">Dr. Smith</TableCell>
                                    <TableCell>
                                        <Badge className="bg-green-100 text-green-700 rounded-lg px-2 py-0.5 border-none font-bold text-[10px] leading-tight">Checked-in</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                                <TableRow className="group border-border/40 hover:bg-accent/30 transition-colors">
                                    <TableCell className="font-bold">10:30 AM</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 rounded-lg border-2 border-background shadow-xs">
                                                <AvatarFallback className="bg-accent text-[10px] font-black">SJ</AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold text-sm">Sarah Jane</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">Cleaning</TableCell>
                                    <TableCell className="text-sm font-medium text-muted-foreground italic">Dr. Lee</TableCell>
                                    <TableCell>
                                        <Badge className="bg-blue-100 text-blue-700 rounded-lg px-2 py-0.5 border-none font-bold text-[10px] leading-tight">Confirmed</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                                <TableRow className="group border-border/40 hover:bg-accent/30 transition-colors">
                                    <TableCell className="font-bold">11:15 AM</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 rounded-lg border-2 border-background shadow-xs">
                                                <AvatarFallback className="bg-accent text-[10px] font-black">MW</AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold text-sm">Mark Wilson</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">Extraction</TableCell>
                                    <TableCell className="text-sm font-medium text-muted-foreground italic">Dr. Smith</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-muted-foreground rounded-lg px-2 py-0.5 font-bold text-[10px] leading-tight bg-accent/20 border-border/50">Pending</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Right Sidebar Section */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    {/* Calendar Card */}
                    <Card className="rounded-3xl border-none shadow-xl shadow-accent/5 bg-background p-4 overflow-hidden">
                        <Calendar
                            mode="single"
                            className="rounded-2xl border-none p-0 mx-auto"
                            classNames={{
                                head_cell: "text-muted-foreground rounded-md w-9 font-bold text-[10px] uppercase tracking-widest",
                                cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:z-20",
                                day: "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-accent rounded-xl transition-all",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-lg shadow-primary/20",
                                day_today: "bg-accent/50 text-accent-foreground",
                                day_outside: "text-muted-foreground opacity-50",
                                day_disabled: "text-muted-foreground opacity-50",
                                nav_button: "hover:bg-accent rounded-lg p-1 transition-all",
                            }}
                        />
                    </Card>

                    {/* Alerts Card */}
                    <Card className="rounded-3xl border-none shadow-xl shadow-accent/5 bg-background p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Bell className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-xl font-black">System Alerts</CardTitle>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 flex gap-4 transition-all hover:bg-orange-50 group hover:shadow-lg hover:shadow-orange-500/5">
                                <div className="p-2 rounded-xl bg-orange-100 text-orange-600 h-fit transition-transform group-hover:scale-110">
                                    <FileDigit className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">New Radiology Result</span>
                                    <span className="text-xs text-muted-foreground font-medium mt-0.5">Patient: John Doe • <b className="text-red-500/80 uppercase tracking-tighter text-[10px]">Urgent Review</b></span>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-accent/30 border border-border/50 flex gap-4 transition-all hover:bg-accent/50 group hover:shadow-lg hover:shadow-accent/5">
                                <div className="p-2 rounded-xl bg-accent text-muted-foreground h-fit transition-transform group-hover:scale-110">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">Stock Alert: Gloves</span>
                                    <span className="text-xs text-muted-foreground font-medium mt-0.5">Less than 5 boxes remaining.</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full mt-6 rounded-xl font-bold text-muted-foreground hover:text-primary transition-colors">View All Notifications</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
