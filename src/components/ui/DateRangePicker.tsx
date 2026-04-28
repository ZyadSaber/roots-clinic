"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, X, LucideIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { useVisibility } from "@/hooks";

export interface DateRangeValue {
    from: string; // ISO date string YYYY-MM-DD
    to: string;
}

interface Props {
    value: DateRangeValue | null;
    onChange: (range: DateRangeValue | string) => void;
    className?: string
    error?: string
    label?: string
    containerClassName?: string;
    icon?: LucideIcon;
    showTime?: boolean;
}

export function DateRangePicker({
    value,
    onChange,
    containerClassName,
    icon: Icon,
    label,
    error,
    className,
    showTime
}: Props) {

    const {
        handleClose,
        visible,
        handleStateChange
    } = useVisibility()

    const selected: DateRange | undefined = value
        ? {
            from: new Date(value.from),
            to: new Date(value.to),
        }
        : undefined;

    const handleSelect = (range: DateRange | undefined) => {
        if (!range?.from) {
            onChange("");
            return;
        }
        if (range.from && range.to) {
            onChange({
                from: format(range.from, "yyyy-MM-dd"),
                to: format(range.to, "yyyy-MM-dd"),
            });
            handleClose()
        } else {
            // Only start date picked — keep open
            onChange({
                from: format(range.from, "yyyy-MM-dd"),
                to: format(range.from, "yyyy-MM-dd"),
            });
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    // Preset helpers
    const applyPreset = (from: Date, to: Date) => {
        onChange({ from: format(from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") });
        handleClose()
    };

    const now = new Date();

    const presets = [
        {
            label: "This month",
            from: startOfMonth(now),
            to: endOfMonth(now),
        },
        {
            label: "Last month",
            from: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
            to: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        },
        {
            label: "Last 30 days",
            from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29),
            to: now,
        },
        {
            label: "Last 90 days",
            from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89),
            to: now,
        },
        {
            label: "This year",
            from: new Date(now.getFullYear(), 0, 1),
            to: new Date(now.getFullYear(), 11, 31),
        },
    ];

    const componentLabel = value
        ? value.from === value.to
            ? format(new Date(value.from), "dd MMM yyyy")
            : `${format(new Date(value.from), "dd MMM")} – ${format(new Date(value.to), "dd MMM yyyy")}`
        : "Date range";

    return (
        <div className={cn("space-y-2 px-1", containerClassName)}>
            {(Icon || label) && <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </Label>}
            <Popover open={visible} onOpenChange={handleStateChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "gap-2 h-9 text-sm font-medium",
                            value && "border-primary/40 bg-primary/5 text-primary",
                            className
                        )}
                    >
                        <CalendarIcon className="h-4 w-4 shrink-0" />
                        <span>{componentLabel}</span>
                        {value && (
                            <X
                                className="h-3.5 w-3.5 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                                onClick={handleClear}
                            />
                        )}
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="end"
                    className="w-auto p-0 flex overflow-hidden rounded-2xl shadow-2xl border-border/50"
                >
                    {/* Presets sidebar */}
                    <div className="flex flex-col gap-0.5 p-2 border-e border-border/50 bg-muted/30 min-w-[130px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                            Quick select
                        </p>
                        {presets.map((p) => (
                            <Button
                                key={p.label}
                                variant="ghost"
                                size="sm"
                                className="justify-start text-xs h-8 rounded-lg font-medium"
                                onClick={() => applyPreset(p.from, p.to)}
                            >
                                {p.label}
                            </Button>
                        ))}
                        {value && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-xs h-8 rounded-lg font-medium text-destructive hover:text-destructive hover:bg-destructive/10 mt-auto"
                                onClick={() => { onChange(""); handleClose(); }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Calendar */}
                    <Calendar
                        mode="range"
                        selected={selected}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        defaultMonth={selected?.from ?? new Date(now.getFullYear(), now.getMonth() - 1)}
                    />
                </PopoverContent>
            </Popover>
            {error && <p className="text-[10px] font-bold text-destructive px-1">{error}</p>}
        </div>
    );
}
