"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, ArrowRight, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useVisibility from "@/hooks/useVisibility";
import { DoctorForm } from "@/components/doctors/DoctorForm";
import { SpecialtiesDialog } from "@/components/doctors/SpecialtiesDialog";
import { Specialty } from "@/types/database";
import { getLocalizedValue } from "@/lib/localize";
import { DoctorSummary } from "@/types/doctors";
import DoctorDetails from "./DoctorDetails";
import { getSpecialties } from "@/services/specialties";

interface DoctorsClientProps {
    doctors: DoctorSummary[];
}

export default function DoctorsClient({ doctors }: DoctorsClientProps) {
    const {
        visible: isDetailsVisible,
        handleOpen: handleOpenDetails,
        handleClose: handleCloseDetails
    } = useVisibility();
    const {
        visible: isFormVisible,
        handleOpen: handleOpenForm,
        handleClose: handleCloseForm
    } = useVisibility();
    const {
        visible: isSpecialtiesOpen,
        handleOpen: handleOpenSpecialties,
        handleClose: handleCloseSpecialties
    } = useVisibility();
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);
    const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
    const [localSpecializations, setLocalSpecializations] = useState<Specialty[]>([]);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const pillsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getSpecialties().then(setLocalSpecializations);
    }, []);

    const updateScrollState = useCallback(() => {
        const el = pillsRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = pillsRef.current;
        if (!el) return;
        updateScrollState();
        el.addEventListener("scroll", updateScrollState);
        const ro = new ResizeObserver(updateScrollState);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", updateScrollState);
            ro.disconnect();
        };
    }, [localSpecializations, updateScrollState]);

    const scrollPills = (dir: "left" | "right") => {
        pillsRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    };
    const locale = useLocale();
    const t = useTranslations("Doctors");
    const tc = useTranslations("Common");

    const handleDoctorClick = (doc: DoctorSummary) => {
        setSelectedDoctor(doc);
        handleOpenDetails();
    };

    const handleOpenNewDoctor = () => {
        setSelectedDoctor(null)
        handleOpenForm()
    }

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
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleOpenSpecialties}
                                variant="outline"
                                className="rounded-xl h-12 px-5 gap-2 font-bold border-border/50"
                            >
                                <Settings2 className="w-4 h-4" /> Specialties
                            </Button>
                            <Button
                                onClick={handleOpenNewDoctor}
                                className="rounded-xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-5 h-5" /> {t("addDoctor")}
                            </Button>

                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="relative flex items-center mb-8">
                        {/* Left arrow */}
                        <button
                            onClick={() => scrollPills("left")}
                            aria-label="Scroll left"
                            className={`absolute start-0 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-md text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 shrink-0 ${canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4 rtl:hidden" />
                            <ChevronRight className="w-4 h-4 ltr:hidden" />
                        </button>

                        {/* Scrollable pills */}
                        <div
                            ref={pillsRef}
                            className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide transition-all ${canScrollLeft ? "ps-10" : "ps-0"
                                } ${canScrollRight ? "pe-10" : "pe-0"
                                }`}
                        >
                            <Button
                                onClick={() => setSelectedSpec(null)}
                                variant={!selectedSpec ? "default" : "outline"}
                                className={`rounded-full h-10 px-6 font-bold whitespace-nowrap transition-all ${selectedSpec ? 'bg-background hover:bg-accent border-border/50' : ''}`}
                            >
                                {t("allSpecializations")}
                            </Button>
                            {localSpecializations.map((spec) => {
                                const name = getLocalizedValue({ en: spec.english_name, ar: spec.arabic_name }, locale);
                                const isActive = spec.id === selectedSpec;
                                return (
                                    <Button
                                        key={spec.id}
                                        onClick={() => setSelectedSpec(spec.id)}
                                        variant={isActive ? "default" : "outline"}
                                        className={`rounded-full h-10 px-6 font-bold whitespace-nowrap transition-all ${!isActive ? 'bg-background hover:bg-accent border-border/50' : ''}`}
                                    >
                                        {name}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Right arrow */}
                        <button
                            onClick={() => scrollPills("right")}
                            aria-label="Scroll right"
                            className={`absolute end-0 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-md text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 shrink-0 ${canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                                }`}
                        >
                            <ChevronRight className="w-4 h-4 rtl:hidden" />
                            <ChevronLeft className="w-4 h-4 ltr:hidden" />
                        </button>
                    </div>

                    {/* Doctor Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doc, i) => (
                            <Card
                                key={i}
                                onClick={() => handleDoctorClick(doc)}
                                className={`rounded-3xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent/5 ${selectedDoctor?.name === doc.name ? 'border-2 border-primary ring-4 ring-primary/5 shadow-xl shadow-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                            >
                                <CardHeader className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <Avatar className="w-16 h-16 rounded-2xl border-2 border-background shadow-lg">
                                            <AvatarImage src={doc.avatar_url} className="object-cover" />
                                            <AvatarFallback className="font-black">{doc.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <Badge className={`rounded-lg px-2 py-0.5 font-black text-[10px] leading-tight border-none 
                                        ${doc.status === 'available' ? 'bg-green-100 text-green-700' :
                                                doc.status === 'on_break' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-accent text-muted-foreground'
                                            }`}>
                                            {t(doc.status.toLowerCase().replace(/\s+/g, '')).toUpperCase()}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-black">{doc.name}</CardTitle>
                                    <p className={`text-sm font-bold ${selectedDoctor?.name === doc.name ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {getLocalizedValue({ en: doc.en, ar: doc.ar }, locale)}
                                    </p>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="flex items-center justify-between border-t border-border/40 pt-4">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{t("fee")}</p>
                                            <p className="text-xl font-black tabular-nums">{tc("currency")} {Number(doc?.consultation_fee).toFixed(2)}</p>
                                        </div>
                                        <ArrowRight className={`w-5 h-5 ${selectedDoctor?.name === doc.name ? 'text-primary' : 'text-muted-foreground'} group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {isDetailsVisible && <DoctorDetails
                visible={isDetailsVisible}
                selectedDoctor={selectedDoctor}
                handleClose={handleCloseDetails}
            />}

            {/* {isFormVisible &&
                <DoctorForm
                    isOpen={isFormVisible}
                    onClose={handleCloseForm}
                    // onSubmit={handleFormSubmit}
                    // mode={formMode}
                    selectedDoctor={selectedDoctor}
                    specializations={localSpecializations}
                />
            } */}

            <SpecialtiesDialog
                isOpen={isSpecialtiesOpen}
                onClose={handleCloseSpecialties}
                specializations={localSpecializations}
                onDataChange={setLocalSpecializations}
            />
        </div>
    );
}
