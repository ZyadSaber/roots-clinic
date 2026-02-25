import { cn } from "@/lib/utils";
import Image from "next/image"

const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn("relative overflow-hidden flex items-center justify-center", className)}>
            <Image
                src="/logo.svg"
                alt="Roots Clinic Logo"
                fill
                className="object-contain transition-all duration-300"
                priority
            />
        </div>
    );
};

export default Logo;