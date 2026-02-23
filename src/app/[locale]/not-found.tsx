"use client";

import { FileQuestion } from "lucide-react";
import ErrorLayout from "@/components/ErrorLayout";
import { useTranslations } from "next-intl";

export default function NotFound() {
    const t = useTranslations("Errors.notFound");

    return (
        <ErrorLayout
            code="404"
            icon={<FileQuestion className="w-full h-full" />}
            title={t("title")}
            description={t("description")}
            backText={t("backToHome")}
        />
    );
}
