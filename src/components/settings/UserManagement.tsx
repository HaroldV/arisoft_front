'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Shield, CheckCircle2, XCircle, X, Key, AlertTriangle, AlertCircle, Percent, 
  ShoppingCart, Package, Landmark, Settings, UserPlus 
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getModuleIcon = (mod: string) => {
  switch (mod) {
    case 'POS': return ShoppingCart;
    case 'INVENTORY': return Package;
    case 'BANKS': return Landmark;
    case 'SETTINGS': return Settings;
    default: return Shield;
  }
};

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
  role_id: string | null;
  creator_id: string | null;
  allowed_modules: string[] | string;
  allowed_permissions: string[] | string;
  is_active: boolean;
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
}

interface ModuleGroup {
  module: string;
  label: string;
  permissions: PermissionDefinition[];
}

const permissionGroups: ModuleGroup[] = [
  {
    module: 'POS',
    label: 'Punto de Venta (POS / Ventas)',
    permissions: [
      { key: 'pos:create', label: 'Registrar Ventas', description: 'Permite abrir el POS y registrar transacciones' },
      { key: 'pos:discount', label: 'Aplicar Descuentos', description: 'Permite modificar precios o aplicar descuentos manuales' },
      { key: 'pos:refund', label: 'Emitir Devoluciones', description: 'Permite generar notas de crédito y reembolsos' },
      { key: 'clients:manage', label: 'Gestionar Clientes', description: 'Permite crear y editar el catálogo de clientes' },
    ],
  },
  {
    module: 'INVENTORY',
    label: 'Inventario y Compras',
    permissions: [
      { key: 'inventory:view', label: 'Visualizar Inventario', description: 'Permite ver existencias y stock' },
      { key: 'inventory:write', label: 'Modificar Productos', description: 'Permite agregar/editar productos, categorías y bodegas' },
      { key: 'inventory:adjust', label: 'Ajustes Manuales', description: 'Permite realizar ingresos/egresos manuales de stock' },
      { key: 'purchases:register', label: 'Registrar Compras', description: 'Permite registrar facturas de compra de proveedores' },
      { key: 'providers:manage', label: 'Gestionar Proveedores', description: 'Permite crear y editar proveedores' },
    ],
  },
  {
    module: 'BANKS',
    label: 'Cuentas y Finanzas',
    permissions: [
      { key: 'banks:view', label: 'Ver Cuentas', description: 'Permite ver saldos y movimientos bancarios' },
      { key: 'banks:write', label: 'Crear/Editar Cuentas', description: 'Permite crear o configurar cuentas bancarias' },
      { key: 'banks:transfer', label: 'Transferencias y Ajustes', description: 'Permite registrar transferencias y ajustes manuales' },
    ],
  },
  {
    module: 'SETTINGS',
    label: 'Administración de Sistema',
    permissions: [
      { key: 'users:manage', label: 'Gestionar Usuarios', description: 'Permite registrar personal y asignar permisos' },
      { key: 'fiscal:manage', label: 'Configuración Fiscal', description: 'Permite ajustar folios y rangos de facturación' },
      { key: 'company:manage', label: 'Perfil de Empresa', description: 'Permite editar los datos de registro de la empresa' },
    ],
  },
];

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modals states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Custom Role Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleFormError, setRoleFormError] = useState<string | null>(null);

  // Deactivation Modal states (Transition feature)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<UserItem | null>(null);
  const [deactivateOption, setDeactivateOption] = useState<'cascade' | 'transfer'>('cascade');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CASHIER');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Filter modules/permissions options based on current user's session
  const allowedModules = currentUser?.enabled_modules || ['POS', 'INVENTORY'];
  const allowedPermissions = currentUser?.permissions || [];

  const hasPermissionToDelegate = (perm: string) => {
    if (currentUser?.role === 'OWNER') return true;
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
    setModalMode('create');
    setSelectedUser(null);
    setFullName('');
    setEmail('');
    setPassword('');
    // Pick the first role from roles list if available, or fallback to CASHIER
    const defaultRole = roles.find(r => r.name === 'CASHIER') || roles[0];
    if (defaultRole) {
      setRole(defaultRole.name);
      setRoleId(defaultRole.id);
    } else {
      setRole('CASHIER');
      setRoleId(null);
    }
    setSelectedModules([]);
    setSelectedPermissions([]);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Helper to open edit modal
  const handleOpenEdit = (user: UserItem) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setRoleId(user.role_id);
    
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
  const applyPresetTemplate = (type: 'CASHIER' | 'MANAGER') => {
    if (type === 'CASHIER') {
      setSelectedModules(['POS', 'INVENTORY']);
      setSelectedPermissions(['pos:create', 'clients:manage', 'inventory:view']);
    } else if (type === 'MANAGER') {
      setSelectedModules(['POS', 'INVENTORY']);
      setSelectedPermissions([
        'pos:create', 'pos:discount', 'pos:refund', 'clients:manage',
        'inventory:view', 'inventory:write', 'inventory:adjust', 'purchases:register', 'providers:manage'
      ].filter(hasPermissionToDelegate));
    }
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

    if (!fullName.trim() || !email.trim()) {
      setFormError('Nombre y correo electrónico son requeridos');
      setIsSaving(false);
      return;
    }

    if (modalMode === 'create' && (!password || password.length < 8)) {
      setFormError('La contraseña debe tener al menos 8 caracteres');
      setIsSaving(false);
      return;
    }

    const payload = {
      full_name: fullName,
      email,
      role,
      role_id: roleId,
      allowed_modules: selectedModules,
      allowed_permissions: selectedPermissions,
      ...(password ? { password } : {}),
      ...(modalMode === 'edit' ? { is_active: isActive } : {}),
    };

    try {
      if (modalMode === 'create') {
        await apiClient.post('/users', payload);
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

  // Save role form
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
      await apiClient.post('/roles', payload);
      setIsRoleModalOpen(false);
      setRoleName('');
      setRolePermissions([]);
      fetchRoles();
    } catch (err: any) {
      setRoleFormError(err.response?.data?.message || 'Error al registrar el rol');
    } finally {
      setIsSavingRole(false);
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
      (u.role === 'OWNER' || u.role === 'MANAGER') && 
      u.id !== deactivateTarget?.id
  );

  const filteredUsers = users.filter(
    u =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Gestión de Usuarios y Roles</h1>
            <p className="text-xs text-slate-500">Registra personal, personaliza roles jerárquicos y delimita permisos granulares de control.</p>
          </div>
        </div>
        
        {(currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER') && (
          <div className="flex gap-2">
            {activeTab === 'roles' ? (
              <button
                onClick={() => {
                  setRoleName('');
                  setRolePermissions([]);
                  setRoleFormError(null);
                  setIsRoleModalOpen(true);
                }}
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
                              <span className="text-xs text-slate-500">{u.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-xs font-bold px-2.5 py-0.5 rounded border uppercase",
                              u.role === 'OWNER' && "bg-blue-50 text-blue-700 border-blue-100",
                              u.role === 'MANAGER' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                              u.role !== 'OWNER' && u.role !== 'MANAGER' && "bg-slate-50 text-slate-700 border-slate-200"
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[320px]">
                              {u.role === 'OWNER' ? (
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
                            <button
                              onClick={() => {
                                if (u.role === 'OWNER' || u.id === currentUser?.id) return;
                                handleToggleStatusClick(u);
                              }}
                              disabled={u.role === 'OWNER' || u.id === currentUser?.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 ease-in-out ${
                                u.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              } ${
                                u.role !== 'OWNER' && u.id !== currentUser?.id
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
                          {r.name === 'OWNER' ? (
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
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
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Basic Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="ej. Juan Pérez"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Correo Electrónico (Login)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ej. juan.perez@ari.com"
                      required
                      disabled={modalMode === 'edit'}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Password & Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                      <span>Contraseña de Acceso</span>
                      {modalMode === 'edit' && (
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(en blanco para no cambiar)</span>
                      )}
                    </label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 caracteres"
                        required={modalMode === 'create'}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Role selection dropdown */}
                  {!(modalMode === 'edit' && selectedUser?.id === currentUser?.id) && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Rol Jerárquico Asignado
                      </label>
                      <select
                        value={role}
                        onChange={e => {
                          const selectedRoleName = e.target.value;
                          setRole(selectedRoleName);
                          const selectedRole = roles.find(r => r.name === selectedRoleName);
                          if (selectedRole) {
                            setRoleId(selectedRole.id);
                            const perms = typeof selectedRole.allowed_permissions === 'string'
                              ? (selectedRole.allowed_permissions as string).split(',').filter(Boolean)
                              : Array.isArray(selectedRole.allowed_permissions)
                                ? selectedRole.allowed_permissions
                                : [];
                            setSelectedPermissions(perms);
                            setSelectedModules(getModulesForPermissions(perms));
                          } else {
                            setRoleId(null);
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold"
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.name}>
                            {r.name} {r.is_system ? '(Sistema)' : '(Personalizado)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Templates / Presets Buttons */}
                {!(modalMode === 'edit' && selectedUser?.id === currentUser?.id) && (
                  <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-blue-50/50 p-4 rounded-2xl border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="text-xs">
                      <span className="font-bold text-indigo-950 block">Sobrescribir con Plantilla Rápida</span>
                      <span className="text-indigo-600/80">Pre-configura los permisos típicos recomendados para este rol.</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => applyPresetTemplate('CASHIER')}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        Perfil Cajero
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetTemplate('MANAGER')}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        Perfil Gerente
                      </button>
                    </div>
                  </div>
                )}

                {/* Granular Permissions Section */}
                {!(modalMode === 'edit' && selectedUser?.id === currentUser?.id) && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Asignación de Permisos Granulares (Anulación Manual)
                      </h3>
                    </div>

                    <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
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
                                const canDelegate = hasPermissionToDelegate(perm.key);
                                const isChecked = selectedPermissions.includes(perm.key);

                                return (
                                  <label
                                    key={perm.key}
                                    className={`flex items-center justify-between p-3 bg-white rounded-xl border transition-all duration-200 select-none text-xs ${
                                      canDelegate 
                                        ? 'cursor-pointer hover:border-indigo-200 hover:shadow-2xs' 
                                        : 'cursor-not-allowed opacity-50 bg-slate-50'
                                    } ${isChecked ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200/80'}`}
                                  >
                                    <div className="flex items-start gap-3 flex-1 pr-4">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={!canDelegate}
                                        onChange={() => handleTogglePermission(perm.key, group.module)}
                                        className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-200 focus:ring-indigo-500 shrink-0 mt-0.5"
                                      />
                                      <div>
                                        <span className="font-bold text-slate-900 block text-xs">{perm.label}</span>
                                        <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">{perm.description}</span>
                                      </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                                      isChecked
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                                    }`}>
                                      {isChecked ? 'Permitido' : 'Bloqueado'}
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
                    Registrar Nuevo Rol Personalizado
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Perfil de Seguridad y Matriz de Permisos del Tenant
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
                              const canDelegate = hasPermissionToDelegate(perm.key);
                              const isChecked = rolePermissions.includes(perm.key);

                              return (
                                <label
                                  key={perm.key}
                                  className={`flex items-center justify-between p-3 bg-white rounded-xl border transition-all duration-200 select-none text-xs ${
                                    canDelegate 
                                      ? 'cursor-pointer hover:border-indigo-200 hover:shadow-2xs' 
                                      : 'cursor-not-allowed opacity-50 bg-slate-50'
                                  } ${isChecked ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200/80'}`}
                                >
                                  <div className="flex items-start gap-3 flex-1 pr-4">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={!canDelegate}
                                      onChange={() => {
                                        setRolePermissions(prev =>
                                          prev.includes(perm.key) ? prev.filter(p => p !== perm.key) : [...prev, perm.key]
                                        );
                                      }}
                                      className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-200 focus:ring-indigo-500 shrink-0 mt-0.5"
                                    />
                                    <div>
                                      <span className="font-bold text-slate-900 block text-xs">{perm.label}</span>
                                      <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">{perm.description}</span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                                    isChecked
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}>
                                    {isChecked ? 'Permitido' : 'Bloqueado'}
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
                  {isSavingRole ? 'Guardando...' : 'Guardar Rol'}
                </button>
              </div>
            </form>
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
    </div>
  );
}
