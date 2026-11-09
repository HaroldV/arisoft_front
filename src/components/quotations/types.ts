export interface QuotationProductVariation {
  name: string;
  quantity: number;
  sku?: string;
  unit_cost?: number;
}

export interface QuotationWarehouseStockInfo {
  warehouse_id: string;
  warehouse_name: string;
  branch_name?: string;
  stock: number;
}

export interface QuotationProduct {
  id: string;
  sku: string;
  name: string;
  costUsd: number;
  priceUsd: number;
  taxRate: number;
  tax_type?: string;
  product_type?: 'SIMPLE' | 'COMPOUND' | string;
  current_stock: number;
  global_stock?: number;
  warehouse_stocks?: QuotationWarehouseStockInfo[];
  image_url?: string;
  imageUrl?: string;
  variations?: QuotationProductVariation[];
}

export interface QuotationClient {
  id: string;
  name: string;
  tax_id: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface QuotationCartItem {
  product: QuotationProduct;
  quantity: number;
  variation?: QuotationProductVariation;
}

export interface CommercialQuotationItem {
  id?: string;
  product_id?: string;
  product_name: string;
  sku?: string;
  quantity: number | string;
  unit_price_usd: number | string;
  subtotal_usd?: number | string;
  tax_usd?: number | string;
  total_usd?: number | string;
}

export interface CommercialQuotation {
  id: string;
  document_number: string;
  client_id?: string;
  client_name: string;
  client_tax_id?: string;
  status: 'SENT' | 'ACCEPTED' | 'CONVERTED' | 'DRAFT';
  issue_date?: string;
  valid_until?: string;
  payment_method?: string;
  subtotal_usd?: number | string;
  tax_usd?: number | string;
  total_usd: number | string;
  total_bs: number | string;
  exchange_rate: number | string;
  notes?: string;
  created_by_user_id?: string;
  created_by_user_name?: string;
  created_at?: string;
  items?: CommercialQuotationItem[];
}
