"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import ErrorLayout from "@/components/ErrorLayout";
import { useTranslations } from "next-intl";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations("Errors.applicationError");
    const commonT = useTranslations("Common");

    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application Error:", error);
    }, [error]);

    return (
        <ErrorLayout
            code="500"
            icon={<AlertTriangle className="w-full h-full" />}
            title={t("title")}
            description={t("description")}
            backText={commonT("backToHome")}
            reset={reset}
            errorDetails={error.message || error.toString()}
        />
    );
}
