import { Star, } from "lucide-react";

const Stars = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground opacity-30'}`}
                />
            ))}
        </div>
    );
}

export default Stars;
