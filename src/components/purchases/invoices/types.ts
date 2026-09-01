export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  total_amount_usd: number;
  discount_percentage?: number;
  discount_amount_usd?: number;
  proof_file_path?: string;
  created_at: string;
  creator_name?: string;
  status?: string;
  credit_notes?: string;
  debit_notes?: string;
  payable_id?: string | null;
  payment_status?: 'PAID' | 'PARTIAL' | 'PENDING';
  total_paid_usd?: number;
  balance_due_usd?: number;
  created_by?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface PurchaseItemDto {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost_usd: number;
  product_sku: string;
  product_name: string;
}

export interface PurchaseNoteSummary {
  id: string;
  document_number: string;
  control_number: string;
  type: 'CREDIT' | 'DEBIT';
  date: string;
  reason_code: string;
  total_usd: number;
  total_ves: number;
  status: string;
}

export interface LocationOption {
  id: string;
  name: string;
  type: string;
  depth: number;
}

export interface NoteItemForm {
  productId: string;
  name: string;
  originalQty: number;
  quantity: number;
  unitPriceUsd: number;
  selected: boolean;
}
