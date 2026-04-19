export type Module =
  | "dashboard"
  | "patients"
  | "appointments"
  | "radiology"
  | "doctors"
  | "inventory"
  | "finance"
  | "records"
  | "users";

export interface NavItemConfig {
  iconName: string;
  labelKey: string; // Key for translation, e.g., 'dashboard'
  href: Module;
  descriptionKey: string; // Key for translation or just a string
  hasCount?: boolean;
  uesDoctorParam?: boolean;
}
