"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
    Plus,
    Star,
    ArrowRight,
    Edit2,
    Wallet,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useVisibility from "@/hooks/useVisibility";
import { motion, AnimatePresence } from "framer-motion";
import { DoctorForm, DoctorFormData } from "@/components/doctors/DoctorForm";
import { toast } from "sonner";
import { Specialty } from "@/types/database";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface Doctor {
    id: string;
    name: string;
    specialty_en: string;
    specialty_ar: string;
    fee: number;
    status: string;
    image: string;
    rating: number;
    reviews: number;
    exp: number;
    schedule: { day: string; time: string; active: boolean }[];
}

interface DoctorsClientProps {
    doctors: Doctor[];
    specializations: Specialty[];
}

export default function DoctorsClient({ doctors, specializations }: DoctorsClientProps) {
    const { visible, handleOpen, handleClose } = useVisibility();
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"add" | "edit">("add");
    const searchQuery = useSelector((state: RootState) => state.uiShared.searchQuery);
    const locale = useLocale();
    const t = useTranslations("Doctors");
    const tc = useTranslations("Common");

    const handleOpenAddForm = () => {
        setFormMode("add");
        setIsFormOpen(true);
    };

    const handleOpenEditForm = () => {
        if (selectedDoctor) {
            setFormMode("edit");
            setIsFormOpen(true);
        }
    };

    const handleFormSubmit = (data: DoctorFormData) => {
        console.log("Form submitted:", data);
        toast.success(formMode === "add" ? t("form.successAdd") : t("form.successEdit"));
        setIsFormOpen(false);
    };

    const handleDoctorClick = (doc: Doctor) => {
        setSelectedDoctor(doc);
        handleOpen();
    };

    const filteredDoctors = doctors.filter(doc => {
        const matchesSpec = !selectedSpec ||
            doc.specialty_en === selectedSpec ||
            doc.specialty_ar === selectedSpec;
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialty_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialty_ar.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSpec && matchesSearch;
    });

    const getDoctorSpecialty = (doc: Doctor) => {
        return locale === 'ar' ? doc.specialty_ar : doc.specialty_en;
    };

    const getSpecialtyName = (spec: Specialty) => {
        return locale === 'ar' ? spec.arabic_name : spec.english_name;
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
            {/* Main Section */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-2">{t("pageTitle")}</h1>
                            <p className="text-muted-foreground font-medium">{t("pageDescription")}</p>
                        </div>
                        <Button
                            onClick={handleOpenAddForm}
                            className="rounded-xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-5 h-5" /> {t("addDoctor")}
                        </Button>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                        <Button
                            onClick={() => setSelectedSpec(null)}
                            variant={!selectedSpec ? "default" : "outline"}
                            className={`rounded-full h-10 px-6 font-bold whitespace-nowrap transition-all ${selectedSpec ? 'bg-background hover:bg-accent border-border/50' : ''}`}
                        >
                            {t("allSpecializations")}
                        </Button>
                        {specializations.map((spec) => {
                            const name = getSpecialtyName(spec);
                            const isActive = selectedSpec === spec.english_name || selectedSpec === spec.arabic_name;
                            return (
                                <Button
                                    key={spec.id}
                                    onClick={() => setSelectedSpec(locale === 'ar' ? spec.arabic_name : spec.english_name)}
                                    variant={isActive ? "default" : "outline"}
                                    className={`rounded-full h-10 px-6 font-bold whitespace-nowrap transition-all ${!isActive ? 'bg-background hover:bg-accent border-border/50' : ''}`}
                                >
                                    {name}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Doctor Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map((doc, i) => (
                            <Card
                                key={i}
                                onClick={() => handleDoctorClick(doc)}
                                className={`rounded-3xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent/5 ${selectedDoctor?.name === doc.name ? 'border-2 border-primary ring-4 ring-primary/5 shadow-xl shadow-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                            >
                                <CardHeader className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <Avatar className="w-16 h-16 rounded-2xl border-2 border-background shadow-lg">
                                            <AvatarImage src={doc.image} className="object-cover" />
                                            <AvatarFallback className="font-black">{doc.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <Badge className={`rounded-lg px-2 py-0.5 font-black text-[10px] leading-tight border-none ${doc.status === 'Available' ? 'bg-green-100 text-green-700' :
                                            doc.status === 'On Break' ? 'bg-blue-100 text-blue-700' :
                                                'bg-accent text-muted-foreground'
                                            }`}>
                                            {t(doc.status.toLowerCase().replace(/\s+/g, '')).toUpperCase()}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-black">{doc.name}</CardTitle>
                                    <p className={`text-sm font-bold ${selectedDoctor?.name === doc.name ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {getDoctorSpecialty(doc)}
                                    </p>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="flex items-center justify-between border-t border-border/40 pt-4">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{t("fee")}</p>
                                            <p className="text-xl font-black tabular-nums">{tc("currency")} {doc.fee.toFixed(2)}</p>
                                        </div>
                                        <ArrowRight className={`w-5 h-5 ${selectedDoctor?.name === doc.name ? 'text-primary' : 'text-muted-foreground'} group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

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
                                        <AvatarImage src={selectedDoctor.image} className="object-cover" />
                                        <AvatarFallback className="text-2xl font-black">
                                            {selectedDoctor.name.split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">{selectedDoctor.name}</h2>
                                        <p className="text-primary font-bold">{getDoctorSpecialty(selectedDoctor)}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <Stars rating={selectedDoctor.rating} />
                                            <span className="text-xs font-bold text-muted-foreground ms-2">{selectedDoctor.rating} ({selectedDoctor.reviews} {t("reviews")})</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-background border border-border/40 rounded-2xl shadow-xs">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{t("fee")}</p>
                                        <p className="text-xl font-black tabular-nums">{tc("currency")} {selectedDoctor.fee.toFixed(2)}</p>
                                    </div>
                                    <div className="p-4 bg-background border border-border/40 rounded-2xl shadow-xs">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{t("form.yearsExp")}</p>
                                        <p className="text-xl font-black tabular-nums">{selectedDoctor.exp} {t("years")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-black text-lg">{t("weeklySchedule")}</h4>
                                    <Button variant="ghost" size="sm" className="text-primary font-bold h-8 rounded-lg">{t("manageRules")}</Button>
                                </div>
                                <div className="space-y-3">
                                    {selectedDoctor.schedule.length > 0 ? (
                                        selectedDoctor.schedule.map((slot: { day: string; time: string; active: boolean }) => (
                                            <div
                                                key={slot.day}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${slot.active
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-accent/20 border-border/40'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${slot.active ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
                                                    <p className="font-bold text-sm">{t(`days.${slot.day}`)}</p>
                                                </div>
                                                <p className={`text-sm font-bold ${slot.active ? 'uppercase tracking-wider' : 'text-muted-foreground'}`}>
                                                    {slot.active ? t("activeNow") : slot.time}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4 font-medium italic">{t("noSchedule")}</p>
                                    )}
                                    <div className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-400" />
                                            <p className="font-bold text-sm text-red-600 dark:text-red-400">{t("weekend")}</p>
                                        </div>
                                        <p className="text-sm font-bold text-red-400">{t("unavailable")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-accent/5 border-t border-border/40 flex gap-4 mt-auto">
                                <Button className="flex-1 h-14 rounded-2xl font-black text-lg gap-2 shadow-lg shadow-primary/20">
                                    <Wallet className="w-5 h-5" /> {t("editFees")}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleOpenEditForm}
                                    className="w-14 h-14 rounded-2xl bg-background border-border/50 shadow-xs active:scale-95 transition-transform"
                                >
                                    <Edit2 className="w-5 h-5 text-muted-foreground" />
                                </Button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <DoctorForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                mode={formMode}
                initialData={formMode === "edit" ? {
                    name: selectedDoctor?.name,
                    specialty: selectedDoctor?.specialty_en,
                    fee: selectedDoctor?.fee,
                    status: selectedDoctor?.status,
                    image: selectedDoctor?.image,
                    exp: selectedDoctor?.exp
                } : undefined}
                specializations={specializations}
            />
        </div>
    );
}

function Stars({ rating }: { rating: number }) {
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
