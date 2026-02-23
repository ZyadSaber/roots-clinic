"use client";

import ErrorLayout from "@/components/ErrorLayout";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ForbiddenPage() {
    const t = useTranslations("Errors.forbidden");

    return (
        <ErrorLayout
            code="403"
            icon={<ShieldAlert className="w-full h-full" />}
            title={t("title")}
            description={t("description")}
            backText={t("backToHome")}
        />
    );
}
