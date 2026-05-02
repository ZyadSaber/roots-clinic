"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { SelectField } from "@/components/ui/select"
import { LabeledCheckBox } from "@/components/ui/checkbox"
import {
    Plus,
    MoreHorizontal,
    FileText,
    Calendar,
    Phone,
    Mail,
    Eye,
    Edit,
    Trash2,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { PatientForm } from "./PatientForm";
import { PatientDetailsModal } from "./PatientDetailsModal";
import { MedicalHistoryModal } from "./MedicalHistoryModal";
import { PatientStats, PatientSummary } from "@/types/patients"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { useDispatch } from "react-redux"
import { setSelectedPatient, setBookingPatient, setPatientFilters } from "@/store/slices/patientSlice"
import { useVisibility } from "@/hooks"
import { useRouter } from "next/navigation"
import { getGenderList } from "@/constants/gender"
import { deletePatient } from "@/services/patients"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface PatientsModuleProps {
    stats: PatientStats;
    patients: PatientSummary[];
}

export function PatientsModule({ patients, stats }: PatientsModuleProps) {
    const t = useTranslations("Patients")
    const tc = useTranslations("Common")
    const tForm = useTranslations("Patients.form")
    const tTitle = useTranslations("Routes")
    const dispatch = useDispatch()
    const selectedPatientId = useSelector((state: RootState) => state.patients.selectedPatientId)
    const selectedPatient = patients.find(d => d.patient_id === selectedPatientId);
    const criticalAlert = useSelector((state: RootState) => state.patients.filters.hasCriticalAlert)
    const insured = useSelector((state: RootState) => state.patients.filters.hasInsurance)
    const gender = useSelector((state: RootState) => state.patients.filters.gender)
    const router = useRouter();
    const locale = useLocale();

    const {
        visible: isDetailsVisible,
        handleOpen: handleOpenDetails,
        handleClose: handleCloseDetails
    } = useVisibility();
    const {
        visible: isHistoryVisible,
        handleOpen: handleOpenHistory,
        handleClose: handleCloseHistory
    } = useVisibility();
    const {
        visible: isFormVisible,
        handleOpen: handleOpenForm,
        handleClose: handleCloseForm
    } = useVisibility();

    const handleOpenAppointment = (patientId: string, fullName: string) => () => {
        dispatch(setBookingPatient({ patient_id: patientId, patient_name: fullName }))
        router.push(`/${locale}/appointments`);
    }

    const queryClient = useQueryClient();
    const { mutate: mutateDelete } = useMutation({
        mutationFn: (patientId: string) => deletePatient(patientId),
        onSuccess: (res) => {
            if (res?.success) {
                toast.success(tc("success"));
                queryClient.invalidateQueries({ queryKey: ['patients'] });
            } else {
                toast.error(tc("error"));
            }
        },
        onError: () => toast.error(tc("error"))
    });

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-8 gap-6 overflow-hidden">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">{tTitle("patientsTitle")}</h1>
                    <p className="text-muted-foreground font-medium">{tTitle("patientsDesc")}</p>
                </div>
                <div className="flex items-end gap-3 w-full sm:w-auto">
                    <LabeledCheckBox
                        label="hasInsurance"
                        checked={insured}
                        onCheckedChange={(checked: boolean) => dispatch(setPatientFilters({ hasInsurance: checked }))}
                    />
                    <LabeledCheckBox
                        label="hasCriticalAlert"
                        checked={criticalAlert}
                        onCheckedChange={(checked: boolean) => dispatch(setPatientFilters({ hasCriticalAlert: checked }))}
                    />
                    <SelectField
                        options={getGenderList(tForm, true)}
                        label={tForm("fields.gender")}
                        placeholder={tForm("placeholders.selectGender")}
                        onValueChange={(v) => dispatch(setPatientFilters({ gender: v as "male" | "female" | "all" }))}
                        name="gender"
                        containerClassName="w-62"
                        value={gender}
                        hideClear
                    />
                    <Button
                        className="rounded-xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20"
                        onClick={handleOpenForm}
                    >
                        <Plus className="w-5 h-5" />
                        {t("addPatient")}
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: t("totalPatients"), value: stats.total, color: "text-foreground" },
                    { label: t("newThisMonth"), value: stats.newThisMonth, color: "text-primary" },
                    { label: t("insured"), value: stats.insured, color: "text-foreground" },
                    { label: t("critical"), value: stats.critical, color: "text-destructive" },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-3xl  border-border/50 shadow-sm border-none bg-background">
                        <CardContent className="p-6">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-3xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Patients Table */}
            <Card className="flex-1 rounded-[2.5rem] h-full border-none shadow-xl shadow-black/5 overflow-hidden bg-background flex flex-col min-h-0">
                <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow className="border-border/40 hover:bg-transparent px-8">
                                    <TableHead className="text-start px-8 font-black uppercase text-[10px] tracking-widest">{t("table.patient")}</TableHead>
                                    <TableHead className="text-start font-black uppercase text-[10px] tracking-widest">{t("table.id")}</TableHead>
                                    <TableHead className="hidden md:table-cell text-start font-black uppercase text-[10px] tracking-widest">{t("table.contact")}</TableHead>
                                    <TableHead className="hidden lg:table-cell text-start font-black uppercase text-[10px] tracking-widest">{t("table.ageGender")}</TableHead>
                                    <TableHead className="text-start font-black uppercase text-[10px] tracking-widest">{t("table.condition")}</TableHead>
                                    <TableHead className="text-start font-black uppercase text-[10px] tracking-widest">{t("table.status")}</TableHead>
                                    <TableHead className="text-start hidden sm:table-cell font-black uppercase text-[10px] tracking-widest">{t("table.lastVisit")}</TableHead>
                                    <TableHead className="text-end px-8 font-black uppercase text-[10px] tracking-widest">{t("table.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patients.map((patient) => (
                                    <TableRow
                                        key={patient.patient_id}
                                        onDoubleClick={handleOpenDetails}
                                        className="border-border/40 hover:bg-accent/20 transition-colors"
                                        onClick={() => dispatch(setSelectedPatient(patient.patient_id))}
                                    >
                                        <TableCell className="px-8 py-4">
                                            <span className="font-bold text-foreground">{patient.full_name}</span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-bold text-sm">
                                            {patient.patient_code}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <Mail className="w-3 h-3 text-primary/60" />
                                                    {patient.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <Phone className="w-3 h-3 text-primary/60" />
                                                    {patient.phone}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-muted-foreground font-bold">
                                            {patient.age} / {patient.gender}
                                        </TableCell>
                                        <TableCell className="text-foreground font-bold">{patient.last_diagnosis}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`rounded-lg px-2 py-0.5 font-black text-[10px] leading-tight border-none ${patient.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {patient.is_active ? t("statuses.active") : t("statuses.inactive", { defaultValue: "Inactive" })}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground font-bold tabular-nums">
                                            {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-end px-8" >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl border-border/50 shadow-xl p-2 min-w-45">
                                                    <DropdownMenuItem
                                                        className="rounded-xl gap-2 font-bold cursor-pointer"
                                                        onClick={handleOpenDetails}
                                                    >
                                                        <Eye className="w-4 h-4 text-primary/60" />
                                                        {t("actions.viewDetails")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="rounded-xl gap-2 font-bold cursor-pointer"
                                                        onClick={handleOpenForm}
                                                    >
                                                        <Edit className="w-4 h-4 text-primary/60" />
                                                        {t("actions.editRecord")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="rounded-xl gap-2 font-bold cursor-pointer"
                                                        onClick={handleOpenHistory}
                                                    >
                                                        <FileText className="w-4 h-4 text-primary/60" />
                                                        {t("actions.medicalHistory")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="rounded-xl gap-2 font-bold cursor-pointer"
                                                        onClick={handleOpenAppointment(patient.patient_id, patient.full_name)}
                                                    >
                                                        <Calendar className="w-4 h-4 text-primary/60" />
                                                        {t("actions.bookAppointment")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="rounded-xl gap-2 font-bold cursor-pointer text-destructive focus:text-destructive"
                                                        onClick={() => mutateDelete(patient.patient_id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        {t("actions.deleteRecord")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {isFormVisible &&
                <PatientForm
                    open={isFormVisible}
                    onClose={handleCloseForm}
                    selectedPatient={selectedPatient}
                />
            }

            {isDetailsVisible && selectedPatient &&
                <PatientDetailsModal
                    selectedPatient={selectedPatient}
                    open={isDetailsVisible}
                    onOpenChange={handleCloseDetails}
                />}

            {isHistoryVisible && selectedPatient &&
                <MedicalHistoryModal
                    selectedPatient={selectedPatient}
                    open={isHistoryVisible}
                    onOpenChange={handleCloseHistory}
                />}
        </div>
    )
}
