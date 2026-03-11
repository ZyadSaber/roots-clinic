import * as React from "react"
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label";

type TextAreaProps = React.ComponentProps<"textarea"> & {
    error?: string
    label?: string
    containerClassName?: string;
    icon?: LucideIcon
}

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    TextAreaProps
>(({
    className,
    error,
    label,
    containerClassName,
    icon: Icon,
    name,
    ...props
},
    ref
) => {
    return (
        <div className={cn("space-y-2 px-1", containerClassName)}>
            {(Icon || label) && <Label htmlFor={name} className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </Label>}
            <textarea
                className={cn(
                    "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    className
                )}
                ref={ref}
                name={name}
                {...props}
            />
            {!!error && <p className="text-destructive text-sm px-3 ">{error}</p>}
        </div>
    )
})
Textarea.displayName = "Textarea"

export default Textarea