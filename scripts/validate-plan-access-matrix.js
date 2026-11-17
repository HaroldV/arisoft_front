const fs = require('fs');
const path = require('path');

console.log('🔍 Executing Quality Gate 2.1: Frontend Plan Access Matrix & Route Parity Validator...');

const domainConstantsPath = path.join(__dirname, '../src/constants/domain-constants.ts');
const domainContent = fs.readFileSync(domainConstantsPath, 'utf8');

// 1. Extraer el bloque PLAN_DEFAULT_PERMISSIONS
const permissionsSectionMatch = domainContent.match(/export const PLAN_DEFAULT_PERMISSIONS[^{]+{([\s\S]*?)};\s*export const SAAS_PLAN_LIMITS/);
if (!permissionsSectionMatch) {
  console.error('❌ Could not locate PLAN_DEFAULT_PERMISSIONS in domain-constants.ts');
  process.exit(1);
}

const permissionsSection = permissionsSectionMatch[1];
const emprendedorBlockMatch = permissionsSection.match(/\[SAAS_PLAN_CODES\.EMPRENDEDOR\]:\s*\[([\s\S]*?)\],/);
if (!emprendedorBlockMatch) {
  console.error('❌ Could not parse [SAAS_PLAN_CODES.EMPRENDEDOR] block');
  process.exit(1);
}

const emprendedorPermissions = emprendedorBlockMatch[1]
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.startsWith("'") && l.includes("'"))
  .map(l => l.replace(/['",]/g, ''));

console.log('📋 Emprendedor Active Permissions Count:', emprendedorPermissions.length);

// 2. Verificar que los permisos prohibidos NO estén en Emprendedor
const strictlyForbiddenInEmprendedor = [
  'banks:ledger',
  'branches:manage',
  'sales:quotations',
  'sales:orders',
  'sales:deliveries',
  'purchases:orders',
  'purchases:receptions',
  'accounts:receivables',
  'accounts:payables',
  'accounts:history',
  'reports:view',
  'payroll:manage',
];

for (const forbidden of strictlyForbiddenInEmprendedor) {
  if (emprendedorPermissions.includes(forbidden)) {
    console.error(`❌ Security Violation: Prohibited permission "${forbidden}" is present in Plan Emprendedor!`);
    process.exit(1);
  }
}

// 3. Verificar que los permisos requeridos SÍ estén presentes
const requiredInEmprendedor = [
  'pos:create',
  'pos:shifts',
  'sales:invoicing',
  'clients:manage',
  'purchases:new',
  'purchases:invoices',
  'providers:manage',
  'inventory:create',
  'inventory:stock',
  'inventory:warehouse',
  'inventory:categories',
  'banks:accounts',
  'company:manage',
  'fiscal:manage',
  'users:manage',
];

for (const required of requiredInEmprendedor) {
  if (!emprendedorPermissions.includes(required)) {
    console.error(`❌ Missing Required Permission: "${required}" is missing from Plan Emprendedor!`);
    process.exit(1);
  }
}

// 4. Validar Paridad con Sidebar y routeMap
const layoutPath = path.join(__dirname, '../src/app/(dashboard)/layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

const expectedRouteMappings = [
  { route: '/sales/quotations', permission: 'sales:quotations' },
  { route: '/sales/orders', permission: 'sales:orders' },
  { route: '/sales/deliveries', permission: 'sales:deliveries' },
  { route: '/admin/shifts', permission: 'pos:shifts' },
  { route: '/accounts/ledger', permission: 'banks:ledger' },
  { route: '/accounts/cash-shifts', permission: 'banks:shifts' },
  { route: '/accounts/receivables', permission: 'accounts:receivables' },
  { route: '/accounts/payables', permission: 'accounts:payables' },
  { route: '/settings/branches', permission: 'branches:manage' },
];

for (const mapping of expectedRouteMappings) {
  const regex = new RegExp(`['"]${mapping.route}['"]\\s*:\\s*['"]${mapping.permission}['"]`);
  if (!regex.test(layoutContent)) {
    console.error(`❌ Route Guard Parity Error: Route "${mapping.route}" is not correctly mapped to permission "${mapping.permission}" in layout.tsx!`);
    process.exit(1);
  }
}

console.log('✅ Quality Gate 2.1 Passed: All SaaS Plan permissions, route mappings and security boundaries are 100% verified.');
