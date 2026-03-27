"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Plus,
    MoreHorizontal,
    Shield,
    ShieldCheck,
    ShieldAlert,
    Edit,
    Trash2,
    Key,
    UserCheck,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { User } from "@/types/staff"
import { MANAGEMENT_NAV_ITEMS } from "@/constants/navigation"
import { RootState } from "@/store/store"
import { useDispatch, useSelector } from "react-redux"
import { SelectField } from "../ui/select"
import { setStatusFilter, setRoleFilter, UsersFilter, setSelectedUserId } from "@/store/slices/staff"
import { Module } from "@/types/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteUser, updateUserPermissions } from "@/services/staff"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import AddUserDialog from "./AddUserDialog"
import StaffUpdateDialog from "./StaffUpdateDialog"
import ResetPasswordDialog from "./ResetPasswordDialog"
import { useVisibility } from "@/hooks"

const roleColors: Record<string, string> = {
    admin: "bg-destructive/20 text-destructive",
    doctor: "bg-primary/20 text-primary",
    receptionist: "bg-chart-5/20 text-chart-5",
    finance: "bg-chart-4/20 text-chart-4",
}

const roleIcons: Record<string, React.ReactNode> = {
    admin: <ShieldAlert className="w-4 h-4" />,
    doctor: <ShieldCheck className="w-4 h-4" />,
    receptionist: <Shield className="w-4 h-4" />,
    finance: <Shield className="w-4 h-4" />,
}

const UsersModule = ({ staff }: { staff: User[] }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const { visible, handleStateChange, handleClose, handleOpen } = useVisibility()
    const { visible: editVisible, handleStateChange: handleEditStateChange, handleClose: handleEditClose, handleOpen: handleEditOpen } = useVisibility()
    const { visible: resetVisible, handleStateChange: handleResetStateChange, handleClose: handleResetClose, handleOpen: handleResetOpen } = useVisibility()

    const tCommon = useTranslations("Common")
    const t = useTranslations("Users")
    const tNav = useTranslations("Routes")
    const dispatch = useDispatch()

    const status = useSelector((state: RootState) => state.staff.filter.status)
    const role = useSelector((state: RootState) => state.staff.filter.role)

    const handleSelectUser = (user: User) => () => {
        dispatch(setSelectedUserId(user.id))
        setSelectedUser(user)
    }

    const queryClient = useQueryClient()

    const { mutate, isPending: loading } = useMutation({
        mutationFn: () =>
            updateUserPermissions(selectedUser!.id, selectedUser!.permissions),
        onSuccess: (res) => {
            if (!res || !res.success) {
                return toast.error(tCommon("error"))
            }
            queryClient.invalidateQueries({ queryKey: ['staff'] })
            toast.success(tCommon("success"))
        },
        onError: () => toast.error(tCommon("error"))
    })

    const handleTogglePermission = (moduleId: Module) => (checked: boolean) => {
        if (!selectedUser) return;

        setSelectedUser(prev => {
            if (!prev) return null;
            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [moduleId]: checked
                }
            }
        });
    }

    const statusOptions = [
        { key: "all", label: t("all") },
        { key: "active", label: t("active") },
        { key: "inactive", label: t("inactive") },
    ]

    const roleOptions = [
        { key: "all", label: t("all") },
        { key: "admin", label: t("admin") },
        { key: "doctor", label: t("doctor") },
        { key: "receptionist", label: t("receptionist") },
        { key: "finance", label: t("finance") },
    ]

    const { mutate: deleteStaff, isPending: isDeleting } = useMutation({
        mutationFn: (id: string) => deleteUser(id),
        onSuccess: (res) => {
            if (!res || !res.success) {
                toast.error(tCommon("error"))
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['staff'] })
            toast.success(tCommon("success"))
        },
        onError: () => toast.error(tCommon("error"))
    })

    const handleDelete = (id: string) => () => {
        deleteStaff(id)
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col space-y-6 p-8 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{tNav("usersTitle")}</h2>
                    <p className="text-sm text-muted-foreground">{tNav("usersDesc")}</p>
                </div>
                <div className="flex items-end gap-2">
                    <SelectField
                        options={statusOptions}
                        label={t("status")}
                        placeholder={t("status")}
                        onValueChange={(v) => dispatch(setStatusFilter(v as UsersFilter))}
                        name="status"
                        containerClassName="w-36"
                        value={status}
                        hideClear
                    />
                    <SelectField
                        options={roleOptions}
                        label={t("role")}
                        placeholder={t("role")}
                        onValueChange={(v) => dispatch(setRoleFilter(v))}
                        name="role"
                        containerClassName="w-48"
                        value={role}
                        hideClear
                    />
                    <Button
                        onClick={handleOpen}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("addUser")}
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Users Table */}
                <div className="lg:col-span-3 flex flex-col min-h-0 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="text-muted-foreground text-start">{t("user")}</TableHead>
                                    <TableHead className="text-muted-foreground text-start">{t("phone")}</TableHead>
                                    <TableHead className="text-muted-foreground text-start">{t("role")}</TableHead>
                                    <TableHead className="text-muted-foreground hidden md:table-cell text-start">{t("department")}</TableHead>
                                    <TableHead className="text-muted-foreground hidden lg:table-cell text-start">{t("lastActive")}</TableHead>
                                    <TableHead className="text-muted-foreground text-start">{t("status")}</TableHead>
                                    <TableHead className="text-muted-foreground text-end">{tCommon("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staff.map((user) => (
                                    <TableRow key={user.id} onClick={handleSelectUser(user)} className={cn("border-border hover:bg-secondary/50", selectedUser?.id === user.id && "bg-primary/20")}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                                        {user.full_name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-foreground">{user.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email ? user.username : ""}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {user.phone}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={roleColors[user.role]}>
                                                <span className="flex items-center gap-1">
                                                    {roleIcons[user.role]}
                                                    {t(user.role)}
                                                </span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {user.specialty}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : t("never")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    user.is_active
                                                        ? "bg-primary/20 text-primary"
                                                        : "bg-muted text-muted-foreground"
                                                }
                                            >
                                                {user.is_active ? t("active") : t("inactive")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!!user.email ? (
                                                        <>
                                                            <DropdownMenuItem onClick={handleEditOpen} disabled={user.role === "doctor"}>
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                {t("editUser")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={handleResetOpen}>
                                                                <Key className="w-4 h-4 mr-2" />
                                                                {t("resetPassword")}
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => { }}>
                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                            {t("activateUser")}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="text-destructive" onClick={handleDelete(user.id)} disabled={isDeleting}>
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        {t("deactivateUser")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>


                {/* Permissions Panel */}
                <Card className="bg-card border-border flex flex-col h-full overflow-hidden">
                    <CardHeader className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-foreground">{t("permissions")}</CardTitle>
                            <CardDescription>
                                {t("permissionsDesc")}
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => mutate()}
                            disabled={loading || !selectedUser}
                        >
                            {t("editPermissions")}
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            {MANAGEMENT_NAV_ITEMS.map((perm) => (
                                <div key={perm.href} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{tNav(perm.labelKey)}</p>
                                        <p className="text-xs text-muted-foreground">{tNav(perm.descriptionKey)}</p>
                                    </div>
                                    <Switch
                                        checked={selectedUser?.permissions[perm.href] || false}
                                        onCheckedChange={handleTogglePermission(perm.href)}
                                        disabled={!selectedUser}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {visible && <AddUserDialog
                open={visible}
                onOpenChange={handleStateChange}
                handleClose={handleClose}
            />}

            {editVisible && <StaffUpdateDialog
                open={editVisible}
                onOpenChange={handleEditStateChange}
                user={selectedUser}
                handleClose={handleEditClose}
            />}

            {resetVisible && <ResetPasswordDialog
                open={resetVisible}
                onOpenChange={handleResetStateChange}
                user={selectedUser!}
                handleClose={handleResetClose}
            />}
        </div>
    )
}

export default UsersModule