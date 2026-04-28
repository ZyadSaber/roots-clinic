import type { InsuranceClaimStatus } from "@/types/finance";

export const DOCTOR_STATUSES = [
  {
    value: "available",
    en: "Available",
    ar: "متاح",
  },
  {
    value: "in_session",
    en: "In Session",
    ar: "في جلسة",
  },
  {
    value: "on_break",
    en: "On Break",
    ar: "في استراحة",
  },
  {
    value: "away",
    en: "Away",
    ar: "بعيد",
  },
  {
    value: "off_duty",
    en: "Off Duty",
    ar: "خارج العمل",
  },
];

export const statusColors: Record<InsuranceClaimStatus, string> = {
  pending: "bg-chart-5/20 text-chart-5",
  submitted: "bg-blue-500/20 text-blue-500",
  approved: "bg-primary/20 text-primary",
  partial: "bg-orange-500/20 text-orange-500",
  rejected: "bg-destructive/20 text-destructive",
};

