import { AppointmentStatus } from "@/types/appointments";

export const statusColors: Record<AppointmentStatus, string> = {
  completed: "bg-primary/20 text-primary",
  cancelled: "bg-destructive/20 text-destructive",
  arrived: "bg-emerald-500/20 text-emerald-500",
  in_chair: "bg-amber-500/20 text-amber-500",
  no_show: "bg-rose-500/20 text-rose-500",
  confirmed: "bg-indigo-500/20 text-indigo-500",
  pending: "bg-blue-500/20 text-blue-500",
};

export const typeColors: Record<
  AppointmentStatus,
  { bg: string; border: string; text: string }
> = {
  completed: {
    bg: "bg-primary/20",
    border: "border-primary/30",
    text: "text-primary",
  },
  cancelled: {
    bg: "bg-indigo-500/20",
    border: "border-indigo-500/30",
    text: "text-indigo-500",
  },
  arrived: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    text: "text-emerald-500",
  },
  in_chair: {
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
    text: "text-purple-500",
  },
  no_show: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    text: "text-blue-500",
  },
  confirmed: {
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    text: "text-amber-500",
  },
  pending: {
    bg: "bg-destructive/20",
    border: "border-destructive/30",
    text: "text-destructive",
  },
};

export const priorityColors: Record<string, string> = {
  normal: "bg-secondary text-muted-foreground border-transparent",
  urgent:
    "bg-destructive/10 text-destructive border-destructive/20 font-bold shadow-sm",
};

export const ACTIONABLE_STATUSES: AppointmentStatus[] = ["arrived", "in_chair"];
