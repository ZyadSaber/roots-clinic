"use server";

import { queryMany } from "@/lib/pg";

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
