"use server";

import { queryMany, queryOne, execute, executeTransaction } from "@/lib/pg";
import { RadiologyRequest } from "@/types/appointments";

export interface RadiologyRecord {
    id: string;
    patient_id: string;
    patient_name: string;
    patient_code: string;
    visit_id: string | null;
    uploaded_by_name: string | null;
    image_type: "panoramic" | "bitewing" | "periapical" | string;
    image_url: string;
    notes: string | null;
    taken_at: string;
}

export async function getRadiologyAssets(
    dateFrom: Date,
    dateTo: Date,
): Promise<RadiologyRecord[]> {
    const start = new Date(dateFrom);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    return queryMany<RadiologyRecord>({
        sql: `
            SELECT
                ra.id,
                ra.patient_id,
                p.full_name          AS patient_name,
                p.patient_code,
                ra.visit_id,
                s.full_name          AS uploaded_by_name,
                ra.image_type,
                ra.image_url,
                ra.notes,
                ra.taken_at
            FROM radiology_assets ra
            JOIN patients p   ON ra.patient_id  = p.id
            LEFT JOIN staff s ON ra.uploaded_by = s.id
            WHERE ra.taken_at BETWEEN $1 AND $2
            ORDER BY ra.taken_at DESC
        `,
        params: [start.toISOString(), end.toISOString()],
    });
}

export async function getRadiologyStats(
    dateFrom: Date,
    dateTo: Date,
): Promise<{ total: number; panoramic: number; bitewing: number; periapical: number }> {
    const start = new Date(dateFrom);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    const rows = await queryMany<{ image_type: string; count: string }>({
        sql: `
            SELECT image_type, COUNT(*)::int AS count
            FROM radiology_assets
            WHERE taken_at BETWEEN $1 AND $2
            GROUP BY image_type
        `,
        params: [start.toISOString(), end.toISOString()],
    });

    const stats = { total: 0, panoramic: 0, bitewing: 0, periapical: 0 };
    for (const row of rows) {
        const n = Number(row.count);
        stats.total += n;
        if (row.image_type === "panoramic") stats.panoramic = n;
        else if (row.image_type === "bitewing") stats.bitewing = n;
        else if (row.image_type === "periapical") stats.periapical = n;
    }
    return stats;
}

export async function createRadiologyRequest(
    appointmentId: string,
    visitId: string,
    patientId: string,
    requestedBy: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const row = await queryOne<{ id: string }>({
            sql: `
                INSERT INTO radiology_requests (appointment_id, visit_id, patient_id, requested_by)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `,
            params: [appointmentId, visitId, patientId, requestedBy],
        });
        return { success: true, id: row?.id };
    } catch (error) {
        console.error("Error creating radiology request:", error);
        return { success: false, error: error instanceof Error ? error.message : "Database error" };
    }
}

export async function getPendingRadiologyRequests(): Promise<RadiologyRequest[]> {
    return queryMany<RadiologyRequest>({
        sql: `
            SELECT
                rr.id,
                rr.appointment_id,
                rr.visit_id,
                rr.patient_id,
                p.full_name        AS patient_name,
                p.patient_code,
                s.full_name        AS doctor_name,
                a.procedure_type,
                a.appointment_date,
                rr.status,
                rr.requested_at,
                rr.completed_at
            FROM radiology_requests rr
            JOIN patients     p  ON rr.patient_id    = p.id
            JOIN appointments a  ON rr.appointment_id = a.id
            LEFT JOIN doctors  d  ON rr.requested_by  = d.id
            LEFT JOIN staff    s  ON d.staff_id        = s.id
            WHERE rr.status = 'pending'
            ORDER BY rr.requested_at ASC
        `,
        params: [],
    });
}

export async function recordRadiologyUpload(params: {
    requestId: string;
    visitId: string;
    patientId: string;
    uploadedBy: string;
    imageType: "panoramic" | "bitewing" | "periapical";
    notes: string;
    imageUrl: string;
}): Promise<{ success: boolean; error?: string }> {
    const { requestId, visitId, patientId, uploadedBy, imageType, notes, imageUrl } = params;
    try {
        await executeTransaction(async (client) => {
            await client.query(
                `INSERT INTO radiology_assets (patient_id, visit_id, uploaded_by, image_type, image_url, notes)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [patientId, visitId, uploadedBy, imageType, imageUrl, notes || null],
            );
            await client.query(
                `UPDATE radiology_requests SET status = 'completed', completed_at = NOW() WHERE id = $1`,
                [requestId],
            );
        });
        return { success: true };
    } catch (error) {
        console.error("Error recording radiology upload:", error);
        return { success: false, error: error instanceof Error ? error.message : "Database error" };
    }
}
