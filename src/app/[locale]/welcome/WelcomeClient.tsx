"use client"

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import {
    ArrowRight,
    Users,
    Stethoscope,
    Activity,
    Calendar,
    TrendingUp,
    ShieldCheck,
    Star
} from "lucide-react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

interface WelcomeClientProps {
    username: string;
}

export default function WelcomeClient({ username }: WelcomeClientProps) {

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemAnim = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-6">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-7 flex flex-col items-start text-left"
                >
                    <div className="mb-8 p-1 rounded-3xl bg-primary/5 w-fit border border-primary/10">
                        <Logo className="w-64 h-20" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
                        Welcome Back, <br />
                        <span className="bg-linear-to-r from-primary via-rose-500 to-orange-500 bg-clip-text text-transparent">
                            {username}
                        </span>!
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-medium">
                        Your clinic&apos;s ecosystem is fully synchronized. Everything and everyone is ready for a productive day of healthcare excellence.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Button asChild className="h-14 px-8 rounded-2xl font-black text-lg gap-3 shadow-xl shadow-primary/20">
                            <Link href="/dashboard">
                                Enter Command Center <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="h-14 px-8 rounded-2xl font-black text-lg bg-background border-border/50">
                            <Link href="/doctors">
                                Manage Doctors
                            </Link>
                        </Button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-5 relative"
                >
                    <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-rose-500/20 blur-[100px] rounded-full" />
                    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-background/60 backdrop-blur-xl relative z-10 p-8 overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="w-32 h-32 text-primary" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-8">System Health</h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                    <span className="font-bold text-sm">Auth Engine</span>
                                </div>
                                <span className="text-[10px] font-black uppercase text-green-500">Secure</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                    <span className="font-bold text-sm">Database Sync</span>
                                </div>
                                <span className="text-[10px] font-black uppercase text-blue-500">Live</span>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-border/50">
                            <p className="text-xs font-bold text-muted-foreground mb-4">ACTIVE ANOMALIES</p>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-bold text-foreground">Zero critical issues detected.</span>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Numbers for Doctors */}
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-8 px-2">Professional Network Overview</h2>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
            >
                <motion.div variants={itemAnim}>
                    <Card className="rounded-3xl border-none shadow-xl bg-background group hover:shadow-2xl transition-all p-6 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Stethoscope className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Total Doctors</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-4xl font-black">24</h4>
                            <Badge className="bg-primary/10 text-primary border-none rounded-lg text-[10px] font-bold">+2 New</Badge>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemAnim}>
                    <Card className="rounded-3xl border-none shadow-xl bg-background group hover:shadow-2xl transition-all p-6 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Available Now</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-4xl font-black">18</h4>
                            <div className="flex items-center gap-1.5 text-green-500">
                                <Activity className="w-3 h-3 animate-pulse" />
                                <span className="text-[10px] font-bold">Active</span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemAnim}>
                    <Card className="rounded-3xl border-none shadow-xl bg-background group hover:shadow-2xl transition-all p-6 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Star className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Top Rated</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-4xl font-black">4.9</h4>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Excellent</span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemAnim}>
                    <Card className="rounded-3xl border-none shadow-xl bg-background group hover:shadow-2xl transition-all p-6 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Calendar className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Appt. Load</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-4xl font-black">82%</h4>
                            <Badge className="bg-orange-500/10 text-orange-500 border-none rounded-lg text-[10px] font-bold">High</Badge>
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Bottom Quote Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-[3.5rem] bg-linear-to-r from-primary/10 via-rose-500/5 to-orange-500/10 p-12 md:p-20 text-center relative overflow-hidden border border-white/5 shadow-2xl"
            >
                <div className="relative z-10 max-w-4xl mx-auto">
                    <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-8 block">Daily Inspiration</span>
                    <p className="text-3xl md:text-4xl text-foreground font-black leading-tight tracking-tight mb-8 text-balance">
                        &quot;The art of healing comes from nature, not from the physician. Therefore the physician must start from nature, with an open mind.&quot;
                    </p>
                    <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
                </div>

                {/* Abstract decorative elements */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Logo className="w-64 h-64 rotate-12" />
                </div>
            </motion.div>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${className}`}>
            {children}
        </span>
    )
}
