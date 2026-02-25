"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { LogOut, Calendar, Search, Bell, HelpCircle, User, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { setSearchQuery } from "@/store/slices/uiSharedSlice"

export function Header() {
    const t = useTranslations("Common")
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const dispatch = useDispatch()
    const searchQuery = useSelector((state: RootState) => state.uiShared.searchQuery)
    const [time, setTime] = useState<Date | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const initialTimer = setTimeout(() => setTime(new Date()), 0)
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => {
            clearTimeout(initialTimer)
            clearInterval(timer)
        }
    }, [])

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            toast.error(error.message)
        } else {
            router.push("/")
        }
    }

    const getPageName = () => {
        if (pathname === "/" || pathname === "/welcome") return "Command Center"
        const parts = pathname.split('/').filter(Boolean)
        const lastPart = parts[parts.length - 1]
        if (!lastPart) return "Command Center"
        if (/^\d+$/.test(lastPart)) return `#${lastPart}`
        return t(lastPart.toLowerCase()) || lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
    }

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-background border-b border-border/50 sticky top-0 z-40 backdrop-blur-md supports-backdrop-filter:bg-background/80">
            <div className="flex items-center gap-4 flex-1">
                <SidebarTrigger className="hover:bg-accent rounded-xl" />
                <div className="h-4 w-px bg-border/60 mx-2" />
                <h1 className="text-xl font-black tracking-tight text-foreground whitespace-nowrap">
                    {getPageName()}
                </h1>

                {/* Search Bar - Center Aligned in flex-1 */}
                <div className="hidden md:flex flex-1 justify-center max-w-xl mx-auto px-8">
                    <div className="relative w-full group">
                        <Search className="absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
                        <Input
                            placeholder="Search patients, records or inventory..."
                            value={searchQuery}
                            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                            className="w-full bg-accent/30 border-none rounded-2xl ps-10 h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Desktop Elements */}
                <div className="hidden lg:flex items-center gap-4 text-sm font-bold text-muted-foreground/60">
                    <div className="flex items-center gap-4 bg-accent/30 px-4 py-1.5 rounded-xl border border-border/20">
                        <div className="flex items-center gap-2 text-foreground/80">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="whitespace-nowrap tabular-nums">
                                {time?.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="w-px h-4 bg-border/60" />
                        <div className="flex items-center gap-2 text-foreground/80">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="whitespace-nowrap tabular-nums uppercase">
                                {time?.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-accent transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2.5 inset-e-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-accent transition-colors">
                        <HelpCircle className="w-5 h-5" />
                    </Button>

                    <div className="w-px h-6 bg-border/60 mx-1" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-accent transition-colors">
                                <User className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-border/50 shadow-2xl">
                            <DropdownMenuLabel className="font-black px-3 py-2">Account Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-1 flex flex-col gap-0.5">
                                <DropdownMenuItem className="rounded-xl gap-2 focus:bg-accent cursor-pointer">
                                    <User className="w-4 h-4" /> Profile
                                </DropdownMenuItem>
                                <div className="flex items-center justify-between px-3 py-1.5 text-sm font-medium">
                                    <span>Theme</span>
                                    <ModeToggle />
                                </div>
                                <div className="flex items-center justify-between px-3 py-1.5 text-sm font-medium">
                                    <span>Language</span>
                                    <LanguageSwitcher />
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="rounded-xl gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer group"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                {t("logout")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
