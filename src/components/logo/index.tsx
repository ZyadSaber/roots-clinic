import { cn } from "@/lib/utils";
import Image from "next/image"

const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn("relative overflow-hidden flex items-center justify-center", className)}>
            <Image
                src="/logo.svg"
                alt="Smart Dine Logo"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
};

export default Logo;