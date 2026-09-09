export interface WarehouseOption {
  id: string;
  name: string;
  type?: string;
}

export interface BranchItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  default_warehouse_id?: string;
  default_warehouse?: WarehouseOption;
  is_active: boolean;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  defaultWarehouseId: string;
  isActive: boolean;
  isMain: boolean;
}
