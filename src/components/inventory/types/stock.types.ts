import { ProductTaxType } from '@/constants/domain-constants';

export interface ProductVariation {
  name: string;
  quantity: number;
  sku?: string;
  unit_cost?: number;
}

export interface AdvancedProductFields {
  expiration_date?: string;
  location?: string;
  security_stock?: number;
  description?: string;
}

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  costUsd: number;
  priceUsd: number;
  taxRate: number;
  tax_type?: ProductTaxType | string;
  is_perishable?: boolean;
  has_batch_control?: boolean;
  current_stock: number;
  unit_of_measure?: string;
  category?: string;
  category_id?: string | null;
  image_url?: string;
  imageUrl?: string;
  created_by_user_name?: string;
  updated_by_user_name?: string;
  created_at?: string;
  updated_at?: string;
  variations?: ProductVariation[];
  advanced_fields?: AdvancedProductFields;
}

export interface ProductCategoryOption {
  id: string;
  name: string;
  tenant_id: string | null;
  code: string | null;
}

export type SortField = 'name' | 'sku' | 'category' | 'costUsd' | 'priceUsd' | 'current_stock';
export type SortOrder = 'asc' | 'desc';
export type SearchFieldScope = 'ALL' | 'SKU' | 'NAME';
