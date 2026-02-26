import { Edit2, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DoctorSummary } from "@/types/doctors";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedValue, LocalizedString } from "@/lib/localize";
import Stars from "@/lib/getStars";
import { useEffect, useState, useTransition } from "react";
import { DoctorScheduleRecord } from "@/types/database";
import isArrayHasData from "@/lib/isArrayHasData";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { getDoctorSchedule } from "@/services/doctors";
import days from "@/constants/days";


interface DoctorDetailsProps {
    visible: boolean;
    selectedDoctor?: DoctorSummary;
    handleClose: () => void;
}

const DoctorDetails = ({ visible, selectedDoctor, handleClose }: DoctorDetailsProps) => {
    const [doctorSchedule, setDoctorSchedule] = useState<DoctorScheduleRecord[]>([]);
    const [isPending, startTransition] = useTransition();
    const locale = useLocale();
    const t = useTranslations("Doctors");
    const tc = useTranslations("Common");

    useEffect(() => {
        if (visible && !!selectedDoctor?.id) {
            startTransition(async () => {
                const data = await getDoctorSchedule(selectedDoctor?.id);
                setDoctorSchedule(data);
            })
        }
    }, [selectedDoctor?.id, visible])

    return (
        <AnimatePresence>
            {visible && selectedDoctor && (
                <>
                    {/* Overlay to catch clicks outside */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-background/20 backdrop-blur-xs z-10"
                    />

                    <motion.aside
                        initial={{ x: locale === 'ar' ? "-100%" : "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: locale === 'ar' ? "-100%" : "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-[450px] absolute inset-e-8 top-8 bottom-8 bg-background/80 backdrop-blur-2xl border border-border/50 flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[3rem] z-20 flex"
                    >
                        <div className="absolute top-6 inset-e-6 z-30">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClose}
                                className="rounded-full hover:bg-accent/50 h-10 w-10"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="p-8 border-b border-border/40 bg-accent/10">
                            <div className="flex items-center gap-6 mb-8">
                                <Avatar className="w-24 h-24 rounded-3xl border-4 border-background shadow-2xl">
                                    <AvatarImage src={selectedDoctor.avatar_url} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-black">
                                        {selectedDoctor.name.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">{selectedDoctor.name}</h2>
                                    {/* <p className="text-primary font-bold">{getDoctorSpecialty(selectedDoctor)}</p> */}
                                    <div className="flex items-center gap-1 mt-2">
                                        <Stars rating={selectedDoctor.rating} />
                                        <span className="text-xs font-bold text-muted-foreground ms-2">{selectedDoctor.rating} ({selectedDoctor.review_count} {t("reviews")})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-background border border-border/40 rounded-2xl shadow-xs">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{t("fee")}</p>
                                    <p className="text-xl font-black tabular-nums">{tc("currency")} {selectedDoctor.consultation_fee}</p>
                                </div>
                                <div className="p-4 bg-background border border-border/40 rounded-2xl shadow-xs">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{t("form.yearsExp")}</p>
                                    <p className="text-xl font-black tabular-nums">{selectedDoctor.years_experience} {t("years")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black text-lg">{t("weeklySchedule")}</h4>
                            </div>
                            <LoadingOverlay loading={isPending}>
                                <div className="space-y-3">
                                    {isArrayHasData(doctorSchedule) ? (
                                        doctorSchedule.map((slot, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${slot.is_active
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-accent/20 border-border/40'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${slot.is_active ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
                                                    <p className="font-bold text-sm">{getLocalizedValue(days[slot.day_of_week] as unknown as LocalizedString, locale)}</p>
                                                </div>
                                                <p className={`text-sm font-bold ${slot.is_active ? 'uppercase tracking-wider' : 'text-muted-foreground'}`}>
                                                    {slot.is_active ? t("activeNow") : slot.start_time + " - " + slot.end_time}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4 font-medium italic">{t("noSchedule")}</p>
                                    )}
                                </div>
                            </LoadingOverlay>
                        </div>

                        <div className="p-8 bg-accent/5 border-t border-border/40 flex gap-4 mt-auto">
                            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-lg gap-2 shadow-lg shadow-primary/20">
                                <Edit2 className="w-5 h-5" /> {t("editFees")}
                            </Button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default DoctorDetails;