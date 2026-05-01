"use client"

import type { ToothType, ToothData, ToothAnnotation, SurfaceId } from "@/types/dentalChart"
import { COND_BY_ID, SURFACE_FULL } from "./data"

const CROWN_PATHS: Record<ToothType, string> = {
  incisor:  "M 12 40 Q 12 78 30 84 Q 48 78 48 40 Z",
  canine:   "M 12 40 Q 14 76 30 86 Q 46 76 48 40 Z",
  premolar: "M 10 40 Q 8 78 30 84 Q 52 78 50 40 Z",
  molar:    "M 6 40 Q 6 80 30 84 Q 54 80 54 40 Z",
}

const ROOT_PATHS: Record<ToothType, string> = {
  incisor:  "M 18 40 Q 22 6 30 4 Q 38 6 42 40 Z",
  canine:   "M 18 40 Q 22 2 30 0 Q 38 2 42 40 Z",
  premolar: "M 16 40 Q 22 8 30 6 Q 38 8 44 40 Z",
  molar:    "M 8 40 Q 14 8 22 6 Q 30 4 38 6 Q 46 8 52 40 Z",
}

// Surface polygons in lower-arch coords (60×88 viewport; crown occupies y 40–88, root y 0–40)
const SURFACE_POLYS: Array<{ id: SurfaceId; d: string }> = [
  { id: "lingual",  d: "M 10 40 L 50 40 L 46 52 L 14 52 Z" },
  { id: "buccal",   d: "M 14 76 L 46 76 L 50 84 L 10 84 Z" },
  { id: "mesial",   d: "M 10 40 L 14 52 L 14 76 L 10 84 Z" },
  { id: "distal",   d: "M 50 40 L 46 52 L 46 76 L 50 84 Z" },
  { id: "occlusal", d: "M 14 52 L 46 52 L 46 76 L 14 76 Z" },
]

function ToothShape({
  type, flip, fillBody, fillCrown,
}: {
  type: ToothType; flip: boolean; fillBody: string; fillCrown?: string
}) {
  return (
    <g transform={flip ? "translate(0,88) scale(1,-1)" : undefined}>
      <path d={ROOT_PATHS[type]} fill={fillBody} stroke="hsl(220 13% 26%)" strokeWidth="0.8" />
      <path d={CROWN_PATHS[type]} fill={fillCrown ?? fillBody} stroke="hsl(220 13% 30%)" strokeWidth="1" />
      {/* Subtle highlight using inline gradient — avoid duplicate gradient IDs by using opacity trick */}
      <path d={CROWN_PATHS[type]} fill="white" opacity="0.12" />
    </g>
  )
}

export interface ToothSVGProps {
  tooth: ToothData
  arch: "upper" | "lower"
  annotation?: ToothAnnotation
  selected: boolean
  readOnly: boolean
  onClick: (fdi: number) => void
  onSurfaceClick: (fdi: number, surface: SurfaceId) => void
}

export function ToothSVG({
  tooth, arch, annotation, selected, readOnly, onClick, onSurfaceClick,
}: ToothSVGProps) {
  const flip = arch === "upper"
  const primaryCond = annotation?.conditions?.[0]
  const condColor = primaryCond ? COND_BY_ID[primaryCond]?.hex : undefined
  const isMissing = annotation?.conditions?.includes("extraction")
  const bodyFill = condColor ?? "hsl(40 28% 92%)"
  const occSurface = annotation?.surfaces?.occlusal
  const crownFill = occSurface ? COND_BY_ID[occSurface]?.hex : bodyFill

  return (
    <g
      onClick={(e) => { e.stopPropagation(); if (!readOnly) onClick(tooth.fdi) }}
      style={{
        cursor: readOnly ? "default" : "pointer",
        transition: "filter 120ms ease",
        filter: selected ? "drop-shadow(0 0 3px hsl(190 80% 55%))" : undefined,
      }}
    >
      {/* Selection halo */}
      {selected && (
        <rect x="2" y="-2" width="56" height="92" rx="6"
          fill="hsl(190 80% 55% / 0.08)"
          stroke="hsl(190 80% 55%)"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
      )}

      {isMissing ? (
        <g opacity="0.4">
          <ToothShape type={tooth.type} flip={flip} fillBody="hsl(220 13% 22%)" fillCrown="hsl(220 13% 22%)" />
          <line x1="10" y1="14" x2="50" y2="74" stroke="hsl(0 75% 60%)" strokeWidth="2.5" />
          <line x1="50" y1="14" x2="10" y2="74" stroke="hsl(0 75% 60%)" strokeWidth="2.5" />
        </g>
      ) : (
        <>
          <ToothShape type={tooth.type} flip={flip} fillBody={bodyFill} fillCrown={crownFill} />

          {/* Surface marks and click targets */}
          <g transform={flip ? "translate(0,88) scale(1,-1)" : undefined}>
            {SURFACE_POLYS.map(({ id, d }) => {
              const mark = annotation?.surfaces?.[id]
              if (!mark) return null
              return <path key={id} d={d} fill={COND_BY_ID[mark]?.hex} opacity="0.85" />
            })}
            {!readOnly && SURFACE_POLYS.map(({ id, d }) => (
              <path
                key={`hit-${id}`}
                d={d}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onSurfaceClick(tooth.fdi, id) }}
              >
                <title>{SURFACE_FULL[id]}</title>
              </path>
            ))}
          </g>

          {/* Severity dot */}
          {annotation?.severity != null && annotation.severity >= 3 && (
            <circle
              cx={flip ? 8 : 52} cy={6} r={4}
              fill={annotation.severity >= 4 ? "hsl(0 75% 60%)" : "hsl(38 92% 55%)"}
              stroke="hsl(220 14% 8%)" strokeWidth="1.5"
            />
          )}

          {/* Note indicator */}
          {annotation?.note && (
            <circle
              cx={flip ? 52 : 8} cy={6} r={3}
              fill="hsl(190 80% 55%)" stroke="hsl(220 14% 8%)" strokeWidth="1"
            />
          )}
        </>
      )}
    </g>
  )
}
