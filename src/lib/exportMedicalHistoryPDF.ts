import { jsPDF } from "jspdf"
import { VisitRecord } from "@/types/patients"

export function exportMedicalHistoryPDF(
    history: VisitRecord[],
    patientName: string,
    patientCode: string
) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 18
    const contentW = pageW - margin * 2
    let y = margin

    const checkPage = (needed: number) => {
        if (y + needed > pageH - margin) {
            doc.addPage()
            y = margin
        }
    }

    const addText = (
        text: string,
        x: number,
        fontSize: number,
        color: [number, number, number] = [30, 30, 30],
        style: "normal" | "bold" = "normal",
        maxWidth?: number
    ) => {
        doc.setFontSize(fontSize)
        doc.setFont("helvetica", style)
        doc.setTextColor(...color)
        if (maxWidth) {
            const lines = doc.splitTextToSize(text, maxWidth)
            doc.text(lines, x, y)
            y += (lines.length * fontSize * 0.4) + 1
        } else {
            doc.text(text, x, y)
            y += fontSize * 0.4 + 1
        }
    }

    // Header
    doc.setFillColor(59, 130, 246)
    doc.roundedRect(0, 0, pageW, 36, 0, 0, "F")
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text("Medical History Report", margin, 14)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Patient: ${patientName}  |  ID: ${patientCode}`, margin, 22)
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, 29)
    y = 44

    history.forEach((visit, index) => {
        checkPage(40)

        doc.setFillColor(245, 247, 255)
        doc.roundedRect(margin - 3, y - 4, contentW + 6, 10, 2, 2, "F")
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(59, 130, 246)
        const dateLabel = new Date(visit.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
        doc.text(`Visit ${history.length - index}  —  ${dateLabel}`, margin, y + 3)
        y += 12

        checkPage(8)
        addText(`Treated by: ${visit.doctor_name}${visit.doctor_specialty_en ? ` (${visit.doctor_specialty_en})` : ""}`, margin, 9, [80, 80, 100])

        if (visit.procedure_type) {
            checkPage(7)
            addText(`Procedure Type: ${visit.procedure_type}`, margin, 9, [100, 60, 200])
        }

        y += 2

        if (visit.diagnosis) {
            checkPage(14)
            addText("Diagnosis", margin, 8, [120, 120, 140], "bold")
            addText(visit.diagnosis, margin, 9, [30, 30, 50], "normal", contentW)
            y += 2
        }

        if (visit.procedure_done) {
            checkPage(14)
            addText("Procedure Performed", margin, 8, [120, 120, 140], "bold")
            addText(visit.procedure_done, margin, 9, [30, 30, 50], "normal", contentW)
            if (visit.procedure_notes) {
                addText(`Notes: ${visit.procedure_notes}`, margin, 8, [100, 100, 120], "normal", contentW)
            }
            y += 2
        }

        if (visit.prescription) {
            checkPage(14)
            addText("Prescription", margin, 8, [120, 120, 140], "bold")
            addText(visit.prescription, margin, 9, [30, 30, 50], "normal", contentW)
            y += 2
        }

        if (visit.follow_up_date) {
            checkPage(8)
            const isOvr = new Date(visit.follow_up_date) < new Date()
            const fDate = new Date(visit.follow_up_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
            addText(`Follow-up: ${fDate}${isOvr ? "  ⚠ OVERDUE" : ""}`, margin, 9, isOvr ? [200, 100, 0] : [0, 130, 80])
        }

        if (visit.assets && visit.assets.length > 0) {
            checkPage(7)
            addText(`X-ray Images Attached: ${visit.assets.length} (${visit.assets.map(a => a.image_type).join(", ")})`, margin, 8, [100, 100, 140])
        }

        y += 4
        checkPage(4)
        doc.setDrawColor(220, 220, 235)
        doc.line(margin, y, pageW - margin, y)
        y += 6
    })

    // Footer on every page
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFontSize(7)
        doc.setTextColor(160, 160, 180)
        doc.text("Roots Clinic — Confidential Medical Record", margin, pageH - 6)
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 6, { align: "right" })
    }

    doc.save(`Medical_History_${patientName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`)
}
