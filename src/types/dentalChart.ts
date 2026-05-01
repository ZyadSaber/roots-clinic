export type ToothType = "incisor" | "canine" | "premolar" | "molar"
export type DentitionKind = "permanent" | "deciduous"
export type Dentition = "adult" | "pediatric"

export type ConditionId =
  | "healthy"
  | "caries"
  | "filling"
  | "crown"
  | "rootcanal"
  | "extraction"
  | "implant"
  | "fracture"
  | "sensitivity"
  | "bridge"
  | "veneer"
  | "watch"

export type SurfaceId = "mesial" | "distal" | "occlusal" | "buccal" | "lingual"

export interface ToothData {
  fdi: number
  type: ToothType
  quadrant: number
  position: number
  kind: DentitionKind
}

export interface ToothAnnotation {
  conditions: ConditionId[]
  surfaces: Partial<Record<SurfaceId, ConditionId>>
  severity: number
  note: string
}

export type AnnotationMap = Record<number, ToothAnnotation>
