import { Specialty } from "./database";

export interface SpecialtyRow {
  id: string;
  english_name: string;
  arabic_name: string;
  isNew?: boolean;
}

export interface SpecialtiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  specializations: Specialty[];
}
