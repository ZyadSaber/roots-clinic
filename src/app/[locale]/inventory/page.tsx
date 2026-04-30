"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search, Plus, AlertTriangle } from "lucide-react"
import { getInventoryKPIs, getInventoryItems } from "@/services/inventory"
import { InventoryStatCards } from "@/components/inventory/InventoryStatCards"
import { AddItemDialog } from "@/components/inventory/AddItemDialog"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import type { StockStatus } from "@/types/inventory"
import { useVisibility } from "@/hooks"

const statusColors: Record<StockStatus, string> = {
    in_stock: "bg-primary/20 text-primary",
    low_stock: "bg-chart-5/20 text-chart-5",
    critical: "bg-destructive/20 text-destructive",
    out_of_stock: "bg-muted text-muted-foreground",
}

const statusLabels: Record<StockStatus, string> = {
    in_stock: "In Stock",
    low_stock: "Low Stock",
    critical: "Critical",
    out_of_stock: "Out of Stock",
}

function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short" })
}

export default function InventoryPage() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all")

    const {
        visible: addItemOpen,
        handleOpen: openAddItem,
        handleStateChange: setAddItemOpen,
    } = useVisibility()

    const { data: kpis } = useQuery({
        queryKey: ["inventory-kpis"],
        queryFn: getInventoryKPIs,
        staleTime: 60_000,
    })

    const { data: items = [], isLoading: itemsLoading } = useQuery({
        queryKey: ["inventory-items", statusFilter, search],
        queryFn: () => getInventoryItems({ status: statusFilter, search: search || undefined }),
        staleTime: 60_000,
    })

    const alertItems = items.filter((i) => i.status === "low_stock" || i.status === "critical")

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage stock levels and item usage</p>
                </div>
            </div>

            {/* KPI cards */}
            <InventoryStatCards kpis={kpis} />

            {/* Alerts */}
            {alertItems.length > 0 && (
                <Card className="bg-destructive/5 border-destructive/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-destructive flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            Stock Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {alertItems.map((item) => (
                                <Badge
                                    key={item.id}
                                    variant="outline"
                                    className={item.status === "critical"
                                        ? "border-destructive text-destructive"
                                        : "border-chart-5 text-chart-5"
                                    }
                                >
                                    {item.name}: {item.current_stock} {item.unit ?? ""}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters + Add */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex flex-1 gap-3 max-w-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search items, SKU, supplier..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StockStatus | "all")}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="in_stock">In Stock</SelectItem>
                            <SelectItem value="low_stock">Low Stock</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={openAddItem} size="sm" className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" />
                    Add Item
                </Button>
            </div>

            {/* Table */}
            <LoadingOverlay loading={itemsLoading}>
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground text-base">Inventory Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead>Item</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Stock Level</TableHead>
                                        <TableHead className="hidden md:table-cell">Supplier</TableHead>
                                        <TableHead className="hidden lg:table-cell">Expiry</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Stock Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 && !itemsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                                No items found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => {
                                            const pct = item.reorder_level > 0
                                                ? Math.min((item.current_stock / (item.reorder_level * 5)) * 100, 100)
                                                : 100
                                            const stockValue = item.current_stock * item.unit_price
                                            return (
                                                <TableRow key={item.id} className="border-border hover:bg-secondary/50">
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-foreground">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            {item.category ?? "—"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1 min-w-32">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-foreground">
                                                                    {item.current_stock} {item.unit ?? ""}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    / {item.reorder_level} reorder
                                                                </span>
                                                            </div>
                                                            <Progress
                                                                value={pct}
                                                                className={`h-2 ${pct < 20
                                                                    ? "[&>div]:bg-destructive"
                                                                    : pct < 40
                                                                        ? "[&>div]:bg-chart-5"
                                                                        : "[&>div]:bg-primary"
                                                                    }`}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                                        {item.supplier ?? "—"}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                                        {formatDate(item.expiry_date)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`border-none ${statusColors[item.status]}`}>
                                                            {statusLabels[item.status]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-foreground font-medium text-sm">
                                                        {new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(item.unit_price)} EGP
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-medium text-muted-foreground">
                                                        {new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2 }).format(stockValue)} EGP
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </LoadingOverlay>

            {addItemOpen && (
                <AddItemDialog open={addItemOpen} onOpenChange={setAddItemOpen} />
            )}
        </div>
    )
}
