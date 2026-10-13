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
  CASH_VES: 'CASH_VES',
  TRANSFER_USD: 'TRANSFER_USD',
  PAGO_MOVIL: 'PAGO_MOVIL',
  TRANSFER_BS: 'TRANSFER_BS',
  TRANSFERENCIA: 'TRANSFERENCIA',
  TARJETA_DEBITO: 'TARJETA_DEBITO',
  TARJETA_CREDITO: 'TARJETA_CREDITO',
  ZELLE: 'ZELLE',
  BINANCE: 'BINANCE',
  CHANGE_USD: 'CHANGE_USD',
  CHANGE_VES: 'CHANGE_VES',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PAYMENT_METHODS.CASH_BS]: 'Efectivo Bs.',
  [PAYMENT_METHODS.CASH_VES]: 'Efectivo en Bolívares (VES)',
  [PAYMENT_METHODS.DEBIT_BS]: 'Tarjeta de Débito (Bs.)',
  [PAYMENT_METHODS.CASH_USD]: 'Efectivo en Dólares ($)',
  [PAYMENT_METHODS.TRANSFER_USD]: 'Transferencia en Dólares ($)',
  [PAYMENT_METHODS.PAGO_MOVIL]: 'Pago Móvil (VES)',
  [PAYMENT_METHODS.TRANSFER_BS]: 'Transferencia Bs.',
  [PAYMENT_METHODS.TRANSFERENCIA]: 'Transferencia Bancaria',
  [PAYMENT_METHODS.TARJETA_DEBITO]: 'Tarjeta de Débito (VES)',
  [PAYMENT_METHODS.TARJETA_CREDITO]: 'Tarjeta de Crédito (USD)',
  [PAYMENT_METHODS.ZELLE]: 'Zelle (USD)',
  [PAYMENT_METHODS.BINANCE]: 'Binance Pay (USDT)',
  [PAYMENT_METHODS.CHANGE_USD]: 'Vuelto Entregado (USD)',
  [PAYMENT_METHODS.CHANGE_VES]: 'Vuelto Entregado (VES)',
};

/**
 * Returns a human-friendly formatted label for any raw payment method string
 */
export function formatPaymentMethod(method?: string): string {
  if (!method) return 'Método no especificado';
  if (PAYMENT_METHOD_LABELS[method]) return PAYMENT_METHOD_LABELS[method];
  
  const m = method.toUpperCase();
  if (m === 'CHANGE_USD') return 'Vuelto Entregado ($)';
  if (m === 'CHANGE_VES') return 'Vuelto Entregado (Bs.)';
  if (m === 'CASH_USD') return 'Efectivo ($)';
  if (m === 'CASH_VES') return 'Efectivo (Bs.)';
  if (m === 'PAGO_MOVIL') return 'Pago Móvil (Bs.)';
  if (m === 'TRANSFERENCIA' || m === 'TRANSFER_BS') return 'Transferencia (Bs.)';
  if (m === 'TRANSFER_USD') return 'Transferencia ($)';
  if (m === 'TARJETA_DEBITO' || m === 'DEBIT_BS') return 'Tarjeta de Débito';
  if (m === 'TARJETA_CREDITO') return 'Tarjeta de Crédito';
  if (m === 'ZELLE') return 'Zelle';
  if (m === 'BINANCE') return 'Binance Pay';
  
  return method;
}

export const PAYMENT_TERMS = {
  CONTADO: 'CONTADO',
  CREDITO_7: 'CREDITO_7',
  CREDITO_15: 'CREDITO_15',
  CREDITO_30: 'CREDITO_30',
} as const;

export type PaymentTerm = typeof PAYMENT_TERMS[keyof typeof PAYMENT_TERMS];

export const CURRENCIES = {
  USD: 'USD',
  VES: 'VES',
  EUR: 'EUR',
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

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

export const SYSTEM_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  CASHIER: 'CASHIER',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

export const SYSTEM_PERMISSIONS = {
  // 1. Módulo POS
  POS_CREATE: 'pos:create',
  POS_DISCOUNT: 'pos:discount',
  POS_REFUND: 'pos:refund',
  POS_SHIFTS: 'pos:shifts',
  SALES_INVOICING: 'sales:invoicing',
  CLIENTS_MANAGE: 'clients:manage',

  // 2. Módulo Ventas
  SALES_QUOTATIONS: 'sales:quotations',
  SALES_ORDERS: 'sales:orders',
  SALES_DELIVERIES: 'sales:deliveries',

  // 3. Módulo Compras
  PURCHASES_NEW: 'purchases:new',
  PURCHASES_ORDERS: 'purchases:orders',
  PURCHASES_RECEPTIONS: 'purchases:receptions',
  PURCHASES_INVOICES: 'purchases:invoices',
  PROVIDERS_MANAGE: 'providers:manage',

  // 4. Módulo Inventario
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_STOCK: 'inventory:stock',
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_WRITE: 'inventory:write',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_WAREHOUSE: 'inventory:warehouse',
  INVENTORY_CATEGORIES: 'inventory:categories',
  INVENTORY_MOVES: 'inventory:moves',
  INVENTORY_BULK_PRICES: 'inventory:bulk_prices',
  INVENTORY_VALUATION: 'inventory:valuation',

  // 5. Módulo Cuentas y Finanzas
  BANKS_ACCOUNTS: 'banks:accounts',
  BANKS_LEDGER: 'banks:ledger',
  BANKS_SHIFTS: 'banks:shifts',
  ACCOUNTS_RECEIVABLES: 'accounts:receivables',
  ACCOUNTS_PAYABLES: 'accounts:payables',
  ACCOUNTS_HISTORY: 'accounts:history',

  // 6. Módulo Nómina & RRHH
  PAYROLL_MANAGE: 'payroll:manage',
  PAYROLL_FORMULAS: 'payroll:formulas',

  // 7. Módulo Reportes
  REPORTS_VIEW: 'reports:view',

  // 8. Módulo Configuración de Empresa
  COMPANY_MANAGE: 'company:manage',
  BRANCHES_MANAGE: 'branches:manage',
  FISCAL_MANAGE: 'fiscal:manage',
  USERS_MANAGE: 'users:manage',
  SETTINGS_SECURITY: 'settings:security',
} as const;

export type SystemPermission = typeof SYSTEM_PERMISSIONS[keyof typeof SYSTEM_PERMISSIONS];

export const ROLE_PRESET_PERMISSIONS = {
  SELLER: [
    SYSTEM_PERMISSIONS.POS_CREATE,
    SYSTEM_PERMISSIONS.POS_SHIFTS,
    SYSTEM_PERMISSIONS.SALES_INVOICING,
    SYSTEM_PERMISSIONS.CLIENTS_MANAGE,
    SYSTEM_PERMISSIONS.INVENTORY_STOCK,
    SYSTEM_PERMISSIONS.SALES_QUOTATIONS,
    SYSTEM_PERMISSIONS.SALES_ORDERS,
  ],
  SUPERVISOR: [
    SYSTEM_PERMISSIONS.POS_CREATE,
    SYSTEM_PERMISSIONS.POS_SHIFTS,
    SYSTEM_PERMISSIONS.SALES_INVOICING,
    SYSTEM_PERMISSIONS.CLIENTS_MANAGE,
    SYSTEM_PERMISSIONS.INVENTORY_STOCK,
    SYSTEM_PERMISSIONS.INVENTORY_MOVES,
    SYSTEM_PERMISSIONS.INVENTORY_ADJUST,
    SYSTEM_PERMISSIONS.INVENTORY_CATEGORIES,
    SYSTEM_PERMISSIONS.SALES_QUOTATIONS,
    SYSTEM_PERMISSIONS.SALES_ORDERS,
    SYSTEM_PERMISSIONS.SALES_DELIVERIES,
    SYSTEM_PERMISSIONS.ACCOUNTS_RECEIVABLES,
    SYSTEM_PERMISSIONS.REPORTS_VIEW,
  ],
  MANAGER: [
    SYSTEM_PERMISSIONS.POS_CREATE,
    SYSTEM_PERMISSIONS.POS_SHIFTS,
    SYSTEM_PERMISSIONS.SALES_INVOICING,
    SYSTEM_PERMISSIONS.CLIENTS_MANAGE,
    SYSTEM_PERMISSIONS.SALES_QUOTATIONS,
    SYSTEM_PERMISSIONS.SALES_ORDERS,
    SYSTEM_PERMISSIONS.SALES_DELIVERIES,
    SYSTEM_PERMISSIONS.PURCHASES_NEW,
    SYSTEM_PERMISSIONS.PURCHASES_ORDERS,
    SYSTEM_PERMISSIONS.PURCHASES_RECEPTIONS,
    SYSTEM_PERMISSIONS.PURCHASES_INVOICES,
    SYSTEM_PERMISSIONS.PROVIDERS_MANAGE,
    SYSTEM_PERMISSIONS.INVENTORY_CREATE,
    SYSTEM_PERMISSIONS.INVENTORY_STOCK,
    SYSTEM_PERMISSIONS.INVENTORY_VIEW,
    SYSTEM_PERMISSIONS.INVENTORY_WRITE,
    SYSTEM_PERMISSIONS.INVENTORY_ADJUST,
    SYSTEM_PERMISSIONS.INVENTORY_BULK_PRICES,
    SYSTEM_PERMISSIONS.INVENTORY_VALUATION,
    SYSTEM_PERMISSIONS.INVENTORY_WAREHOUSE,
    SYSTEM_PERMISSIONS.INVENTORY_CATEGORIES,
    SYSTEM_PERMISSIONS.INVENTORY_MOVES,
    SYSTEM_PERMISSIONS.BANKS_ACCOUNTS,
    SYSTEM_PERMISSIONS.ACCOUNTS_RECEIVABLES,
    SYSTEM_PERMISSIONS.ACCOUNTS_PAYABLES,
    SYSTEM_PERMISSIONS.ACCOUNTS_HISTORY,
    SYSTEM_PERMISSIONS.REPORTS_VIEW,
  ],
} as const;

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

export const SAAS_PLAN_TIER_ORDER: Record<string, number> = {
  [SAAS_PLAN_CODES.EMPRENDEDOR]: 1,
  [SAAS_PLAN_CODES.COMERCIAL_PRO]: 2,
  [SAAS_PLAN_CODES.CORPORATIVO]: 3,
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
    'pos:discount',
    'pos:refund',
    'sales:invoicing',
    'clients:manage',
    // 2. Módulo Compras (INVENTORY_PURCHASES)
    'purchases:new',
    'purchases:invoices',
    'providers:manage',
    // 3. Módulo Control de Inventario (INVENTORY)
    'inventory:create',
    'inventory:stock',
    'inventory:view',
    'inventory:write',
    'inventory:adjust',
    'inventory:warehouse',
    'inventory:categories',
    // 4. Módulo Cuentas (BANKS)
    'banks:accounts',
    // 5. Módulo Configuración de Empresa (SETTINGS)
    'company:manage',
    'fiscal:manage',
    'users:manage',
    'branches:manage',
  ],
  [SAAS_PLAN_CODES.COMERCIAL_PRO]: [
    'pos:create',
    'pos:discount',
    'pos:refund',
    'sales:invoicing',
    'sales:quotations',
    'sales:orders',
    'sales:deliveries',
    'clients:manage',
    'pos:shifts',
    'purchases:orders',
    'purchases:receptions',
    'purchases:invoices',
    'purchases:new',
    'providers:manage',
    'inventory:create',
    'inventory:stock',
    'inventory:view',
    'inventory:write',
    'inventory:adjust',
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
    'branches:manage',
  ],
  [SAAS_PLAN_CODES.CORPORATIVO]: [
    'pos:create',
    'pos:discount',
    'pos:refund',
    'sales:invoicing',
    'sales:quotations',
    'sales:orders',
    'sales:deliveries',
    'clients:manage',
    'pos:shifts',
    'purchases:orders',
    'purchases:receptions',
    'purchases:invoices',
    'purchases:new',
    'providers:manage',
    'inventory:create',
    'inventory:stock',
    'inventory:view',
    'inventory:write',
    'inventory:adjust',
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
    'branches:manage',
  ],
};

export const SAAS_PLAN_LIMITS: Record<string, { USERS: number; PRODUCTS: number; BRANCHES: number }> = {
  EMPRENDEDOR: { USERS: 2, PRODUCTS: 500, BRANCHES: 1 },
  COMERCIAL_PRO: { USERS: 5, PRODUCTS: 5000, BRANCHES: 3 },
  CORPORATIVO: { USERS: 50, PRODUCTS: 999999, BRANCHES: 999 },
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
