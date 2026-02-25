import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Plus,
    Star,
    ArrowRight,
    Edit2,
    Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function DoctorsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}`);
    }

    const specializations = [
        "All Specializations",
        "General Dentistry",
        "Orthodontics",
        "Radiology",
        "Periodontics",
        "Oral Surgery"
    ];

    const doctors = [
        {
            name: "Dr. Sarah Jenkins",
            specialty: "Senior Orthodontist",
            fee: 150,
            status: "Available",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKbo6Fpf1EQ0grM7Mt6Lfk3WbhvLZ5mRXThI11dI5UY8rvq60AFXNpFZs2TRW5Ryuub3pC32-u69Z2VD0Ks3yMX7_Anmba2t8TuTadzzBwzWK-zyDexYNeNa_RkE-9UOxMjCSrtKChJzB4VkzovTzEDBSvV7_IjYqCYKWRaL88kUeKhM7aUaqG_seS9vUkEhrynZ5nIYxP84d8q2GqPjvbmoizdmhuyuIrDY7If4uDse8MKOXJ71XJXVELBxGwfOqjXjW_EN6NiCDJ",
            rating: 4.8,
            reviews: 124,
            exp: 12,
            schedule: [
                { day: "Monday", time: "09:00 AM - 05:00 PM", active: false },
                { day: "Tuesday", time: "09:00 AM - 05:00 PM", active: false },
                { day: "Wednesday", time: "Active Now", active: true },
                { day: "Thursday", time: "09:00 AM - 03:00 PM", active: false },
                { day: "Friday", time: "08:00 AM - 02:00 PM", active: false },
            ]
        },
        {
            name: "Dr. Michael Chen",
            specialty: "Radiology Specialist",
            fee: 120,
            status: "On Break",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlZqh2RRtkH8sgYGepK82uqPnMTI18jfM42glPn04jG8VKWmvhmy1gYm5P_rP8gYAX8lXdqK5w6AhN6NNAfMQ_P-_8vyiuyHZ5u41xBFljQ8j1iZ0RDmOxBHEz5SwyysOJGBM7M2QbePdIGxupjtttjXRydk0tF5FeF-Q14t-IxWdeI1oC26IHHl4_am0TTjl_IliXSZALmsliL1p12sWUpISxLOFKuz5Rj7SgZjLZNN-OuhrZLF-aM9aMuK0L6sg708AhAldqVdK2",
            rating: 4.5,
            reviews: 89,
            exp: 8,
            schedule: []
        },
        {
            name: "Dr. Elena Rodriguez",
            specialty: "General Dentistry",
            fee: 95,
            status: "Available",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwl51ly2MXaovsoeiwfas5jswYkiqgxm9yweW669TAWRuys3BnqXaAFJQ7ExAtf5e6jGfOrOSyoSPai_imbqDhg0T14Yusqs7g6vOqynVnNRyTyYHZ5bUyzPNr6ahn4-tTtJUYLPa6Hpb4Z2BT4N3TyKW9gGi7hlJ90295sf1MfVOxJ2XQL7L-TNMAsQ43yvVtIDsOcpR_h-AOP3EswhCfJxYm7KyO93fLrVutMrKr3QV4aIeUCCLzY5lIiMYQM_r8lmuUgqqjCSRN",
            rating: 4.9,
            reviews: 210,
            exp: 15,
            schedule: []
        },
        {
            name: "Dr. Marcus Thorne",
            specialty: "Periodontist",
            fee: 180,
            status: "Away",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFKnu3b0I08_rvG94pbeuixgEelmmdBerGYbW8zRNT53Iex4i0DbuxbSeXFmbDaCuA6DxZrExY7JZ2PDG2of-ZfLtPsVOhHjkVMeRY9fmC53V0lZormOiSxyr0Mk3HNEkuQlVcqnRGQO-zYIltg7u_T7wa1XqWudGVrwW1vAotQe5H0N6zd2o4P7iivYyD-TZya4Jq1T2vNnfLm9drhVQCHzi-LinhzWQ8NTs8-E-P_PsoI959eM9i0II43qGOniM1GGnu09zoi7qN",
            rating: 4.7,
            reviews: 56,
            exp: 10,
            schedule: []
        }
    ];

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* Main Section */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-2">Doctor Management</h1>
                            <p className="text-muted-foreground font-medium">View and manage your professional clinical staff and their specialties.</p>
                        </div>
                        <Button className="rounded-xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5" /> Add New Doctor
                        </Button>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                        {specializations.map((spec, i) => (
                            <Button
                                key={spec}
                                variant={i === 0 ? "default" : "outline"}
                                className={`rounded-full h-10 px-6 font-bold whitespace-nowrap transition-all ${i !== 0 ? 'bg-background hover:bg-accent border-border/50' : ''}`}
                            >
                                {spec}
                            </Button>
                        ))}
                    </div>

                    {/* Doctor Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doc, i) => (
                            <Card
                                key={doc.name}
                                className={`rounded-3xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent/5 ${i === 0 ? 'border-2 border-primary ring-4 ring-primary/5 shadow-xl shadow-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                            >
                                <CardHeader className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <Avatar className="w-16 h-16 rounded-2xl border-2 border-background shadow-lg">
                                            <AvatarImage src={doc.image} className="object-cover" />
                                            <AvatarFallback className="font-black">{doc.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <Badge className={`rounded-lg px-2 py-0.5 font-black text-[10px] leading-tight border-none ${doc.status === 'Available' ? 'bg-green-100 text-green-700' :
                                            doc.status === 'On Break' ? 'bg-blue-100 text-blue-700' :
                                                'bg-accent text-muted-foreground'
                                            }`}>
                                            {doc.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-black">{doc.name}</CardTitle>
                                    <p className={`text-sm font-bold ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{doc.specialty}</p>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="flex items-center justify-between border-t border-border/40 pt-4">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Fee</p>
                                            <p className="text-xl font-black tabular-nums">${doc.fee.toFixed(2)}</p>
                                        </div>
                                        <ArrowRight className={`w-5 h-5 ${i === 0 ? 'text-primary' : 'text-muted-foreground'} group-hover:translate-x-1 transition-transform`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Details Panel */}
            <aside className="hidden lg:flex w-[450px] bg-background border-l border-border/50 flex-col overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-border/40 bg-accent/10">
                    <div className="flex items-center gap-6 mb-8">
                        <Avatar className="w-24 h-24 rounded-3xl border-4 border-background shadow-2xl">
                            <AvatarImage src={doctors[0].image} className="object-cover" />
                            <AvatarFallback className="text-2xl font-black">SJ</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{doctors[0].name}</h2>
                            <p className="text-primary font-bold">{doctors[0].specialty}</p>
                            <div className="flex items-center gap-1 mt-2">
                                <Stars rating={doctors[0].rating} />
                                <span className="text-xs font-bold text-muted-foreground ml-2">{doctors[0].rating} ({doctors[0].reviews} reviews)</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-background border border-border/40 rounded-2xl shadow-xs">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Fee</p>
                            <p className="text-xl font-black tabular-nums">${doctors[0].fee.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-background border border-border/40 rounded-2xl shadow-xs">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Exp.</p>
                            <p className="text-xl font-black tabular-nums">{doctors[0].exp} Years</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-black text-lg">Weekly Schedule</h4>
                        <Button variant="ghost" size="sm" className="text-primary font-bold h-8 rounded-lg">Manage Rules</Button>
                    </div>
                    <div className="space-y-3">
                        {doctors[0].schedule.map((slot) => (
                            <div
                                key={slot.day}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${slot.active
                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                    : 'bg-accent/20 border-border/40'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${slot.active ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
                                    <p className="font-bold text-sm">{slot.day}</p>
                                </div>
                                <p className={`text-sm font-bold ${slot.active ? 'uppercase tracking-wider' : 'text-muted-foreground'}`}>
                                    {slot.active ? 'Active Now' : slot.time}
                                </p>
                            </div>
                        ))}
                        <div className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                <p className="font-bold text-sm text-red-600 dark:text-red-400">Weekend</p>
                            </div>
                            <p className="text-sm font-bold text-red-400">Unavailable</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-accent/5 border-t border-border/40 flex gap-4">
                    <Button className="flex-1 h-14 rounded-2xl font-black text-lg gap-2 shadow-lg shadow-primary/20">
                        <Wallet className="w-5 h-5" /> Edit Fees
                    </Button>
                    <Button variant="outline" className="w-14 h-14 rounded-2xl bg-background border-border/50 shadow-xs">
                        <Edit2 className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>
            </aside>
        </div>
    );
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground opacity-30'}`}
                />
            ))}
        </div>
    );
}
