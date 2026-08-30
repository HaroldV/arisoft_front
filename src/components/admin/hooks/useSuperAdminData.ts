'use client';

import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/infrastructure/api/api-client';
import { useAuth } from '@/context/AuthContext';
import { TenantCompany, SaasPlan } from '../SuperAdminBackoffice';
import { SAAS_ADDON_PRICING, PLAN_DEFAULT_MODULES, PLAN_DEFAULT_PERMISSIONS, SAAS_PLAN_CODES, type SaasPlanCode } from '@/constants/domain-constants';

const MOCK_TENANTS: TenantCompany[] = [
  {
    id: 't-1',
    name: 'Unidad Educativa Privada Nuestro Samán',
    tax_id: 'J-31456982-1',
    subdomain: 'unidad-educativa-privada-nuestro-saman',
    plan_name: 'CORPORATIVO',
    status: 'ACTIVE',
    user_count: 8,
    max_users: 50,
    product_count: 1420,
    max_products: 999999,
    monthly_fee_usd: 120.00,
    subscription_expires_at: '2026-12-31',
    created_at: '28/7/2026',
    enabled_modules: PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.CORPORATIVO],
    enabled_permissions: PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.CORPORATIVO],
    owner_email: 'direccion@nuestrosaman.edu.ve',
    owner_name: 'Lic. Nelson Parra',
    logo_color: 'bg-emerald-600'
  },
  {
    id: 't-2',
    name: 'IKAIUAD',
    tax_id: 'J-40897654-3',
    subdomain: 'ikaiuad',
    plan_name: 'COMERCIAL_PRO',
    status: 'ACTIVE',
    user_count: 4,
    max_users: 5,
    product_count: 680,
    max_products: 5000,
    monthly_fee_usd: 50.00,
    subscription_expires_at: '2026-09-15',
    created_at: '23/5/2026',
    enabled_modules: PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.COMERCIAL_PRO],
    enabled_permissions: PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.COMERCIAL_PRO],
    owner_email: 'contacto@ikaiuad.com',
    owner_name: 'Ing. Javier Soto',
    logo_color: 'bg-blue-600'
  },
  {
    id: 't-3',
    name: 'Porto Minimarket & Delicateses',
    tax_id: 'J-50119283-4',
    subdomain: 'porto',
    plan_name: 'COMERCIAL_PRO',
    status: 'ACTIVE',
    user_count: 5,
    max_users: 5,
    product_count: 1850,
    max_products: 5000,
    monthly_fee_usd: 50.00,
    subscription_expires_at: '2026-10-10',
    created_at: '23/5/2026',
    enabled_modules: PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.COMERCIAL_PRO],
    enabled_permissions: PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.COMERCIAL_PRO],
    owner_email: 'gerencia@portovenezuela.com',
    owner_name: 'Antonio Da Silva',
    logo_color: 'bg-blue-600'
  },
  {
    id: 't-4',
    name: 'Cecual Suministros Industriales',
    tax_id: 'J-29837465-0',
    subdomain: 'cecual',
    plan_name: 'EMPRENDEDOR',
    status: 'ACTIVE',
    user_count: 2,
    max_users: 2,
    product_count: 340,
    max_products: 500,
    monthly_fee_usd: 25.00,
    subscription_expires_at: '2026-08-30',
    created_at: '8/5/2026',
    enabled_modules: PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.EMPRENDEDOR],
    enabled_permissions: PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.EMPRENDEDOR],
    owner_email: 'ventas@cecual.com',
    owner_name: 'Cecilia Alvarado',
    logo_color: 'bg-blue-600'
  },
  {
    id: 't-5',
    name: 'Loca Academia de Policía',
    tax_id: 'G-20098172-8',
    subdomain: 'loca-academia-de-policia',
    plan_name: 'COMERCIAL_PRO',
    status: 'ACTIVE',
    user_count: 3,
    max_users: 5,
    product_count: 520,
    max_products: 5000,
    monthly_fee_usd: 50.00,
    subscription_expires_at: '2026-11-20',
    created_at: '8/5/2026',
    enabled_modules: PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.COMERCIAL_PRO],
    enabled_permissions: PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.COMERCIAL_PRO],
    owner_email: 'seguridad@academia.org',
    owner_name: 'Capitán Mahoney',
    logo_color: 'bg-blue-600'
  },
  {
    id: 't-6',
    name: 'HaroldV Global Solutions',
    tax_id: 'V-18992019-1',
    subdomain: 'haroldv',
    plan_name: 'CORPORATIVO',
    status: 'ACTIVE',
    user_count: 12,
    max_users: 50,
    product_count: 4200,
    max_products: 999999,
    monthly_fee_usd: 120.00,
    subscription_expires_at: '2026-12-31',
    created_at: '8/5/2026',
    enabled_modules: PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.CORPORATIVO],
    enabled_permissions: PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.CORPORATIVO],
    owner_email: 'harold@haroldv.com',
    owner_name: 'Harold Villalobos',
    logo_color: 'bg-blue-600'
  }
];

export const ALL_MODULE_GROUPS = [
  {
    key: 'POS', label: 'Ventas (Punto de Venta & Operaciones)', icon: 'Store',
    color: 'indigo',
    submodules: [
      { key: 'pos:create', label: 'Punto de Venta', desc: 'Acceso al módulo POS de caja y facturación rápida' },
      { key: 'sales:invoicing', label: 'Facturación de Venta', desc: 'Módulo de emisión y consulta de facturas de venta' },
      { key: 'sales:quotations', label: 'Cotizaciones', desc: 'Emisión y seguimiento de cotizaciones a clientes' },
      { key: 'sales:orders', label: 'Notas de Pedido', desc: 'Gestión de pedidos de venta y pedidos pendientes' },
      { key: 'sales:deliveries', label: 'Notas de Entrega', desc: 'Despachos y guías de entrega de productos' },
      { key: 'clients:manage', label: 'Clientes', desc: 'Directorio y gestión del catálogo de clientes' },
      { key: 'pos:shifts', label: 'Turnos y Arqueos', desc: 'Apertura, cierre y arqueos de turnos de caja' },
    ]
  },
  {
    key: 'INVENTORY_PURCHASES', label: 'Compras (Órdenes, Recepciones & Facturas)', icon: 'Building2',
    color: 'emerald',
    submodules: [
      { key: 'purchases:orders', label: 'Órdenes de Compra', desc: 'Gestión y aprobación de órdenes de compra a proveedores' },
      { key: 'purchases:receptions', label: 'Notas de Recepción', desc: 'Recepciones y verificación de mercancía recibida' },
      { key: 'purchases:new', label: 'Registrar Compra', desc: 'Formulario de registro directo de compras' },
      { key: 'purchases:invoices', label: 'Facturación de Compra', desc: 'Registro y control de facturas de proveedores' },
      { key: 'providers:manage', label: 'Proveedores', desc: 'Directorio y gestión del catálogo de proveedores' },
    ]
  },
  {
    key: 'INVENTORY', label: 'Control de Inventario (Catálogo & Stock)', icon: 'Package',
    color: 'teal',
    submodules: [
      { key: 'inventory:create', label: 'Crear Productos', desc: 'Alta de nuevos productos en el catálogo' },
      { key: 'inventory:stock', label: 'Listado de Productos', desc: 'Consulta de stock, catálogo y precios' },
      { key: 'inventory:bulk_prices', label: 'Actualizar Precios Masivo', desc: 'Herramienta de actualización masiva de precios' },
      { key: 'inventory:valuation', label: 'Valuación de Inventario', desc: 'Reportes de auditoría y valorización de stock' },
      { key: 'inventory:warehouse', label: 'Almacenes', desc: 'Gestión de depósitos y sucursales' },
      { key: 'inventory:categories', label: 'Categorías', desc: 'Clasificación y rubros de productos' },
      { key: 'inventory:moves', label: 'Movimientos', desc: 'Ajustes, mermas y transferencias entre almacenes' },
    ]
  },
  {
    key: 'BANKS', label: 'Cuentas (Bancos, CxC, CxP & Historial)', icon: 'Landmark',
    color: 'blue',
    submodules: [
      { key: 'banks:accounts', label: 'Cuentas Bancarias', desc: 'Administración de cuentas bancarias y saldos' },
      { key: 'accounts:receivables', label: 'Cuentas por Cobrar (CxC)', desc: 'Control de créditos y cobros pendientes' },
      { key: 'accounts:payables', label: 'Cuentas por Pagar (CxP)', desc: 'Control de compromisos y pagos a proveedores' },
      { key: 'accounts:history', label: 'Historial', desc: 'Auditoría e historial financiero general' },
    ]
  },
  {
    key: 'REPORTS', label: 'Reportes y Analítica', icon: 'BarChart3',
    color: 'purple',
    submodules: [
      { key: 'reports:view', label: 'Reportes y Analítica', desc: 'Centro de reportes BI y métricas clave del negocio' },
    ]
  },
  {
    key: 'PAYROLL', label: 'Nómina & Recursos Humanos', icon: 'Users',
    color: 'emerald',
    submodules: [
      { key: 'payroll:manage', label: 'Procesamiento de Nómina', desc: 'Cálculo de asignaciones, deducciones y emisión de recibos' },
    ]
  },
  {
    key: 'SETTINGS', label: 'Configuración de Empresa', icon: 'Settings',
    color: 'amber',
    submodules: [
      { key: 'company:manage', label: 'Perfil de Empresa', desc: 'Configuración de datos de la empresa y logo' },
      { key: 'fiscal:manage', label: 'Configuración Fiscal', desc: 'Timbres fiscales, retenciones e imprenta digital' },
      { key: 'users:manage', label: 'Usuarios y Roles', desc: 'Administración de usuarios, cajeros y roles internos' },
    ]
  },
];

export function useSuperAdminData() {
  const [activeTab, setActiveTab] = useState<'TENANTS' | 'PLANS' | 'BILLING' | 'MARKET_BI'>('TENANTS');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');
  const [tenants, setTenants] = useState<TenantCompany[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [masterBcvRate, setMasterBcvRate] = useState<number>(772.54);
  const [masterEurRate, setMasterEurRate] = useState<number>(894.49);
  const [isSyncingBcv, setIsSyncingBcv] = useState(false);
  const [bcvLastUpdated, setBcvLastUpdated] = useState<string>('Cargando...');
  const [isManualBcvModalOpen, setIsManualBcvModalOpen] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantCompany | null>(null);
  const [formName, setFormName] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formSubdomain, setFormSubdomain] = useState('');

  const [saasPlans, setSaasPlans] = useState<SaasPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlan | null>(null);

  const [planFormName, setPlanFormName] = useState('');
  const [planFormCode, setPlanFormCode] = useState('');
  const [planFormDesc, setPlanFormDesc] = useState('');
  const [planFormMonthly, setPlanFormMonthly] = useState<number>(29);
  const [planFormAnnual, setPlanFormAnnual] = useState<number>(290);
  const [planFormUsers, setPlanFormUsers] = useState<number>(5);
  const [planFormProducts, setPlanFormProducts] = useState<number>(1000);
  const [planFormWarehouses, setPlanFormWarehouses] = useState<number>(1);
  const [planFormFiscalPrinting, setPlanFormFiscalPrinting] = useState<boolean>(false);
  const [planFormBadge, setPlanFormBadge] = useState('');
  const [planFormFeatured, setPlanFormFeatured] = useState<boolean>(false);
  const [planFormActive, setPlanFormActive] = useState<boolean>(true);
  const [planFormModules, setPlanFormModules] = useState<string[]>(['POS', 'INVENTORY']);
  const [planFormPermissions, setPlanFormPermissions] = useState<string[]>(['pos:create', 'sales:invoicing', 'inventory:stock']);
  const [planFormFeaturesText, setPlanFormFeaturesText] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planModalError, setPlanModalError] = useState<string | null>(null);

  const [formPlan, setFormPlan] = useState<string>('EMPRENDEDOR');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [formMaxUsers, setFormMaxUsers] = useState<number>(2);
  const [formMaxProducts, setFormMaxProducts] = useState<number>(500);
  const [formMonthlyFee, setFormMonthlyFee] = useState<number>(25);
  const [formBasePlanPrice, setFormBasePlanPrice] = useState<number>(25);
  const [formHasCustomPricing, setFormHasCustomPricing] = useState<boolean>(false);
  const [formDiscountType, setFormDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(0);
  const [formPricingNotes, setFormPricingNotes] = useState<string>('');
  const [formOwnerEmail, setFormOwnerEmail] = useState('');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerPassword, setFormOwnerPassword] = useState('');
  const [formOwnerPasswordConfirm, setFormOwnerPasswordConfirm] = useState('');
  const [formModules, setFormModules] = useState<string[]>(PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.EMPRENDEDOR]);
  const [formPermissions, setFormPermissions] = useState<string[]>(PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.EMPRENDEDOR]);
  const [expandedModuleGroups, setExpandedModuleGroups] = useState<string[]>(['POS', 'INVENTORY_PURCHASES', 'INVENTORY', 'BANKS', 'SETTINGS']);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [tenantToToggle, setTenantToToggle] = useState<TenantCompany | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [impersonatingTenant, setImpersonatingTenant] = useState<TenantCompany | null>(null);
  const [isImpersonatingId, setIsImpersonatingId] = useState<string | null>(null);
  const [newTenantPassword, setNewTenantPassword] = useState<string | null>(null);
  const [formResetPassword, setFormResetPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchTenants();
      fetchPlans();
      fetchMasterBcvRate();
    }
  }, [user?.role]);

  const fetchMasterBcvRate = async () => {
    try {
      const res = await apiClient.get('/admin/bcv/rate');
      if (res.data) {
        if (res.data.USD?.rate) setMasterBcvRate(Number(res.data.USD.rate));
        else if (res.data.rate) setMasterBcvRate(Number(res.data.rate));

        if (res.data.EUR?.rate) setMasterEurRate(Number(res.data.EUR.rate));

        const dt = res.data.updated_at ? new Date(res.data.updated_at) : new Date();
        setBcvLastUpdated(dt.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }));
      }
    } catch (err) {
      console.warn('Could not fetch master BCV rate:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await apiClient.get('/admin/plans');
      if (res.data && Array.isArray(res.data)) {
        setSaasPlans(res.data);
      }
    } catch (err) {
      console.error('Error fetching SaaS plans:', err);
    }
  };

  const fetchTenants = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await apiClient.get('/admin/tenants');
      if (res.data && Array.isArray(res.data)) {
        setTenants(res.data);
      } else {
        setTenants(MOCK_TENANTS);
      }
    } catch (err: any) {
      console.error('Error fetching tenants:', err);
      setTenants(MOCK_TENANTS);
      setFetchError('No se pudo conectar con el backend. Mostrando datos de demostración.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSuggestedFee = (planCode: string, modules: string[], hasCustom: boolean, customFee: number) => {
    if (hasCustom) return customFee;
    const plan = saasPlans.find(p => p.code === planCode);
    const planCodeTyped = planCode as SaasPlanCode;
    const defaultModules: string[] = (plan?.enabled_modules && plan.enabled_modules.length > 0)
      ? plan.enabled_modules
      : (PLAN_DEFAULT_MODULES[planCodeTyped] || ['POS', 'INVENTORY_PURCHASES', 'INVENTORY', 'BANKS', 'SETTINGS']);
    
    const baseFee = plan ? Number(plan.monthly_fee_usd) : (planCode === 'EMPRENDEDOR' ? 25 : planCode === 'CORPORATIVO' ? 120 : 50);
    
    let addOnTotal = 0;
    modules.forEach(m => {
      if (!defaultModules.includes(m) && SAAS_ADDON_PRICING[m]) {
        addOnTotal += SAAS_ADDON_PRICING[m];
      }
    });

    return baseFee + addOnTotal;
  };

  const handleSelectPlanInForm = (planCode: string) => {
    setFormPlan(planCode);
    const planCodeTyped = planCode as SaasPlanCode;
    const selected = saasPlans.find(p => p.code === planCode);
    
    const baseFee = selected 
      ? Number(selected.monthly_fee_usd) 
      : (planCode === 'EMPRENDEDOR' ? 25 : planCode === 'CORPORATIVO' ? 120 : 50);
    const maxUsers = selected 
      ? selected.max_users 
      : (planCode === 'EMPRENDEDOR' ? 2 : planCode === 'CORPORATIVO' ? 50 : 5);
    const maxProducts = selected 
      ? selected.max_products 
      : (planCode === 'EMPRENDEDOR' ? 500 : planCode === 'CORPORATIVO' ? 999999 : 5000);
    const defaultModules: string[] = (selected?.enabled_modules && selected.enabled_modules.length > 0)
      ? selected.enabled_modules
      : (PLAN_DEFAULT_MODULES[planCodeTyped] || ['POS', 'INVENTORY_PURCHASES', 'INVENTORY', 'BANKS', 'SETTINGS']);
    const defaultPermissions: string[] = (selected?.enabled_permissions && selected.enabled_permissions.length > 0)
      ? selected.enabled_permissions
      : (PLAN_DEFAULT_PERMISSIONS[planCodeTyped] || []);

    setFormMaxUsers(maxUsers);
    setFormMaxProducts(maxProducts);
    setFormBasePlanPrice(baseFee);
    setFormModules(defaultModules);
    setFormPermissions(defaultPermissions);

    if (!formHasCustomPricing) {
      setFormMonthlyFee(baseFee);
    }
  };

  const handleOpenPlanModal = (plan?: SaasPlan) => {
    setPlanModalError(null);
    if (plan) {
      setEditingPlan(plan);
      setPlanFormName(plan.name);
      setPlanFormCode(plan.code);
      setPlanFormDesc(plan.description || '');
      setPlanFormMonthly(plan.monthly_fee_usd);
      setPlanFormAnnual(plan.annual_fee_usd || plan.monthly_fee_usd * 10);
      setPlanFormUsers(plan.max_users);
      setPlanFormProducts(plan.max_products);
      setPlanFormWarehouses(plan.max_warehouses || 1);
      setPlanFormFiscalPrinting(Boolean(plan.has_fiscal_printing));
      setPlanFormBadge(plan.badge_text || '');
      setPlanFormFeatured(Boolean(plan.is_featured));
      setPlanFormActive(Boolean(plan.is_active));
      setPlanFormModules(plan.enabled_modules || ['POS', 'INVENTORY']);
      setPlanFormPermissions(plan.enabled_permissions || []);
      setPlanFormFeaturesText((plan.features_list || []).join('\n'));
    } else {
      setEditingPlan(null);
      setPlanFormName('');
      setPlanFormCode('');
      setPlanFormDesc('');
      setPlanFormMonthly(25);
      setPlanFormAnnual(250);
      setPlanFormUsers(5);
      setPlanFormProducts(1000);
      setPlanFormWarehouses(1);
      setPlanFormFiscalPrinting(false);
      setPlanFormBadge('');
      setPlanFormFeatured(false);
      setPlanFormActive(true);
      setPlanFormModules(['POS', 'INVENTORY']);
      setPlanFormPermissions(['pos:create', 'sales:invoicing', 'inventory:stock']);
      setPlanFormFeaturesText('');
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanModalError(null);
    if (!planFormName.trim() || (!editingPlan && !planFormCode.trim())) {
      setPlanModalError('Por favor completa el Nombre y Código único del Plan');
      return;
    }
    setIsSavingPlan(true);

    const featuresArray = planFormFeaturesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      name: planFormName,
      code: planFormCode.toUpperCase().trim(),
      description: planFormDesc,
      monthly_fee_usd: Number(planFormMonthly),
      annual_fee_usd: Number(planFormAnnual),
      max_users: Number(planFormUsers),
      max_products: Number(planFormProducts),
      max_warehouses: Number(planFormWarehouses),
      has_fiscal_printing: planFormFiscalPrinting,
      badge_text: planFormBadge,
      is_featured: planFormFeatured,
      is_active: planFormActive,
      enabled_modules: planFormModules,
      enabled_permissions: planFormPermissions,
      features_list: featuresArray
    };

    try {
      if (editingPlan) {
        await apiClient.put(`/admin/plans/${editingPlan.id}`, payload);
        setSyncSuccess(`¡Plan SaaS "${planFormName}" actualizado con éxito!`);
      } else {
        await apiClient.post('/admin/plans', payload);
        setSyncSuccess(`¡Nuevo Plan SaaS "${planFormName}" registrado con éxito!`);
      }
      setIsPlanModalOpen(false);
      fetchPlans();
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving plan:', err);
      setPlanModalError(err.response?.data?.message || 'No se pudo guardar el plan SaaS');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleTogglePlanStatus = async (plan: SaasPlan) => {
    try {
      const newStatus = !plan.is_active;
      await apiClient.put(`/admin/plans/${plan.id}/status`, { is_active: newStatus });
      setSaasPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: newStatus } : p));
      setSyncSuccess(`¡Plan "${plan.name}" ${newStatus ? 'activado' : 'desactivado'} con éxito!`);
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error toggling plan status:', err);
      setSyncError('No se pudo cambiar el estado del plan');
      setTimeout(() => setSyncError(null), 4000);
    }
  };

  const handleTriggerBcvCron = async () => {
    setIsSyncingBcv(true);
    setSyncSuccess(null);
    setSyncError(null);
    try {
      const res = await apiClient.post('/admin/bcv/sync');
      const usdRate = res.data?.USD?.rate || res.data?.rate;
      const eurRate = res.data?.EUR?.rate;
      if (usdRate && typeof usdRate === 'number') {
        setMasterBcvRate(usdRate);
        if (eurRate) setMasterEurRate(eurRate);
        const now = new Date();
        const valueDate = res.data?.value_date ? ` (Fecha Valor: ${res.data.value_date})` : '';
        const eurText = eurRate ? ` | EUR: Bs. ${eurRate.toFixed(2)}` : '';
        setBcvLastUpdated(`Hoy, ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })} (BCV Oficial)`);
        setSyncSuccess(`¡Tasas Oficiales BCV sincronizadas: USD Bs. ${usdRate.toFixed(2)}${eurText}${valueDate}!`);
        setTimeout(() => setSyncSuccess(null), 5000);

        // Notificar inmediatamente al Header y al resto de la aplicación
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('exchange-rate-updated', {
              detail: {
                usdRate,
                eurRate,
              },
            })
          );
        }
      }
    } catch (err: any) {
      console.error('Error triggering BCV sync:', err);
      setSyncError('No se pudo conectar con el portal www.bcv.org.ve. Puedes registrar las tasas manualmente con el botón "Ajustar Manual".');
      setTimeout(() => setSyncError(null), 6000);
    } finally {
      setIsSyncingBcv(false);
    }
  };

  const handleSaveManualBcvRate = async (rates: { usdRate?: number; eurRate?: number }, valueDate?: string, note?: string) => {
    setIsSyncingBcv(true);
    setSyncSuccess(null);
    setSyncError(null);
    try {
      const res = await apiClient.post('/admin/bcv/manual', {
        usd_rate: rates.usdRate,
        eur_rate: rates.eurRate,
        value_date: valueDate,
        note,
      });
      const usdRate = res.data?.USD?.rate || res.data?.rate;
      const eurRate = res.data?.EUR?.rate;
      if (usdRate && typeof usdRate === 'number') {
        setMasterBcvRate(usdRate);
        if (eurRate) setMasterEurRate(eurRate);
        const now = new Date();
        setBcvLastUpdated(`Hoy, ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })} (Manual)`);
        setSyncSuccess(`¡Tasas Maestras Globales actualizadas manualmente (USD: Bs. ${usdRate.toFixed(2)} | EUR: Bs. ${eurRate?.toFixed(2) || '---'})!`);
        setTimeout(() => setSyncSuccess(null), 5000);

        // Notificar inmediatamente al Header y al resto de la aplicación
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('exchange-rate-updated', {
              detail: {
                usdRate,
                eurRate,
              },
            })
          );
        }
      }
    } catch (err: any) {
      console.error('Error saving manual BCV rate:', err);
      setSyncError(err.response?.data?.message || 'Error al guardar las tasas manuales.');
      throw err;
    } finally {
      setIsSyncingBcv(false);
    }
  };

  const handleOpenModal = (tenant?: TenantCompany) => {
    setFormOwnerPassword('');
    setFormOwnerPasswordConfirm('');
    if (tenant) {
      setEditingTenant(tenant);
      setFormName(tenant.name);
      setFormTaxId(tenant.tax_id);
      setFormSubdomain(tenant.subdomain);
      setFormPlan(tenant.plan_name);
      setFormStatus(tenant.status);
      setFormMaxUsers(tenant.max_users);
      setFormMaxProducts(tenant.max_products);
      setFormMonthlyFee(tenant.monthly_fee_usd);
      setFormBasePlanPrice(tenant.base_plan_price || tenant.monthly_fee_usd || 25);
      setFormHasCustomPricing(Boolean(tenant.has_custom_pricing));
      setFormDiscountType(tenant.discount_type || 'FIXED');
      setFormDiscountValue(tenant.discount_value || 0);
      setFormPricingNotes(tenant.pricing_notes || '');
      setFormOwnerEmail(tenant.owner_email || '');
      setFormOwnerName(tenant.owner_name || '');
      const planCodeTyped = (tenant.plan_name as SaasPlanCode) || SAAS_PLAN_CODES.COMERCIAL_PRO;
      const tenantModules = tenant.enabled_modules && tenant.enabled_modules.length > 0 
        ? tenant.enabled_modules 
        : (PLAN_DEFAULT_MODULES[planCodeTyped] || ['POS', 'INVENTORY_PURCHASES', 'INVENTORY', 'BANKS', 'REPORTS', 'SETTINGS']);
      const tenantPermissions = tenant.enabled_permissions && tenant.enabled_permissions.length > 0
        ? tenant.enabled_permissions
        : (PLAN_DEFAULT_PERMISSIONS[planCodeTyped] || []);

      setFormModules(tenantModules);
      setFormPermissions(tenantPermissions);
      setExpandedModuleGroups(tenantModules);
    } else {
      setEditingTenant(null);
      setFormName('');
      setFormTaxId('');
      setFormSubdomain('');
      setFormPlan('EMPRENDEDOR');
      setFormStatus('ACTIVE');
      setFormMaxUsers(2);
      setFormMaxProducts(500);
      setFormMonthlyFee(25);
      setFormBasePlanPrice(25);
      setFormHasCustomPricing(false);
      setFormDiscountType('FIXED');
      setFormDiscountValue(0);
      setFormPricingNotes('');
      setFormOwnerEmail('');
      setFormOwnerName('');
      const defaultEmprendedorModules = PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.EMPRENDEDOR] || ['POS', 'INVENTORY_PURCHASES', 'INVENTORY', 'BANKS', 'SETTINGS'];
      const defaultEmprendedorPermissions = PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.EMPRENDEDOR] || [];
      setFormModules(defaultEmprendedorModules);
      setFormPermissions(defaultEmprendedorPermissions);
      setExpandedModuleGroups(['POS', 'INVENTORY_PURCHASES', 'INVENTORY', 'BANKS', 'SETTINGS']);
    }
    setFormResetPassword(false);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleModule = (modKey: string) => {
    const group = ALL_MODULE_GROUPS.find(g => g.key === modKey);
    const moduleEnabled = formModules.includes(modKey);
    let nextModules: string[];
    if (moduleEnabled) {
      nextModules = formModules.filter(m => m !== modKey);
      setFormModules(nextModules);
      const groupPerms = group?.submodules.map(s => s.key) || [];
      setFormPermissions(prev => prev.filter(p => !groupPerms.includes(p)));
    } else {
      nextModules = [...formModules, modKey];
      setFormModules(nextModules);
      setExpandedModuleGroups(prev => prev.includes(modKey) ? prev : [...prev, modKey]);
    }

    if (!formHasCustomPricing) {
      setFormMonthlyFee(calculateSuggestedFee(formPlan, nextModules, false, formMonthlyFee));
    }
  };

  const handleToggleSubmodule = (parentKey: string, permKey: string) => {
    const permEnabled = formPermissions.includes(permKey);
    if (permEnabled) {
      const newPerms = formPermissions.filter(p => p !== permKey);
      setFormPermissions(newPerms);
      const group = ALL_MODULE_GROUPS.find(g => g.key === parentKey);
      const groupPerms = group?.submodules.map(s => s.key) || [];
      if (!groupPerms.some(p => newPerms.includes(p))) {
        const nextModules = formModules.filter(m => m !== parentKey);
        setFormModules(nextModules);
        if (!formHasCustomPricing) {
          setFormMonthlyFee(calculateSuggestedFee(formPlan, nextModules, false, formMonthlyFee));
        }
      }
    } else {
      setFormPermissions(prev => [...prev, permKey]);
      if (!formModules.includes(parentKey)) {
        const nextModules = [...formModules, parentKey];
        setFormModules(nextModules);
        setExpandedModuleGroups(prev => prev.includes(parentKey) ? prev : [...prev, parentKey]);
        if (!formHasCustomPricing) {
          setFormMonthlyFee(calculateSuggestedFee(formPlan, nextModules, false, formMonthlyFee));
        }
      }
    }
  };

  const handleToggleModuleGroup = (modKey: string) => {
    setExpandedModuleGroups(prev =>
      prev.includes(modKey) ? prev.filter(m => m !== modKey) : [...prev, modKey]
    );
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTaxId.trim() || !formOwnerEmail.trim()) {
      setModalError('Por favor completa todos los campos requeridos.');
      return;
    }

    // Validation for new company registration password fields
    if (!editingTenant) {
      if (!formOwnerPassword || formOwnerPassword.length < 6) {
        setModalError('La contraseña temporal de acceso debe tener al menos 6 caracteres.');
        return;
      }
      if (formOwnerPassword !== formOwnerPasswordConfirm) {
        setModalError('Las contraseñas ingresadas no coinciden. Por favor verifica los campos.');
        return;
      }
    } else if (formOwnerPassword) {
      // If editing and password field is filled
      if (formOwnerPassword.length < 6) {
        setModalError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (formOwnerPassword !== formOwnerPasswordConfirm) {
        setModalError('Las contraseñas ingresadas no coinciden. Por favor verifica los campos.');
        return;
      }
    }

    setIsSaving(true);
    setModalError(null);

    const payload: any = {
      name: formName.trim(),
      tax_id: formTaxId.trim().toUpperCase(),
      subdomain: formSubdomain.trim().toLowerCase() || formName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      plan_name: formPlan,
      status: formStatus,
      max_users: Number(formMaxUsers),
      max_products: Number(formMaxProducts),
      monthly_fee_usd: Number(formMonthlyFee),
      base_plan_price: Number(formBasePlanPrice),
      has_custom_pricing: Boolean(formHasCustomPricing),
      discount_type: formDiscountType,
      discount_value: Number(formDiscountValue),
      pricing_notes: formPricingNotes.trim(),
      owner_email: formOwnerEmail.trim(),
      owner_name: formOwnerName.trim() || 'Gerente General',
      enabled_modules: formModules,
      enabled_permissions: formPermissions,
      reset_password: formResetPassword,
    };

    if (formOwnerPassword) {
      payload.owner_password = formOwnerPassword;
    }

    try {
      if (editingTenant) {
        const res = await apiClient.put(`/admin/tenants/${editingTenant.id}`, payload);
        const resetPassword = res.data?.defaultPassword;
        setTenants(prev => prev.map(t =>
          t.id === editingTenant.id
            ? {
              ...t,
              name: payload.name,
              tax_id: payload.tax_id,
              subdomain: payload.subdomain,
              plan_name: payload.plan_name,
              status: payload.status,
              max_users: payload.max_users,
              max_products: payload.max_products,
              monthly_fee_usd: payload.monthly_fee_usd,
              base_plan_price: payload.base_plan_price,
              has_custom_pricing: payload.has_custom_pricing,
              discount_type: payload.discount_type,
              discount_value: payload.discount_value,
              pricing_notes: payload.pricing_notes,
              owner_email: payload.owner_email,
              owner_name: payload.owner_name,
              enabled_modules: payload.enabled_modules,
              enabled_permissions: payload.enabled_permissions,
            }
            : t
        ));
        setIsModalOpen(false);
        await fetchTenants();
        if (resetPassword) {
          setNewTenantPassword(resetPassword);
        } else {
          setSyncSuccess('Empresa actualizada exitosamente.');
          setTimeout(() => setSyncSuccess(null), 4000);
        }
      } else {
        const res = await apiClient.post('/admin/tenants', payload);
        const createdPassword = res.data?.defaultPassword || 'ArivPassword123!';
        await fetchTenants();
        setIsModalOpen(false);
        setNewTenantPassword(createdPassword);
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      const status = err?.response?.status;
      if (status === 409) {
        setModalError(backendMessage || 'El RIF o el email ya están registrados en la plataforma.');
      } else if (status === 400) {
        setModalError(backendMessage || 'Datos inválidos. Verifica los campos requeridos.');
      } else {
        setModalError('Error al guardar la empresa. Intenta de nuevo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatusRequest = (tenant: TenantCompany) => {
    if (tenant.status === 'ACTIVE') {
      setTenantToToggle(tenant);
      setIsConfirmModalOpen(true);
    } else {
      executeToggleStatus(tenant);
    }
  };

  const executeToggleStatus = async (tenant: TenantCompany) => {
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, status: newStatus, owner_is_active: newStatus !== 'SUSPENDED' } : t));
    setIsConfirmModalOpen(false);
    setTenantToToggle(null);
    try {
      await apiClient.put(`/admin/tenants/${tenant.id}`, { status: newStatus });
      setSyncSuccess(`¡Empresa "${tenant.name}" ${newStatus === 'SUSPENDED' ? 'suspendida' : 'activada'} con éxito!`);
      setTimeout(() => setSyncSuccess(null), 4000);
      await fetchTenants();
    } catch (err: any) {
      console.error('Error toggling tenant status:', err);
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, status: tenant.status } : t));
      setSyncError(`No se pudo cambiar el estado de "${tenant.name}". Intenta de nuevo.`);
      setTimeout(() => setSyncError(null), 4000);
    }
  };

  const handleReactivateOwner = async (tenant: TenantCompany) => {
    setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, owner_is_active: true, status: t.status === 'SUSPENDED' ? 'ACTIVE' : t.status } : t));
    try {
      await apiClient.post(`/admin/tenants/${tenant.id}/reactivate-owner`);
      setSyncSuccess(`¡Cuenta de ${tenant.owner_name} (${tenant.owner_email}) reactivada con éxito! Acceso restablecido.`);
      setTimeout(() => setSyncSuccess(null), 6000);
      await fetchTenants();
    } catch (err: any) {
      console.error('Error reactivating owner:', err);
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, owner_is_active: tenant.owner_is_active } : t));
      setSyncError(`No se pudo reactivar la cuenta de ${tenant.owner_name}. Intenta de nuevo.`);
      setTimeout(() => setSyncError(null), 4000);
    }
  };

  const handleImpersonate = async (tenant: TenantCompany) => {
    if (isImpersonatingId) return;
    setIsImpersonatingId(tenant.id);
    setImpersonatingTenant(tenant);
    try {
      const res = await apiClient.post(`/admin/tenants/${tenant.id}/impersonate`);
      const { access_token, user } = res.data || {};

      if (access_token && user) {
        localStorage.setItem('ari_token', access_token);
        localStorage.setItem('ari_user', JSON.stringify(user));
        window.location.href = '/dashboard';
      } else {
        throw new Error('Respuesta inválida del servidor de impersonación');
      }
    } catch (err: any) {
      console.error('Error impersonating tenant:', err);
      setImpersonatingTenant(null);
      setIsImpersonatingId(null);
      setSyncError(`No se pudo iniciar sesión como "${tenant.name}". Verifica que el tenant tenga usuarios activos.`);
      setTimeout(() => setSyncError(null), 5000);
    }
  };

  const handleCopyPassword = () => {
    if (newTenantPassword) {
      navigator.clipboard.writeText(newTenantPassword).then(() => {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      });
    }
  };

  const totalMRR = useMemo(() => {
    return tenants.filter(t => t.status === 'ACTIVE').reduce((acc, t) => acc + t.monthly_fee_usd, 0);
  }, [tenants]);

  const activeTenantsCount = useMemo(() => {
    return tenants.filter(t => t.status === 'ACTIVE').length;
  }, [tenants]);

  const inactiveTenantsCount = useMemo(() => {
    return tenants.filter(t => t.status === 'SUSPENDED').length;
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tax_id.toLowerCase().includes(search.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tenants, search, statusFilter]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return {
    activeTab, setActiveTab,
    viewMode, setViewMode,
    tenants,
    search, setSearch,
    statusFilter, setStatusFilter,
    isLoading,
    fetchError,
    masterBcvRate,
    masterEurRate,
    isSyncingBcv,
    bcvLastUpdated,
    isManualBcvModalOpen,
    setIsManualBcvModalOpen,
    handleSaveManualBcvRate,
    syncSuccess,
    syncError,
    isModalOpen, setIsModalOpen,
    editingTenant,
    formName, setFormName,
    formTaxId, setFormTaxId,
    formSubdomain, setFormSubdomain,
    saasPlans,
    billingCycle, setBillingCycle,
    isPlanModalOpen, setIsPlanModalOpen,
    editingPlan,
    planFormName, setPlanFormName,
    planFormCode, setPlanFormCode,
    planFormDesc, setPlanFormDesc,
    planFormMonthly, setPlanFormMonthly,
    planFormAnnual, setPlanFormAnnual,
    planFormUsers, setPlanFormUsers,
    planFormProducts, setPlanFormProducts,
    planFormWarehouses, setPlanFormWarehouses,
    planFormFiscalPrinting, setPlanFormFiscalPrinting,
    planFormBadge, setPlanFormBadge,
    planFormFeatured, setPlanFormFeatured,
    planFormActive, setPlanFormActive,
    planFormModules, setPlanFormModules,
    planFormPermissions, setPlanFormPermissions,
    planFormFeaturesText, setPlanFormFeaturesText,
    isSavingPlan,
    planModalError,
    formPlan, setFormPlan,
    formStatus, setFormStatus,
    formMaxUsers, setFormMaxUsers,
    formMaxProducts, setFormMaxProducts,
    formMonthlyFee, setFormMonthlyFee,
    formBasePlanPrice, setFormBasePlanPrice,
    formHasCustomPricing, setFormHasCustomPricing,
    formDiscountType, setFormDiscountType,
    formDiscountValue, setFormDiscountValue,
    formPricingNotes, setFormPricingNotes,
    formOwnerEmail, setFormOwnerEmail,
    formOwnerName, setFormOwnerName,
    formOwnerPassword, setFormOwnerPassword,
    formOwnerPasswordConfirm, setFormOwnerPasswordConfirm,
    formModules, setFormModules,
    formPermissions, setFormPermissions,
    expandedModuleGroups, setExpandedModuleGroups,
    isSaving,
    modalError,
    tenantToToggle,
    isConfirmModalOpen, setIsConfirmModalOpen,
    impersonatingTenant,
    isImpersonatingId,
    newTenantPassword, setNewTenantPassword,
    formResetPassword, setFormResetPassword,
    passwordCopied,
    handleSelectPlanInForm,
    handleOpenPlanModal,
    handleSavePlan,
    handleTogglePlanStatus,
    handleTriggerBcvCron,
    handleOpenModal,
    handleToggleModule,
    handleToggleSubmodule,
    handleToggleModuleGroup,
    handleSaveTenant,
    handleToggleStatusRequest,
    executeToggleStatus,
    handleReactivateOwner,
    handleImpersonate,
    handleCopyPassword,
    totalMRR,
    activeTenantsCount,
    inactiveTenantsCount,
    filteredTenants,
    getInitials,
    fetchTenants,
  };
}
