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

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

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

export const APP_CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  DEFAULT_BCV_RATE: Number(process.env.NEXT_PUBLIC_DEFAULT_BCV_RATE || 36.50),
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ARI ERP',
  SAAS_DOMAIN: process.env.NEXT_PUBLIC_SAAS_DOMAIN || 'erparisoft.com',
};
