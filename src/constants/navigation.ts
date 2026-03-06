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
    iconName: "calendar",
    labelKey: "appointments",
    href: "/appointments",
    descriptionKey: "appointmentsDesc",
  },
  {
    iconName: "image",
    labelKey: "radiology",
    href: "/radiology",
    descriptionKey: "radiologyDesc",
  },
  {
    iconName: "stethoscope",
    labelKey: "doctors",
    href: "/doctors",
    descriptionKey: "doctorsDesc",
  },
  {
    iconName: "userCog",
    labelKey: "staff",
    href: "/staff",
    descriptionKey: "staffDesc",
  },
  {
    iconName: "package",
    labelKey: "inventory",
    href: "/inventory",
    descriptionKey: "inventoryDesc",
  },
  {
    iconName: "dollarSign",
    labelKey: "finance",
    href: "/finance",
    descriptionKey: "financeDesc",
  },
  {
    iconName: "fileText",
    labelKey: "records",
    href: "/records",
    descriptionKey: "recordsDesc",
  },
  {
    iconName: "shield",
    labelKey: "users",
    href: "/users",
    descriptionKey: "usersDesc",
  },
];
