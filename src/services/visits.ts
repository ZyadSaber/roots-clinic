"use server";

import { queryOne, queryMany, execute, executeTransaction } from "@/lib/pg";
import { revalidatePath } from "next/cache";
import { VisitRecord, RadiologyAsset } from "@/types/patients";
import { VisitRecordRow, VisitRecordStats } from "@/types/records";

export async function getVisitRecords(
  dateFrom: Date,
  dateTo: Date,
): Promise<VisitRecordRow[]> {
  const start = new Date(dateFrom);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateTo);
  end.setHours(23, 59, 59, 999);

  return queryMany<VisitRecordRow>({
    sql: `
      SELECT
        vr.id,
        vr.appointment_id,
        vr.patient_id,
        p.full_name           AS patient_name,
        p.patient_code,
        vr.doctor_id,
        s.full_name           AS doctor_name,
        COALESCE(sp.english_name, '') AS specialty_en,
        COALESCE(sp.arabic_name, '')  AS specialty_ar,
        vr.diagnosis,
        a.procedure_type,
        vr.procedure_done,
        vr.procedure_notes,
        vr.prescription,
        vr.follow_up_date,
        vr.created_at,
        (SELECT COUNT(*)::int FROM radiology_assets ra WHERE ra.visit_id = vr.id) AS radiology_count
      FROM visit_records vr
      JOIN patients      p  ON vr.patient_id    = p.id
      JOIN doctors       d  ON vr.doctor_id     = d.id
      JOIN staff         s  ON d.staff_id       = s.id
      LEFT JOIN specialties sp ON d.specialty_id = sp.id
      LEFT JOIN appointments a  ON vr.appointment_id = a.id
      WHERE vr.created_at BETWEEN $1 AND $2
      ORDER BY vr.created_at DESC
    `,
    params: [start.toISOString(), end.toISOString()],
  });
}

export async function getVisitRecordStats(
  dateFrom: Date,
  dateTo: Date,
): Promise<VisitRecordStats> {
  const start = new Date(dateFrom);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateTo);
  end.setHours(23, 59, 59, 999);

  const row = await queryOne<VisitRecordStats>({
    sql: `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE follow_up_date IS NOT NULL)::int                        AS with_follow_up,
        COUNT(*) FILTER (WHERE prescription IS NOT NULL AND prescription <> '')::int   AS with_prescription,
        COUNT(*) FILTER (
          WHERE EXISTS (SELECT 1 FROM radiology_assets ra WHERE ra.visit_id = vr.id)
        )::int AS with_radiology
      FROM visit_records vr
      WHERE vr.created_at BETWEEN $1 AND $2
    `,
    params: [start.toISOString(), end.toISOString()],
  });
  return row ?? { total: 0, with_follow_up: 0, with_prescription: 0, with_radiology: 0 };
}

export async function getVisitByAppointmentId(
  appointmentId: string,
): Promise<VisitRecord | null> {
  return queryOne<VisitRecord>({
    sql: `
      SELECT
        vr.id,
        vr.appointment_id,
        vr.patient_id,
        vr.doctor_id,
        vr.diagnosis,
        vr.procedure_done,
        vr.procedure_notes,
        vr.prescription,
        vr.follow_up_date,
        vr.tooth_chart,
        vr.created_at,
        s.full_name       AS doctor_name,
        sp.english_name   AS doctor_specialty_en,
        sp.arabic_name    AS doctor_specialty_ar,
        a.procedure_type
      FROM visit_records vr
      JOIN doctors       d  ON vr.doctor_id     = d.id
      JOIN staff         s  ON d.staff_id        = s.id
      LEFT JOIN specialties sp ON d.specialty_id = sp.id
      LEFT JOIN appointments a ON vr.appointment_id = a.id
      WHERE vr.appointment_id = $1
    `,
    params: [appointmentId],
  });
}

export async function getRadiologyByVisitId(
  visitId: string,
): Promise<RadiologyAsset[]> {
  return queryMany<RadiologyAsset>({
    sql: `
      SELECT id, image_type, image_url, notes, taken_at
      FROM radiology_assets
      WHERE visit_id = $1
      ORDER BY taken_at ASC
    `,
    params: [visitId],
  });
}

export interface VisitUpdatePayload {
  diagnosis?: string;
  procedure_done?: string;
  procedure_notes?: string;
  prescription?: string;
  follow_up_date?: string | null;
  tooth_chart?: import("@/types/dentalChart").AnnotationMap | null;
}

export async function updateVisitRecord(
  visitId: string,
  data: VisitUpdatePayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `
        UPDATE visit_records SET
          diagnosis       = COALESCE($1, diagnosis),
          procedure_done  = COALESCE($2, procedure_done),
          procedure_notes = COALESCE($3, procedure_notes),
          prescription    = COALESCE($4, prescription),
          follow_up_date  = $5,
          tooth_chart     = COALESCE($6::jsonb, tooth_chart)
        WHERE id = $7
      `,
      params: [
        data.diagnosis ?? null,
        data.procedure_done ?? null,
        data.procedure_notes ?? null,
        data.prescription ?? null,
        data.follow_up_date ?? null,
        data.tooth_chart != null ? JSON.stringify(data.tooth_chart) : null,
        visitId,
      ],
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating visit record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

export interface PatientVisitHistoryItem {
  id: string;
  appointment_id: string;
  diagnosis: string | null;
  procedure_type: string | null;
  procedure_done: string | null;
  procedure_notes: string | null;
  prescription: string | null;
  follow_up_date: string | null;
  tooth_chart: import("@/types/dentalChart").AnnotationMap | null;
  doctor_name: string;
  doctor_specialty_en: string;
  created_at: string;
  radiology_count: number;
}

export async function getPatientVisitHistory(
  patientId: string,
  excludeVisitId: string,
): Promise<PatientVisitHistoryItem[]> {
  return queryMany<PatientVisitHistoryItem>({
    sql: `
      SELECT
        vr.id,
        vr.appointment_id,
        vr.diagnosis,
        a.procedure_type,
        vr.procedure_done,
        vr.procedure_notes,
        vr.prescription,
        vr.follow_up_date,
        vr.tooth_chart,
        s.full_name                        AS doctor_name,
        COALESCE(sp.english_name, '')      AS doctor_specialty_en,
        vr.created_at,
        (SELECT COUNT(*)::int FROM radiology_assets ra WHERE ra.visit_id = vr.id) AS radiology_count
      FROM visit_records vr
      JOIN  doctors      d  ON vr.doctor_id     = d.id
      JOIN  staff        s  ON d.staff_id        = s.id
      LEFT JOIN specialties sp ON d.specialty_id = sp.id
      LEFT JOIN appointments a ON vr.appointment_id = a.id
      WHERE vr.patient_id = $1
        AND vr.id         != $2
      ORDER BY vr.created_at DESC
    `,
    params: [patientId, excludeVisitId],
  });
}

// ── Complete visit + auto-create draft invoice ─────────────────────────────
//
// Called when the doctor clicks "End Visit & Save". One atomic transaction:
//   1. Saves clinical notes on the visit record
//   2. Marks the appointment as completed
//   3. Idempotency — skips invoice creation if one already exists for this visit
//   4. Creates a draft invoice linked to visit + patient + doctor
//   5. Adds a consultation line item at the doctor's configured fee
//   6. Groups radiology assets by image_type, looks up price from radiology_pricing,
//      and adds one line item per type (quantity = count of that type taken)
//   7. Recalculates invoice subtotal and total from the inserted items
//
// Inventory items used during the procedure will be added here in a future pass.
//
export interface CompleteVisitPayload {
  visitId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string | null;
  procedureType: string;
  formData: VisitUpdatePayload;
  createdBy?: string;
}

export async function completeVisitWithInvoice(
  payload: CompleteVisitPayload,
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    let invoiceId: string | undefined;

    await executeTransaction(async (client) => {
      // 1. Save clinical notes
      await client.query(
        `UPDATE visit_records SET
           diagnosis       = COALESCE($1, diagnosis),
           procedure_done  = COALESCE($2, procedure_done),
           procedure_notes = COALESCE($3, procedure_notes),
           prescription    = COALESCE($4, prescription),
           follow_up_date  = $5,
           tooth_chart     = COALESCE($6::jsonb, tooth_chart)
         WHERE id = $7`,
        [
          payload.formData.diagnosis ?? null,
          payload.formData.procedure_done ?? null,
          payload.formData.procedure_notes ?? null,
          payload.formData.prescription ?? null,
          payload.formData.follow_up_date ?? null,
          payload.formData.tooth_chart != null
            ? JSON.stringify(payload.formData.tooth_chart)
            : null,
          payload.visitId,
        ],
      );

      // 2. Mark appointment completed
      await client.query(
        `UPDATE appointments SET
           status       = 'completed'::appointment_status,
           completed_at = COALESCE(completed_at, NOW())
         WHERE id = $1`,
        [payload.appointmentId],
      );

      // 3. Idempotency — skip if invoice already exists for this visit
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM invoices WHERE visit_id = $1 LIMIT 1`,
        [payload.visitId],
      );
      if (existing.rows.length > 0) {
        invoiceId = existing.rows[0].id;
        return;
      }

      // 4. Fetch doctor's consultation fee
      let consultationFee = 0;
      if (payload.doctorId) {
        const docRow = await client.query<{ consultation_fee: string }>(
          `SELECT consultation_fee FROM doctors WHERE id = $1`,
          [payload.doctorId],
        );
        consultationFee = docRow.rows[0] ? Number(docRow.rows[0].consultation_fee) : 0;
      }

      // 5. Fetch radiology assets + pricing, grouped by image type
      //    LEFT JOIN so we get 0 price if the clinic hasn't configured pricing yet
      const radRows = await client.query<{ image_type: string; price: string; count: string }>(
        `SELECT
           ra.image_type,
           COALESCE(rp.price, 0) AS price,
           COUNT(*)              AS count
         FROM radiology_assets ra
         LEFT JOIN radiology_pricing rp ON rp.image_type = ra.image_type
         WHERE ra.visit_id = $1
         GROUP BY ra.image_type, rp.price
         ORDER BY ra.image_type`,
        [payload.visitId],
      );

      // 6. Create draft invoice with doctor_id for easy filtering in Finance
      const invoiceRow = await client.query<{ id: string }>(
        `INSERT INTO invoices
           (patient_id, visit_id, doctor_id, subtotal, discount, tax, total, status, created_by)
         VALUES ($1, $2, $3, 0, 0, 0, 0, 'draft', $4)
         RETURNING id`,
        [payload.patientId, payload.visitId, payload.doctorId ?? null, payload.createdBy ?? null],
      );
      invoiceId = invoiceRow.rows[0].id;

      // 7. Consultation fee line item (doctor attributed)
      await client.query(
        `INSERT INTO invoice_items
           (invoice_id, doctor_id, service_name, quantity, unit_price, discount_pct, total)
         VALUES ($1, $2, $3, 1, $4, 0, $4)`,
        [invoiceId, payload.doctorId ?? null, payload.procedureType, consultationFee],
      );

      // 8. Radiology line items — one row per image type, quantity = count of that type
      for (const row of radRows.rows) {
        const qty   = Number(row.count);
        const price = Number(row.price);
        const total = parseFloat((qty * price).toFixed(2));
        await client.query(
          `INSERT INTO invoice_items
             (invoice_id, service_name, quantity, unit_price, discount_pct, total)
           VALUES ($1, $2, $3, $4, 0, $5)`,
          [invoiceId, `Radiology – ${row.image_type}`, qty, price, total],
        );
      }

      // 9. Inventory items used during visit — pull usage movements tied to this visit
      const invMovements = await client.query<{
        item_id: string; item_name: string; quantity: string; unit_price: string;
      }>(
        `SELECT m.item_id, i.name AS item_name, m.quantity, i.unit_price
         FROM inventory_movements m
         JOIN inventory_items i ON i.id = m.item_id
         WHERE m.visit_id = $1 AND m.movement_type = 'usage' AND m.invoice_id IS NULL`,
        [payload.visitId],
      );

      for (const mov of invMovements.rows) {
        const qty = Number(mov.quantity);
        const price = Number(mov.unit_price);
        const total = parseFloat((qty * price).toFixed(2));
        await client.query(
          `INSERT INTO invoice_items
             (invoice_id, service_name, quantity, unit_price, discount_pct, total)
           VALUES ($1, $2, $3, $4, 0, $5)`,
          [invoiceId, mov.item_name, qty, price, total],
        );
      }

      // Backfill invoice_id on the movements we just consumed
      if (invMovements.rows.length > 0) {
        await client.query(
          `UPDATE inventory_movements
           SET invoice_id = $1
           WHERE visit_id = $2 AND movement_type = 'usage' AND invoice_id IS NULL`,
          [invoiceId, payload.visitId],
        );
      }

      // 10. Recalculate invoice totals from the inserted items
      await client.query(
        `UPDATE invoices SET
           subtotal   = (SELECT COALESCE(SUM(total), 0) FROM invoice_items WHERE invoice_id = $1),
           total      = (SELECT COALESCE(SUM(total), 0) FROM invoice_items WHERE invoice_id = $1),
           updated_at = NOW()
         WHERE id = $1`,
        [invoiceId],
      );
    });

    revalidatePath("/[locale]/finance", "page");
    return { success: true, invoiceId };
  } catch (error) {
    console.error("completeVisitWithInvoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}
