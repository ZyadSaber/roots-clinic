"use server";

import { execute, pool, query, queryMany } from "@/lib/pg";
import {
  InvoiceRecord,
  MedicalAlert,
  PatientDetails,
  PatientSummary,
  VisitRecord,
} from "@/types/patients";
import { revalidatePath } from "next/cache";
import { type PatientFormValues } from "@/validation/patients";
import { getLocale } from "next-intl/server";

export async function fetchAllPatients(): Promise<PatientSummary[]> {
  const sql = `SELECT * FROM patients_full`;
  return (await queryMany({ sql })) as PatientSummary[];
}

export async function fetchPatientDetails(
  patientId: string,
): Promise<PatientDetails> {
  try {
    const locale = await getLocale()
    const [
      alerts,
      visitsRaw,
      assets,
      invoices
    ] = await Promise.all([
      queryMany({
        sql: `SELECT * FROM patient_alerts WHERE patient_id = $1 ORDER BY created_at DESC`,
        params: [patientId],
      }),
      queryMany({
        sql: `
          SELECT
            vr.*,
            s.full_name        AS doctor_name,
            ${locale === "en" ? "sp.english_name" : "sp.arabic_name"} AS doctor_specialty,
            a.procedure_type
          FROM visit_records vr
          JOIN doctors       d  ON vr.doctor_id      = d.id
          JOIN staff         s  ON d.staff_id         = s.id
          LEFT JOIN specialties sp ON d.specialty_id  = sp.id
          LEFT JOIN appointments a ON vr.appointment_id = a.id
          WHERE vr.patient_id = $1
          ORDER BY vr.created_at DESC
        `,
        params: [patientId],
      }),
      queryMany({
        sql: `SELECT * FROM radiology_assets WHERE patient_id = $1 ORDER BY taken_at DESC`,
        params: [patientId],
      }),
      queryMany({
        sql: `SELECT * FROM invoices WHERE patient_id = $1 ORDER BY created_at DESC`,
        params: [patientId],
      }),
    ]);

    // Attach assets to visits
    const visitsWithAssets = visitsRaw.map((v) => ({
      ...v,
      assets: assets.filter((a) => a.visit_id === v.id),
    }));

    return {
      alerts: alerts as MedicalAlert[],
      visits: visitsWithAssets as VisitRecord[],
      invoices: invoices as InvoiceRecord[],
    };
  } catch (error) {
    console.error(error)
    return {
      alerts: [],
      visits: [],
      invoices: []
    }
  }
}

export async function deletePatient(patientId: string) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check if patient has any related data
    const relatedData = await client.query(
      `SELECT
        (SELECT COUNT(*) FROM appointments    WHERE patient_id = $1) AS appointments,
        (SELECT COUNT(*) FROM invoices        WHERE patient_id = $1) AS invoices,
        (SELECT COUNT(*) FROM visit_records   WHERE patient_id = $1) AS visits,
        (SELECT COUNT(*) FROM patient_alerts  WHERE patient_id = $1) AS alerts,
        (SELECT COUNT(*) FROM payments        WHERE patient_id = $1) AS payments,
        (SELECT COUNT(*) FROM insurance_claims WHERE patient_id = $1) AS claims`,
      [patientId],
    );

    const { appointments, invoices, visits, alerts, payments, claims } =
      relatedData.rows[0];

    const hasRelatedData =
      Number(appointments) > 0 ||
      Number(invoices) > 0 ||
      Number(visits) > 0 ||
      Number(alerts) > 0 ||
      Number(payments) > 0 ||
      Number(claims) > 0;

    if (hasRelatedData) {
      // 2. Has data — soft delete (deactivate)
      await client.query(
        `UPDATE patients SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
        [patientId],
      );

      await client.query("COMMIT");
      revalidatePath("/[locale]/patients", "page");
      return {
        success: true,
        action: "deactivated",
        message:
          "Patient has existing records and has been deactivated instead.",
      };
    }

    // 3. No data — hard delete
    await client.query(`DELETE FROM patients WHERE id = $1`, [patientId]);

    await client.query("COMMIT");
    revalidatePath("/[locale]/patients", "page");
    return {
      success: true,
      action: "deleted",
      message: "Patient has been permanently deleted.",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[deletePatient] failed:", error);
    return { success: false, error: "Failed to delete patient." };
  } finally {
    client.release();
  }
}

// ================================
// CREATE PATIENT
// ================================

export async function createPatient(formData: PatientFormValues) {
  try {
    const rows = await query<{ patient_id: string }>({
      sql: `INSERT INTO patients (
        full_name,
        phone,
        email,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        insurance_provider_id,
        insurance_number,
        notes,
        dob
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11
      ) RETURNING id AS patient_id`,
      params: [
        formData.full_name,
        formData.phone,
        formData.email || null,
        formData.gender || null,
        formData.address || null,
        formData.emergency_contact_name || null,
        formData.emergency_contact_phone || null,
        formData.insurance_company_id || null,
        formData.insurance_number || null,
        formData.notes || null,
        formData.dob || null,
      ],
    });

    revalidatePath("/patients");

    return { success: true, patient_id: rows[0].patient_id };
  } catch (err) {
    console.error("[createPatient]", err);
    return {
      success: false,
      error: "Failed to create patient. Please try again.",
    };
  }
}

// ================================
// UPDATE PATIENT
// ================================

export async function updatePatient(
  patientId: string,
  formData: PatientFormValues,
) {
  try {
    await execute({
      sql: `UPDATE patients SET
        full_name               = $1,
        phone                   = $2,
        email                   = $3,
        gender                  = $4,
        address                 = $5,
        emergency_contact_name  = $6,
        emergency_contact_phone = $7,
        insurance_provider_id   = $8,
        insurance_number        = $9,
        notes                   = $10,
        updated_at              = NOW(),
        dob                     = $12
      WHERE id = $11`,
      params: [
        formData.full_name,
        formData.phone,
        formData.email || null,
        formData.gender || null,
        formData.address || null,
        formData.emergency_contact_name || null,
        formData.emergency_contact_phone || null,
        formData.insurance_company_id || null,
        formData.insurance_number || null,
        formData.notes || null,
        patientId,
        formData.dob || null,
      ],
    });

    revalidatePath("/patients");

    return { success: true, patientId };
  } catch (err) {
    console.error("[updatePatient]", err);
    return {
      success: false,
      error: "Failed to update patient. Please try again.",
    };
  }
}
