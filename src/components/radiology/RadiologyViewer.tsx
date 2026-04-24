"use client"

import { useEffect, useRef, useCallback } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw, Sun, Contrast, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import useFormManager from "@/hooks/useFormManager"

interface RadiologyViewerProps {
    src: string
    alt?: string
    onClose: () => void
}

const DEFAULTS = {
    scale: 1,
    brightness: 100,
    contrast: 100,
    offsetX: 0,
    offsetY: 0,
    isPanning: false,
}

export function RadiologyViewer({ src, alt = "Radiology", onClose }: RadiologyViewerProps) {
    const { formData: v, handleFieldChange, handleChangeMultiInputs, resetForm: reset } = useFormManager({
        initialData: DEFAULTS,
    })

    const panStart = useRef<{ x: number; y: number } | null>(null)
    const offsetAtPanStart = useRef({ x: 0, y: 0 })

    const zoom = useCallback((delta: number) => {
        handleFieldChange({ name: "scale", value: Math.min(5, Math.max(0.2, v.scale + delta)) })
    }, [v.scale, handleFieldChange])

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()
        zoom(e.deltaY < 0 ? 0.15 : -0.15)
    }, [zoom])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return
        handleFieldChange({ name: "isPanning", value: true })
        panStart.current = { x: e.clientX, y: e.clientY }
        offsetAtPanStart.current = { x: v.offsetX, y: v.offsetY }
    }

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!v.isPanning || !panStart.current) return
        handleChangeMultiInputs({
            offsetX: offsetAtPanStart.current.x + (e.clientX - panStart.current.x),
            offsetY: offsetAtPanStart.current.y + (e.clientY - panStart.current.y),
        })
    }, [v.isPanning, handleChangeMultiInputs])

    const stopPan = () => {
        handleFieldChange({ name: "isPanning", value: false })
        panStart.current = null
    }

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [onClose])

    const imgStyle = {
        transform: `translate(${v.offsetX}px, ${v.offsetY}px) scale(${v.scale})`,
        filter: `brightness(${v.brightness}%) contrast(${v.contrast}%)`,
        transition: v.isPanning ? "none" : "transform 0.15s ease",
        cursor: v.isPanning ? "grabbing" : "grab",
        userSelect: "none" as const,
    }

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                    {/* Zoom */}
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => zoom(0.2)}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <span className="text-white/60 text-xs w-12 text-center tabular-nums">{Math.round(v.scale * 100)}%</span>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => zoom(-0.2)}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-5 bg-white/10 mx-1" />

                    {/* Brightness */}
                    <Sun className="w-4 h-4 text-white/50 shrink-0" />
                    <input
                        type="range" min={20} max={200} step={5}
                        value={v.brightness}
                        onChange={(e) => handleFieldChange({ name: "brightness", value: Number(e.target.value) })}
                        className="w-24 accent-white/60 cursor-pointer"
                    />

                    <div className="w-px h-5 bg-white/10 mx-1" />

                    {/* Contrast */}
                    <Contrast className="w-4 h-4 text-white/50 shrink-0" />
                    <input
                        type="range" min={20} max={200} step={5}
                        value={v.contrast}
                        onChange={(e) => handleFieldChange({ name: "contrast", value: Number(e.target.value) })}
                        className="w-24 accent-white/60 cursor-pointer"
                    />

                    <div className="w-px h-5 bg-white/10 mx-1" />

                    {/* Reset */}
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 h-8 w-8" onClick={reset}>
                        <RotateCcw className="w-4 h-4" />
                    </Button>

                    {/* Pan hint */}
                    <span className="flex items-center gap-1 text-white/30 text-xs ms-2">
                        <Move className="w-3 h-3" /> drag to pan · scroll to zoom
                    </span>
                </div>

                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 h-8 w-8" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Image canvas */}
            <div
                className="flex-1 overflow-hidden flex items-center justify-center select-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopPan}
                onMouseLeave={stopPan}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    style={imgStyle}
                    className="max-w-none"
                />
            </div>
        </div>
    )
}
