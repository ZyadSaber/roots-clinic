"use client"

import { useMemo } from "react"
import { useSelector } from "react-redux"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import { fetchAvailableDoctors } from "@/services/doctors"
import { RootState } from "@/store/store"
import { selectFilteredDoctors } from "@/store/selectors/doctorsSelectors"
import DoctorsClient from "@/components/doctors/DoctorsClient"
import { LoadingOverlay } from "@/components/ui/LoadingOverlay"
import ErrorLayout from "@/components/ErrorLayout"

export default function DoctorsPage() {
    const t = useTranslations("Errors.applicationError.505")
    const commonT = useTranslations("Common")

    const filters = useSelector((state: RootState) => state.doctors.filters)
    const searchQuery = useSelector((state: RootState) => state.uiShared.searchQuery)

    const { data: availableDoctors = [], isLoading, error } = useQuery({
        queryKey: ["doctors"],
        queryFn: fetchAvailableDoctors,
    })

    const filteredDoctors = useMemo(
        () => selectFilteredDoctors(availableDoctors)(({ doctors: { filters }, uiShared: { searchQuery } } as RootState)),
        [availableDoctors, filters, searchQuery]
    )

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
            <DoctorsClient doctors={filteredDoctors} />
        </LoadingOverlay>
    )
}