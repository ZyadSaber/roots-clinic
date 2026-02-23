"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ReactNode } from "react";
import { RefreshCcw, Home } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorLayoutProps {
    icon: ReactNode;
    title: string;
    description: string;
    code: string;
    backText: string;
    reset?: () => void;
    errorDetails?: string;
}

export default function ErrorLayout({ icon, title, description, code, backText, reset, errorDetails }: ErrorLayoutProps) {
    const t = useTranslations("Errors");
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decorative Animated Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/10 rounded-full blur-[120px]"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg w-full text-center space-y-8 relative glassmorphism p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-2xl"
            >
                <div className="relative inline-block">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.1
                        }}
                        className="text-[10rem] font-black text-primary/5 select-none leading-none tracking-tighter"
                    >
                        {code}
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            initial={{ rotate: -20, opacity: 0, scale: 0.5 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: 0.2
                            }}
                            className="bg-primary/10 p-6 rounded-3xl backdrop-blur-xl border border-primary/20 shadow-inner"
                        >
                            <div className="text-primary w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                                {icon}
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl antialiased">
                        {title}
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium max-w-sm mx-auto">
                        {description}
                    </p>
                </div>

                {errorDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-destructive/5 border border-destructive/10 rounded-2xl p-4 text-xs font-mono text-destructive/80 overflow-hidden"
                    >
                        <p className="font-bold uppercase tracking-wider mb-2 opacity-50">{t("errorDetails")}</p>
                        <div className="max-h-32 overflow-y-auto custom-scrollbar">
                            {errorDetails}
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                >
                    {reset ? (
                        <Button
                            onClick={reset}
                            size="lg"
                            className="w-full sm:w-auto rounded-2xl px-8 py-6 h-auto text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all group"
                        >
                            <RefreshCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                            {t("retry")}
                        </Button>
                    ) : (
                        <Button asChild size="lg" className="w-full sm:w-auto rounded-2xl px-8 py-6 h-auto text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all group">
                            <Link href="/">
                                <Home className="w-5 h-5 mr-3 group-hover:-translate-y-1 transition-transform" />
                                {backText}
                            </Link>
                        </Button>
                    )}

                    {reset && (
                        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-2xl px-8 py-6 h-auto text-lg font-bold border-white/10 hover:bg-white/5 transition-all">
                            <Link href="/management">
                                <Home className="w-5 h-5 mr-3" />
                                {t("goHome")}
                            </Link>
                        </Button>
                    )}
                </motion.div>
            </motion.div>

            <style jsx global>{`
                .glassmorphism {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
                .dark .glassmorphism {
                    background: rgba(0, 0, 0, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--primary), 0.2);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
