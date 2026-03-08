import { NavItemConfig } from "@/types/navigation";

export const MANAGEMENT_NAV_ITEMS: NavItemConfig[] = [
  {
    iconName: "layout-dashboard",
    labelKey: "dashboard",
    href: "/dashboard",
    descriptionKey: "dashboardDesc",
    hasCount: false,
  },
  {
    iconName: "users",
    labelKey: "patients",
    href: "/patients",
    descriptionKey: "patientsDesc",
    hasCount: false,
  },
  {
    iconName: "calendar",
    labelKey: "appointments",
    href: "/appointments",
    descriptionKey: "appointmentsDesc",
    hasCount: true,
  },
  {
    iconName: "image",
    labelKey: "radiology",
    href: "/radiology",
    descriptionKey: "radiologyDesc",
    hasCount: true,
  },
  {
    iconName: "stethoscope",
    labelKey: "doctors",
    href: "/doctors",
    descriptionKey: "doctorsDesc",
    hasCount: false,
  },
  {
    iconName: "package",
    labelKey: "inventory",
    href: "/inventory",
    descriptionKey: "inventoryDesc",
    hasCount: false,
  },
  {
    iconName: "dollarSign",
    labelKey: "finance",
    href: "/finance",
    descriptionKey: "financeDesc",
    hasCount: false,
  },
  {
    iconName: "fileText",
    labelKey: "records",
    href: "/records",
    descriptionKey: "recordsDesc",
    hasCount: false,
  },
  {
    iconName: "shield",
    labelKey: "users",
    href: "/users",
    descriptionKey: "usersDesc",
    hasCount: false,
  },
];
