import { NavItemConfig } from "@/types/navigation";

export const MANAGEMENT_NAV_ITEMS: NavItemConfig[] = [
  {
    iconName: "layout-dashboard",
    labelKey: "dashboard",
    href: "/dashboard",
    descriptionKey: "dashboardDesc",
  },
  {
    iconName: "users",
    labelKey: "patients",
    href: "/patients",
    descriptionKey: "patientsDesc",
  },
  {
    iconName: "stethoscope",
    labelKey: "doctors",
    href: "/doctors",
    descriptionKey: "doctorsDesc",
  },
  {
    iconName: "package",
    labelKey: "inventory",
    href: "/inventory",
    descriptionKey: "inventoryDesc",
  },
  {
    iconName: "file-digit",
    labelKey: "radiology",
    href: "/radiology",
    descriptionKey: "radiologyDesc",
  },
  {
    iconName: "banknote",
    labelKey: "finance",
    href: "/finance",
    descriptionKey: "financeDesc",
  },
];
