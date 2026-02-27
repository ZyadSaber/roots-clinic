"use client"

import DoctorsClient from "@/components/doctors/DoctorsClient";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import ErrorLayout from "@/components/ErrorLayout";
import { AlertTriangle } from "lucide-react";
import { loadAvailableDoctors } from "@/store/slices/doctorsSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslations } from "next-intl";

export default function DoctorsPage() {
    const dispatch = useDispatch<AppDispatch>()
    const t = useTranslations("Errors.applicationError.505");
    const commonT = useTranslations("Common");
    const { availableDoctors, loading, error } = useSelector(
        (state: RootState) => state.doctors
    )

    useEffect(() => {
        if (availableDoctors.length === 0) {
            dispatch(loadAvailableDoctors())
        }
    }, [dispatch, availableDoctors.length])

    return (
        <LoadingOverlay loading={loading}>
            {error && <ErrorLayout
                code="505"
                icon={<AlertTriangle className="w-full h-full" />}
                title={t("title")}
                description={t("description")}
                backText={commonT("backToHome")}
                errorDetails={error || ""}
            />}
            <DoctorsClient doctors={availableDoctors} />
        </LoadingOverlay>
    );
}
