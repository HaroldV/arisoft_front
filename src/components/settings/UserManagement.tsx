'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Shield, CheckCircle2, XCircle, X, Key, AlertTriangle, AlertCircle, Percent, 
  ShoppingCart, Package, Landmark, Settings, UserPlus, FileText, ShoppingBag, Users, BarChart3, Building2,
  Eye, EyeOff, Copy, Check, ExternalLink, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { useAuth } from '@/context/AuthContext';
import { 
  PLAN_DEFAULT_PERMISSIONS, 
  PLAN_DEFAULT_MODULES, 
  SAAS_PLAN_CODES, 
  SaasPlanCode, 
  SYSTEM_MODULES,
  SYSTEM_ROLES,
  SYSTEM_PERMISSIONS,
  ROLE_PRESET_PERMISSIONS
} from '@/constants/domain-constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getModuleIcon = (mod: string) => {
  switch (mod) {
    case 'POS': return ShoppingCart;
    case 'SALES': return FileText;
    case 'INVENTORY_PURCHASES': return ShoppingBag;
    case 'INVENTORY': return Package;
    case 'BANKS': return Landmark;
    case 'PAYROLL': return Users;
    case 'REPORTS': return BarChart3;
    case 'SETTINGS': return Settings;
    default: return Shield;
  }
};

interface BranchOption {
  id: string;
  name: string;
  code: string;
  is_main?: boolean;
  default_warehouse_id?: string | null;
  default_warehouse?: {
    id: string;
    name: string;
  } | null;
}

interface UserItem {
  id: string;
  full_name: string;
  username: string;
  email?: string;
  role: string;
  role_id: string | null;
  branch_id?: string | null;
  branch?: BranchOption | null;
  creator_id: string | null;
  allowed_modules: string[] | string;
  allowed_permissions: string[] | string;
  is_active: boolean;
  failed_login_attempts?: number;
  created_at: string;
}

interface RoleItem {
  id: string;
  name: string;
  allowed_permissions: string[] | string;
  is_system: boolean;
}

interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  inConstruction?: boolean;
}

interface ModuleGroup {
  module: string;
  label: string;
  permissions: PermissionDefinition[];
}

const permissionGroups: ModuleGroup[] = [
  {
    module: SYSTEM_MODULES.POS,
    label: '1. Módulo Punto de Venta (POS)',
    permissions: [
      { key: SYSTEM_PERMISSIONS.POS_CREATE, label: 'Caja & Ventas POS', description: 'Permite registrar cobros y emitir tickets en punto de venta' },
      { key: SYSTEM_PERMISSIONS.POS_DISCOUNT, label: 'Aplicar Descuentos en Ventas', description: 'Permite autorizar y aplicar porcentajes de descuento en caja' },
      { key: SYSTEM_PERMISSIONS.POS_REFUND, label: 'Anulaciones y Devoluciones', description: 'Permite anular ventas y emitir devoluciones de mercancía' },
      { key: SYSTEM_PERMISSIONS.POS_SHIFTS, label: 'Turnos y Arqueos', description: 'Permite aperturar, cerrar y auditar turnos de caja' },
      { key: SYSTEM_PERMISSIONS.SALES_INVOICING, label: 'Facturación Fiscal', description: 'Permite generar facturas fiscales SENIAT' },
      { key: SYSTEM_PERMISSIONS.CLIENTS_MANAGE, label: 'Directorio de Clientes', description: 'Permite registrar y consultar clientes' },
    ],
  },
  {
    module: SYSTEM_MODULES.SALES,
    label: '2. Módulo Ventas & Documentos',
    permissions: [
      { key: SYSTEM_PERMISSIONS.SALES_QUOTATIONS, label: 'Cotizaciones', description: 'Permite emitir y gestionar presupuestos comerciales' },
      { key: SYSTEM_PERMISSIONS.SALES_ORDERS, label: 'Notas de Pedido', description: 'Permite procesar pedidos antes de su despacho' },
      { key: SYSTEM_PERMISSIONS.SALES_DELIVERIES, label: 'Notas de Entrega', description: 'Permite generar guías y notas de entrega' },
    ],
  },
  {
    module: SYSTEM_MODULES.INVENTORY_PURCHASES,
    label: '3. Módulo Compras & Proveedores',
    permissions: [
      { key: SYSTEM_PERMISSIONS.PURCHASES_NEW, label: 'Compra Directa', description: 'Permite cargar compras directas al inventario' },
      { key: SYSTEM_PERMISSIONS.PURCHASES_ORDERS, label: 'Órdenes de Compra', description: 'Permite generar órdenes formales a proveedores' },
      { key: SYSTEM_PERMISSIONS.PURCHASES_RECEPTIONS, label: 'Recepciones de Almacén', description: 'Permite registrar entradas físicas de mercancía' },
      { key: SYSTEM_PERMISSIONS.PURCHASES_INVOICES, label: 'Facturas de Compra', description: 'Permite validar facturas de compras de proveedores' },
      { key: SYSTEM_PERMISSIONS.PROVIDERS_MANAGE, label: 'Directorio de Proveedores', description: 'Permite crear y editar proveedores' },
    ],
  },
  {
    module: SYSTEM_MODULES.INVENTORY,
    label: '4. Módulo Control de Inventario',
    permissions: [
      { key: SYSTEM_PERMISSIONS.INVENTORY_CREATE, label: 'Crear Productos', description: 'Permite registrar nuevos ítems en el catálogo' },
      { key: SYSTEM_PERMISSIONS.INVENTORY_STOCK, label: 'Existencias & Stock', description: 'Permite consultar existencias en tiempo real' },
      { key: SYSTEM_PERMISSIONS.INVENTORY_WAREHOUSE, label: 'Almacenes y Sucursales', description: 'Permite gestionar múltiples depósitos' },
      { key: SYSTEM_PERMISSIONS.INVENTORY_CATEGORIES, label: 'Categorías de Producto', description: 'Permite organizar líneas y familias' },
      { key: SYSTEM_PERMISSIONS.INVENTORY_MOVES, label: 'Movimientos Kardex', description: 'Permite auditar el historial de entradas y salidas' },
      { key: SYSTEM_PERMISSIONS.INVENTORY_BULK_PRICES, label: 'Ajuste Masivo de Precios', description: 'Permite actualizar precios por lote' },
      { key: SYSTEM_PERMISSIONS.INVENTORY_VALUATION, label: 'Reportes de Valuación', description: 'Permite calcular el valor total del inventario' },
    ],
  },
  {
    module: SYSTEM_MODULES.BANKS,
    label: '5. Módulo Cuentas y Finanzas',
    permissions: [
      { key: SYSTEM_PERMISSIONS.BANKS_ACCOUNTS, label: 'Cuentas Bancarias', description: 'Permite gestionar cuentas bancarias y conciliar saldos' },
      { key: SYSTEM_PERMISSIONS.BANKS_LEDGER, label: 'Libro Mayor', description: 'Permite auditar movimientos y libro mayor contable' },
      { key: SYSTEM_PERMISSIONS.BANKS_SHIFTS, label: 'Cierres de Caja & Arqueos', description: 'Permite supervisar y auditar cierres de turnos en cajas' },
      { key: SYSTEM_PERMISSIONS.ACCOUNTS_RECEIVABLES, label: 'Cuentas por Cobrar (CxC)', description: 'Permite gestionar créditos y cobranzas a clientes' },
      { key: SYSTEM_PERMISSIONS.ACCOUNTS_PAYABLES, label: 'Cuentas por Pagar (CxP)', description: 'Permite controlar deudas y pagos a proveedores' },
      { key: SYSTEM_PERMISSIONS.ACCOUNTS_HISTORY, label: 'Historial Financiero', description: 'Permite auditar movimientos y libros auxiliares', inConstruction: true },
    ],
  },
  {
    module: SYSTEM_MODULES.PAYROLL,
    label: '6. Módulo Nómina & RRHH',
    permissions: [
      { key: SYSTEM_PERMISSIONS.PAYROLL_MANAGE, label: 'Procesamiento de Nómina', description: 'Permite calcular recibos y asignaciones salariales', inConstruction: true },
      { key: SYSTEM_PERMISSIONS.PAYROLL_FORMULAS, label: 'Fórmulas Legales de Nómina', description: 'Permite personalizar fórmulas de cálculo laboral', inConstruction: true },
    ],
  },
  {
    module: SYSTEM_MODULES.REPORTS,
    label: '7. Módulo Reportes & BI',
    permissions: [
      { key: SYSTEM_PERMISSIONS.REPORTS_VIEW, label: 'Métricas y Tableros BI', description: 'Permite acceder a estadísticas y reportes ejecutivos', inConstruction: true },
    ],
  },
  {
    module: SYSTEM_MODULES.SETTINGS,
    label: '8. Módulo Configuración de Empresa',
    permissions: [
      { key: SYSTEM_PERMISSIONS.COMPANY_MANAGE, label: 'Perfil de Empresa', description: 'Permite editar datos de la empresa y monedas' },
      { key: SYSTEM_PERMISSIONS.BRANCHES_MANAGE, label: 'Sucursales & Tiendas', description: 'Permite administrar depósitos y tiendas físicas' },
      { key: SYSTEM_PERMISSIONS.FISCAL_MANAGE, label: 'Parámetros Fiscales', description: 'Permite configurar correlativos e impresoras fiscales' },
      { key: SYSTEM_PERMISSIONS.USERS_MANAGE, label: 'Gestión de Usuarios', description: 'Permite registrar personal y administrar roles' },
      { key: SYSTEM_PERMISSIONS.SETTINGS_SECURITY, label: 'Seguridad del Sistema', description: 'Permite gestionar políticas de autenticación y seguridad', inConstruction: true },
    ],
  },
];

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modals states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Custom Role Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<'create' | 'edit'>('create');
  const [roleEditingId, setRoleEditingId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [activeRolePreset, setActiveRolePreset] = useState<'SELLER' | 'SUPERVISOR' | 'MANAGER' | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleFormError, setRoleFormError] = useState<string | null>(null);

  // Role Deletion states
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [deleteRoleError, setDeleteRoleError] = useState<string | null>(null);

  // Deactivation Modal states (Transition feature)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<UserItem | null>(null);
  const [deactivateOption, setDeactivateOption] = useState<'cascade' | 'transfer'>('cascade');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('CASHIER');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string>('');
  const [showCustomPermissions, setShowCustomPermissions] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Quota and Subscription state
  const [maxUsers, setMaxUsers] = useState<number>(2);
  const [currentPlanName, setCurrentPlanName] = useState<string>('Emprendedor');
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  // Tenant / Company Info & Employee Access Link state
  const [companyTaxId, setCompanyTaxId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{
    fullName: string;
    username: string;
    role: string;
    tempPassword?: string;
  } | null>(null);

  // Fetch team users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener la lista de usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/roles');
      setRoles(response.data);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/settings/branches');
      setBranches(response.data || []);
    } catch (err: any) {
      console.error('Error fetching branches:', err);
    }
  };

  // Subscription plan code state
  const [currentPlanCode, setCurrentPlanCode] = useState<SaasPlanCode>(SAAS_PLAN_CODES.EMPRENDEDOR);

  // Fetch subscription quota limits
  const fetchSubscriptionStatus = async () => {
    try {
      const res = await apiClient.get('/subscription/my-status');
      if (res.data?.current_plan) {
        if (res.data.current_plan.max_users) setMaxUsers(Number(res.data.current_plan.max_users));
        if (res.data.current_plan.name) setCurrentPlanName(res.data.current_plan.name);
        if (res.data.current_plan.code) setCurrentPlanCode(res.data.current_plan.code);
      }
    } catch (err) {
      console.warn('Could not fetch subscription plan quota:', err);
    }
  };

  // Fetch tenant profile (RIF and company name)
  const fetchTenantProfile = async () => {
    try {
      const res = await apiClient.get('/tenant/profile');
      if (res.data) {
        if (res.data.tax_id) setCompanyTaxId(res.data.tax_id);
        if (res.data.company_name) setCompanyName(res.data.company_name);
      }
    } catch (err) {
      console.warn('Could not fetch tenant profile:', err);
    }
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchBranches();
    fetchSubscriptionStatus();
    fetchTenantProfile();
  }, []);

  // Compute allowed modules and permissions strictly from currentUser session & SaaS Plan
  const planDefaultModules = PLAN_DEFAULT_MODULES[currentPlanCode] || PLAN_DEFAULT_MODULES[SAAS_PLAN_CODES.EMPRENDEDOR];
  const planDefaultPermissions = PLAN_DEFAULT_PERMISSIONS[currentPlanCode] || PLAN_DEFAULT_PERMISSIONS[SAAS_PLAN_CODES.EMPRENDEDOR];

  const allowedModules = currentUser?.enabled_modules && currentUser.enabled_modules.length > 0
    ? currentUser.enabled_modules
    : planDefaultModules;

  const allowedPermissions = currentUser?.permissions && currentUser.permissions.length > 0
    ? currentUser.permissions
    : planDefaultPermissions;

  const hasPermissionToDelegate = (perm: string) => {
    if (currentUser?.role === SYSTEM_ROLES.OWNER || currentUser?.role === SYSTEM_ROLES.SUPER_ADMIN) {
      return true;
    }
    return allowedPermissions.includes(perm);
  };

  const getModulesForPermissions = (perms: string[]): string[] => {
    const modulesSet = new Set<string>();
    perms.forEach(permKey => {
      const group = permissionGroups.find(g => g.permissions.some(p => p.key === permKey));
      if (group) {
        modulesSet.add(group.module);
      }
    });
    return Array.from(modulesSet);
  };

  // Helper to open create modal
  const handleOpenCreate = () => {
    // Validar cuota máxima de usuarios permitida por el plan
    if (users.length >= maxUsers) {
      setIsQuotaModalOpen(true);
      return;
    }

    fetchBranches();
    setModalMode('create');
    setSelectedUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setBranchId(branches[0]?.id || '');
    setShowCustomPermissions(false);
    
    // Pick the first role from roles list if available, or fallback to CASHIER
    const defaultRole = roles.find(r => r.name === 'CASHIER') || roles[0];
    if (defaultRole) {
      setRole(defaultRole.name);
      setRoleId(defaultRole.id);
      const perms = typeof defaultRole.allowed_permissions === 'string'
        ? (defaultRole.allowed_permissions as string).split(',').filter(Boolean)
        : Array.isArray(defaultRole.allowed_permissions)
          ? defaultRole.allowed_permissions
          : [];
      setSelectedPermissions(perms);
      setSelectedModules(getModulesForPermissions(perms));
    } else {
      setRole('CASHIER');
      setRoleId(null);
      applyPresetTemplate('SELLER');
    }
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Helper to open edit modal
  const handleOpenEdit = (user: UserItem) => {
    fetchBranches();
    setModalMode('edit');
    setSelectedUser(user);
    setFullName(user.full_name);
    setUsername(user.username || '');
    setEmail(user.email || '');
    setPassword('');
    setRole(user.role);
    setRoleId(user.role_id);
    setBranchId(user.branch_id || '');
    setShowCustomPermissions(false);
    
    // Parse allowed_modules array
    const mods = typeof user.allowed_modules === 'string'
      ? (user.allowed_modules as string).split(',').filter(Boolean)
      : Array.isArray(user.allowed_modules)
        ? user.allowed_modules
        : [];
    setSelectedModules(mods);

    // Parse allowed_permissions array
    const perms = typeof user.allowed_permissions === 'string'
      ? (user.allowed_permissions as string).split(',').filter(Boolean)
      : Array.isArray(user.allowed_permissions)
        ? user.allowed_permissions
        : [];
    setSelectedPermissions(perms);

    setIsActive(user.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Preset Template loader
  const applyPresetTemplate = (type: 'SELLER' | 'SUPERVISOR' | 'MANAGER') => {
    const presetPerms = [...ROLE_PRESET_PERMISSIONS[type]];
    setSelectedPermissions(presetPerms);
    setSelectedModules(getModulesForPermissions(presetPerms));
  };

  // Handle toggling of individual permissions
  const handleTogglePermission = (perm: string, module: string) => {
    setSelectedPermissions(prev => {
      const isSelected = prev.includes(perm);
      const newPerms = isSelected ? prev.filter(p => p !== perm) : [...prev, perm];

      // Auto-enable module if any permission inside it is checked
      if (!isSelected && !selectedModules.includes(module)) {
        setSelectedModules(m => [...m, module]);
      }
      return newPerms;
    });
  };

  // Save user form
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    if (!fullName.trim() || !username.trim()) {
      setFormError('Nombre completo y nombre de usuario son requeridos');
      setIsSaving(false);
      return;
    }

    if (modalMode === 'create' && (!password || password.length < 8)) {
      setFormError('La contraseña debe tener al menos 8 caracteres');
      setIsSaving(false);
      return;
    }

    const payload = {
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      ...(email.trim() ? { email: email.trim().toLowerCase() } : {}),
      role,
      role_id: roleId,
      branch_id: branchId || null,
      allowed_modules: selectedModules,
      allowed_permissions: selectedPermissions,
      ...(password ? { password } : {}),
      ...(modalMode === 'edit' ? { is_active: isActive } : {}),
    };

    try {
      if (modalMode === 'create') {
        await apiClient.post('/users', payload);
        setCreatedUserCredentials({
          fullName: payload.full_name,
          username: payload.username,
          role: payload.role,
          tempPassword: password || undefined,
        });
      } else if (selectedUser) {
        await apiClient.put(`/users/${selectedUser.id}`, payload);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Create Role modal
  const handleOpenCreateRole = () => {
    setRoleModalMode('create');
    setRoleEditingId(null);
    setRoleName('');
    setRolePermissions([]);
    setActiveRolePreset(null);
    setRoleFormError(null);
    setIsRoleModalOpen(true);
  };

  // Open Edit Role modal
  const handleOpenEditRole = (targetRole: RoleItem) => {
    setRoleModalMode('edit');
    setRoleEditingId(targetRole.id);
    setRoleName(targetRole.name);
    const perms = typeof targetRole.allowed_permissions === 'string'
      ? (targetRole.allowed_permissions as string).split(',').filter(Boolean)
      : Array.isArray(targetRole.allowed_permissions)
        ? targetRole.allowed_permissions
        : [];
    setRolePermissions(perms);
    setActiveRolePreset(null);
    setRoleFormError(null);
    setIsRoleModalOpen(true);
  };

  // Save role form (Create or Update)
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleFormError(null);
    setIsSavingRole(true);

    if (!roleName.trim()) {
      setRoleFormError('El nombre del rol es requerido');
      setIsSavingRole(false);
      return;
    }

    const payload = {
      name: roleName.trim(),
      allowed_permissions: rolePermissions,
    };

    try {
      if (roleModalMode === 'edit' && roleEditingId) {
        await apiClient.put(`/roles/${roleEditingId}`, payload);
      } else {
        const response = await apiClient.post('/roles', payload);
        const newRoleItem = response.data;

        // Auto-seleccionar el nuevo rol en el formulario del usuario
        if (newRoleItem) {
          setRole(newRoleItem.name);
          setRoleId(newRoleItem.id);
          const perms = typeof newRoleItem.allowed_permissions === 'string'
            ? (newRoleItem.allowed_permissions as string).split(',').filter(Boolean)
            : Array.isArray(newRoleItem.allowed_permissions)
              ? newRoleItem.allowed_permissions
              : [];
          setSelectedPermissions(perms);
          setSelectedModules(getModulesForPermissions(perms));
        }
      }

      setIsRoleModalOpen(false);
      setRoleName('');
      setRolePermissions([]);
      setRoleEditingId(null);
      await fetchRoles();
    } catch (err: any) {
      setRoleFormError(err.response?.data?.message || 'Error al guardar el rol');
    } finally {
      setIsSavingRole(false);
    }
  };

  // Open Delete Role modal
  const handleOpenDeleteRole = (targetRole: RoleItem) => {
    setRoleToDelete(targetRole);
    setDeleteRoleError(null);
    setIsDeleteRoleModalOpen(true);
  };

  // Confirm delete role
  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeletingRole(true);
    setDeleteRoleError(null);

    try {
      await apiClient.delete(`/roles/${roleToDelete.id}`);
      setIsDeleteRoleModalOpen(false);
      setRoleToDelete(null);
      await fetchRoles();
    } catch (err: any) {
      setDeleteRoleError(err.response?.data?.message || 'Error al eliminar el rol');
    } finally {
      setIsDeletingRole(false);
    }
  };

  // Deactivate handler
  const handleToggleStatusClick = (user: UserItem) => {
    const directSubordinatesCount = users.filter(u => u.creator_id === user.id).length;

    if (user.is_active && directSubordinatesCount > 0) {
      setDeactivateTarget(user);
      setDeactivateOption('cascade');
      setTransferTargetId('');
      setIsDeactivateModalOpen(true);
    } else {
      executeToggleStatus(user.id, !user.is_active);
    }
  };

  const executeToggleStatus = async (userId: string, is_active: boolean, transferToId?: string) => {
    try {
      await apiClient.patch(`/users/${userId}/status`, { 
        is_active, 
        transfer_subordinates_to_id: transferToId || undefined 
      });
      setIsDeactivateModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar el estado del usuario');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    
    if (deactivateOption === 'transfer' && !transferTargetId) {
      alert('Debes seleccionar un supervisor de destino para transferir el equipo.');
      setIsDeactivating(false);
      return;
    }

    await executeToggleStatus(
      deactivateTarget.id, 
      false, 
      deactivateOption === 'transfer' ? transferTargetId : undefined
    );
    setIsDeactivating(false);
  };

  const getCreatorLabel = (creatorId: string | null) => {
    if (!creatorId) return 'Sistema / OWNER';
    if (creatorId === currentUser?.id) return 'Tú';
    const creatorUser = users.find(u => u.id === creatorId);
    return creatorUser ? creatorUser.full_name : 'Otro Manager';
  };

  const availableSupervisors = users.filter(
    u => 
      u.is_active && 
      (u.role === SYSTEM_ROLES.OWNER || u.role === SYSTEM_ROLES.MANAGER) && 
      u.id !== deactivateTarget?.id
  );

  const filteredUsers = users.filter(
    u =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section (Aesthetics Rule 2) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200 ease-in-out">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Gestión de Usuarios y Roles</h1>
              {currentUser?.role === SYSTEM_ROLES.OWNER && (
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  users.length >= maxUsers 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {users.length}/{maxUsers} Usuarios ({currentPlanName})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Registra personal, personaliza roles jerárquicos y delimita permisos granulares de control.</p>
          </div>
        </div>
        
        {(currentUser?.role === SYSTEM_ROLES.OWNER || currentUser?.role === SYSTEM_ROLES.MANAGER) && (
          <div className="flex gap-2">
            {activeTab === 'roles' ? (
              <button
                onClick={handleOpenCreateRole}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 ease-in-out cursor-pointer text-sm shadow-sm hover:shadow hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Registrar Rol
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 ease-in-out cursor-pointer text-sm shadow-sm hover:shadow hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Registrar Usuario
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quota Limit Reached Modal (STORY-UM-04) */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Límite de Usuarios Alcanzado
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Has alcanzado el límite máximo de <strong>{maxUsers} usuarios permitidos</strong> en tu <strong>Plan {currentPlanName}</strong> ({users.length}/{maxUsers} utilizados).
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Para registrar nuevos miembros en tu equipo de trabajo o ampliar los accesos de tu empresa, por favor actualiza tu suscripción.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Entendido / Cerrar
                </button>
                <a
                  href="/settings/subscription"
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl text-xs hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-200 cursor-pointer"
                >
                  <span>💳 Ver Planes & Actualizar ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-xs gap-1 border">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "flex-1 sm:flex-initial py-2.5 px-6 font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-200 ease-in-out cursor-pointer",
            activeTab === 'users'
              ? "bg-indigo-50 text-indigo-700 border-indigo-100 border"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          )}
        >
          Personal / Usuarios
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={cn(
            "flex-1 sm:flex-initial py-2.5 px-6 font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-200 ease-in-out cursor-pointer",
            activeTab === 'roles'
              ? "bg-indigo-50 text-indigo-700 border-indigo-100 border"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          )}
        >
          Roles Personalizados
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Employee Direct Connection Banner (Sally Enterprise UX Standard) */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs transition-all">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 max-w-xl">
                <div className="p-2.5 bg-white border border-indigo-200/80 rounded-xl text-indigo-600 shadow-2xs shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">Acceso de Empleados y Colaboradores</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                      Portal Empleados
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Comparte el <strong>RIF</strong> de tu empresa o el <strong>enlace directo de conexión</strong> con tus vendedores y administradores para que inicien sesión con su usuario y contraseña sin requerir correo electrónico.
                  </p>
                </div>
              </div>

              {/* RIF & Direct URL Action Cards */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                {/* RIF Badge & Copy */}
                <div className="flex-1 sm:flex-initial flex items-center justify-between gap-2.5 bg-white border border-slate-200/90 px-3.5 py-2 rounded-xl shadow-2xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RIF Empresa</span>
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {companyTaxId || 'J-00000000-0'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(companyTaxId, 'banner-rif')}
                    disabled={!companyTaxId}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title="Copiar RIF"
                  >
                    {copiedField === 'banner-rif' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Direct Link & Copy */}
                <div className="flex-1 sm:flex-initial flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const link = typeof window !== 'undefined'
                        ? `${window.location.origin}/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`
                        : `/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`;
                      copyToClipboard(link, 'banner-link');
                    }}
                    disabled={!companyTaxId}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    title="Copiar enlace directo de inicio de sesión para empleados"
                  >
                    {copiedField === 'banner-link' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>¡Enlace Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Enlace de Conexión</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white border border-slate-200/90 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-2xs"
                    title="Abrir vista previa del portal de empleados"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 transition-all duration-200 ease-in-out">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o rol..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 ease-in-out outline-none text-slate-800 placeholder-slate-400 border focus:shadow-sm"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200 ease-in-out">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                Cargando equipo de trabajo...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 bg-red-50/50 border-b border-slate-100">
                {error}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No se encontraron usuarios registrados en tu equipo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Rol</th>
                      <th className="px-6 py-4">Sede / Almacén</th>
                      <th className="px-6 py-4">Permisos Clave</th>
                      <th className="px-6 py-4">Jerarquía / Creador</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(u => {
                      const userPerms = typeof u.allowed_permissions === 'string'
                        ? (u.allowed_permissions as string).split(',').filter(Boolean)
                        : Array.isArray(u.allowed_permissions)
                          ? u.allowed_permissions
                          : [];

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-all duration-200 ease-in-out group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors duration-150">{u.full_name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  @{u.username || 'usuario'}
                                </span>
                                {u.email && (
                                  <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{u.email}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-xs font-bold px-2.5 py-0.5 rounded border uppercase",
                              u.role === SYSTEM_ROLES.OWNER && "bg-blue-50 text-blue-700 border-blue-100",
                              u.role === SYSTEM_ROLES.MANAGER && "bg-emerald-50 text-emerald-700 border-emerald-100",
                              u.role !== SYSTEM_ROLES.OWNER && u.role !== SYSTEM_ROLES.MANAGER && "bg-slate-50 text-slate-700 border-slate-200"
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold">
                            {u.branch ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-100 w-fit">
                                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>{u.branch.name}</span>
                                </div>
                                {u.branch.default_warehouse?.name && (
                                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 pl-1">
                                    <Package className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>Almacén: <strong className="text-slate-700 font-semibold">{u.branch.default_warehouse.name}</strong></span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Acceso Global</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[320px]">
                              {u.role === SYSTEM_ROLES.OWNER ? (
                                <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                                  Todos los permisos (Acceso Total)
                                </span>
                              ) : userPerms.length === 0 ? (
                                <span className="text-slate-400 text-xs italic">Ninguno asignado</span>
                              ) : (
                                userPerms.map(p => (
                                  <span
                                    key={p}
                                    className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded transition-transform hover:scale-105"
                                  >
                                    {p}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 font-mono">
                            <div className="flex flex-col">
                              <span>{getCreatorLabel(u.creator_id)}</span>
                              {u.creator_id && (
                                <span className="text-[10px] text-slate-400">ID: {u.creator_id.substring(0, 8)}...</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  if (u.role === SYSTEM_ROLES.OWNER || u.id === currentUser?.id) return;
                                  handleToggleStatusClick(u);
                                }}
                                disabled={u.role === SYSTEM_ROLES.OWNER || u.id === currentUser?.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 ease-in-out ${
                                  u.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                } ${
                                  u.role !== SYSTEM_ROLES.OWNER && u.id !== currentUser?.id
                                    ? 'cursor-pointer hover:opacity-85 hover:shadow-xs'
                                    : 'cursor-not-allowed opacity-90'
                                }`}
                              >
                                {u.is_active ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 animate-pulse" /> Activo
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3" /> Inactivo
                                  </>
                                )}
                              </button>
                              {!u.is_active && (u.failed_login_attempts ?? 0) >= 3 && (
                                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                                  Bloqueado (3 intentos)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200 ease-in-out cursor-pointer inline-flex items-center hover:scale-105"
                              title="Editar usuario"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Roles Management Table */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200 ease-in-out">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Nombre del Rol</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Permisos Asociados</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roles.map(r => {
                  const rolePerms = typeof r.allowed_permissions === 'string'
                    ? (r.allowed_permissions as string).split(',').filter(Boolean)
                    : Array.isArray(r.allowed_permissions)
                      ? r.allowed_permissions
                      : [];

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-all duration-200 ease-in-out group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors duration-150">
                          {r.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          r.is_system
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {r.is_system ? 'Predeterminado' : 'Personalizado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xl">
                          {r.name === SYSTEM_ROLES.OWNER ? (
                            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                              Todos los permisos (Acceso Total)
                            </span>
                          ) : rolePerms.length === 0 ? (
                            <span className="text-slate-400 text-xs italic">Sin permisos definidos</span>
                          ) : (
                            rolePerms.map(p => (
                              <span
                                key={p}
                                className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded transition-transform hover:scale-105"
                              >
                                {p}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!r.is_system ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditRole(r)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                              title="Editar rol y permisos"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteRole(r)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 cursor-pointer"
                              title="Eliminar rol"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Solo lectura</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal (Sally Enterprise UX Standard) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {modalMode === 'create' ? 'Registrar Nuevo Usuario' : 'Editar Usuario y Permisos'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Seguridad de Acceso • Asignación de Roles y Permisos Granulares
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveUser} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Grid 1: Datos Principales de Identidad (2 Columnas Simétricas) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Nombre Completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="ej. Juan Pérez"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-2xs h-10.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Usuario (Login) <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-indigo-600 font-semibold lowercase">minúsculas / sin espacios</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase())}
                      placeholder="ej. juanperez"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium font-mono shadow-2xs h-10.5"
                    />
                    {companyTaxId && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                        <span>Iniciar sesión con RIF:</span>
                        <strong className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">{companyTaxId}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Grid 2: Correo y Contraseña (2 Columnas Simétricas) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Correo Electrónico</span>
                      <span className="text-[10px] text-slate-400 font-normal lowercase">(opcional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ej. juan@empresa.com"
                      className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-2xs h-10.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Contraseña de Acceso</span>
                      {modalMode === 'edit' ? (
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(en blanco para no cambiar)</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(mín. 8 caracteres)</span>
                      )}
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required={modalMode === 'create'}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-2xs h-10.5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid 3: Rol Jerárquico y Sucursal Asignada (2 Columnas Simétricas) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Role selection dropdown with inline [+ Nuevo Rol] button */}
                  {!(modalMode === 'edit' && selectedUser?.id === currentUser?.id) && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Rol Jerárquico Asignado
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setRoleName('');
                            setRolePermissions([]);
                            setActiveRolePreset(null);
                            setRoleFormError(null);
                            setIsRoleModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nuevo Rol</span>
                        </button>
                      </div>
                      <select
                        value={roleId ? roleId : role}
                        onChange={e => {
                          const selectedVal = e.target.value;
                          // Check if it's a custom or database role by ID or by name
                          const foundCustomRole = roles.find(r => r.id === selectedVal || r.name === selectedVal);
                          if (foundCustomRole) {
                            setRole(foundCustomRole.name);
                            setRoleId(foundCustomRole.id);
                            const perms = typeof foundCustomRole.allowed_permissions === 'string'
                              ? (foundCustomRole.allowed_permissions as string).split(',').filter(Boolean)
                              : Array.isArray(foundCustomRole.allowed_permissions)
                                ? foundCustomRole.allowed_permissions
                                : [];
                            setSelectedPermissions(perms);
                            setSelectedModules(getModulesForPermissions(perms));
                          } else if (selectedVal === SYSTEM_ROLES.CASHIER) {
                            setRole(SYSTEM_ROLES.CASHIER);
                            setRoleId(null);
                            applyPresetTemplate('SELLER');
                          } else if (selectedVal === SYSTEM_ROLES.SUPERVISOR) {
                            setRole(SYSTEM_ROLES.SUPERVISOR);
                            setRoleId(null);
                            applyPresetTemplate('SUPERVISOR');
                          } else if (selectedVal === SYSTEM_ROLES.MANAGER) {
                            setRole(SYSTEM_ROLES.MANAGER);
                            setRoleId(null);
                            applyPresetTemplate('MANAGER');
                          } else {
                            setRole(selectedVal);
                            setRoleId(null);
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold"
                      >
                        <optgroup label="Perfiles Estándar del Sistema">
                          <option value={SYSTEM_ROLES.CASHIER}>Vendedor / Cajero (POS y Facturación)</option>
                          <option value={SYSTEM_ROLES.SUPERVISOR}>Supervisor (Ventas, Inventario y Reportes)</option>
                          <option value={SYSTEM_ROLES.MANAGER}>Gerente / Administrador (Acceso Operativo Total)</option>
                        </optgroup>
                        {roles.filter(r => ![SYSTEM_ROLES.OWNER, SYSTEM_ROLES.CASHIER, SYSTEM_ROLES.SUPERVISOR, SYSTEM_ROLES.MANAGER].includes(r.name as any)).length > 0 && (
                          <optgroup label="Roles Personalizados">
                            {roles
                              .filter(r => ![SYSTEM_ROLES.OWNER, SYSTEM_ROLES.CASHIER, SYSTEM_ROLES.SUPERVISOR, SYSTEM_ROLES.MANAGER].includes(r.name as any))
                              .map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.name} (Personalizado)
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}
                  {/* Sucursal Asignada (STORY-18.2) */}
                  {!(modalMode === 'edit' && selectedUser?.id === currentUser?.id) && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Sucursal / Sede Asignada</span>
                        </label>
                      </div>
                      <select
                        value={branchId}
                        onChange={e => setBranchId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold shadow-2xs h-10.5"
                      >
                        <option value="">-- Sin Sucursal Asignada (Acceso Central) --</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>
                            📦 {b.default_warehouse?.name || b.name} — ({b.name}{b.is_main ? ' ★ Sede Principal' : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Permissions Collapsible Trigger & Summary (Option A UX Standard) */}
                {!(modalMode === 'edit' && selectedUser?.id === currentUser?.id) && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">Permisos del Sistema</span>
                            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                              {selectedPermissions.length} asignados
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Cargados automáticamente según el rol seleccionado.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCustomPermissions(prev => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                      >
                        <span>{showCustomPermissions ? 'Ocultar Detalle' : 'Ver Permisos del Rol'}</span>
                        {showCustomPermissions ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    </div>

                    {/* Granular Permissions Collapsible Body */}
                    {showCustomPermissions && (
                      <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar p-1 animate-in fade-in duration-150">
                        <div className="p-3 bg-indigo-50/70 border border-indigo-100/80 rounded-xl text-indigo-900 text-xs">
                          <p className="leading-relaxed">
                            💡 <strong>Gobernanza por Rol:</strong> Los permisos mostrados corresponden fielmente al rol asignado. Para modificar los accesos de este cargo, puedes editar el rol o crear uno nuevo en la sección <strong>Roles Personalizados</strong>.
                          </p>
                        </div>

                        {permissionGroups.map(group => {
                          if (!allowedModules.includes(group.module)) return null;
                          const IconComponent = getModuleIcon(group.module);

                          return (
                            <div key={group.module} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3 shadow-2xs">
                              <h4 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-200 pb-2">
                                <IconComponent className="h-4 w-4 text-indigo-600" />
                                {group.label}
                              </h4>
                              <div className="space-y-2.5">
                                {group.permissions.map(perm => {
                                  const isUnderConstruction = Boolean(perm.inConstruction);
                                  const isAllowedByRole = !isUnderConstruction && selectedPermissions.includes(perm.key);

                                  return (
                                    <div
                                      key={perm.key}
                                      className={`flex items-center justify-between p-3 bg-white rounded-xl border transition-all duration-200 select-none text-xs ${
                                        isUnderConstruction
                                          ? 'opacity-70 bg-amber-50/20 border-amber-200/60'
                                          : isAllowedByRole
                                            ? 'border-indigo-100 bg-indigo-50/15'
                                            : 'border-slate-200/70 opacity-60 bg-slate-50/50'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3 flex-1 pr-4">
                                        <div className="mt-0.5 shrink-0">
                                          {isAllowedByRole ? (
                                            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                          ) : (
                                            <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                              <X className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className={`font-bold block text-xs ${isAllowedByRole ? 'text-slate-900' : 'text-slate-500'}`}>
                                              {perm.label}
                                            </span>
                                            {isUnderConstruction && (
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                                                En Construcción
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">{perm.description}</span>
                                        </div>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                                        isUnderConstruction
                                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                          : isAllowedByRole
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                                      }`}>
                                        {isUnderConstruction ? 'Próximamente' : isAllowedByRole ? 'Incluido en Rol' : 'No Permitido'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Active Toggle (Hidden if self) */}
                {modalMode === 'edit' && selectedUser?.id !== currentUser?.id && (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Estado de la Cuenta</span>
                      <span className="text-xs text-slate-500">Determina si el usuario puede iniciar sesión en el ERP.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                )}
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Creation Modal (Sally Enterprise UX Standard) */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {roleModalMode === 'edit' ? 'Editar Rol Personalizado' : 'Registrar Nuevo Rol Personalizado'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {roleModalMode === 'edit' ? 'Modifica el nombre y la matriz de accesos del rol' : 'Perfil de Seguridad y Matriz de Permisos del Tenant'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {roleFormError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{roleFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nombre del Rol
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                    placeholder="ej. Supervisor General, Cajero Auxiliar, Jefe de Inventario"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                  />
                </div>

                {/* Templates / Presets Buttons inside Role Modal */}
                <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-blue-50/50 p-4 rounded-2xl border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="text-xs">
                    <span className="font-bold text-indigo-950 block">Partir desde una Plantilla</span>
                    <span className="text-indigo-600/80">Carga los permisos recomendados para editar sobre ellos:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRolePermissions([...ROLE_PRESET_PERMISSIONS.SELLER]);
                        setActiveRolePreset('SELLER');
                        if (!roleName) setRoleName('Vendedor / Mostrador');
                      }}
                      className={cn(
                        "px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-2xs active:scale-98 flex items-center gap-1.5 border",
                        activeRolePreset === 'SELLER'
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 scale-102"
                          : "bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-200 hover:shadow-xs"
                      )}
                    >
                      <span>🛍️</span>
                      <span>Vendedor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRolePermissions([...ROLE_PRESET_PERMISSIONS.SUPERVISOR]);
                        setActiveRolePreset('SUPERVISOR');
                        if (!roleName) setRoleName('Supervisor de Tienda');
                      }}
                      className={cn(
                        "px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-2xs active:scale-98 flex items-center gap-1.5 border",
                        activeRolePreset === 'SUPERVISOR'
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300 scale-102"
                          : "bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-200 hover:shadow-xs"
                      )}
                    >
                      <span>👔</span>
                      <span>Supervisor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRolePermissions([...ROLE_PRESET_PERMISSIONS.MANAGER]);
                        setActiveRolePreset('MANAGER');
                        if (!roleName) setRoleName('Gerente Operativo');
                      }}
                      className={cn(
                        "px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-2xs active:scale-98 flex items-center gap-1.5 border",
                        activeRolePreset === 'MANAGER'
                          ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400 scale-102"
                          : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-xs"
                      )}
                    >
                      <span>🏛️</span>
                      <span>Gerente</span>
                    </button>
                  </div>
                </div>

                {/* Roles Permissions Checkboxes */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Definir Permisos del Rol
                    </h3>
                  </div>

                  <div className="space-y-4 max-h-[42vh] overflow-y-auto pr-2 custom-scrollbar">
                    {permissionGroups.map(group => {
                      if (!allowedModules.includes(group.module)) return null;
                      const IconComponent = getModuleIcon(group.module);

                      return (
                        <div key={group.module} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3 shadow-2xs">
                          <h4 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-200 pb-2">
                            <IconComponent className="h-4 w-4 text-indigo-600" />
                            {group.label}
                          </h4>
                          <div className="space-y-2.5">
                            {group.permissions.map(perm => {
                              const isUnderConstruction = Boolean(perm.inConstruction);
                              const canDelegate = !isUnderConstruction && hasPermissionToDelegate(perm.key);
                              const isChecked = !isUnderConstruction && rolePermissions.includes(perm.key);

                              return (
                                <label
                                  key={perm.key}
                                  className={`flex items-center justify-between p-3 bg-white rounded-xl border transition-all duration-200 select-none text-xs ${
                                    isUnderConstruction
                                      ? 'cursor-not-allowed opacity-75 bg-amber-50/20 border-amber-200/60'
                                      : canDelegate 
                                        ? 'cursor-pointer hover:border-indigo-200 hover:shadow-2xs' 
                                        : 'cursor-not-allowed opacity-50 bg-slate-50'
                                  } ${isChecked ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200/80'}`}
                                >
                                  <div className="flex items-start gap-3 flex-1 pr-4">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isUnderConstruction || !canDelegate}
                                      onChange={() => {
                                        setActiveRolePreset(null);
                                        setRolePermissions(prev =>
                                          prev.includes(perm.key) ? prev.filter(p => p !== perm.key) : [...prev, perm.key]
                                        );
                                      }}
                                      className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-200 focus:ring-indigo-500 shrink-0 mt-0.5"
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 block text-xs">{perm.label}</span>
                                        {isUnderConstruction && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                                            En Construcción
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">{perm.description}</span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                                    isUnderConstruction
                                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                      : isChecked
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}>
                                    {isUnderConstruction ? 'Próximamente' : isChecked ? 'Permitido' : 'Bloqueado'}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSavingRole ? 'Guardando...' : roleModalMode === 'edit' ? 'Guardar Cambios' : 'Registrar Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Modal (Sally Enterprise UX Standard) */}
      {isDeleteRoleModalOpen && roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-rose-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Eliminar Rol Personalizado</h3>
                  <p className="text-xs text-slate-500 font-medium">Validación de seguridad y consistencia</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteRoleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {deleteRoleError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{deleteRoleError}</span>
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente el rol{' '}
                <strong className="text-slate-900 font-bold">"{roleToDelete.name}"</strong>?
              </p>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Regla de integridad:</strong> Si este rol se encuentra asignado a algún usuario, el sistema bloqueará la eliminación para evitar que usuarios queden sin permisos asignados.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setIsDeleteRoleModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingRole}
                onClick={handleConfirmDeleteRole}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-rose-200 text-sm cursor-pointer disabled:opacity-50"
              >
                {isDeletingRole ? 'Eliminando...' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation & Transfer Modal (Sally Enterprise UX Standard) */}
      {isDeactivateModalOpen && deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-rose-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Alerta: Desactivación de Supervisor</h3>
                  <p className="text-xs text-slate-500 font-medium">Reasignación de equipo subordinado</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeactivateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <p className="text-xs text-slate-600 leading-relaxed">
                El usuario <span className="font-bold text-slate-900">{deactivateTarget.full_name}</span> tiene{' '}
                <span className="font-bold text-slate-900">{users.filter(u => u.creator_id === deactivateTarget.id).length}</span>{' '}
                subordinados a su cargo. Selecciona cómo deseas reestructurar el equipo:
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-all shadow-2xs">
                  <input
                    type="radio"
                    name="deactivateOption"
                    checked={deactivateOption === 'cascade'}
                    onChange={() => setDeactivateOption('cascade')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Desactivar en Cascada</span>
                    <span className="text-[10px] text-slate-500 leading-normal block mt-0.5">
                      Desactivará automáticamente todas las cuentas del equipo subordinadas a este usuario.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-all shadow-2xs">
                  <input
                    type="radio"
                    name="deactivateOption"
                    checked={deactivateOption === 'transfer'}
                    onChange={() => setDeactivateOption('transfer')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-800 block">Transferir Subordinados</span>
                    <span className="text-[10px] text-slate-500 leading-normal block mt-0.5">
                      Transfiere los subordinados directos a otro supervisor activo.
                    </span>
                  </div>
                </label>
              </div>

              {deactivateOption === 'transfer' && (
                <div className="animate-in slide-in-from-top-2 duration-150 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Supervisor de Destino (OWNER / MANAGER)
                  </label>
                  <select
                    value={transferTargetId}
                    onChange={e => setTransferTargetId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Selecciona un supervisor...</option>
                    {availableSupervisors.map(superv => (
                      <option key={superv.id} value={superv.id}>
                        {superv.full_name} ({superv.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isDeactivating || (deactivateOption === 'transfer' && !transferTargetId)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-rose-200 cursor-pointer disabled:opacity-50"
              >
                {isDeactivating ? 'Procesando...' : 'Confirmar Desactivación'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Credentials Modal (Sally Enterprise UX Standard) */}
      {createdUserCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 text-white rounded-xl p-2.5 shadow-md shadow-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    ¡Usuario Creado Exitosamente!
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Credenciales de acceso para el colaborador
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedUserCredentials(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                El usuario ha sido registrado en el sistema. Puedes copiar los datos de acceso o el enlace directo para compartirlos con el usuario:
              </p>

              {/* Data Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 font-medium text-xs">
                {/* RIF */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">RIF Empresa:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                      {companyTaxId || 'J-00000000-0'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(companyTaxId, 'success-rif')}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Copiar RIF"
                    >
                      {copiedField === 'success-rif' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Usuario:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      @{createdUserCredentials.username}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdUserCredentials.username, 'success-user')}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Copiar Usuario"
                    >
                      {copiedField === 'success-user' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password if provided */}
                {createdUserCredentials.tempPassword && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Contraseña:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                        {createdUserCredentials.tempPassword}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(createdUserCredentials.tempPassword || '', 'success-pass')}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Copiar Contraseña"
                      >
                        {copiedField === 'success-pass' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Direct Link */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Enlace de Inicio de Sesión:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined'
                        ? `${window.location.origin}/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`
                        : `/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const link = typeof window !== 'undefined'
                          ? `${window.location.origin}/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`
                          : `/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`;
                        copyToClipboard(link, 'success-link');
                      }}
                      className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer shrink-0"
                      title="Copiar Enlace"
                    >
                      {copiedField === 'success-link' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const link = typeof window !== 'undefined'
                    ? `${window.location.origin}/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`
                    : `/login?rif=${encodeURIComponent(companyTaxId || '')}&mode=employee`;
                  const allInfo = `*Acceso al Sistema ERP*\nEmpresa: ${companyName || 'Empresa'}\nRIF: ${companyTaxId}\nUsuario: ${createdUserCredentials.username}\n${createdUserCredentials.tempPassword ? `Contraseña: ${createdUserCredentials.tempPassword}\n` : ''}Enlace: ${link}`;
                  copyToClipboard(allInfo, 'copy-all');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                {copiedField === 'copy-all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>¡Copiado Todo!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Todo el Mensaje</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCreatedUserCredentials(null)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl text-xs hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-200 cursor-pointer"
              >
                Listo / Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
