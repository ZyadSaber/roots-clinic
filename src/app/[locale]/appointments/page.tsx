"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Textarea from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Plus,
    Clock,
    User,
    Stethoscope,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Calendar as CalendarIcon,
    Phone,
    Mail,
    Check,
} from "lucide-react"
import { PatientForm } from "@/components/patients/PatientForm"
import { PatientSummary } from "@/types/patients"

interface Appointment {
    id: number
    patient: string
    patientId: string
    doctor: string
    time: string
    duration: string
    type: string
    status: string
    notes?: string
}

const initialAppointments: Appointment[] = [
    {
        id: 1,
        patient: "John Smith",
        patientId: "P001",
        doctor: "Dr. Sarah Wilson",
        time: "09:00 AM",
        duration: "30 min",
        type: "Check-up",
        status: "Completed",
    },
    {
        id: 2,
        patient: "Emma Johnson",
        patientId: "P002",
        doctor: "Dr. Michael Chen",
        time: "09:30 AM",
        duration: "45 min",
        type: "X-Ray Review",
        status: "In Progress",
    },
    {
        id: 3,
        patient: "Michael Brown",
        patientId: "P003",
        doctor: "Dr. Sarah Wilson",
        time: "10:15 AM",
        duration: "30 min",
        type: "Consultation",
        status: "Waiting",
    },
    {
        id: 4,
        patient: "Sarah Davis",
        patientId: "P004",
        doctor: "Dr. Aisha Patel",
        time: "11:00 AM",
        duration: "60 min",
        type: "Surgery Prep",
        status: "Scheduled",
    },
    {
        id: 5,
        patient: "James Wilson",
        patientId: "P005",
        doctor: "Dr. Michael Chen",
        time: "02:00 PM",
        duration: "30 min",
        type: "Follow-up",
        status: "Scheduled",
    },
    {
        id: 6,
        patient: "Lisa Anderson",
        patientId: "P006",
        doctor: "Dr. Sarah Wilson",
        time: "03:00 PM",
        duration: "45 min",
        type: "Lab Results",
        status: "Scheduled",
    },
]

const doctors = [
    { id: "D001", name: "Dr. Sarah Wilson", specialty: "General Practice" },
    { id: "D002", name: "Dr. Michael Chen", specialty: "Radiology" },
    { id: "D003", name: "Dr. Aisha Patel", specialty: "Surgery" },
    { id: "D004", name: "Dr. David Kim", specialty: "Cardiology" },
]

const appointmentTypes = [
    "Check-up",
    "Consultation",
    "Follow-up",
    "X-Ray Review",
    "Lab Results",
    "Surgery Prep",
    "Emergency",
    "Vaccination",
]

const durations = ["15 min", "30 min", "45 min", "60 min", "90 min"]

const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
]

const statusColors: Record<string, string> = {
    Completed: "bg-primary/20 text-primary",
    "In Progress": "bg-chart-3/20 text-chart-3",
    Waiting: "bg-chart-5/20 text-chart-5",
    Scheduled: "bg-secondary text-muted-foreground",
    Cancelled: "bg-destructive/20 text-destructive",
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const dates = [3, 4, 5, 6, 7, 8]

// Full hour slots for the calendar grid (8 AM – 6 PM)
const calendarHours = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
]

// Convert "09:30 AM" → decimal hour (9.5)
function timeToDecimal(time: string): number {
    const [rawTime, period] = time.split(" ")
    let [h, m] = rawTime.split(":").map(Number)
    if (period === "PM" && h !== 12) h += 12
    if (period === "AM" && h === 12) h = 0
    return h + m / 60
}

// Convert duration string → minutes
function durationToMinutes(dur: string): number {
    const n = parseInt(dur, 10)
    return isNaN(n) ? 30 : n
}

const ROW_HEIGHT = 64 // px per hour slot
const CELL_HOUR_OFFSET = 8 // grid starts at 8:00

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    "Check-up": { bg: "bg-primary/15", border: "border-primary/50", text: "text-primary" },
    "Consultation": { bg: "bg-chart-2/15", border: "border-chart-2/50", text: "text-chart-2" },
    "Follow-up": { bg: "bg-chart-3/15", border: "border-chart-3/50", text: "text-chart-3" },
    "X-Ray Review": { bg: "bg-chart-4/15", border: "border-chart-4/50", text: "text-chart-4" },
    "Lab Results": { bg: "bg-chart-5/15", border: "border-chart-5/50", text: "text-chart-5" },
    "Surgery Prep": { bg: "bg-destructive/15", border: "border-destructive/50", text: "text-destructive" },
    "Emergency": { bg: "bg-destructive/20", border: "border-destructive", text: "text-destructive" },
    "Vaccination": { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
}

export default function AppointmentsModule() {
    const [selectedDate, setSelectedDate] = useState(6)
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
    const [patients, setPatients] = useState<PatientSummary[]>([])
    const [showNewAppointment, setShowNewAppointment] = useState(false)
    const [showNewPatient, setShowNewPatient] = useState(false)

    // New appointment form state
    const [selectedPatient, setSelectedPatient] = useState("")
    const [selectedDoctor, setSelectedDoctor] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [selectedDuration, setSelectedDuration] = useState("30 min")
    const [selectedType, setSelectedType] = useState("")
    const [appointmentNotes, setAppointmentNotes] = useState("")


    const resetAppointmentForm = () => {
        setSelectedPatient("")
        setSelectedDoctor("")
        setSelectedTime("")
        setSelectedDuration("30 min")
        setSelectedType("")
        setAppointmentNotes("")
    }

    const handleCreateAppointment = () => {
        const patient = patients.find(p => p.id === selectedPatient)
        if (!patient || !selectedDoctor || !selectedTime || !selectedType) return

        const newAppointment: Appointment = {
            id: appointments.length + 1,
            patient: patient.name,
            patientId: patient.id,
            doctor: doctors.find(d => d.id === selectedDoctor)?.name || "",
            time: selectedTime,
            duration: selectedDuration,
            type: selectedType,
            status: "Scheduled",
            notes: appointmentNotes,
        }

        setAppointments([...appointments, newAppointment])
        setShowNewAppointment(false)
        resetAppointmentForm()
    }

    const selectedPatientData = patients.find(p => p.id === selectedPatient)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Appointment Schedule</h2>
                    <p className="text-sm text-muted-foreground">Manage and track all appointments</p>
                </div>
                <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setShowNewAppointment(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Appointment
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{"Today's Total"}</p>
                        <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold text-primary">
                            {appointments.filter(a => a.status === "Completed").length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Upcoming</p>
                        <p className="text-2xl font-bold text-foreground">
                            {appointments.filter(a => a.status === "Scheduled" || a.status === "Waiting").length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Cancelled</p>
                        <p className="text-2xl font-bold text-destructive">
                            {appointments.filter(a => a.status === "Cancelled").length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar and List View */}
            <Tabs defaultValue="list" className="space-y-4">
                <TabsList className="bg-secondary">
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    {/* Week Selector */}
                    <Card className="bg-card border-border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <Button variant="ghost" size="icon">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="font-medium text-foreground">March 2026</span>
                                <Button variant="ghost" size="icon">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {weekDays.map((day, i) => (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(dates[i])}
                                        className={`p-3 rounded-lg text-center transition-all ${selectedDate === dates[i]
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary hover:bg-secondary/80 text-foreground"
                                            }`}
                                    >
                                        <p className="text-xs text-inherit opacity-70">{day}</p>
                                        <p className="text-lg font-semibold">{dates[i]}</p>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointments List */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">March {selectedDate}, 2026</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {appointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 text-center">
                                            <p className="text-sm font-medium text-foreground">{apt.time}</p>
                                            <p className="text-xs text-muted-foreground">{apt.duration}</p>
                                        </div>
                                        <div className="h-12 w-px bg-border" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium text-foreground">{apt.patient}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Stethoscope className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">{apt.doctor}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pl-20 sm:pl-0">
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {apt.type}
                                        </Badge>
                                        <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="calendar">
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-foreground text-base">
                                    Daily Schedule — March {selectedDate}, 2026
                                </CardTitle>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {Object.entries(typeColors).slice(0, 4).map(([type, c]) => (
                                        <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span className={`w-2.5 h-2.5 rounded-sm border ${c.bg} ${c.border}`} />
                                            {type}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 pb-4">
                            <div className="overflow-x-auto">
                                {/* Column headers */}
                                <div
                                    className="grid border-b border-border"
                                    style={{ gridTemplateColumns: `72px repeat(${doctors.length}, minmax(160px, 1fr))` }}
                                >
                                    <div className="py-3 px-3 text-xs text-muted-foreground font-medium">Time</div>
                                    {doctors.map((doc) => (
                                        <div key={doc.id} className="py-3 px-3 border-l border-border">
                                            <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Time grid */}
                                <div
                                    className="grid relative"
                                    style={{ gridTemplateColumns: `72px repeat(${doctors.length}, minmax(160px, 1fr))` }}
                                >
                                    {/* Hour rows — rendered as background guides */}
                                    {calendarHours.map((hour) => (
                                        <div
                                            key={hour}
                                            className="contents"
                                        >
                                            {/* Time label */}
                                            <div
                                                className="flex items-start justify-end pr-3 pt-1 text-xs text-muted-foreground select-none"
                                                style={{ height: ROW_HEIGHT }}
                                            >
                                                {hour}
                                            </div>
                                            {/* Doctor cells */}
                                            {doctors.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="border-l border-t border-border bg-secondary/10"
                                                    style={{ height: ROW_HEIGHT }}
                                                />
                                            ))}
                                        </div>
                                    ))}

                                    {/* Appointment blocks — absolutely positioned over the grid */}
                                    {appointments.map((apt) => {
                                        const docIndex = doctors.findIndex((d) => d.name === apt.doctor)
                                        if (docIndex === -1) return null

                                        const startDecimal = timeToDecimal(apt.time)
                                        const durationMins = durationToMinutes(apt.duration)
                                        const topPx = (startDecimal - CELL_HOUR_OFFSET) * ROW_HEIGHT
                                        const heightPx = Math.max((durationMins / 60) * ROW_HEIGHT, 28)

                                        // Each doctor column starts at: 72px (time col) + docIndex * (col width)
                                        // We use inset-inline approach via inline style with left calc
                                        const colors = typeColors[apt.type] ?? typeColors["Check-up"]

                                        return (
                                            <div
                                                key={apt.id}
                                                title={`${apt.patient} — ${apt.type}`}
                                                className={`absolute rounded-md border px-2 py-1 overflow-hidden cursor-pointer
                          transition-all hover:z-20 hover:shadow-lg hover:scale-[1.02]
                          ${colors.bg} ${colors.border}`}
                                                style={{
                                                    top: topPx,
                                                    height: heightPx,
                                                    // 72px time col + each doctor col is uniform fraction
                                                    left: `calc(72px + ${docIndex} * ((100% - 72px) / ${doctors.length}))`,
                                                    width: `calc((100% - 72px) / ${doctors.length} - 4px)`,
                                                    marginLeft: 2,
                                                    zIndex: 10,
                                                }}
                                            >
                                                <p className={`text-xs font-semibold leading-tight truncate ${colors.text}`}>
                                                    {apt.patient}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate leading-tight">
                                                    {apt.type}
                                                </p>
                                                {heightPx > 44 && (
                                                    <p className="text-xs text-muted-foreground leading-tight">
                                                        {apt.time} · {apt.duration}
                                                    </p>
                                                )}
                                                {heightPx > 58 && (
                                                    <Badge
                                                        className={`mt-0.5 text-[10px] px-1 py-0 h-4 ${statusColors[apt.status]}`}
                                                    >
                                                        {apt.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* New Appointment Modal */}
            <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
                <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            Schedule New Appointment
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Fill in the details below to create a new appointment
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Patient Selection Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-foreground">Patient Information</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowNewPatient(true)}
                                    className="text-primary border-primary/30 hover:bg-primary/10"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    New Patient
                                </Button>
                            </div>

                            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                                <SelectTrigger className="bg-secondary border-border">
                                    <SelectValue placeholder="Select a patient" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    {patients.map((patient) => (
                                        <SelectItem key={patient.id} value={patient.id}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{patient.name}</span>
                                                <span className="text-muted-foreground text-xs">({patient.id})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Selected Patient Card */}
                            {selectedPatientData && (
                                <Card className="bg-secondary/50 border-border">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                                <User className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-foreground">{selectedPatientData.name}</h4>
                                                    <Badge className={
                                                        selectedPatientData.status === "Active" ? "bg-primary/20 text-primary" :
                                                            selectedPatientData.status === "Critical" ? "bg-destructive/20 text-destructive" :
                                                                "bg-chart-3/20 text-chart-3"
                                                    }>
                                                        {selectedPatientData.status}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        {selectedPatientData.phone}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Mail className="w-3 h-3" />
                                                        {selectedPatientData.email}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Last visit: {selectedPatientData.lastVisit} | Condition: {selectedPatientData.condition}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Appointment Details */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-foreground">Appointment Details</Label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="doctor" className="text-sm text-muted-foreground">Doctor</Label>
                                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue placeholder="Select doctor" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {doctors.map((doctor) => (
                                                <SelectItem key={doctor.id} value={doctor.id}>
                                                    <div className="flex flex-col">
                                                        <span>{doctor.name}</span>
                                                        <span className="text-xs text-muted-foreground">{doctor.specialty}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-sm text-muted-foreground">Appointment Type</Label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {appointmentTypes.map((type) => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="time" className="text-sm text-muted-foreground">Time Slot</Label>
                                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue placeholder="Select time" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {timeSlots.map((time) => (
                                                <SelectItem key={time} value={time}>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        {time}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration" className="text-sm text-muted-foreground">Duration</Label>
                                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {durations.map((duration) => (
                                                <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm text-muted-foreground">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add any additional notes for this appointment..."
                                    value={appointmentNotes}
                                    onChange={(e) => setAppointmentNotes(e.target.value)}
                                    className="bg-secondary border-border resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowNewAppointment(false)
                                resetAppointmentForm()
                            }}
                            className="border-border"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateAppointment}
                            disabled={!selectedPatient || !selectedDoctor || !selectedTime || !selectedType}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Create Appointment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Shared Add Patient Modal */}
            <PatientForm
                open={showNewPatient}
            // onOpenChange={setShowNewPatient}
            // onPatientCreated={(patient) => setSelectedPatient(patient.id)}
            />
        </div>
    )
}
