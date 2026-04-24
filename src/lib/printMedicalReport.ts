import { VisitRecordRow } from "@/types/records"
import { RadiologyAsset } from "@/types/radiology"
import { format } from "date-fns"

export function printMedicalReport(record: VisitRecordRow, assets: RadiologyAsset[], specialty: string) {
    const visitDate = format(new Date(record.created_at), "MMMM d, yyyy")
    const followUpDate = record.follow_up_date
        ? format(new Date(record.follow_up_date), "MMMM d, yyyy")
        : null
    const printedAt = format(new Date(), "MMMM d, yyyy · h:mm a")

    const radiologySection =
        assets.length > 0
            ? `<div class="section">
          <div class="section-header">
            <span class="section-icon">🩻</span>
            <h3>Radiology Images</h3>
          </div>
          <div class="radiology-grid">
            ${assets
                .map(
                    (a) => `
              <div class="radiology-item">
                <img src="${a.image_url}" alt="${a.image_type}" crossorigin="anonymous" />
                <p class="img-label">${a.image_type.toUpperCase()}${a.notes ? ` — ${a.notes}` : ""}</p>
              </div>`
                )
                .join("")}
          </div>
        </div>`
            : ""

    const field = (icon: string, label: string, value: string, mono = false) => `
      <div class="section">
        <div class="section-header">
          <span class="section-icon">${icon}</span>
          <h3>${label}</h3>
        </div>
        <p class="field-value${mono ? " mono" : ""}">${value}</p>
      </div>`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Medical Report — ${record.patient_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: #2563eb;
      --primary-light: #dbeafe;
      --muted: #6b7280;
      --border: #e5e7eb;
      --bg: #f9fafb;
      --card: #ffffff;
      --text: #111827;
      --accent: #1e40af;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      background: var(--card);
      min-height: 100vh;
      padding: 48px 56px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 28px;
      border-bottom: 2px solid var(--primary);
      margin-bottom: 32px;
    }

    .clinic-brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .clinic-logo {
      width: 52px;
      height: 52px;
      background: var(--primary);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -1px;
      flex-shrink: 0;
    }

    .clinic-name {
      font-size: 20px;
      font-weight: 900;
      color: var(--text);
      letter-spacing: -0.5px;
    }

    .clinic-tagline {
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
      margin-top: 2px;
    }

    .report-meta {
      text-align: right;
    }

    .report-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: var(--primary);
    }

    .report-date {
      font-size: 11px;
      color: var(--muted);
      margin-top: 4px;
      font-weight: 500;
    }

    .report-id {
      font-size: 10px;
      color: var(--muted);
      margin-top: 2px;
      font-family: 'JetBrains Mono', monospace;
    }

    /* ── Patient card ── */
    .patient-card {
      background: var(--primary-light);
      border-radius: 16px;
      padding: 20px 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }

    .patient-card-left {
      border-right: 1px solid #bfdbfe;
      padding-right: 20px;
    }

    .patient-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--accent);
      margin-bottom: 4px;
    }

    .patient-name {
      font-size: 18px;
      font-weight: 900;
      color: var(--text);
      letter-spacing: -0.5px;
    }

    .patient-code {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--accent);
      font-weight: 500;
      margin-top: 2px;
    }

    .patient-right-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .info-cell {}

    .info-cell .label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--accent);
      margin-bottom: 3px;
    }

    .info-cell .value {
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
    }

    /* ── Divider ── */
    .divider {
      height: 1px;
      background: var(--border);
      margin: 28px 0;
    }

    /* ── Section ── */
    .section {
      margin-bottom: 22px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .section-icon {
      font-size: 14px;
      line-height: 1;
    }

    .section-header h3 {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--muted);
    }

    .field-value {
      font-size: 13px;
      color: var(--text);
      font-weight: 500;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
      white-space: pre-wrap;
      line-height: 1.7;
    }

    .field-value.mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }

    .diagnosis-badge {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 800;
      font-size: 13px;
      padding: 6px 16px;
      border-radius: 999px;
    }

    .followup-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      font-weight: 800;
      font-size: 13px;
      padding: 6px 16px;
      border-radius: 999px;
    }

    /* ── Radiology ── */
    .radiology-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .radiology-item {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .radiology-item img {
      width: 100%;
      aspect-ratio: 4/3;
      object-fit: cover;
      display: block;
    }

    .img-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--muted);
      padding: 6px 10px;
      background: var(--bg);
      border-top: 1px solid var(--border);
    }

    /* ── Footer ── */
    .footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .footer-left {
      font-size: 9px;
      color: var(--muted);
      line-height: 1.8;
    }

    .footer-sig {
      text-align: right;
    }

    .sig-line {
      width: 160px;
      height: 1px;
      background: var(--border);
      margin-left: auto;
      margin-bottom: 6px;
    }

    .sig-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--muted);
    }

    @media print {
      body { background: white; }
      .page { padding: 36px 44px; max-width: 100%; }
      .radiology-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="clinic-brand">
        <div class="clinic-logo">R</div>
        <div>
          <div class="clinic-name">Roots Clinic</div>
          <div class="clinic-tagline">Dental &amp; Healthcare Excellence</div>
        </div>
      </div>
      <div class="report-meta">
        <div class="report-title">Medical Report</div>
        <div class="report-date">Printed: ${printedAt}</div>
        <div class="report-id">${record.appointment_id}</div>
      </div>
    </div>

    <!-- Patient card -->
    <div class="patient-card">
      <div class="patient-card-left">
        <div class="patient-label">Patient</div>
        <div class="patient-name">${record.patient_name}</div>
        <div class="patient-code">${record.patient_code}</div>
      </div>
      <div class="patient-right-grid">
        <div class="info-cell">
          <div class="label">Visit Date</div>
          <div class="value">${visitDate}</div>
        </div>
        <div class="info-cell">
          <div class="label">Doctor</div>
          <div class="value">${record.doctor_name}</div>
        </div>
        <div class="info-cell">
          <div class="label">Specialty</div>
          <div class="value">${specialty || "—"}</div>
        </div>
        <div class="info-cell">
          <div class="label">Procedure Type</div>
          <div class="value">${record.procedure_type ?? "—"}</div>
        </div>
      </div>
    </div>

    <!-- Clinical content -->
    ${
        record.diagnosis
            ? `<div class="section">
        <div class="section-header">
          <span class="section-icon">🔬</span>
          <h3>Diagnosis</h3>
        </div>
        <span class="diagnosis-badge">${record.diagnosis}</span>
      </div>`
            : ""
    }

    ${record.procedure_done ? field("🦷", "Procedure Done", record.procedure_done) : ""}
    ${record.procedure_notes ? field("📋", "Clinical Notes", record.procedure_notes) : ""}
    ${record.prescription ? field("💊", "Prescription", record.prescription, true) : ""}

    ${
        followUpDate
            ? `<div class="section">
        <div class="section-header">
          <span class="section-icon">📅</span>
          <h3>Follow-up Appointment</h3>
        </div>
        <span class="followup-badge">📅 ${followUpDate}</span>
      </div>`
            : ""
    }

    ${radiologySection ? `<div class="divider"></div>${radiologySection}` : ""}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <div>This document is confidential and intended solely for the patient named above.</div>
        <div>Roots Clinic · Dental &amp; Healthcare Excellence</div>
        <div>Generated by Roots Clinic Management System</div>
      </div>
      <div class="footer-sig">
        <div class="sig-line"></div>
        <div class="sig-label">Doctor's Signature</div>
      </div>
    </div>

  </div>

  <script>
    // Wait for all images to load then print
    const images = document.querySelectorAll('img');
    if (images.length === 0) {
      window.print();
    } else {
      let loaded = 0;
      const total = images.length;
      const tryPrint = () => { if (++loaded >= total) window.print(); };
      images.forEach(img => {
        if (img.complete) tryPrint();
        else { img.onload = tryPrint; img.onerror = tryPrint; }
      });
    }
  </script>
</body>
</html>`

    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) return
    win.document.write(html)
    win.document.close()
}
