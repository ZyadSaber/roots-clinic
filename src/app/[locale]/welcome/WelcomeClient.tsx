"use client"

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowRight, Users, Bell } from "lucide-react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

interface WelcomeClientProps {
    username: string;
}

export default function WelcomeClient({ username }: WelcomeClientProps) {

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full flex flex-col items-center text-center"
            >
                <div className="mb-12 p-2 rounded-3xl bg-primary/5 border border-primary/10 shadow-xs">
                    <Logo className="w-48 h-16 md:w-64 md:h-20" />
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                    Welcome Back, <br />
                    <span className="bg-linear-to-r from-primary via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                        {username}
                    </span>!
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed font-medium max-w-lg">
                    Everything is ready for your shift. Here are your latest updates.
                </p>

                <div className="w-full max-w-md space-y-3">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Recent Activity</h3>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full border border-primary/20">
                            3 New
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent/20 border border-border/40 hover:border-primary/30 hover:bg-accent/40 transition-all cursor-pointer group">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold">New Patient Intake</p>
                                <p className="text-[11px] text-muted-foreground font-medium">Zyad Saber is waiting in the lobby.</p>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground/40">2m ago</span>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent/20 border border-border/40 hover:border-primary/30 hover:bg-accent/40 transition-all cursor-pointer group">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/10">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold">Lab Results Ready</p>
                                <p className="text-[11px] text-muted-foreground font-medium">Critical results for Patient #8291.</p>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground/40">15m ago</span>
                        </div>
                    </div>

                    <Button variant="ghost" asChild className="w-full h-12 mt-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 gap-2">
                        <Link href="/dashboard">
                            Enter Command Center <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

