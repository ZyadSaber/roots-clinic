"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Upload, X, ImageIcon, User, Stethoscope } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Textarea from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadiologyRequest } from "@/types/appointments"
import { recordRadiologyUpload } from "@/services/radiology"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface UploadRadiologyDialogProps {
    open: boolean
    request: RadiologyRequest | null
    onClose: () => void
    onSuccess: () => void
    uploadedBy: string
}

type ImageType = "panoramic" | "bitewing" | "periapical"

export function UploadRadiologyDialog({
    open,
    request,
    onClose,
    onSuccess,
    uploadedBy,
}: UploadRadiologyDialogProps) {
    const t = useTranslations("Radiology.uploadDialog")
    const tTypes = useTranslations("Radiology.imageTypes")

    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [imageType, setImageType] = useState<ImageType>("panoramic")
    const [notes, setNotes] = useState("")
    const [uploading, setUploading] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(f)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const f = e.dataTransfer.files?.[0]
        if (!f || !f.type.startsWith("image/")) return
        setFile(f)
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(f)
    }

    const handleUpload = async () => {
        if (!file || !request) return
        setUploading(true)
        try {
            const supabase = createClient()
            const ext = file.name.split(".").pop() ?? "jpg"
            const path = `${request.patient_id}/${request.id}/${Date.now()}.${ext}`

            const { error: storageError } = await supabase.storage
                .from("radiology")
                .upload(path, file, { upsert: false })
            if (storageError) throw new Error(storageError.message)

            const { data: { publicUrl } } = supabase.storage.from("radiology").getPublicUrl(path)

            const result = await recordRadiologyUpload({
                requestId: request.id,
                visitId: request.visit_id!,
                patientId: request.patient_id,
                uploadedBy,
                imageType,
                notes,
                imageUrl: publicUrl,
            })

            if (!result.success) throw new Error(result.error)

            toast.success(t("uploadSuccess", { name: request.patient_name }))
            handleClose()
            onSuccess()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t("uploadError"))
        } finally {
            setUploading(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setPreview(null)
        setNotes("")
        setImageType("panoramic")
        onClose()
    }

    if (!request) return null

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o && !uploading) handleClose() }}>
            <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-background">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
                    <DialogTitle className="text-base font-black">{t("title")}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">{t("desc")}</DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4 space-y-4">
                    {/* Patient chip */}
                    <div className="flex items-center gap-3 rounded-xl bg-accent/30 border border-border/30 px-3 py-2">
                        <div className="w-7 h-7 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-black leading-tight truncate">{request.patient_name}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{request.patient_code}</p>
                        </div>
                        {request.procedure_type && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                <Stethoscope className="w-3 h-3" />
                                {request.procedure_type}
                            </div>
                        )}
                    </div>

                    {/* Dropzone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => inputRef.current?.click()}
                        className="cursor-pointer rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 bg-secondary/20 hover:bg-secondary/40 transition-colors overflow-hidden"
                    >
                        {preview ? (
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={preview} alt="preview" className="w-full max-h-48 object-contain" />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive/10"
                                >
                                    <X className="w-3.5 h-3.5 text-destructive" />
                                </button>
                                <p className="text-center text-xs text-muted-foreground py-1.5">{file?.name}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-dashed border-indigo-500/30 flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">{t("dropzone")}</p>
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Image type */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold">{t("imageType")}</Label>
                        <Select value={imageType} onValueChange={(v) => setImageType(v as ImageType)}>
                            <SelectTrigger className="rounded-xl bg-secondary border-border/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="panoramic">{tTypes("panoramic")}</SelectItem>
                                <SelectItem value="bitewing">{tTypes("bitewing")}</SelectItem>
                                <SelectItem value="periapical">{tTypes("periapical")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <Textarea
                        label={t("notes")}
                        placeholder={t("notesPlaceholder")}
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="rounded-xl resize-none text-sm bg-background border-border/50"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={uploading}
                        className="flex-1 h-10 rounded-xl font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 h-10 rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {uploading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t("uploading")}
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                {t("upload")}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
