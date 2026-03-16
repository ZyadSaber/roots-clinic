"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Plus,
    Filter,
    Image,
    Download,
    Eye,
    Share2,
    Calendar,
    User,
} from "lucide-react"

const xrayRecords = [
    {
        id: "XR001",
        patient: "John Smith",
        type: "Chest X-Ray",
        date: "Mar 5, 2026",
        doctor: "Dr. Chen",
        status: "Reviewed",
        findings: "Normal",
    },
    {
        id: "XR002",
        patient: "Emma Johnson",
        type: "Dental X-Ray",
        date: "Mar 4, 2026",
        doctor: "Dr. Wilson",
        status: "Pending Review",
        findings: "Awaiting",
    },
    {
        id: "XR003",
        patient: "Michael Brown",
        type: "Spine MRI",
        date: "Mar 3, 2026",
        doctor: "Dr. Patel",
        status: "Reviewed",
        findings: "Abnormal",
    },
    {
        id: "XR004",
        patient: "Sarah Davis",
        type: "CT Scan",
        date: "Mar 2, 2026",
        doctor: "Dr. Chen",
        status: "Reviewed",
        findings: "Normal",
    },
    {
        id: "XR005",
        patient: "James Wilson",
        type: "Ultrasound",
        date: "Mar 1, 2026",
        doctor: "Dr. Wilson",
        status: "Processing",
        findings: "Pending",
    },
    {
        id: "XR006",
        patient: "Lisa Anderson",
        type: "Mammogram",
        date: "Feb 28, 2026",
        doctor: "Dr. Patel",
        status: "Reviewed",
        findings: "Normal",
    },
]

const statusColors: Record<string, string> = {
    Reviewed: "bg-primary/20 text-primary",
    "Pending Review": "bg-chart-5/20 text-chart-5",
    Processing: "bg-chart-2/20 text-chart-2",
}

const findingColors: Record<string, string> = {
    Normal: "bg-primary/20 text-primary",
    Abnormal: "bg-destructive/20 text-destructive",
    Awaiting: "bg-muted text-muted-foreground",
    Pending: "bg-muted text-muted-foreground",
}

export default function XrayModule() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const filteredRecords = xrayRecords.filter(
        (r) =>
            r.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-1 gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search X-rays, patients..."
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
                    Upload New
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Images</p>
                        <p className="text-2xl font-bold text-foreground">2,847</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Pending Review</p>
                        <p className="text-2xl font-bold text-chart-5">28</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold text-primary">156</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Abnormal Findings</p>
                        <p className="text-2xl font-bold text-destructive">12</p>
                    </CardContent>
                </Card>
            </div>

            {/* Image Gallery Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Records List */}
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Recent Imaging Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredRecords.map((record) => (
                                <div
                                    key={record.id}
                                    onClick={() => setSelectedImage(record.id)}
                                    className={`p-4 rounded-lg border transition-all cursor-pointer ${selectedImage === record.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center">
                                            <Image className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs text-muted-foreground">{record.id}</span>
                                                <Badge className={statusColors[record.status]} variant="secondary">
                                                    {record.status}
                                                </Badge>
                                            </div>
                                            <p className="font-medium text-foreground">{record.type}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="w-3 h-3" />
                                                {record.patient}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                {record.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                        <Badge className={findingColors[record.findings]} variant="secondary">
                                            {record.findings}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{record.doctor}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Image Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedImage ? (
                            <div className="space-y-4">
                                <div className="aspect-square rounded-lg bg-secondary flex items-center justify-center">
                                    <Image className="w-16 h-16 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    {xrayRecords.find((r) => r.id === selectedImage) && (
                                        <>
                                            <p className="text-sm text-muted-foreground">
                                                <span className="text-foreground font-medium">Patient: </span>
                                                {xrayRecords.find((r) => r.id === selectedImage)?.patient}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                <span className="text-foreground font-medium">Type: </span>
                                                {xrayRecords.find((r) => r.id === selectedImage)?.type}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                <span className="text-foreground font-medium">Radiologist: </span>
                                                {xrayRecords.find((r) => r.id === selectedImage)?.doctor}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-square rounded-lg bg-secondary/50 flex flex-col items-center justify-center text-muted-foreground">
                                <Image className="w-12 h-12 mb-2 opacity-50" />
                                <p className="text-sm">Select an image to preview</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
