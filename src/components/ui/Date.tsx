"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { ChevronDownIcon, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label";

interface DatePickerProps {
    value: Date | undefined
    className?: string
    error?: string
    label?: string
    containerClassName?: string;
    icon?: LucideIcon;
    placeHolder?: string;
    onDateChange?: (date: Date) => void
}

export function DatePicker({
    value,
    containerClassName,
    className,
    icon: Icon,
    label,
    placeHolder,
    onDateChange
}: DatePickerProps) {
    return (
        <div className={cn("space-y-2 px-1", containerClassName)}>
            {(Icon || label) && <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </Label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        data-empty={!value}
                        className={cn("w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground", className)}
                    >
                        {value ? format(value, "dd/MM/yyyy") : <span>{placeHolder ? placeHolder : "Pick a date"}</span>}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={onDateChange}
                        defaultMonth={value}
                        captionLayout="dropdown"
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}