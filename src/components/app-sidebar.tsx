"use client"

import * as React from "react"
import {
    Banknote,
    FileDigit,
    LayoutDashboard,
    Package,
    Stethoscope,
    Users,
    Settings,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
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
    "file-digit": FileDigit,
    "banknote": Banknote,
}

import { MANAGEMENT_NAV_ITEMS } from "@/constants/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const t = useTranslations("Common")
    const pathname = usePathname()

    return (
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/50" {...props}>
            <SidebarHeader className="h-24 flex items-center justify-center px-4 mt-6">
                <Link href="/welcome" className="flex flex-col items-center w-full transition-opacity hover:opacity-80">
                    <Logo className="h-12 w-full max-w-[160px] group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 transition-all duration-300" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-3 group-data-[collapsible=icon]:hidden text-center w-full">
                        Admin Center
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden px-4">{t("menu")}</SidebarGroupLabel>
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
                                        className="h-12 px-4 rounded-xl transition-all data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                                    >
                                        <Link href={item.href}>
                                            <Icon className="w-6 h-6" />
                                            <span className="font-semibold">{t(item.labelKey)}</span>
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
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-bold truncate">Dr. Sarah Miller</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">System Admin</span>
                    </div>
                    <button className="ml-auto p-1 text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden">
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
