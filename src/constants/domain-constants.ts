/**
 * Centralized Domain Enums & Constants for SaaS Statuses, Plans, Accounting and System Modules
 * Prevents magic strings and hardcoded literals in conditionals across the application.
 */

export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TRIAL: 'TRIAL',
} as const;

export type TenantStatus = typeof TENANT_STATUS[keyof typeof TENANT_STATUS];

export const ACCOUNT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  PARTIAL: 'PARTIAL',
} as const;

export type AccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS];

export const ACCOUNT_TYPES = {
  PAYABLE: 'PAYABLE',
  RECEIVABLE: 'RECEIVABLE',
} as const;

export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];

export const ENTITY_TYPES = {
  PROVIDER: 'PROVIDER',
  CLIENT: 'CLIENT',
  PARTNER: 'PARTNER',
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

export const PAYMENT_METHODS = {
  CASH_BS: 'CASH_BS',
  DEBIT_BS: 'DEBIT_BS',
  CASH_USD: 'CASH_USD',
  TRANSFER_USD: 'TRANSFER_USD',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const PRODUCT_TAX_TYPES = {
  TAXABLE: 'TAXABLE',
  EXEMPT: 'EXEMPT',
  EXONERATED: 'EXONERATED',
} as const;

export type ProductTaxType = typeof PRODUCT_TAX_TYPES[keyof typeof PRODUCT_TAX_TYPES];

export const STOCK_LEVEL_FILTERS = {
  ALL: 'ALL',
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;

export type StockLevelFilter = typeof STOCK_LEVEL_FILTERS[keyof typeof STOCK_LEVEL_FILTERS];

export const RIF_TYPES = {
  JURIDICO: 'JURIDICO',
  NATURAL_V: 'NATURAL_V',
  NATURAL_E: 'NATURAL_E',
  GUBERNAMENTAL: 'GUBERNAMENTAL',
  PASAPORTE: 'PASAPORTE',
} as const;

export type RifType = typeof RIF_TYPES[keyof typeof RIF_TYPES];

export const SAAS_PLAN_CODES = {
  EMPRENDEDOR: 'EMPRENDEDOR',
  COMERCIAL_PRO: 'COMERCIAL_PRO',
  CORPORATIVO: 'CORPORATIVO',
} as const;

export type SaasPlanCode = typeof SAAS_PLAN_CODES[keyof typeof SAAS_PLAN_CODES];

export const SAAS_PLAN_NAMES: Record<SaasPlanCode | string, string> = {
  [SAAS_PLAN_CODES.EMPRENDEDOR]: 'Emprendedor',
  [SAAS_PLAN_CODES.COMERCIAL_PRO]: 'Comercial Pro',
  [SAAS_PLAN_CODES.CORPORATIVO]: 'Corporativo',
};

export const SYSTEM_MODULES = {
  POS: 'POS',
  SALES: 'SALES',
  INVENTORY_PURCHASES: 'INVENTORY_PURCHASES',
  INVENTORY: 'INVENTORY',
  BANKS: 'BANKS',
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS',
  PAYROLL: 'PAYROLL',
} as const;

export type SystemModule = typeof SYSTEM_MODULES[keyof typeof SYSTEM_MODULES];

export const PLAN_DEFAULT_MODULES: Record<SaasPlanCode, SystemModule[]> = {
  [SAAS_PLAN_CODES.EMPRENDEDOR]: [
    SYSTEM_MODULES.POS,
    SYSTEM_MODULES.INVENTORY_PURCHASES,
    SYSTEM_MODULES.INVENTORY,
    SYSTEM_MODULES.BANKS,
    SYSTEM_MODULES.SETTINGS,
  ],
  [SAAS_PLAN_CODES.COMERCIAL_PRO]: [
    SYSTEM_MODULES.POS,
    SYSTEM_MODULES.SALES,
    SYSTEM_MODULES.INVENTORY,
    SYSTEM_MODULES.INVENTORY_PURCHASES,
    SYSTEM_MODULES.BANKS,
    SYSTEM_MODULES.REPORTS,
    SYSTEM_MODULES.SETTINGS,
  ],
  [SAAS_PLAN_CODES.CORPORATIVO]: [
    SYSTEM_MODULES.POS,
    SYSTEM_MODULES.SALES,
    SYSTEM_MODULES.INVENTORY,
    SYSTEM_MODULES.INVENTORY_PURCHASES,
    SYSTEM_MODULES.BANKS,
    SYSTEM_MODULES.REPORTS,
    SYSTEM_MODULES.SETTINGS,
    SYSTEM_MODULES.PAYROLL,
  ],
};

export const PLAN_DEFAULT_PERMISSIONS: Record<SaasPlanCode, string[]> = {
  [SAAS_PLAN_CODES.EMPRENDEDOR]: [
    // 1. Módulo Ventas (POS)
    'pos:create',
    'sales:invoicing',
    'clients:manage',
    // 2. Módulo Compras (INVENTORY_PURCHASES)
    'purchases:new',
    'purchases:invoices',
    'providers:manage',
    // 3. Módulo Control de Inventario (INVENTORY)
    'inventory:create',
    'inventory:stock',
    'inventory:warehouse',
    'inventory:categories',
    // 4. Módulo Cuentas (BANKS)
    'banks:accounts',
    // 5. Módulo Configuración de Empresa (SETTINGS)
    'company:manage',
    'fiscal:manage',
    'users:manage',
  ],
  [SAAS_PLAN_CODES.COMERCIAL_PRO]: [
    'pos:create',
    'sales:invoicing',
    'sales:quotations',
    'sales:orders',
    'sales:deliveries',
    'clients:manage',
    'pos:shifts',
    'purchases:orders',
    'purchases:receptions',
    'purchases:invoices',
    'providers:manage',
    'inventory:create',
    'inventory:stock',
    'inventory:bulk_prices',
    'inventory:valuation',
    'inventory:warehouse',
    'inventory:categories',
    'inventory:moves',
    'banks:accounts',
    'accounts:receivables',
    'accounts:payables',
    'accounts:history',
    'reports:view',
    'company:manage',
    'fiscal:manage',
    'users:manage',
  ],
  [SAAS_PLAN_CODES.CORPORATIVO]: [
    'pos:create',
    'sales:invoicing',
    'sales:quotations',
    'sales:orders',
    'sales:deliveries',
    'clients:manage',
    'pos:shifts',
    'purchases:orders',
    'purchases:receptions',
    'purchases:invoices',
    'providers:manage',
    'inventory:create',
    'inventory:stock',
    'inventory:bulk_prices',
    'inventory:valuation',
    'inventory:warehouse',
    'inventory:categories',
    'inventory:moves',
    'banks:accounts',
    'accounts:receivables',
    'accounts:payables',
    'accounts:history',
    'payroll:manage',
    'reports:view',
    'company:manage',
    'fiscal:manage',
    'users:manage',
  ],
};

export const SAAS_ADDON_PRICING: Record<string, number> = {
  PAYROLL: 10.00,
  BANKS: 10.00,
  REPORTS: 8.00,
  SETTINGS: 5.00,
};

export const SAAS_SUBMODULE_PRICING: Record<string, number> = {
  'sales:quotations': 3.00,
  'sales:orders': 3.00,
  'sales:deliveries': 3.00,
  'pos:shifts': 3.50,
  'purchases:orders': 3.50,
  'purchases:receptions': 3.00,
  'inventory:bulk_prices': 3.00,
  'inventory:valuation': 3.00,
  'inventory:warehouse': 4.00,
  'accounts:payables': 4.00,
  'banks:accounts': 4.00,
  'accounts:history': 3.00,
  'payroll:manage': 10.00,
};

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim().replace(/\/+$/, '');
const normalizedApiUrl = rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
  ? rawApiUrl
  : `https://${rawApiUrl}`;

export const APP_CONFIG = {
  API_URL: normalizedApiUrl,
  DEFAULT_BCV_RATE: Number(process.env.NEXT_PUBLIC_DEFAULT_BCV_RATE || 36.50),
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ARI ERP',
  SAAS_DOMAIN: process.env.NEXT_PUBLIC_SAAS_DOMAIN || 'erparisoft.com',
};
