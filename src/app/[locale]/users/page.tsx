"use client"

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ErrorLayout from "@/components/ErrorLayout";
import UsersModule from "@/components/users/UsersModule";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { selectFilteredUsers } from "@/store/selectors/staffSelector";
import { getAllStaff } from "@/services/staff"

export default function UsersPage() {
    const t = useTranslations("Errors.applicationError.505")
    const commonT = useTranslations("Common")

    const { data: staff = [], isLoading, error } = useQuery({
        queryKey: ["staff"],
        queryFn: getAllStaff,
    });

    const filteredStaff = useSelector(
        useMemo(() => selectFilteredUsers(staff), [staff])
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
            <UsersModule staff={filteredStaff} />
        </LoadingOverlay>
    );
}
