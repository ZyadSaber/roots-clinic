"use client"

import { useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    User,
    Phone,
    Mail,
    MapPin,
    Shield,
    AlertCircle,
    Activity,
    ClipboardList,
    CreditCard,
    Heart,
    Thermometer,
    Weight,
    Stethoscope,
    Calendar,
    CheckCircle2,
    Clock,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import { PatientDetails, PatientSummary } from "@/types/patients"
import { fetchPatientDetails } from "@/services/patients"

interface PatientDetailsModalProps {
    selectedPatient: PatientSummary
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PatientDetailsModal({
    selectedPatient,
    open,
    onOpenChange,
}: PatientDetailsModalProps) {

    const {
        patient_id,
        full_name,
        is_active,
        patient_code,
        age,
        gender,
        phone,
        email,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        insurance_provider,
        insurance_number,
        total_billed,
        total_paid,
        total_outstanding,
        invoice_count,
        has_critical_alert
    } = selectedPatient

    const t = useTranslations("Patients")

    const { data: patient, isLoading: loading } = useQuery<PatientDetails | null>({
        queryKey: ["patientDetails", patient_id],
        queryFn: () => fetchPatientDetails(patient_id),
        enabled: open && !!patient_id,
    });

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "high":
                return "bg-red-100 text-red-700 border-red-200"
            case "medium":
                return "bg-orange-100 text-orange-700 border-orange-200"
            case "low":
                return "bg-green-100 text-green-700 border-green-200"
            default:
                return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    const infoItem = (icon: React.ReactNode, label: string, value: string | null | number | undefined) => (
        <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-accent/50 transition-colors">
            <div className="mt-1 p-2 rounded-xl bg-primary/5 text-primary">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1.5">
                    {label}
                </span>
                <span className="text-sm font-bold text-foreground">
                    {value || "—"}
                </span>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl w-[92vw] h-[92vh] p-0 gap-0 overflow-hidden rounded-[2rem] sm:rounded-[3rem] border-none shadow-2xl flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Clock className="w-8 h-8 text-primary/40" />
                        </motion.div>
                    </div>
                ) : patient ? (
                    <>
                        {/* Critical Alert Banner */}
                        <AnimatePresence>
                            {has_critical_alert && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="bg-destructive text-destructive-foreground px-6 py-2 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest z-50 overflow-hidden"
                                >
                                    <AlertCircle className="w-4 h-4 animate-pulse" />
                                    {t("details.criticalAlertDetected")}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Modal Header */}
                        <div className="px-8 pt-8 pb-6 bg-linear-to-b from-accent/20 to-transparent">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-black text-3xl shadow-inner">
                                        {full_name.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-black tracking-tight">{full_name}</h2>
                                            <Badge
                                                variant="secondary"
                                                className={`rounded-lg px-2 py-0.5 font-black text-[10px] leading-tight border-none ${is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {is_active ? t("statuses.active") : t("statuses.inactive")}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-muted-foreground font-bold text-sm">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/50">
                                                <User className="w-3.5 h-3.5" />
                                                {patient_code}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full bg-accent/50">
                                                {age} {t("details.yearsOld")}, {gender}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                            <div className="px-8">
                                <TabsList className="bg-accent/30 p-1.5 rounded-2xl h-14 w-full justify-start gap-1">
                                    <TabsTrigger
                                        value="overview"
                                        className="rounded-xl flex-1 px-4 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
                                    >
                                        {t("details.tabs.overview")}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="medical"
                                        className="rounded-xl flex-1 px-4 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
                                    >
                                        {t("details.tabs.medical")}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="visits"
                                        className="rounded-xl flex-1 px-4 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
                                    >
                                        {t("details.tabs.visits")}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="financial"
                                        className="rounded-xl flex-1 px-4 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
                                    >
                                        {t("details.tabs.financial")}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 px-8 py-6">
                                {/* Overview Tab */}
                                <TabsContent value="overview" className="m-0 mt-0 space-y-6 pb-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                            <div className="p-4 bg-accent/10 border-b border-accent/20">
                                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-primary" />
                                                    {t("details.sections.contact")}
                                                </h3>
                                            </div>
                                            <CardContent className="p-4 grid grid-cols-1 gap-1">
                                                {infoItem(<Phone className="w-4 h-4" />, t("details.labels.phone"), phone)}
                                                {infoItem(<Mail className="w-4 h-4" />, t("details.labels.email"), email)}
                                                {infoItem(<MapPin className="w-4 h-4" />, t("details.labels.address"), address)}
                                            </CardContent>
                                        </Card>

                                        <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                            <div className="p-4 bg-accent/10 border-b border-accent/20">
                                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <User className="w-4 h-4 text-primary" />
                                                    {t("details.sections.emergency")}
                                                </h3>
                                            </div>
                                            <CardContent className="p-4 grid grid-cols-1 gap-1">
                                                {infoItem(<User className="w-4 h-4" />, t("details.labels.emergencyName"), emergency_contact_name)}
                                                {infoItem(<Phone className="w-4 h-4" />, t("details.labels.emergencyPhone"), emergency_contact_phone)}
                                            </CardContent>
                                        </Card>

                                        <Card className="rounded-3xl border-none bg-accent/5 col-span-1 md:col-span-2 overflow-hidden shadow-none">
                                            <div className="p-4 bg-accent/10 border-b border-accent/20">
                                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-primary" />
                                                    {t("details.sections.insurance")}
                                                </h3>
                                            </div>
                                            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {infoItem(<Shield className="w-4 h-4" />, t("details.labels.provider"), insurance_provider)}
                                                {infoItem(<ClipboardList className="w-4 h-4" />, t("details.labels.insuranceNumber"), insurance_number)}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* Medical Tab */}
                                <TabsContent value="medical" className="m-0 mt-0 space-y-6 pb-12">
                                    {/* Latest Vitals */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            {
                                                label: t("details.labels.bloodPressure"),
                                                value: patient.vitals[0]?.blood_pressure,
                                                icon: <Activity className="w-5 h-5" />,
                                                color: "text-blue-600",
                                                bg: "bg-blue-50",
                                            },
                                            {
                                                label: t("details.labels.heartRate"),
                                                value: patient.vitals[0]?.heart_rate ? `${patient.vitals[0].heart_rate} bpm` : null,
                                                icon: <Heart className="w-5 h-5" />,
                                                color: "text-red-600",
                                                bg: "bg-red-50",
                                            },
                                            {
                                                label: t("details.labels.temperature"),
                                                value: patient.vitals[0]?.temperature ? `${patient.vitals[0].temperature}°C` : null,
                                                icon: <Thermometer className="w-5 h-5" />,
                                                color: "text-orange-600",
                                                bg: "bg-orange-50",
                                            },
                                            {
                                                label: t("details.labels.weight"),
                                                value: patient.vitals[0]?.weight ? `${patient.vitals[0].weight} kg` : null,
                                                icon: <Weight className="w-5 h-5" />,
                                                color: "text-purple-600",
                                                bg: "bg-purple-50",
                                            },
                                        ].map((vital, i) => (
                                            <Card key={i} className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                                <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                                                    <div className={`p-3 rounded-2xl ${vital.bg} ${vital.color}`}>
                                                        {vital.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">
                                                            {vital.label}
                                                        </p>
                                                        <p className="text-lg font-black tabular-nums">{vital.value || "—"}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Medical Flags */}
                                    <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                        <div className="p-4 bg-accent/10 border-b border-accent/20">
                                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-primary" />
                                                {t("details.sections.medicalFlags")}
                                            </h3>
                                        </div>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {patient.alerts.length > 0 ? (
                                                    patient.alerts.map((alert) => (
                                                        <div key={alert.id} className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border/50">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-xl bg-accent text-accent-foreground">
                                                                    <AlertCircle className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold">{alert.description}</p>
                                                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                                                                        {alert.alert_type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                className={`rounded-lg px-2.5 py-1 font-black text-[10px] uppercase tracking-wider border ${getSeverityColor(alert.severity)}`}
                                                            >
                                                                {alert.severity}
                                                            </Badge>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-8 text-center">
                                                        <p className="text-muted-foreground font-bold">{t("details.noMedicalFlags")}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Visits Tab */}
                                <TabsContent value="visits" className="m-0 mt-0 space-y-4 pb-12">
                                    {patient.visits.length > 0 ? (
                                        patient.visits.map((visit) => (
                                            <Card key={visit.id} className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                                <div className="p-4 flex items-center justify-between border-b border-accent/20 bg-accent/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-widest">
                                                                {new Date(visit.created_at).toLocaleDateString(undefined, {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                                <Stethoscope className="w-3 h-3" />
                                                                {visit.doctor_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {visit.follow_up_date && (
                                                        <Badge variant="outline" className="rounded-full gap-1.5 px-3 py-1 font-bold text-[10px] bg-background">
                                                            <Clock className="w-3 h-3 text-primary" />
                                                            {t("details.labels.followUp")}: {new Date(visit.follow_up_date).toLocaleDateString()}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardContent className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                                                                    <Activity className="w-3.5 h-3.5" />
                                                                    {t("details.labels.diagnosis")}
                                                                </p>
                                                                <p className="text-sm font-bold bg-background p-3 rounded-2xl border border-border/50">
                                                                    {visit.diagnosis || t("details.noDiagnosis")}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                                                                    <Stethoscope className="w-3.5 h-3.5" />
                                                                    {t("details.labels.procedure")}
                                                                </p>
                                                                <p className="text-sm font-bold bg-background p-3 rounded-2xl border border-border/50">
                                                                    {visit.procedure_done || t("details.noProcedure")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                                                                    <ClipboardList className="w-3.5 h-3.5" />
                                                                    {t("details.labels.prescription")}
                                                                </p>
                                                                <p className="text-sm font-bold bg-background p-3 rounded-2xl border border-border/50 whitespace-pre-wrap min-h-25">
                                                                    {visit.prescription || t("details.noPrescription")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center space-y-4 bg-accent/5 rounded-[2.5rem]">
                                            <div className="mx-auto w-16 h-16 rounded-3xl bg-accent flex items-center justify-center text-muted-foreground">
                                                <Calendar className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{t("details.noVisits")}</p>
                                                <p className="text-muted-foreground font-medium">{t("details.noVisitsDesc")}</p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Financial Tab */}
                                <TabsContent value="financial" className="m-0 mt-0 space-y-6 pb-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            {
                                                label: t("details.labels.totalBilled"),
                                                value: total_billed,
                                                icon: <CreditCard className="w-5 h-5" />,
                                                color: "text-foreground",
                                            },
                                            {
                                                label: t("details.labels.totalPaid"),
                                                value: total_paid,
                                                icon: <CheckCircle2 className="w-5 h-5" />,
                                                color: "text-green-600",
                                            },
                                            {
                                                label: t("details.labels.outstanding"),
                                                value: total_outstanding,
                                                icon: <AlertCircle className="w-5 h-5" />,
                                                color: "text-destructive",
                                            },
                                            {
                                                label: t("details.labels.invoiceCount"),
                                                value: invoice_count,
                                                icon: <ClipboardList className="w-5 h-5" />,
                                                color: "text-primary",
                                            },
                                        ].map((fin, i) => (
                                            <Card key={i} className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                                <CardContent className="p-6 space-y-2">
                                                    <div className={`p-3 w-fit rounded-2xl bg-background border border-border/50 ${fin.color}`}>
                                                        {fin.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">
                                                            {fin.label}
                                                        </p>
                                                        <p className={`text-2xl font-black tabular-nums ${fin.color}`}>
                                                            {typeof fin.value === 'number' && fin.label !== t("details.labels.invoiceCount")
                                                                ? `$${fin.value.toLocaleString()}`
                                                                : fin.value}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Billing History Table */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-1">
                                            <ClipboardList className="w-4 h-4 text-primary" />
                                            {t("details.sections.billingHistory")}
                                        </h3>
                                        <Card className="rounded-[2rem] border-none bg-accent/5 overflow-hidden shadow-none">
                                            <CardContent className="p-0">
                                                <Table>
                                                    <TableHeader className="bg-accent/10">
                                                        <TableRow className="hover:bg-transparent border-border/40">
                                                            <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">{t("details.labels.invoiceNumber")}</TableHead>
                                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">{t("details.labels.date")}</TableHead>
                                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">{t("details.labels.status")}</TableHead>
                                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">{t("details.labels.total")}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {patient.invoices && patient.invoices.length > 0 ? (
                                                            patient.invoices.map((invoice) => (
                                                                <TableRow key={invoice.id} className="hover:bg-accent/20 border-border/40">
                                                                    <TableCell className="font-bold pl-6 text-sm underline decoration-primary/30 underline-offset-4 cursor-pointer hover:text-primary transition-colors">
                                                                        #{invoice.invoice_number}
                                                                    </TableCell>
                                                                    <TableCell className="text-muted-foreground font-bold text-xs">
                                                                        {new Date(invoice.created_at).toLocaleDateString()}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className={`rounded-lg px-2 py-0.5 font-black text-[10px] uppercase border-none ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                                invoice.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                                                                                    'bg-red-100 text-red-700'
                                                                                }`}
                                                                        >
                                                                            {invoice.status}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right pr-6 font-black tabular-nums">
                                                                        ${invoice.total.toLocaleString()}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={4} className="h-24 text-center font-bold text-muted-foreground">
                                                                    {t("details.noInvoices")}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
