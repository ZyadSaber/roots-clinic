"use server";

import { queryOne, queryMany, execute, executeTransaction } from "@/lib/pg";
import { revalidatePath } from "next/cache";
import type {
  InventoryItem,
  InventoryKPIs,
  InventoryMovement,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  Supplier,
  CreateInventoryItemPayload,
  CreatePurchasePayload,
  AddPurchaseItemPayload,
  UseInventoryItemPayload,
  CreateSupplierPayload,
  InventoryFilters,
} from "@/types/inventory";

// ── KPIs ───────────────────────────────────────────────────────────────────

const EMPTY_KPIS: InventoryKPIs = {
  total_items: 0,
  low_stock_count: 0,
  critical_count: 0,
  out_of_stock_count: 0,
  total_value: 0,
};

export async function getInventoryKPIs(): Promise<InventoryKPIs> {
  try {
    const row = await queryOne<InventoryKPIs>({ sql: "SELECT * FROM inventory_kpis" });
    if (!row) return EMPTY_KPIS;
    return {
      total_items: Number(row.total_items),
      low_stock_count: Number(row.low_stock_count),
      critical_count: Number(row.critical_count),
      out_of_stock_count: Number(row.out_of_stock_count),
      total_value: Number(row.total_value),
    };
  } catch (err) {
    console.error("getInventoryKPIs:", err);
    return EMPTY_KPIS;
  }
}

// ── Items ──────────────────────────────────────────────────────────────────

export async function getInventoryItems(filters: InventoryFilters = {}): Promise<InventoryItem[]> {
  const { status, category, search } = filters;

  const statusParam = !status || status === "all" ? null : status;
  const categoryParam = category || null;
  const searchParam = search ? `%${search}%` : null;

  return queryMany<InventoryItem>({
    sql: `
      SELECT *
      FROM inventory_items
      WHERE ($1::stock_status IS NULL OR status = $1::stock_status)
        AND ($2::TEXT IS NULL OR category ILIKE $2)
        AND ($3::TEXT IS NULL OR name ILIKE $3 OR sku ILIKE $3 OR supplier ILIKE $3)
      ORDER BY name ASC
    `,
    params: [statusParam, categoryParam, searchParam],
  });
}

export async function createInventoryItem(
  payload: CreateInventoryItemPayload,
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const row = await queryOne<{ id: string }>({
      sql: `
        INSERT INTO inventory_items
          (name, sku, category, description, unit, current_stock, reorder_level, unit_price, supplier, expiry_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      params: [
        payload.name,
        payload.sku,
        payload.category || null,
        payload.description || null,
        payload.unit || null,
        payload.current_stock ?? 0,
        payload.reorder_level ?? 0,
        payload.unit_price ?? 0,
        payload.supplier || null,
        payload.expiry_date || null,
      ],
    });
    revalidatePath("/[locale]/inventory", "page");
    return { success: true, itemId: row?.id };
  } catch (err) {
    console.error("createInventoryItem:", err);
    return { success: false, error: "Failed to create inventory item." };
  }
}

// ── Movements ─────────────────────────────────────────────────────────────

export async function getInventoryMovements(itemId?: string): Promise<InventoryMovement[]> {
  return queryMany<InventoryMovement>({
    sql: `
      SELECT
        m.id, m.item_id, i.name AS item_name,
        m.movement_type, m.quantity, m.notes,
        m.invoice_id, m.visit_id, m.moved_by, m.moved_at
      FROM inventory_movements m
      JOIN inventory_items i ON i.id = m.item_id
      WHERE ($1::UUID IS NULL OR m.item_id = $1::UUID)
      ORDER BY m.moved_at DESC
      LIMIT 200
    `,
    params: [itemId || null],
  });
}

// Called from VisitInProgressModal when doctor uses items during a visit.
// Records the movement + deducts stock only. Invoice line items are added
// later by completeVisitWithInvoice which reads movements by visit_id.
export async function useInventoryItem(
  payload: UseInventoryItemPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await executeTransaction(async (client) => {
      // 1. Deduct stock — trigger auto-updates status
      const result = await client.query(
        `UPDATE inventory_items
         SET current_stock = current_stock - $1
         WHERE id = $2 AND current_stock >= $1
         RETURNING id`,
        [payload.quantity, payload.item_id],
      );
      if (result.rowCount === 0) throw new Error("Insufficient stock");

      // 2. Record movement linked to visit (invoice_id is set when visit ends)
      await client.query(
        `INSERT INTO inventory_movements
           (item_id, movement_type, quantity, notes, visit_id, invoice_id, moved_by)
         VALUES ($1, 'usage', $2, $3, $4, $5, $6)`,
        [
          payload.item_id,
          payload.quantity,
          payload.notes || null,
          payload.visit_id,
          payload.invoice_id || null,
          payload.moved_by || null,
        ],
      );
    });

    revalidatePath("/[locale]/inventory", "page");
    return { success: true };
  } catch (err) {
    console.error("useInventoryItem:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record item usage.",
    };
  }
}

// ── Purchase Invoices ──────────────────────────────────────────────────────

export async function getPurchaseInvoices(): Promise<PurchaseInvoice[]> {
  return queryMany<PurchaseInvoice>({
    sql: `
      SELECT
        pi.*,
        s.name AS supplier_name
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON s.id = pi.supplier_id
      ORDER BY pi.ordered_at DESC, pi.created_at DESC
    `,
  });
}

// ── Suppliers ──────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  return queryMany<Supplier>({
    sql: `SELECT * FROM suppliers ORDER BY name ASC`,
  });
}

export async function createSupplier(
  payload: CreateSupplierPayload,
): Promise<{ success: boolean; supplierId?: string; error?: string }> {
  try {
    const row = await queryOne<{ id: string }>({
      sql: `
        INSERT INTO suppliers (name, phone, responsible_person, initial_balance, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      params: [
        payload.name,
        payload.phone || null,
        payload.responsible_person || null,
        payload.initial_balance ?? 0,
        payload.notes || null,
      ],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true, supplierId: row?.id };
  } catch (err) {
    console.error("createSupplier:", err);
    return { success: false, error: "Failed to create supplier." };
  }
}

export async function updateSupplier(
  supplierId: string,
  payload: Partial<CreateSupplierPayload>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `
        UPDATE suppliers
        SET
          name               = COALESCE($1, name),
          phone              = $2,
          responsible_person = $3,
          initial_balance    = COALESCE($4, initial_balance),
          notes              = $5,
          updated_at         = NOW()
        WHERE id = $6
      `,
      params: [
        payload.name ?? null,
        payload.phone ?? null,
        payload.responsible_person ?? null,
        payload.initial_balance ?? null,
        payload.notes ?? null,
        supplierId,
      ],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("updateSupplier:", err);
    return { success: false, error: "Failed to update supplier." };
  }
}

export async function deleteSupplier(
  supplierId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({ sql: `DELETE FROM suppliers WHERE id = $1`, params: [supplierId] });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("deleteSupplier:", err);
    return { success: false, error: "Failed to delete supplier." };
  }
}

export async function getPurchaseItems(purchaseId: string): Promise<PurchaseInvoiceItem[]> {
  return queryMany<PurchaseInvoiceItem>({
    sql: `SELECT * FROM purchase_invoice_items WHERE purchase_id = $1 ORDER BY created_at ASC`,
    params: [purchaseId],
  });
}

export async function createPurchaseInvoice(
  payload: CreatePurchasePayload,
): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
  try {
    const row = await queryOne<{ id: string }>({
      sql: `
        INSERT INTO purchase_invoices (supplier, supplier_id, ordered_at, notes, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      params: [
        payload.supplier,
        payload.supplier_id || null,
        payload.ordered_at,
        payload.notes || null,
        payload.created_by || null,
      ],
    });
    revalidatePath("/[locale]/inventory", "page");
    return { success: true, purchaseId: row?.id };
  } catch (err) {
    console.error("createPurchaseInvoice:", err);
    return { success: false, error: "Failed to create purchase order." };
  }
}

export async function addPurchaseItem(
  payload: AddPurchaseItemPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const itemTotal = parseFloat((payload.quantity * payload.unit_price).toFixed(2));

    await executeTransaction(async (client) => {
      await client.query(
        `INSERT INTO purchase_invoice_items
           (purchase_id, item_id, item_name, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          payload.purchase_id,
          payload.item_id || null,
          payload.item_name,
          payload.quantity,
          payload.unit_price,
          itemTotal,
        ],
      );

      await client.query(
        `UPDATE purchase_invoices
         SET total = (SELECT COALESCE(SUM(total), 0) FROM purchase_invoice_items WHERE purchase_id = $1),
             updated_at = NOW()
         WHERE id = $1`,
        [payload.purchase_id],
      );
    });

    revalidatePath("/[locale]/inventory", "page");
    return { success: true };
  } catch (err) {
    console.error("addPurchaseItem:", err);
    return { success: false, error: "Failed to add item to purchase order." };
  }
}

export async function receivePurchaseOrder(
  purchaseId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await executeTransaction(async (client) => {
      // Fetch all items on this purchase
      const { rows: items } = await client.query(
        `SELECT item_id, item_name, quantity, unit_price
         FROM purchase_invoice_items
         WHERE purchase_id = $1 AND item_id IS NOT NULL`,
        [purchaseId],
      );

      for (const item of items) {
        // Add stock (trigger auto-updates status)
        await client.query(
          `UPDATE inventory_items SET current_stock = current_stock + $1 WHERE id = $2`,
          [item.quantity, item.item_id],
        );

        // Record movement
        await client.query(
          `INSERT INTO inventory_movements (item_id, movement_type, quantity, notes)
           VALUES ($1, 'purchase', $2, $3)`,
          [item.item_id, item.quantity, `Purchase order received`],
        );
      }

      // Mark as received
      await client.query(
        `UPDATE purchase_invoices
         SET status = 'received', received_at = CURRENT_DATE, updated_at = NOW()
         WHERE id = $1`,
        [purchaseId],
      );
    });

    revalidatePath("/[locale]/inventory", "page");
    return { success: true };
  } catch (err) {
    console.error("receivePurchaseOrder:", err);
    return { success: false, error: "Failed to receive purchase order." };
  }
}

export async function updatePurchaseStatus(
  purchaseId: string,
  status: "ordered" | "cancelled",
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `UPDATE purchase_invoices SET status = $1::purchase_status, updated_at = NOW() WHERE id = $2`,
      params: [status, purchaseId],
    });
    revalidatePath("/[locale]/inventory", "page");
    return { success: true };
  } catch (err) {
    console.error("updatePurchaseStatus:", err);
    return { success: false, error: "Failed to update purchase status." };
  }
}
