"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import useVisibility from "@/hooks/useVisibility";
import DoctorCard from "@/components/doctors/DoctorCard";
import { DoctorForm } from "@/components/doctors/DoctorForm";
import { SpecialtiesDialog } from "@/components/doctors/SpecialtiesDialog";
import { getLocalizedValue } from "@/lib/localize";
import { DoctorSummary } from "@/types/doctors";
import DoctorDetails from "./DoctorDetails";
import { getSpecialties } from "@/services/specialties";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setDoctorFilters, setSelectedDoctor } from "@/store/slices/doctorsSlice";
import { useQuery } from "@tanstack/react-query";

interface DoctorsClientProps {
    doctors: DoctorSummary[];
}

export default function DoctorsClient({ doctors }: DoctorsClientProps) {
    const dispatch = useDispatch()
    const specialtyId = useSelector((state: RootState) => state.doctors.filters.specialtyId)
    const selectedDoctorId = useSelector((state: RootState) => state.doctors.selectedDoctorId)
    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

    const { data: localSpecializations = [] } = useQuery({
        queryKey: ['specialties'],
        queryFn: getSpecialties,
        staleTime: 1000 * 60 * 10, // specialties rarely change, cache for 10 mins
    })

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

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const pillsRef = useRef<HTMLDivElement>(null);

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
    const ts = useTranslations("Doctors.specializations");

    const handleDoctorClick = (doc: DoctorSummary) => {
        dispatch(setSelectedDoctor(doc.id));  // store just the ID
        handleOpenDetails();
    };

    const handleOpenNewDoctor = () => {
        dispatch(setSelectedDoctor(null));    // clear selection
        handleOpenForm();
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
                                <Settings2 className="w-4 h-4" /> {ts("specialty")}
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
                            className={`absolute inset-s-0 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-md text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 shrink-0 ${canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
                                onClick={() =>
                                    dispatch(setDoctorFilters({ specialtyId: null }))}
                                variant={!specialtyId ? "default" : "outline"}
                                className={`rounded-full h-10 px-6 font-bold whitespace-nowrap transition-all ${specialtyId ? 'bg-background hover:bg-accent border-border/50' : ''}`}
                            >
                                {t("allSpecializations")}
                            </Button>
                            {localSpecializations.map((spec) => {
                                const name = getLocalizedValue({ en: spec.english_name, ar: spec.arabic_name }, locale);
                                const isActive = spec.id === specialtyId;
                                return (
                                    <Button
                                        key={spec.id}
                                        onClick={() =>
                                            dispatch(setDoctorFilters({ specialtyId: spec.id || null }))}
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
                            className={`absolute inset-e-0 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-md text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 shrink-0 ${canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                                }`}
                        >
                            <ChevronRight className="w-4 h-4 rtl:hidden" />
                            <ChevronLeft className="w-4 h-4 ltr:hidden" />
                        </button>
                    </div>

                    {/* Doctor Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doc) => (
                            <DoctorCard
                                key={doc.id}
                                doc={doc}
                                isSelected={selectedDoctorId === doc.id}
                                locale={locale}
                                onClick={() => handleDoctorClick(doc)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {isDetailsVisible && selectedDoctor &&
                <DoctorDetails
                    visible={isDetailsVisible}
                    selectedDoctor={selectedDoctor}
                    handleClose={handleCloseDetails}
                    handleOpenForm={handleOpenForm}
                />
            }

            {isFormVisible &&
                <DoctorForm
                    visible={isFormVisible}
                    onClose={handleCloseForm}
                    specializations={localSpecializations}
                    selectedDoctor={selectedDoctor}
                />
            }

            {isSpecialtiesOpen && <SpecialtiesDialog
                isOpen={isSpecialtiesOpen}
                onClose={handleCloseSpecialties}
                specializations={localSpecializations}
            />}
        </div>
    );
}
