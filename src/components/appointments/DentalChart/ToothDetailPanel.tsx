"use client"

import { useState } from "react"
import { X, Trash2, AlertTriangle, Sparkles } from "lucide-react"
import type { ToothData, ToothAnnotation, ConditionId, SurfaceId } from "@/types/dentalChart"
import { CONDITIONS, COND_BY_ID, SURFACE_FULL, QUADRANT_NAMES } from "./data"

// ── Surface matrix (3×3 grid) ─────────────────────────────────────────────────

const SURFACE_CELLS: Array<{ id: SurfaceId; label: string; row: number; col: number }> = [
  { id: "lingual",  label: "L", row: 1, col: 2 },
  { id: "mesial",   label: "M", row: 2, col: 1 },
  { id: "occlusal", label: "O", row: 2, col: 2 },
  { id: "distal",   label: "D", row: 2, col: 3 },
  { id: "buccal",   label: "B", row: 3, col: 2 },
]

function SurfaceMatrix({
  surfaces,
  activeCondition,
  readOnly,
  onToggle,
}: {
  surfaces: Partial<Record<SurfaceId, ConditionId>>
  activeCondition: ConditionId | null
  readOnly: boolean
  onToggle: (id: SurfaceId) => void
}) {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 34px)",
          gap: 4,
          background: "hsl(220 13% 10%)",
          border: "1px solid hsl(220 13% 22%)",
          borderRadius: 12,
          padding: 6,
        }}
      >
        {SURFACE_CELLS.map((c) => {
          const mark = surfaces[c.id]
          const cond = mark ? COND_BY_ID[mark] : null
          return (
            <button
              key={c.id}
              type="button"
              disabled={readOnly}
              onClick={() => onToggle(c.id)}
              title={SURFACE_FULL[c.id]}
              style={{
                gridRow: c.row,
                gridColumn: c.col,
                borderRadius: 8,
                border: "1px solid hsl(220 13% 26%)",
                background: cond ? cond.hex : "hsl(220 13% 15%)",
                color: cond ? "hsl(220 14% 8%)" : "hsl(220 9% 70%)",
                fontWeight: 900,
                fontFamily: "monospace",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: readOnly ? "default" : "pointer",
                transition: "all 120ms ease",
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-center text-muted-foreground/70 font-semibold mt-1.5">
        {activeCondition
          ? <>Apply <span style={{ color: COND_BY_ID[activeCondition]?.hex }}>{COND_BY_ID[activeCondition]?.label}</span></>
          : "Select a condition first"
        }
      </p>
    </div>
  )
}

// ── Severity scale ────────────────────────────────────────────────────────────

const SEVERITY_COLORS = [
  "hsl(158 70% 48%)",
  "hsl(190 80% 55%)",
  "hsl(38 92% 55%)",
  "hsl(25 95% 60%)",
  "hsl(0 75% 60%)",
]

function SeverityScale({
  value,
  readOnly,
  onChange,
}: {
  value: number
  readOnly: boolean
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value >= n
          return (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(value === n ? 0 : n)}
              className="flex-1 h-7 rounded-lg text-[11px] font-black transition-all"
              style={{
                border: active ? "1px solid transparent" : "1px solid hsl(220 13% 22%)",
                background: active ? SEVERITY_COLORS[n - 1] : "hsl(220 13% 14%)",
                color: active ? "hsl(220 14% 8%)" : "hsl(220 9% 60%)",
                cursor: readOnly ? "default" : "pointer",
                fontFamily: "monospace",
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between mt-1 text-[9px] font-semibold font-mono uppercase tracking-wide text-muted-foreground/50">
        <span>Mild</span>
        <span>Moderate</span>
        <span>Severe</span>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-5 text-center">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/8 border border-dashed border-cyan-500/30 flex items-center justify-center text-cyan-400/70">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2a4 4 0 0 0-4 4c0 1.5.5 2.5 1 4 .5 1.5 1 3.5 1 5.5 0 2 .5 4 2 4s1.5-2 2-4c.5-2 .5-2 1-2s.5 0 1 2c.5 2 .5 4 2 4s2-2 2-4c0-2 .5-4 1-5.5.5-1.5 1-2.5 1-4a4 4 0 0 0-4-4c-1.5 0-2 .5-3 .5s-1.5-.5-3-.5z" />
        </svg>
      </div>
      <div>
        <p className="text-[12px] font-black text-muted-foreground mb-1">No tooth selected</p>
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-[200px]">
          Click a tooth in the chart to apply conditions, mark surfaces, and add notes.
        </p>
      </div>
    </div>
  )
}

// ── Panel section wrapper ─────────────────────────────────────────────────────

function Section({
  label, icon, right, children,
}: {
  label: string
  icon: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <span className="text-cyan-400">{icon}</span>
          {label}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

// ── ToothDetailPanel ──────────────────────────────────────────────────────────

export interface ToothDetailPanelProps {
  fdi: number | null
  tooth: ToothData | null
  annotation?: ToothAnnotation
  readOnly: boolean
  onUpdate: (fdi: number, annotation: ToothAnnotation) => void
  onClear: (fdi: number) => void
  onClose: () => void
}

export function ToothDetailPanel({
  fdi, tooth, annotation, readOnly, onUpdate, onClear, onClose,
}: ToothDetailPanelProps) {
  const [activeCond, setActiveCond] = useState<ConditionId | null>(null)

  if (!fdi || !tooth) return <EmptyState />

  const ann: ToothAnnotation = annotation ?? { conditions: [], surfaces: {}, severity: 0, note: "" }

  const toggleCondition = (id: ConditionId) => {
    const has = ann.conditions.includes(id)
    const next = has
      ? ann.conditions.filter((c) => c !== id)
      : [id, ...ann.conditions.filter((c) => c !== id)]
    onUpdate(fdi, { ...ann, conditions: next })
    if (!has) setActiveCond(id)
  }

  const toggleSurface = (sid: SurfaceId) => {
    if (!activeCond) {
      if (ann.surfaces[sid]) {
        const { [sid]: _, ...rest } = ann.surfaces
        onUpdate(fdi, { ...ann, surfaces: rest })
      }
      return
    }
    if (ann.surfaces[sid] === activeCond) {
      const { [sid]: _, ...rest } = ann.surfaces
      onUpdate(fdi, { ...ann, surfaces: rest })
    } else {
      onUpdate(fdi, { ...ann, surfaces: { ...ann.surfaces, [sid]: activeCond } })
    }
  }

  const typeLabel = tooth.type[0].toUpperCase() + tooth.type.slice(1)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 font-mono"
          style={{ background: "hsl(190 80% 55% / 0.1)", border: "1px solid hsl(190 80% 55% / 0.25)", color: "hsl(190 80% 65%)" }}
        >
          {fdi}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black leading-tight">Tooth {fdi} · {typeLabel}</p>
          <p className="text-[10px] text-muted-foreground font-semibold font-mono uppercase tracking-wider mt-0.5">
            {QUADRANT_NAMES[tooth.quadrant]}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-accent/40 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide space-y-4">
        {/* Conditions */}
        <Section label="Conditions" icon={<Sparkles className="w-2.5 h-2.5" />}>
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((c) => {
              const active = ann.conditions.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleCondition(c.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
                  style={{
                    border: active ? "1px solid transparent" : "1px solid hsl(220 13% 22%)",
                    background: active ? c.hex : "hsl(220 13% 14%)",
                    color: active ? "hsl(220 14% 8%)" : "hsl(220 9% 75%)",
                    cursor: readOnly ? "default" : "pointer",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "hsl(220 14% 8%)" : c.hex }} />
                  {c.label}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Surfaces */}
        <Section
          label="Surfaces"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2a4 4 0 0 0-4 4c0 1.5.5 2.5 1 4 .5 1.5 1 3.5 1 5.5 0 2 .5 4 2 4s1.5-2 2-4c.5-2 .5-2 1-2s.5 0 1 2c.5 2 .5 4 2 4s2-2 2-4c0-2 .5-4 1-5.5.5-1.5 1-2.5 1-4a4 4 0 0 0-4-4c-1.5 0-2 .5-3 .5s-1.5-.5-3-.5z" />
            </svg>
          }
          right={<span className="text-[9px] font-bold font-mono text-muted-foreground/50 uppercase tracking-wider">M · D · O · B · L</span>}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <SurfaceMatrix surfaces={ann.surfaces} activeCondition={activeCond} readOnly={readOnly} onToggle={toggleSurface} />
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Apply with</p>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto scrollbar-hide">
                {CONDITIONS.filter((c) => !["extraction", "watch", "sensitivity"].includes(c.id)).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setActiveCond(activeCond === c.id ? null : c.id)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold text-left transition-all"
                    style={{
                      border: activeCond === c.id ? `1px solid ${c.hex}` : "1px solid hsl(220 13% 22%)",
                      background: activeCond === c.id ? `${c.hex}22` : "hsl(220 13% 12%)",
                      color: "hsl(220 9% 75%)",
                      cursor: readOnly ? "default" : "pointer",
                    }}
                  >
                    <span className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: c.hex }} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Severity */}
        <Section
          label="Severity"
          icon={<AlertTriangle className="w-2.5 h-2.5" />}
          right={
            <span className="text-[10px] font-bold font-mono text-muted-foreground/60">
              {ann.severity ? `${ann.severity} / 5` : "—"}
            </span>
          }
        >
          <SeverityScale value={ann.severity ?? 0} readOnly={readOnly} onChange={(s) => onUpdate(fdi, { ...ann, severity: s })} />
        </Section>

        {/* Notes */}
        <Section label="Notes" icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
          </svg>
        }>
          <textarea
            value={ann.note ?? ""}
            disabled={readOnly}
            onChange={(e) => onUpdate(fdi, { ...ann, note: e.target.value })}
            placeholder={`Findings for tooth ${fdi}…`}
            rows={4}
            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 text-[12px] leading-relaxed resize-none outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-60 disabled:cursor-default transition-colors"
          />
        </Section>

        {!readOnly && (
          <button
            type="button"
            onClick={() => onClear(fdi)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black text-destructive hover:bg-destructive/10 border border-destructive/30 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear all markings
          </button>
        )}
      </div>
    </div>
  )
}
