"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Search,
    Plus,
    Filter,
    Package,
    AlertTriangle,
    TrendingDown,
    ArrowUpDown,
} from "lucide-react"

const inventory = [
    {
        id: "INV001",
        name: "Surgical Gloves (Box)",
        category: "Consumables",
        quantity: 450,
        minStock: 100,
        maxStock: 500,
        unit: "boxes",
        price: 15.99,
        supplier: "MedSupply Co",
        expiry: "Dec 2027",
        status: "In Stock",
    },
    {
        id: "INV002",
        name: "Syringes 5ml",
        category: "Consumables",
        quantity: 2800,
        minStock: 500,
        maxStock: 5000,
        unit: "pcs",
        price: 0.25,
        supplier: "MedSupply Co",
        expiry: "Mar 2028",
        status: "In Stock",
    },
    {
        id: "INV003",
        name: "Paracetamol 500mg",
        category: "Medication",
        quantity: 85,
        minStock: 200,
        maxStock: 1000,
        unit: "boxes",
        price: 8.5,
        supplier: "PharmaDist",
        expiry: "Jun 2026",
        status: "Low Stock",
    },
    {
        id: "INV004",
        name: "Bandages (Roll)",
        category: "Consumables",
        quantity: 320,
        minStock: 100,
        maxStock: 500,
        unit: "rolls",
        price: 3.99,
        supplier: "MedSupply Co",
        expiry: "Jan 2029",
        status: "In Stock",
    },
    {
        id: "INV005",
        name: "Insulin Vials",
        category: "Medication",
        quantity: 25,
        minStock: 50,
        maxStock: 200,
        unit: "vials",
        price: 45.0,
        supplier: "PharmaDist",
        expiry: "Apr 2026",
        status: "Critical",
    },
    {
        id: "INV006",
        name: "Face Masks N95",
        category: "PPE",
        quantity: 1200,
        minStock: 500,
        maxStock: 2000,
        unit: "pcs",
        price: 2.5,
        supplier: "SafetyFirst Inc",
        expiry: "Dec 2028",
        status: "In Stock",
    },
    {
        id: "INV007",
        name: "IV Fluid 500ml",
        category: "Consumables",
        quantity: 180,
        minStock: 100,
        maxStock: 300,
        unit: "bags",
        price: 12.0,
        supplier: "MedSupply Co",
        expiry: "Aug 2026",
        status: "In Stock",
    },
    {
        id: "INV008",
        name: "Antibiotics (Amoxicillin)",
        category: "Medication",
        quantity: 45,
        minStock: 100,
        maxStock: 500,
        unit: "boxes",
        price: 22.0,
        supplier: "PharmaDist",
        expiry: "May 2026",
        status: "Low Stock",
    },
]

const statusColors: Record<string, string> = {
    "In Stock": "bg-primary/20 text-primary",
    "Low Stock": "bg-chart-5/20 text-chart-5",
    Critical: "bg-destructive/20 text-destructive",
    "Out of Stock": "bg-muted text-muted-foreground",
}

export default function StockModule() {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredInventory = inventory.filter(
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const lowStockItems = inventory.filter(
        (item) => item.status === "Low Stock" || item.status === "Critical"
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-1 gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search inventory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-secondary border-border"
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        Reorder
                    </Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Total Items</p>
                        </div>
                        <p className="text-2xl font-bold text-foreground mt-1">1,284</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-chart-5" />
                            <p className="text-sm text-muted-foreground">Low Stock</p>
                        </div>
                        <p className="text-2xl font-bold text-chart-5 mt-1">18</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <p className="text-sm text-muted-foreground">Critical</p>
                        </div>
                        <p className="text-2xl font-bold text-destructive mt-1">5</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="text-2xl font-bold text-foreground mt-1">$142,580</p>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
                <Card className="bg-destructive/5 border-destructive/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Stock Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {lowStockItems.map((item) => (
                                <Badge
                                    key={item.id}
                                    variant="outline"
                                    className={`${item.status === "Critical"
                                        ? "border-destructive text-destructive"
                                        : "border-chart-5 text-chart-5"
                                        }`}
                                >
                                    {item.name}: {item.quantity} {item.unit}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Inventory Table */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Inventory Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="text-muted-foreground">Item</TableHead>
                                    <TableHead className="text-muted-foreground">Category</TableHead>
                                    <TableHead className="text-muted-foreground">Stock Level</TableHead>
                                    <TableHead className="text-muted-foreground hidden md:table-cell">Supplier</TableHead>
                                    <TableHead className="text-muted-foreground hidden lg:table-cell">Expiry</TableHead>
                                    <TableHead className="text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInventory.map((item) => {
                                    const stockPercentage = (item.quantity / item.maxStock) * 100
                                    return (
                                        <TableRow key={item.id} className="border-border hover:bg-secondary/50">
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-foreground">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    {item.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 min-w-32">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-foreground">
                                                            {item.quantity} {item.unit}
                                                        </span>
                                                        <span className="text-muted-foreground">/ {item.maxStock}</span>
                                                    </div>
                                                    <Progress
                                                        value={stockPercentage}
                                                        className={`h-2 ${stockPercentage < 20
                                                            ? "[&>div]:bg-destructive"
                                                            : stockPercentage < 40
                                                                ? "[&>div]:bg-chart-5"
                                                                : "[&>div]:bg-primary"
                                                            }`}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                                {item.supplier}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                                                {item.expiry}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[item.status]}>{item.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-foreground font-medium">
                                                ${item.price.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
