"use client"

import * as React from "react"
import {
    Banknote,
    UserCog,
    LayoutDashboard,
    Package,
    Stethoscope,
    Users,
    Settings,
    Calendar,
    Image,
    FileText,
    DollarSign,
    Shield
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
} from "@/components/ui/sidebar"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/routing"
import Logo from "@/components/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const iconMap = {
    "layout-dashboard": LayoutDashboard,
    "users": Users,
    "stethoscope": Stethoscope,
    "package": Package,
    "image": Image,
    "banknote": Banknote,
    "calendar": Calendar,
    "userCog": UserCog,
    "dollarSign": DollarSign,
    "fileText": FileText,
    "shield": Shield
}

import { MANAGEMENT_NAV_ITEMS } from "@/constants/navigation"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { cn } from "@/lib/utils"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const t = useTranslations("Common")
    const pathname = usePathname()
    const { user, loading } = useSelector((state: RootState) => state.auth)

    return (
        <Sidebar variant="sidebar" collapsible="icon" {...props}>
            <SidebarHeader className="h-16 flex items-center justify-center px-6 border-b border-border/50">
                <Link href="/welcome" className="flex flex-col items-center w-full transition-opacity hover:opacity-80">
                    <Logo className="h-12 w-full max-w-40 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 transition-all duration-300" />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {MANAGEMENT_NAV_ITEMS.map((item) => {
                            const Icon = iconMap[item.iconName as keyof typeof iconMap] || LayoutDashboard
                            const isActive = pathname.includes(item.href)

                            return (
                                <SidebarMenuItem key={item.labelKey}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={t(item.labelKey)}
                                        className="h-10 px-3 rounded-lg transition-all data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                                    >
                                        <Link href={item.href} className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="w-5 h-5" />
                                                <span className="text-sm font-medium">{t(item.labelKey)}</span>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[10px] h-5 px-1.5 min-w-5 flex items-center justify-center rounded-full",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {0}
                                            </Badge>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 flex flex-col gap-4 group-data-[collapsible=icon]:p-2">
                <div className="flex items-center gap-3 p-2 rounded-2xl bg-accent/50 border border-border/50 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:justify-center">
                    <Avatar className="h-11 w-11 rounded-xl border-2 border-background shadow-xs group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9">
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback>{user?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-bold truncate">
                            {loading ? "Loading..." : (user?.full_name || "User")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                            {user?.role || "Staff Member"}
                        </span>
                    </div>
                    <button className="ms-auto p-1 text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <p className="text-[10px] font-medium text-muted-foreground/50 leading-tight">
                        © {new Date().getFullYear()} Roots Clinic<br />
                        Crafted for Excellence
                    </p>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
