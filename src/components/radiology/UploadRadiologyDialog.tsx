"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Upload, X, ImageIcon, User, Stethoscope, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Textarea from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadiologyRequest, RadiologyImageType } from "@/types/radiology"
import { recordRadiologyUpload } from "@/services/radiology"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"]

interface UploadRadiologyDialogProps {
    open: boolean
    request: RadiologyRequest | null
    onClose: () => void
    onSuccess: () => void
    uploadedBy: string
}

type UploadState = "idle" | "uploading" | "error"

function validateFile(file: File): string | null {
    if (!ALLOWED_MIME.includes(file.type)) {
        return `Invalid format. Allowed: ${ALLOWED_EXT.join(", ").toUpperCase()}`
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return `File too large. Max size is ${MAX_FILE_SIZE_MB}MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`
    }
    return null
}

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
    const [fileError, setFileError] = useState<string | null>(null)
    const [imageType, setImageType] = useState<RadiologyImageType>("panoramic")
    const [notes, setNotes] = useState("")
    const [uploadState, setUploadState] = useState<UploadState>("idle")
    const [uploadError, setUploadError] = useState<string | null>(null)
    // Store the storage path so we can retry the DB step without re-uploading
    const uploadedPath = useRef<string | null>(null)
    const uploadedUrl = useRef<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)

    const applyFile = (f: File) => {
        const err = validateFile(f)
        if (err) { setFileError(err); return }
        setFileError(null)
        setFile(f)
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(f)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (f) applyFile(f)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const f = e.dataTransfer.files?.[0]
        if (f) applyFile(f)
    }

    const clearFile = () => {
        setFile(null)
        setPreview(null)
        setFileError(null)
        uploadedPath.current = null
        uploadedUrl.current = null
        if (inputRef.current) inputRef.current.value = ""
    }

    const handleUpload = async () => {
        if (!request) return
        setUploadState("uploading")
        setUploadError(null)

        try {
            // Step 1 — upload to storage (skip if we already have a URL from a previous retry)
            if (!uploadedUrl.current) {
                if (!file) { setUploadState("error"); setUploadError("No file selected"); return }
                const supabase = createClient()
                const ext = file.name.split(".").pop() ?? "jpg"
                const path = `${request.patient_id}/${request.id}/${Date.now()}.${ext}`

                const { error: storageError } = await supabase.storage
                    .from("radiology")
                    .upload(path, file, { upsert: false })

                if (storageError) throw new Error(`Storage error: ${storageError.message}`)

                const { data: { publicUrl } } = supabase.storage.from("radiology").getPublicUrl(path)
                uploadedPath.current = path
                uploadedUrl.current = publicUrl
            }

            // Step 2 — record in DB
            const result = await recordRadiologyUpload({
                requestId: request.id,
                visitId: request.visit_id!,
                patientId: request.patient_id,
                uploadedBy,
                imageType,
                notes,
                imageUrl: uploadedUrl.current!,
            })

            if (!result.success) throw new Error(result.error ?? "Database error")

            toast.success(t("uploadSuccess", { name: request.patient_name }))
            handleClose()
            onSuccess()
        } catch (err) {
            const msg = err instanceof Error ? err.message : t("uploadError")
            setUploadError(msg)
            setUploadState("error")
            // If we have a stored URL it means storage succeeded but DB failed — show retry
        }
    }

    const handleClose = () => {
        if (uploadState === "uploading") return
        setFile(null)
        setPreview(null)
        setFileError(null)
        setNotes("")
        setImageType("panoramic")
        setUploadState("idle")
        setUploadError(null)
        uploadedPath.current = null
        uploadedUrl.current = null
        onClose()
    }

    const isRetry = uploadState === "error" && !!uploadedUrl.current
    const uploading = uploadState === "uploading"

    if (!request) return null

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
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

                    {/* Dropzone — hidden when retrying (file already uploaded to storage) */}
                    {!isRetry && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => inputRef.current?.click()}
                            className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
                                fileError
                                    ? "border-destructive/50 bg-destructive/5"
                                    : "border-border/50 hover:border-primary/40 bg-secondary/20 hover:bg-secondary/40"
                            }`}
                        >
                            {preview ? (
                                <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview} alt="preview" className="w-full max-h-48 object-contain" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); clearFile() }}
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
                                    <p className="text-[10px] text-muted-foreground/60">
                                        JPG · PNG · WebP · max {MAX_FILE_SIZE_MB}MB
                                    </p>
                                </div>
                            )}
                            <input
                                ref={inputRef}
                                type="file"
                                accept={ALLOWED_MIME.join(",")}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {/* File validation error */}
                    {fileError && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1">
                            <X className="w-3 h-3" /> {fileError}
                        </p>
                    )}

                    {/* Upload error (DB/storage failure) */}
                    {uploadState === "error" && uploadError && (
                        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                            <p className="font-bold mb-0.5">Upload failed</p>
                            <p className="opacity-80">{uploadError}</p>
                            {isRetry && (
                                <p className="mt-1 opacity-60">Image was uploaded to storage. Click Retry to save the record.</p>
                            )}
                        </div>
                    )}

                    {/* Image type */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold">{t("imageType")}</Label>
                        <Select value={imageType} onValueChange={(v) => setImageType(v as RadiologyImageType)}>
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
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={(!file && !isRetry) || !!fileError || uploading}
                        className="flex-1 h-10 rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {uploading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t("uploading")}
                            </>
                        ) : isRetry ? (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                {t("retry")}
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
