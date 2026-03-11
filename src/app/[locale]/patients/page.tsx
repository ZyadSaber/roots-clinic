"use client"

import ErrorLayout from "@/components/ErrorLayout";
import { PatientsModule } from "@/components/patients/PatientsModule";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { selectFilteredPatients, selectPatientStats } from "@/store/selectors/patientsSelector";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { fetchAllPatients } from "@/services/patients"

export default function PatientsPage() {
    const t = useTranslations("Errors.applicationError.505")
    const commonT = useTranslations("Common")

    const { data: patients = [], isLoading, error } = useQuery({
        queryKey: ["patients"],
        queryFn: fetchAllPatients,
    });

    const filteredPatients = useSelector(
        useMemo(() => selectFilteredPatients(patients), [patients])
    );

    const stats = useSelector(
        useMemo(() => selectPatientStats(patients), [patients])
    );

    return (
        <LoadingOverlay loading={isLoading}>
            {error && (
                <ErrorLayout
                    code="505"
                    icon={<AlertTriangle className="w-full h-full" />}
                    title={t("title")}
                    description={t("description")}
                    backText={commonT("backToHome")}
                    errorDetails={error instanceof Error ? error.message : "An unexpected error occurred"}
                />
            )}
            <PatientsModule patients={filteredPatients} stats={stats} />
        </LoadingOverlay>
    );
}
