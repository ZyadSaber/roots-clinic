"use client"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { ChevronDownIcon, Clock, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area"

interface DatePickerProps {
    value: Date | undefined
    className?: string
    error?: string
    label?: string
    containerClassName?: string;
    icon?: LucideIcon;
    placeHolder?: string;
    showTime?: boolean;
    onDateChange?: (date: Date) => void
}

export function DatePicker({
    value,
    containerClassName,
    className,
    icon: Icon,
    label,
    placeHolder,
    showTime,
    error,
    onDateChange
}: DatePickerProps) {

    const handleTimeChange = (type: "h" | "m", val: number) => {
        if (!onDateChange) return
        const newDate = value ? new Date(value) : new Date()
        if (type === "h") newDate.setHours(val)
        else newDate.setMinutes(val)
        onDateChange(newDate)
    }

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
                        className={cn("w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground rounded-xl h-12", className)}
                    >
                        {value ? (
                            <div className="flex items-center gap-2">
                                <span>{format(value, "dd/MM/yyyy")}</span>
                                {showTime && <span className="text-muted-foreground/60 font-bold border-l border-border pl-2 ml-1">{format(value, "HH:mm")}</span>}
                            </div>
                        ) : <span>{placeHolder ? placeHolder : "Pick a date"}</span>}
                        <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 flex divide-x divide-border overflow-hidden rounded-2xl shadow-2xl border-none" align="start">
                    <div className="flex flex-col">
                        <Calendar
                            mode="single"
                            selected={value}
                            onSelect={(date) => {
                                if (date) {
                                    const newDate = new Date(date)
                                    if (value) {
                                        newDate.setHours(value.getHours())
                                        newDate.setMinutes(value.getMinutes())
                                    }
                                    onDateChange?.(newDate)
                                }
                            }}
                            defaultMonth={value}
                            captionLayout="dropdown"
                        />
                    </div>
                    {showTime && (
                        <div className="flex flex-col w-32 divide-y divide-border">
                            <div className="p-3 flex items-center gap-2 justify-center bg-accent/30">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Time</span>
                            </div>
                            <div className="flex h-72 divide-x divide-border">
                                <ScrollArea className="w-16 h-full">
                                    <div className="flex flex-col p-1.5 pt-2">
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <Button
                                                key={i}
                                                variant={value?.getHours() === i ? "default" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                    "h-8 w-full text-xs font-bold rounded-lg mb-1",
                                                    value?.getHours() === i ? "shadow-lg shadow-primary/20" : "hover:bg-accent"
                                                )}
                                                onClick={() => handleTimeChange("h", i)}
                                            >
                                                {i.toString().padStart(2, "0")}
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <ScrollArea className="w-16 h-full">
                                    <div className="flex flex-col p-1.5 pt-2">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <Button
                                                key={i * 5}
                                                variant={value?.getMinutes() === i * 5 ? "default" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                    "h-8 w-full text-xs font-bold rounded-lg mb-1",
                                                    value?.getMinutes() === i * 5 ? "shadow-lg shadow-primary/20" : "hover:bg-accent"
                                                )}
                                                onClick={() => handleTimeChange("m", i * 5)}
                                            >
                                                {(i * 5).toString().padStart(2, "0")}
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
            {error && <p className="text-[10px] font-bold text-destructive px-1">{error}</p>}
        </div>
    )
}