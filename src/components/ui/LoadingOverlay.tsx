import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
    loading?: boolean;
    children?: React.ReactNode;
    className?: string;
    message?: string;
}

export function LoadingOverlay({
    loading,
    children,
    className,
    message,
}: LoadingOverlayProps) {
    return (
        <div className="relative w-full h-full">
            {children}
            {loading && (
                <div
                    className={cn(
                        "absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] transition-all duration-300 animate-in fade-in",
                        className
                    )}
                >
                    <div className="relative flex flex-col items-center gap-4 p-8 rounded-3xl bg-card/50 border border-white/10 shadow-2xl">
                        <div className="relative">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                        </div>
                        {message && (
                            <p className="text-sm font-medium text-muted-foreground animate-pulse text-center">
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
