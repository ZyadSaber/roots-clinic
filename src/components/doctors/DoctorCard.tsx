import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getLocalizedValue } from "@/lib/localize";
import { DoctorSummary } from "@/types/doctors";

interface DoctorCardProps {
    doc: DoctorSummary;
    isSelected: boolean;
    locale: string;
    onClick: () => void;
}

export default function DoctorCard({ doc, isSelected, locale, onClick }: DoctorCardProps) {
    const t = useTranslations("Doctors");
    const tc = useTranslations("Common");

    return (
        <Card
            onClick={onClick}
            className={`rounded-3xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent/5 ${isSelected ? 'border-2 border-primary ring-4 ring-primary/5 shadow-xl shadow-primary/5' : 'border-border/50 hover:border-primary/50'}`}
        >
            <CardHeader className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <Avatar className="w-16 h-16 rounded-2xl border-2 border-background shadow-lg">
                        <AvatarFallback className="font-black">
                            {doc.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <Badge className={`rounded-lg px-2 py-0.5 font-black text-[10px] leading-tight border-none
                        ${doc.status === 'available' ? 'bg-green-100 text-green-700' :
                            doc.status === 'on_break' ? 'bg-blue-100 text-blue-700' :
                                'bg-accent text-muted-foreground'
                        }`}>
                        {t(doc.status.toLowerCase().replace(/\s+/g, '') as Parameters<typeof t>[0]).toUpperCase()}
                    </Badge>
                </div>
                <CardTitle className="text-lg font-black">{doc.name}</CardTitle>
                <p className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {getLocalizedValue({ en: doc.en, ar: doc.ar }, locale)}
                </p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{t("fee")}</p>
                        <p className="text-xl font-black tabular-nums">{tc("currency")} {Number(doc.consultation_fee).toFixed(2)}</p>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'} rtl:rotate-180 transition-transform`} />
                </div>
            </CardContent>
        </Card>
    );
}
