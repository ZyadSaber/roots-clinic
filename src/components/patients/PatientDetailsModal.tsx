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
    ScanLine,
    ImageOff,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import { PatientDetails, PatientSummary } from "@/types/patients"
import { fetchPatientDetails } from "@/services/patients"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import isArrayHasData from "@/lib/isArrayHasData"
import { format } from "date-fns"

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
        insurance_company_name,
        insurance_number,
        total_billed,
        total_paid,
        total_outstanding,
        invoice_count,
        has_critical_alert
    } = selectedPatient

    const t = useTranslations("Patients")

    const { data: patientData, isLoading: loading } = useQuery<PatientDetails>({
        queryKey: ["patientDetails", patient_id],
        queryFn: () => fetchPatientDetails(patient_id),
        enabled: open && !!patient_id,
    });
    const patient: PatientDetails = patientData ?? { alerts: [], visits: [], invoices: [] };

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
        <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-accent/50 transition-colors">
            <div className="p-1.5 rounded-lg bg-primary/5 text-primary shrink-0">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-0.5">
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
            <DialogContent className="sm:max-w-5xl w-[92vw] h-[92vh] p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl flex flex-col">
                <LoadingOverlay loading={loading}>
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
                    <div className="px-6 pt-5 pb-4 bg-linear-to-b from-accent/20 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl shadow-inner shrink-0">
                                {full_name.charAt(0)}
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black tracking-tight">{full_name}</h2>
                                    <Badge
                                        variant="secondary"
                                        className={`rounded-md px-1.5 py-0.5 font-black text-[10px] leading-tight border-none ${is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                    >
                                        {is_active ? t("statuses.active") : t("statuses.inactive")}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs">
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/50">
                                        <User className="w-3 h-3" />
                                        {patient_code}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-accent/50">
                                        {age} {t("details.yearsOld")}, {gender}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                        <div className="px-6">
                            <TabsList className="bg-accent/30 p-1 rounded-xl h-10 w-full justify-start gap-1">
                                <TabsTrigger
                                    value="overview"
                                    className="rounded-lg flex-1 px-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md h-8"
                                >
                                    {t("details.tabs.overview")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="medical"
                                    className="rounded-lg flex-1 px-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md h-8"
                                >
                                    {t("details.tabs.medical")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="visits"
                                    className="rounded-lg flex-1 px-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md h-8"
                                >
                                    {t("details.tabs.visits")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="financial"
                                    className="rounded-lg flex-1 px-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md h-8"
                                >
                                    {t("details.tabs.financial")}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 min-h-0 overflow-hidden">
                            <ScrollArea className="h-full px-6 py-4">
                                {/* Overview Tab */}
                                <TabsContent value="overview" className="m-0 mt-0 space-y-3 pb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                            <div className="p-3 bg-accent/10 border-b border-accent/20">
                                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-primary" />
                                                    {t("details.sections.contact")}
                                                </h3>
                                            </div>
                                            <CardContent className="p-2 grid grid-cols-1 gap-0">
                                                {infoItem(<Phone className="w-4 h-4" />, t("details.labels.phone"), phone)}
                                                {infoItem(<Mail className="w-4 h-4" />, t("details.labels.email"), email)}
                                                {infoItem(<MapPin className="w-4 h-4" />, t("details.labels.address"), address)}
                                            </CardContent>
                                        </Card>

                                        <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                            <div className="p-3 bg-accent/10 border-b border-accent/20">
                                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <User className="w-4 h-4 text-primary" />
                                                    {t("details.sections.emergency")}
                                                </h3>
                                            </div>
                                            <CardContent className="p-2 grid grid-cols-1 gap-0">
                                                {infoItem(<User className="w-4 h-4" />, t("details.labels.emergencyName"), emergency_contact_name)}
                                                {infoItem(<Phone className="w-4 h-4" />, t("details.labels.emergencyPhone"), emergency_contact_phone)}
                                            </CardContent>
                                        </Card>

                                        <Card className="rounded-3xl border-none bg-accent/5 col-span-1 md:col-span-2 overflow-hidden shadow-none">
                                            <div className="p-3 bg-accent/10 border-b border-accent/20">
                                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-primary" />
                                                    {t("details.sections.insurance")}
                                                </h3>
                                            </div>
                                            <CardContent className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-0">
                                                {infoItem(<Shield className="w-4 h-4" />, t("details.labels.provider"), insurance_company_name)}
                                                {infoItem(<ClipboardList className="w-4 h-4" />, t("details.labels.insuranceNumber"), insurance_number)}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* Medical Tab */}
                                <TabsContent value="medical" className="m-0 mt-0 space-y-3 pb-6">
                                    {/* Medical Flags */}
                                    <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                        <CardContent>
                                            <div className="space-y-4">
                                                {isArrayHasData(patient.alerts) ? (
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
                                <TabsContent value="visits" className="m-0 mt-0 space-y-3 pb-6">
                                    {isArrayHasData(patient.visits) ? (
                                        patient.visits.map((visit) => (
                                            <Card key={visit.id} className="rounded-3xl border-none bg-accent/5 overflow-hidden shadow-none">
                                                <div className="p-3 flex items-center justify-between border-b border-accent/20 bg-accent/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-widest">
                                                                {format(visit.created_at, "EEEE, dd MMM yyyy")}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                                <Stethoscope className="w-3 h-3" />
                                                                {visit.doctor_name}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                                {visit.doctor_specialty}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {visit.follow_up_date && (
                                                        <Badge variant="outline" className="rounded-full gap-1.5 px-3 py-1 font-bold text-[10px] bg-background">
                                                            <Clock className="w-3 h-3 text-primary" />
                                                            {t("details.labels.followUp")}: {format(visit.follow_up_date, "dd/MM/yyyy")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardContent className="p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                    {isArrayHasData(visit.assets) && (
                                                        <div className="mt-4 space-y-2">
                                                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                                                                <ScanLine className="w-3.5 h-3.5" />
                                                                {t("details.labels.radiology")}
                                                            </p>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                                {visit.assets.map((asset) => (
                                                                    <a
                                                                        key={asset.id}
                                                                        href={asset.image_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="group relative aspect-square rounded-2xl overflow-hidden border border-border/50 bg-background hover:border-primary/40 transition-colors"
                                                                    >
                                                                        <img
                                                                            src={asset.image_url}
                                                                            alt={asset.image_type}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                            onError={(e) => {
                                                                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                                                                (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove("hidden");
                                                                            }}
                                                                        />
                                                                        <div className="hidden absolute inset-0 flex items-center justify-center bg-accent/30">
                                                                            <ImageOff className="w-6 h-6 text-muted-foreground" />
                                                                        </div>
                                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white leading-tight">
                                                                                {asset.image_type}
                                                                            </p>
                                                                            {asset.notes && (
                                                                                <p className="text-[9px] text-white/70 truncate">{asset.notes}</p>
                                                                            )}
                                                                        </div>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
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
                                <TabsContent value="financial" className="m-0 mt-0 space-y-3 pb-6">
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
                                                <CardContent className="p-4 space-y-2">
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
                                                        {isArrayHasData(patient.invoices) ? (
                                                            patient.invoices.map((invoice) => (
                                                                <TableRow key={invoice.id} className="hover:bg-accent/20 border-border/40">
                                                                    <TableCell className="font-bold pl-6 text-sm underline decoration-primary/30 underline-offset-4 cursor-pointer hover:text-primary transition-colors">
                                                                        #{invoice.invoice_number}
                                                                    </TableCell>
                                                                    <TableCell className="text-muted-foreground font-bold text-xs">
                                                                        {format(invoice.created_at, "dd-MM-yyyy")}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className={`rounded-lg px-2 py-0.5 font-black text-[10px] uppercase border-none 
                                                                                ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
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
                        </div>
                    </Tabs>
                </LoadingOverlay>

            </DialogContent>
        </Dialog>
    )
}
