import type { ToothType, ToothData, DentitionKind, ConditionId } from "@/types/dentalChart"

const TOOTH_TYPES_PERMANENT: ToothType[] = [
  "incisor", "incisor", "canine", "premolar", "premolar", "molar", "molar", "molar",
]
const TOOTH_TYPES_DECIDUOUS: ToothType[] = [
  "incisor", "incisor", "canine", "molar", "molar",
]

function buildArch(quadrant: number, kind: DentitionKind): ToothData[] {
  const types = kind === "permanent" ? TOOTH_TYPES_PERMANENT : TOOTH_TYPES_DECIDUOUS
  return types.map((type, i) => ({
    fdi: quadrant * 10 + (i + 1),
    type,
    quadrant,
    position: i + 1,
    kind,
  }))
}

export const UPPER_ADULT: ToothData[] = [
  ...buildArch(1, "permanent").slice().reverse(),
  ...buildArch(2, "permanent"),
]
export const LOWER_ADULT: ToothData[] = [
  ...buildArch(4, "permanent").slice().reverse(),
  ...buildArch(3, "permanent"),
]
export const UPPER_KIDS: ToothData[] = [
  ...buildArch(5, "deciduous").slice().reverse(),
  ...buildArch(6, "deciduous"),
]
export const LOWER_KIDS: ToothData[] = [
  ...buildArch(8, "deciduous").slice().reverse(),
  ...buildArch(7, "deciduous"),
]

export const DENTITION = {
  adult: { upper: UPPER_ADULT, lower: LOWER_ADULT },
  pediatric: { upper: UPPER_KIDS, lower: LOWER_KIDS },
}

export const SURFACE_FULL: Record<string, string> = {
  mesial: "Mesial",
  distal: "Distal",
  occlusal: "Occlusal / Incisal",
  buccal: "Buccal / Labial",
  lingual: "Lingual / Palatal",
}

export const SURFACE_LABEL: Record<string, string> = {
  mesial: "M",
  distal: "D",
  occlusal: "O",
  buccal: "B",
  lingual: "L",
}

export interface ConditionDef {
  id: ConditionId
  label: string
  hex: string
}

export const CONDITIONS: ConditionDef[] = [
  { id: "healthy",     label: "Healthy",     hex: "hsl(158 70% 48%)" },
  { id: "caries",      label: "Caries",      hex: "hsl(350 85% 62%)" },
  { id: "filling",     label: "Filling",     hex: "hsl(190 80% 55%)" },
  { id: "crown",       label: "Crown",       hex: "hsl(38 92% 55%)"  },
  { id: "rootcanal",   label: "Root canal",  hex: "hsl(268 75% 65%)" },
  { id: "extraction",  label: "Missing",     hex: "hsl(220 9% 45%)"  },
  { id: "implant",     label: "Implant",     hex: "hsl(240 75% 65%)" },
  { id: "fracture",    label: "Fracture",    hex: "hsl(0 75% 60%)"   },
  { id: "sensitivity", label: "Sensitivity", hex: "hsl(48 95% 60%)"  },
  { id: "bridge",      label: "Bridge",      hex: "hsl(310 70% 60%)" },
  { id: "veneer",      label: "Veneer",      hex: "hsl(175 70% 50%)" },
  { id: "watch",       label: "Watch",       hex: "hsl(220 13% 55%)" },
]

export const COND_BY_ID = Object.fromEntries(
  CONDITIONS.map((c) => [c.id, c]),
) as Record<ConditionId, ConditionDef>

export const QUADRANT_NAMES: Record<number, string> = {
  1: "Upper Right",
  2: "Upper Left",
  3: "Lower Left",
  4: "Lower Right",
  5: "Upper Right (deciduous)",
  6: "Upper Left (deciduous)",
  7: "Lower Left (deciduous)",
  8: "Lower Right (deciduous)",
}
