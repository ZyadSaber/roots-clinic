import { NavItemConfig } from "@/types/navigation";

export const MANAGEMENT_NAV_ITEMS: NavItemConfig[] = [
  {
    iconName: "layout-dashboard",
    labelKey: "dashboardTitle",
    href: "dashboard",
    descriptionKey: "dashboardDesc",
    hasCount: false,
  },
  {
    iconName: "users",
    labelKey: "patientsTitle",
    href: "patients",
    descriptionKey: "patientsDesc",
    hasCount: false,
  },
  {
    iconName: "calendar",
    labelKey: "appointmentsTitle",
    href: "appointments",
    descriptionKey: "appointmentsDesc",
    hasCount: true,
  },
  {
    iconName: "image",
    labelKey: "radiologyTitle",
    href: "radiology",
    descriptionKey: "radiologyDesc",
    hasCount: true,
  },
  {
    iconName: "stethoscope",
    labelKey: "doctorsTitle",
    href: "doctors",
    descriptionKey: "doctorsDesc",
    hasCount: false,
  },
  {
    iconName: "package",
    labelKey: "inventoryTitle",
    href: "inventory",
    descriptionKey: "inventoryDesc",
    hasCount: false,
  },
  {
    iconName: "dollarSign",
    labelKey: "financeTitle",
    href: "finance",
    descriptionKey: "financeDesc",
    hasCount: false,
  },
  {
    iconName: "fileText",
    labelKey: "recordsTitle",
    href: "records",
    descriptionKey: "recordsDesc",
    hasCount: true,
  },
  {
    iconName: "shield",
    labelKey: "usersTitle",
    href: "users",
    descriptionKey: "usersDesc",
    hasCount: false,
  },
];
