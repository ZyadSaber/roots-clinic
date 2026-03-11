"use server";

import { pool, queryMany, queryOne } from "@/lib/pg";
import {
  InvoiceRecord,
  MedicalAlert,
  PatientDetails,
  PatientSummary,
  RadiologyAsset,
  VisitRecord,
  VitalRecord,
} from "@/types/patients";
import { revalidatePath } from "next/cache";

export async function fetchAllPatients(): Promise<PatientSummary[]> {
  const sql = `    SELECT * FROM patients_full  `;
  return (await queryMany({ sql })) as PatientSummary[];
}

export async function fetchPatientDetails(
  patientId: string,
): Promise<PatientDetails | null> {
  // 1. Get Summary (Base info)
  const summarySql = `SELECT * FROM patients_full WHERE patient_id = $1`;
  const summary = (await queryOne({
    sql: summarySql,
    params: [patientId],
  })) as PatientSummary;

  if (!summary) return null;

  // 2. Get Alerts
  const alertsSql = `SELECT * FROM patient_alerts WHERE patient_id = $1 ORDER BY created_at DESC`;
  const alerts = (await queryMany({
    sql: alertsSql,
    params: [patientId],
  })) as MedicalAlert[];

  // 3. Get Vitals
  const vitalsSql = `SELECT * FROM patient_vitals WHERE patient_id = $1 ORDER BY recorded_at DESC`;
  const vitals = (await queryMany({
    sql: vitalsSql,
    params: [patientId],
  })) as VitalRecord[];

  // 4. Get Visits
  const visitsSql = `
    SELECT 
      vr.*, 
      s.full_name as doctor_name,
      sp.english_name as doctor_specialty_en,
      sp.arabic_name as doctor_specialty_ar,
      a.procedure_type
    FROM visit_records vr
    JOIN doctors d ON vr.doctor_id = d.id
    JOIN staff s ON d.staff_id = s.id
    LEFT JOIN specialties sp ON d.specialty_id = sp.id
    LEFT JOIN appointments a ON vr.appointment_id = a.id
    WHERE vr.patient_id = $1
    ORDER BY vr.created_at DESC
  `;
  const visitsRaw = (await queryMany({
    sql: visitsSql,
    params: [patientId],
  })) as (VisitRecord & {
    doctor_specialty_en: string;
    doctor_specialty_ar: string;
    procedure_type: string;
  })[];

  // 5. Get Radiology Assets
  const assetsSql = `SELECT * FROM radiology_assets WHERE patient_id = $1 ORDER BY taken_at DESC`;
  const assets = (await queryMany({
    sql: assetsSql,
    params: [patientId],
  })) as (RadiologyAsset & { visit_id: string })[];

  // 6. Get Invoices
  const invoicesSql = `
    SELECT * FROM invoices 
    WHERE patient_id = $1 
    ORDER BY created_at DESC
  `;
  const invoices = (await queryMany({
    sql: invoicesSql,
    params: [patientId],
  })) as InvoiceRecord[];

  // Attach assets to visits
  const visitsWithAssets = visitsRaw.map((v) => ({
    ...v,
    assets: assets.filter((a) => a.visit_id === v.id),
  }));

  return {
    alerts,
    vitals,
    visits: visitsWithAssets,
    invoices,
  };
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
        (SELECT COUNT(*) FROM patient_vitals  WHERE patient_id = $1) AS vitals,
        (SELECT COUNT(*) FROM payments        WHERE patient_id = $1) AS payments,
        (SELECT COUNT(*) FROM insurance_claims WHERE patient_id = $1) AS claims`,
      [patientId],
    );

    const { appointments, invoices, visits, alerts, vitals, payments, claims } =
      relatedData.rows[0];

    const hasRelatedData =
      Number(appointments) > 0 ||
      Number(invoices) > 0 ||
      Number(visits) > 0 ||
      Number(alerts) > 0 ||
      Number(vitals) > 0 ||
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
