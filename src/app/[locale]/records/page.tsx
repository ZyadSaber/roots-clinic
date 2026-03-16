"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Search,
    Plus,
    Filter,
    FileText,
    Download,
    Eye,
    Calendar,
    User,
    Stethoscope,
    Pill,
    Activity,
} from "lucide-react"

const medicalRecords = [
    {
        id: "MR001",
        patient: "John Smith",
        type: "Consultation Report",
        doctor: "Dr. Sarah Wilson",
        date: "Mar 5, 2026",
        diagnosis: "Hypertension",
        prescriptions: 2,
        notes: "Blood pressure elevated. Prescribed medication and lifestyle changes.",
    },
    {
        id: "MR002",
        patient: "Emma Johnson",
        type: "Lab Results",
        doctor: "Dr. Michael Chen",
        date: "Mar 4, 2026",
        diagnosis: "Diabetes Type 2",
        prescriptions: 3,
        notes: "HbA1c levels above normal. Adjusted medication dosage.",
    },
    {
        id: "MR003",
        patient: "Michael Brown",
        type: "Surgery Report",
        doctor: "Dr. Aisha Patel",
        date: "Mar 3, 2026",
        diagnosis: "Cardiac Arrhythmia",
        prescriptions: 4,
        notes: "Successful pacemaker implantation. Follow-up in 2 weeks.",
    },
    {
        id: "MR004",
        patient: "Sarah Davis",
        type: "X-Ray Report",
        doctor: "Dr. Michael Chen",
        date: "Mar 2, 2026",
        diagnosis: "Fracture - Left Arm",
        prescriptions: 1,
        notes: "Clean fracture. Cast applied. Recovery expected in 6 weeks.",
    },
    {
        id: "MR005",
        patient: "James Wilson",
        type: "Follow-up Report",
        doctor: "Dr. Sarah Wilson",
        date: "Mar 1, 2026",
        diagnosis: "Post-Surgery Recovery",
        prescriptions: 2,
        notes: "Healing well. Continue current medication. Next check-up in 1 month.",
    },
]

const recordTypeIcons: Record<string, React.ReactNode> = {
    "Consultation Report": <Stethoscope className="w-4 h-4" />,
    "Lab Results": <Activity className="w-4 h-4" />,
    "Surgery Report": <FileText className="w-4 h-4" />,
    "X-Ray Report": <FileText className="w-4 h-4" />,
    "Follow-up Report": <Calendar className="w-4 h-4" />,
}

export default function RecordsModule() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedRecord, setSelectedRecord] = useState<string | null>(null)

    const filteredRecords = medicalRecords.filter(
        (r) =>
            r.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selected = medicalRecords.find((r) => r.id === selectedRecord)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-1 gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search medical records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-secondary border-border"
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    New Record
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Records</p>
                        <p className="text-2xl font-bold text-foreground">12,847</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold text-primary">248</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Pending Review</p>
                        <p className="text-2xl font-bold text-chart-5">18</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Archived</p>
                        <p className="text-2xl font-bold text-muted-foreground">8,432</p>
                    </CardContent>
                </Card>
            </div>

            {/* Records List and Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Records List */}
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Medical Records</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {filteredRecords.map((record) => (
                            <div
                                key={record.id}
                                onClick={() => setSelectedRecord(record.id)}
                                className={`p-4 rounded-lg border transition-all cursor-pointer ${selectedRecord === record.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-secondary/30 hover:bg-secondary/50"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                                                {record.patient
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-foreground">{record.patient}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {recordTypeIcons[record.type]}
                                                <span>{record.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-muted-foreground mb-1">
                                            {record.diagnosis}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">{record.date}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{record.notes}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Record Detail */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Record Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selected ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="bg-primary/20 text-primary">
                                            {selected.patient
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-foreground">{selected.patient}</p>
                                        <p className="text-sm text-muted-foreground">{selected.id}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Type:</span>
                                        <span className="text-sm text-foreground">{selected.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Doctor:</span>
                                        <span className="text-sm text-foreground">{selected.doctor}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Date:</span>
                                        <span className="text-sm text-foreground">{selected.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Diagnosis:</span>
                                        <Badge variant="outline">{selected.diagnosis}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Pill className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Prescriptions:</span>
                                        <span className="text-sm text-foreground">{selected.prescriptions} medications</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                                    <p className="text-sm text-foreground">{selected.notes}</p>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Eye className="w-4 h-4 mr-1" />
                                        View Full
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <FileText className="w-12 h-12 mb-2 opacity-50" />
                                <p className="text-sm">Select a record to view details</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
