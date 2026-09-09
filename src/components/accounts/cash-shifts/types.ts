export interface CashShiftItem {
  id: string;
  cashier_id: string;
  cashier?: {
    id: string;
    full_name: string;
    email: string;
  };
  branch_id?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
    default_warehouse?: {
      id: string;
      name: string;
    };
  };
  status: 'OPEN' | 'PENDING_APPROVAL' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
  opening_balance_usd: number;
  opening_balance_ves: number;
  expected_cash_usd: number;
  expected_cash_ves: number;
  declared_cash_usd: number;
  declared_cash_ves: number;
  discrepancy_usd: number;
  discrepancy_ves: number;
  approved_by_id?: string;
}

export interface PaymentSummaryLine {
  method: string;
  total_usd: number;
  total_original: number;
  currency: string;
}

export interface ProductSoldLine {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  total_usd: number;
}

export interface ShiftDetailsData {
  shift: CashShiftItem;
  stats: {
    sales_count: number;
    total_billed_usd: number;
  };
  payments_summary: PaymentSummaryLine[];
  products_sold: ProductSoldLine[];
}
