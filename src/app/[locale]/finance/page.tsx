"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Plus,
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    FileText,
    Download,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"

const invoices = [
    {
        id: "INV-2026-001",
        patient: "John Smith",
        amount: 850.0,
        date: "Mar 5, 2026",
        dueDate: "Mar 20, 2026",
        status: "Paid",
        type: "Consultation",
    },
    {
        id: "INV-2026-002",
        patient: "Emma Johnson",
        amount: 2400.0,
        date: "Mar 4, 2026",
        dueDate: "Mar 19, 2026",
        status: "Pending",
        type: "Surgery",
    },
    {
        id: "INV-2026-003",
        patient: "Michael Brown",
        amount: 350.0,
        date: "Mar 3, 2026",
        dueDate: "Mar 18, 2026",
        status: "Overdue",
        type: "X-Ray",
    },
    {
        id: "INV-2026-004",
        patient: "Sarah Davis",
        amount: 150.0,
        date: "Mar 2, 2026",
        dueDate: "Mar 17, 2026",
        status: "Paid",
        type: "Check-up",
    },
    {
        id: "INV-2026-005",
        patient: "James Wilson",
        amount: 1200.0,
        date: "Mar 1, 2026",
        dueDate: "Mar 16, 2026",
        status: "Pending",
        type: "Lab Tests",
    },
]

const expenses = [
    {
        id: "EXP-001",
        description: "Medical Supplies",
        amount: 5200.0,
        date: "Mar 5, 2026",
        category: "Inventory",
    },
    {
        id: "EXP-002",
        description: "Equipment Maintenance",
        amount: 1800.0,
        date: "Mar 4, 2026",
        category: "Maintenance",
    },
    {
        id: "EXP-003",
        description: "Staff Salaries",
        amount: 45000.0,
        date: "Mar 1, 2026",
        category: "Payroll",
    },
    {
        id: "EXP-004",
        description: "Utilities",
        amount: 2300.0,
        date: "Mar 1, 2026",
        category: "Operations",
    },
]

const statusColors: Record<string, string> = {
    Paid: "bg-primary/20 text-primary",
    Pending: "bg-chart-5/20 text-chart-5",
    Overdue: "bg-destructive/20 text-destructive",
}

export default function FinanceModule() {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const paidInvoices = invoices.filter((inv) => inv.status === "Paid")
    const pendingInvoices = invoices.filter((inv) => inv.status === "Pending" || inv.status === "Overdue")

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Financial Overview</h2>
                    <p className="text-sm text-muted-foreground">Track revenue, expenses, and invoices</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        New Invoice
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                                <p className="text-2xl font-bold text-foreground mt-1">$142,580</p>
                                <div className="flex items-center gap-1 mt-2 text-primary">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span className="text-sm font-medium">+12.5%</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                                <p className="text-2xl font-bold text-foreground mt-1">$54,300</p>
                                <div className="flex items-center gap-1 mt-2 text-destructive">
                                    <ArrowDownRight className="w-4 h-4" />
                                    <span className="text-sm font-medium">+5.2%</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-destructive" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Outstanding</p>
                                <p className="text-2xl font-bold text-chart-5 mt-1">$18,450</p>
                                <p className="text-sm text-muted-foreground mt-2">12 invoices</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-chart-5/20 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-chart-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Net Profit</p>
                                <p className="text-2xl font-bold text-primary mt-1">$88,280</p>
                                <div className="flex items-center gap-1 mt-2 text-primary">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span className="text-sm font-medium">+18.3%</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices and Expenses */}
            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList className="bg-secondary">
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices">
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-foreground">Recent Invoices</CardTitle>
                            <Button variant="ghost" size="sm" className="text-primary">
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-muted-foreground">Invoice</TableHead>
                                            <TableHead className="text-muted-foreground">Patient</TableHead>
                                            <TableHead className="text-muted-foreground hidden md:table-cell">Type</TableHead>
                                            <TableHead className="text-muted-foreground hidden lg:table-cell">Date</TableHead>
                                            <TableHead className="text-muted-foreground">Status</TableHead>
                                            <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((invoice) => (
                                            <TableRow key={invoice.id} className="border-border hover:bg-secondary/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-mono text-sm text-foreground">{invoice.id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-foreground">{invoice.patient}</TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                                    {invoice.type}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-muted-foreground">
                                                    {invoice.date}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-foreground">
                                                    ${invoice.amount.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expenses">
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-foreground">Recent Expenses</CardTitle>
                            <Button variant="ghost" size="sm" className="text-primary">
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-muted-foreground">ID</TableHead>
                                            <TableHead className="text-muted-foreground">Description</TableHead>
                                            <TableHead className="text-muted-foreground">Category</TableHead>
                                            <TableHead className="text-muted-foreground hidden md:table-cell">Date</TableHead>
                                            <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.map((expense) => (
                                            <TableRow key={expense.id} className="border-border hover:bg-secondary/50">
                                                <TableCell className="font-mono text-sm text-muted-foreground">
                                                    {expense.id}
                                                </TableCell>
                                                <TableCell className="font-medium text-foreground">{expense.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-muted-foreground">
                                                        {expense.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                                    {expense.date}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-destructive">
                                                    -${expense.amount.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
