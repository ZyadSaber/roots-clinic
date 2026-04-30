"use client";

import { Package, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { InventoryKPIs } from "@/types/inventory";

interface Props {
  kpis?: InventoryKPIs;
}

export function InventoryStatCards({ kpis }: Props) {
  const currency = "EGP";

  const cards = [
    {
      label: "Total Items",
      value: kpis?.total_items?.toLocaleString() ?? "—",
      icon: Package,
      color: "text-muted-foreground",
    },
    {
      label: "Low Stock",
      value: kpis?.low_stock_count ?? "—",
      icon: TrendingDown,
      color: "text-chart-5",
    },
    {
      label: "Critical",
      value: kpis?.critical_count ?? "—",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      label: "Total Value",
      value: kpis
        ? new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kpis.total_value) + " " + currency
        : "—",
      icon: DollarSign,
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
            <p className={`text-2xl font-bold mt-1 ${card.color === "text-muted-foreground" ? "text-foreground" : card.color}`}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
