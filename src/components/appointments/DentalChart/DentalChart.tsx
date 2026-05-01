"use client"

import { Baby, User } from "lucide-react"
import type { Dentition, ToothData, AnnotationMap, SurfaceId } from "@/types/dentalChart"
import { DENTITION, CONDITIONS, COND_BY_ID } from "./data"
import { ToothSVG } from "./Tooth"

const TOOTH_W = 36
const TOOTH_GAP = 4

// ── Arch row ─────────────────────────────────────────────────────────────────

function ArchRow({
  teeth,
  arch,
  selectedFdi,
  annotations,
  readOnly,
  onTooth,
  onSurface,
  compact,
}: {
  teeth: ToothData[]
  arch: "upper" | "lower"
  selectedFdi: number | null
  annotations: AnnotationMap
  readOnly: boolean
  onTooth: (fdi: number) => void
  onSurface: (fdi: number, surface: SurfaceId) => void
  compact: boolean
}) {
  const h = compact ? 72 : 92
  const scale = h / 92
  const svgWidth = teeth.length * (TOOTH_W + TOOTH_GAP)
  const svgHeight = h + 20

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      style={{ display: "block" }}
    >
      {teeth.map((tooth, idx) => {
        const x = idx * (TOOTH_W + TOOTH_GAP)
        const yOffset = arch === "upper" ? 0 : 18

        return (
          <g key={tooth.fdi} transform={`translate(${x}, ${yOffset})`}>
            {/* FDI number */}
            <text
              x={TOOTH_W / 2}
              y={arch === "upper" ? h + 14 : 12}
              textAnchor="middle"
              fontSize={9}
              fontFamily="monospace"
              fontWeight="700"
              fill={selectedFdi === tooth.fdi ? "hsl(190 80% 65%)" : "hsl(220 9% 55%)"}
            >
              {tooth.fdi}
            </text>

            {/* Tooth shape scaled into TOOTH_W slot */}
            <g transform={`translate(${(TOOTH_W - 60 * scale) / 2}, ${arch === "upper" ? 0 : 18}) scale(${scale})`}>
              <ToothSVG
                tooth={tooth}
                arch={arch}
                annotation={annotations[tooth.fdi]}
                selected={selectedFdi === tooth.fdi}
                readOnly={readOnly}
                onClick={onTooth}
                onSurfaceClick={onSurface}
              />
            </g>
          </g>
        )
      })}

      {/* Midline divider (dashed) */}
      <line
        x1={svgWidth / 2}
        y1={arch === "upper" ? 4 : 18}
        x2={svgWidth / 2}
        y2={arch === "upper" ? h + 4 : h + 14}
        stroke="hsl(220 13% 26%)"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
    </svg>
  )
}

// ── Dentition toggle ──────────────────────────────────────────────────────────

function DentitionToggle({
  value,
  onChange,
  readOnly,
}: {
  value: Dentition
  onChange: (d: Dentition) => void
  readOnly: boolean
}) {
  return (
    <div className="inline-flex rounded-xl bg-secondary/40 border border-border/50 p-0.5 gap-0.5">
      {(["adult", "pediatric"] as Dentition[]).map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={readOnly}
          onClick={() => onChange(opt)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[11px] font-black uppercase tracking-wide transition-all ${
            value === opt
              ? "bg-secondary text-cyan-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt === "adult"
            ? <User className="w-3 h-3" />
            : <Baby className="w-3 h-3" />
          }
          {opt === "adult" ? "Adult" : "Pediatric"}
        </button>
      ))}
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function ChartLegend() {
  return (
    <div className="flex flex-wrap gap-2.5">
      {CONDITIONS.slice(0, 8).map((c) => (
        <span key={c.id} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span
            className="w-2.5 h-2.5 rounded-[3px] shrink-0"
            style={{ background: c.hex, border: "1px solid hsl(220 13% 28%)" }}
          />
          {c.label}
        </span>
      ))}
    </div>
  )
}

// ── DentalChart ───────────────────────────────────────────────────────────────

export interface DentalChartProps {
  dentition: Dentition
  selectedFdi: number | null
  annotations: AnnotationMap
  readOnly: boolean
  compact?: boolean
  onTooth: (fdi: number) => void
  onSurface: (fdi: number, surface: SurfaceId) => void
  onDentitionChange: (d: Dentition) => void
}

export function DentalChart({
  dentition,
  selectedFdi,
  annotations,
  readOnly,
  compact = false,
  onTooth,
  onSurface,
  onDentitionChange,
}: DentalChartProps) {
  const set = DENTITION[dentition]
  const adult = dentition === "adult"

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2a4 4 0 0 0-4 4c0 1.5.5 2.5 1 4 .5 1.5 1 3.5 1 5.5 0 2 .5 4 2 4s1.5-2 2-4c.5-2 .5-2 1-2s.5 0 1 2c.5 2 .5 4 2 4s2-2 2-4c0-2 .5-4 1-5.5.5-1.5 1-2.5 1-4a4 4 0 0 0-4-4c-1.5 0-2 .5-3 .5s-1.5-.5-3-.5z" />
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-black tracking-tight">Dental Chart</div>
            <div className="text-[10px] text-muted-foreground font-semibold font-mono">FDI · ISO 3950</div>
          </div>
        </div>
        <DentitionToggle value={dentition} onChange={onDentitionChange} readOnly={readOnly} />
      </div>

      {/* Chart canvas */}
      <div className="rounded-[18px] bg-secondary/10 border border-border/50 px-6 py-5">
        {/* Upper quadrant labels */}
        <div className="flex justify-between text-[9px] font-bold font-mono uppercase tracking-widest text-muted-foreground/60 mb-1.5">
          <span>Q{adult ? "1" : "5"} · Upper Right</span>
          <span className="text-muted-foreground/30">↑ Maxillary</span>
          <span>Q{adult ? "2" : "6"} · Upper Left</span>
        </div>

        <ArchRow
          teeth={set.upper}
          arch="upper"
          selectedFdi={selectedFdi}
          annotations={annotations}
          readOnly={readOnly}
          onTooth={onTooth}
          onSurface={onSurface}
          compact={compact}
        />

        {/* Midline rule */}
        <div className="relative my-2.5 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent">
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2.5 text-[9px] font-bold font-mono uppercase tracking-widest text-muted-foreground/40">
            Midline
          </span>
        </div>

        <ArchRow
          teeth={set.lower}
          arch="lower"
          selectedFdi={selectedFdi}
          annotations={annotations}
          readOnly={readOnly}
          onTooth={onTooth}
          onSurface={onSurface}
          compact={compact}
        />

        {/* Lower quadrant labels */}
        <div className="flex justify-between text-[9px] font-bold font-mono uppercase tracking-widest text-muted-foreground/60 mt-1.5">
          <span>Q{adult ? "4" : "8"} · Lower Right</span>
          <span className="text-muted-foreground/30">↓ Mandibular</span>
          <span>Q{adult ? "3" : "7"} · Lower Left</span>
        </div>
      </div>

      <ChartLegend />
    </div>
  )
}
