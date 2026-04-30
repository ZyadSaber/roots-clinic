export type StockStatus = 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock';

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  responsible_person: string | null;
  initial_balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierPayload {
  name: string;
  phone?: string;
  responsible_person?: string;
  initial_balance?: number;
  notes?: string;
}
export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled';
export type MovementType = 'purchase' | 'usage' | 'adjustment' | 'return';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  description: string | null;
  unit: string | null;
  current_stock: number;
  reorder_level: number;
  unit_price: number;
  supplier: string | null;
  expiry_date: string | null;
  status: StockStatus;
  created_at: string;
  updated_at: string;
}

export interface InventoryKPIs {
  total_items: number;
  low_stock_count: number;
  critical_count: number;
  out_of_stock_count: number;
  total_value: number;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  item_name: string;
  movement_type: MovementType;
  quantity: number;
  notes: string | null;
  invoice_id: string | null;
  visit_id: string | null;
  moved_by: string | null;
  moved_at: string;
}

export interface PurchaseInvoice {
  id: string;
  purchase_number: string;
  supplier: string;
  supplier_id: string | null;
  supplier_name: string | null;
  total: number;
  status: PurchaseStatus;
  ordered_at: string;
  received_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  purchase_id: string;
  item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

// ── Payloads ───────────────────────────────────────────────────────────────

export interface CreateInventoryItemPayload {
  name: string;
  sku: string;
  category?: string;
  description?: string;
  unit?: string;
  current_stock?: number;
  reorder_level?: number;
  unit_price?: number;
  supplier?: string;
  expiry_date?: string;
}

export interface CreatePurchasePayload {
  supplier_id?: string;
  supplier: string;
  ordered_at: string;
  notes?: string;
  created_by?: string;
}

export interface AddPurchaseItemPayload {
  purchase_id: string;
  item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

export interface UseInventoryItemPayload {
  item_id: string;
  visit_id: string;
  quantity: number;
  notes?: string;
  moved_by?: string;
  invoice_id?: string;
}

export interface InventoryFilters {
  status?: StockStatus | 'all';
  category?: string;
  search?: string;
}
