import { OrderStatus } from '@/constants/domain-constants';

export interface OrderItem {
  id?: string;
  item_number?: number;
  productId: string;
  sku?: string;
  model?: string;
  warehouseId?: string;
  quantityOrdered: number;
  unitCostUsd: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxType?: string;
  taxRate?: number;
  additionalTaxAmount?: number;
  lineComment?: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_name: string;
  supplier_rif?: string;
  payment_term?: string;
  currency?: string;
  exchange_rate?: number;
  is_national?: boolean;
  status: OrderStatus | string;
  expected_date?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by_user_id?: string;
  subtotal_usd: number;
  global_discount_amount?: number;
  global_surcharge_amount?: number;
  tax_usd: number;
  total_usd: number;
  created_by_user_name?: string;
  created_at: string;
  items?: any[];
}

export interface ProviderOption {
  id: string;
  name: string;
  rif?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  costUsd: number;
}

export interface WarehouseOption {
  id: string;
  name: string;
}
