"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useVisibility from "@/hooks/useVisibility";
import { DoctorForm } from "@/components/doctors/DoctorForm";
import { Specialty } from "@/types/database";
import { getLocalizedValue } from "@/lib/localize";
import { DoctorSummary } from "@/types/doctors";
import DoctorDetails from "./DoctorDetails";

interface DoctorsClientProps {
    doctors: DoctorSummary[];
    specializations: Specialty[];
}

export default function DoctorsClient({ doctors, specializations }: DoctorsClientProps) {
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
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary>();
    const [selectedSpec, setSelectedSpec] = useState<string | null>(null)
    const locale = useLocale();
    const t = useTranslations("Doctors");
    const tc = useTranslations("Common");

    const handleDoctorClick = (doc: DoctorSummary) => {
        setSelectedDoctor(doc);
        handleOpenDetails();
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
                            onClick={handleOpen}
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
                            const name = getLocalizedValue({ en: spec.english_name, ar: spec.arabic_name }, locale);
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

            <DoctorForm
                isOpen={isFormVisible}
                onClose={handleCloseForm}
                // onSubmit={handleFormSubmit}
                // mode={formMode}
                selectedDoctor={selectedDoctor}
                specializations={specializations}
            />
        </div>
    );
}
