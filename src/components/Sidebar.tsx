'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  PackageSearch,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
  ShoppingCart,
  Users,
  Landmark,
  History,
  Store,
  Receipt,
  FileText,
  ClipboardList,
  Truck,
  ShoppingBag,
  FileSpreadsheet,
  PlusCircle,
  Package,
  TrendingUp,
  Warehouse,
  Tags,
  ArrowRightLeft,
  Building,
  Wallet,
  Settings,
  BarChart3,
  Crown,
  Clock,
  CreditCard
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/context/AuthContext';

import { SubscriptionBlockedModal } from '@/components/modals/SubscriptionBlockedModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuConfig = [
  {
    title: 'Navegación General',
    items: [
      { label: 'Inicio', icon: LayoutDashboard, href: '/', tenantOnly: true },
      {
        label: 'Ventas',
        icon: ShoppingCart,
        module: 'POS',
        tenantOnly: true,
        children: [
          { label: 'Punto de Venta', icon: Store, href: '/pos', permission: 'pos:create' },
          { label: 'Facturación de Venta', icon: Receipt, href: '/sales', permission: 'sales:invoicing' },
          { label: 'Cotizaciones', icon: FileText, href: '/sales/quotations', permission: 'sales:quotations' },
          { label: 'Notas de Pedido', icon: ClipboardList, href: '/sales/orders', permission: 'sales:orders' },
          { label: 'Notas de Entrega', icon: Truck, href: '/sales/deliveries', permission: 'sales:deliveries' },
          { label: 'Clientes', icon: Users, href: '/sales/clients', permission: 'clients:manage' },
          { label: 'Turnos y Arqueos', icon: Clock, href: '/admin/shifts', roles: ['OWNER', 'MANAGER'], permission: 'pos:shifts' },
        ]
      },
      {
        label: 'Compras',
        icon: Building2,
        module: 'INVENTORY_PURCHASES',
        tenantOnly: true,
        children: [
          { label: 'Órdenes de Compra', icon: FileText, href: '/inventory/purchases/orders', permission: 'purchases:orders' },
          { label: 'Notas de Recepción', icon: Truck, href: '/inventory/purchases/receptions', permission: 'purchases:receptions' },
          { label: 'Compra Directa', icon: ShoppingBag, href: '/inventory/purchases/new', permission: 'purchases:new' },
          { label: 'Listado de Facturas de Compras', icon: FileSpreadsheet, href: '/inventory/purchases', permission: 'purchases:invoices' },
          { label: 'Proveedores', icon: Building2, href: '/inventory/providers', permission: 'providers:manage' },
        ]
      },
      {
        label: 'Control de Inventario',
        icon: PackageSearch,
        module: 'INVENTORY',
        tenantOnly: true,
        children: [
          { label: 'Crear Productos', icon: PlusCircle, href: '/inventory/initial', permission: 'inventory:create' },
          { label: 'Listado de Productos', icon: Package, href: '/inventory/stock', permission: 'inventory:stock' },
          { label: 'Actualizar Precios Masivo', icon: TrendingUp, href: '/inventory/prices/bulk-update', permission: 'inventory:bulk_prices' },
          { label: 'Valuación de Inventario', icon: TrendingUp, href: '/inventory/audit-reports', permission: 'inventory:valuation' },
          { label: 'Almacenes', icon: Warehouse, href: '/inventory/warehouse', permission: 'inventory:warehouse' },
          { label: 'Categorías', icon: Tags, href: '/inventory/categories', permission: 'inventory:categories' },
          { label: 'Movimientos', icon: ArrowRightLeft, href: '/inventory/moves', permission: 'inventory:moves' },
        ]
      },
      {
        label: 'Cuentas',
        icon: Landmark,
        module: 'BANKS',
        tenantOnly: true,
        children: [
          { label: 'Cuentas Bancarias', icon: Building, href: '/accounts/banks', permission: 'banks:accounts' },
          { label: 'Cuentas por Cobrar (CxC)', icon: Wallet, href: '/accounts/receivables', permission: 'accounts:receivables' },
          { label: 'Cuentas por Pagar (CxP)', icon: FileSpreadsheet, href: '/accounts/payables', permission: 'accounts:payables' },
          { label: 'Historial', icon: History, href: '/accounts/history', permission: 'accounts:history' },
        ]
      },
      {
        label: 'Super Admin Backoffice',
        icon: Crown,
        href: '/admin',
        roles: ['SUPER_ADMIN'],
      },
      {
        label: 'Configuración',
        icon: Settings,
        tenantOnly: true,
        children: [
          { label: 'Perfil de Empresa', icon: Building2, href: '/settings/company', roles: ['OWNER', 'MANAGER'], permission: 'company:manage' },
          { label: 'Configuración Fiscal', icon: Receipt, href: '/settings/fiscal', roles: ['OWNER', 'MANAGER'], permission: 'fiscal:manage' },
          { label: 'Usuarios y Roles', icon: Users, href: '/settings/users', roles: ['OWNER', 'MANAGER'], permission: 'users:manage' },
          { label: 'Seguridad', icon: UserCircle, href: '/settings/security', roles: ['OWNER', 'MANAGER', 'CASHIER', 'WAREHOUSE_KEEPER'] },
        ]
      },
      {
        label: 'Nómina & RRHH',
        icon: Users,
        module: 'PAYROLL',
        tenantOnly: true,
        children: [
          { label: 'Procesamiento de Nómina', icon: FileSpreadsheet, href: '/payroll', permission: 'payroll:manage' },
          { label: 'Fórmulas Legales', icon: FileText, href: '/payroll/formulas', permission: 'payroll:manage' },
        ]
      },
      {
        label: 'Reportes & Analítica',
        icon: BarChart3,
        module: 'REPORTS',
        tenantOnly: true,
        children: [
          { label: 'Tablero General', icon: LayoutDashboard, href: '/reports?tab=OVERVIEW', permission: 'reports:view' },
          { label: 'Reporte de Ventas', icon: Receipt, href: '/reports?tab=SALES', permission: 'reports:view' },
          { label: 'Reporte de Compras', icon: ShoppingBag, href: '/reports?tab=PURCHASES', permission: 'reports:view' },
          { label: 'Reporte de Proveedores', icon: Building2, href: '/reports?tab=SUPPLIERS', permission: 'reports:view' },
          { label: 'Reporte de Productos', icon: Package, href: '/reports?tab=PRODUCTS', permission: 'reports:view' },
        ]
      },
      {
        label: 'Planes & Suscripción',
        icon: CreditCard,
        href: '/settings/subscription',
        tenantOnly: true,
        roles: ['OWNER', 'MANAGER'],
      }
    ]
  }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = false, onClose, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedSectionName, setBlockedSectionName] = useState('esta sección');

  const isPlanInactive = user?.role !== 'SUPER_ADMIN' && (user?.plan_is_active === false || user?.tenant_status === 'SUSPENDED');

  const handleRestrictedNavigation = (e: React.MouseEvent, label: string, href?: string) => {
    if (isPlanInactive && href !== '/settings/subscription' && href !== '/settings/security') {
      e.preventDefault();
      setBlockedSectionName(label);
      setIsBlockedModalOpen(true);
    } else if (onClose && typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  useEffect(() => {
    for (const group of menuConfig) {
      for (const item of group.items) {
        if (item.children?.some((child: any) => child.href === pathname)) {
          if (!openMenus.includes(item.label)) {
            setOpenMenus(prev => [...prev, item.label]);
          }
        }
      }
    }
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(i => i !== label)
        : [...prev, label]
    );
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const filteredMenu = (menuConfig as any[]).map(group => {
    const filteredItems = group.items.map((item: any) => {
      // Regla Opción 1: SUPER_ADMIN solo ve los ítems destinados a la plataforma SaaS (sin tenantOnly)
      if (isSuperAdmin && item.tenantOnly) {
        return null;
      }

      // Reglas para usuarios Tenant
      if (!isSuperAdmin) {
        // Super Admin Backoffice es exclusivo de SUPER_ADMIN; NUNCA debe mostrarse a roles de Tenant (incluso OWNER)
        if (item.roles && !item.roles.includes(user?.role)) {
          return null;
        }
        if (item.module && !user?.enabled_modules?.includes(item.module)) {
          return null;
        }
      }

      if (item.children) {
        const filteredChildren = item.children.filter((child: any) => {
          if (isSuperAdmin && child.tenantOnly) {
            return false;
          }
          if (!isSuperAdmin) {
            if (child.module && !user?.enabled_modules?.includes(child.module)) {
              return false;
            }
            if (child.roles && !child.roles.includes(user?.role) && user?.role !== 'OWNER') {
              return false;
            }
            // Si el subelemento exige un permiso específico, debe estar contenido en los permisos asignados a la sesión del usuario (incluso para OWNER)
            if (child.permission && !user?.permissions?.includes(child.permission)) {
              return false;
            }
          }
          return true;
        });
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }

      return item;
    }).filter(Boolean);

    if (filteredItems.length === 0) return null;

    return { ...group, items: filteredItems };
  }).filter(Boolean);

  return (
    <>
      {/* Backdrop oscuro para tablets y móviles */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Botón flotante para ABRIR el sidebar en Desktop/Laptop (Anclado al borde izquierdo) */}
      {!isOpen && onToggle && (
        <button
          onClick={onToggle}
          className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-[#071D33] hover:bg-indigo-600 text-slate-300 hover:text-white border-y border-r border-indigo-900/60 py-3 px-1.5 rounded-r-xl shadow-xl transition-all duration-200 cursor-pointer items-center justify-center group hover:pr-2.5 active:scale-95"
          title="Desplegar menú lateral (Click)"
          aria-label="Abrir barra lateral"
        >
          <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 max-w-[85vw] lg:w-64 bg-[#071D33] text-slate-300 border-r border-[#0B2C4D]/80 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Pestaña flotante ejecutiva para CERRAR el sidebar en Desktop/Laptop */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 bg-[#071D33] hover:bg-indigo-600 text-slate-400 hover:text-white border border-[#0B2C4D] hover:border-indigo-400 w-7 h-7 rounded-full shadow-xl items-center justify-center transition-all duration-200 cursor-pointer group active:scale-90"
            title="Colapsar menú lateral (Click)"
            aria-label="Cerrar barra lateral"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}

        <div className="flex h-16 items-center justify-between px-4 bg-white border-b border-slate-200 shrink-0 shadow-xs">
          <Link href="/" onClick={onClose} className="flex items-center justify-center">
            <img src="/logo.png" alt="Arivsoft Solutions Logo" className="h-9 w-auto object-contain max-w-[160px]" />
          </Link>
          {/* Botón cerrar para tablets y móviles */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Cerrar menú"
          >
            <span className="text-2xl font-bold leading-none">&times;</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3.5 space-y-4 min-h-0 custom-scrollbar">
          {filteredMenu.map((group: any) => (
            <div key={group.title} className="space-y-1.5">
              <h3 className="px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item: any) => (
                  <div key={item.label}>
                    {item.children ? (
                      <div>
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ease-in-out hover:bg-[#0B2C4D] hover:text-white cursor-pointer",
                            openMenus.includes(item.label) ? "bg-[#0B2C4D] text-white shadow-xs" : "text-slate-300"
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon className={cn(
                              "mr-2.5 h-4 w-4 transition-colors",
                              openMenus.includes(item.label) ? "text-emerald-400" : "text-slate-400"
                            )} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                            openMenus.includes(item.label) && "rotate-180 text-emerald-400"
                          )} />
                        </button>
                        <div className={cn(
                          "mt-1 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out pl-4",
                          openMenus.includes(item.label) ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0"
                        )}>
                          {item.children.map((sub: any) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                onClick={(e) => handleRestrictedNavigation(e, sub.label, sub.href)}
                                className={cn(
                                  "flex items-center rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 ease-in-out hover:translate-x-0.5 group relative",
                                  isSubActive
                                    ? "text-emerald-300 bg-[#0B2C4D] font-bold shadow-xs border-l-2 border-emerald-400"
                                    : "text-slate-400 hover:text-white hover:bg-[#0B2C4D]/60"
                                )}
                              >
                                {sub.icon && (
                                  <sub.icon className={cn(
                                    "mr-2 h-3.5 w-3.5 shrink-0 transition-colors",
                                    isSubActive ? "text-emerald-400" : "text-slate-400 group-hover:text-emerald-300"
                                  )} />
                                )}
                                <span>{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={(e) => handleRestrictedNavigation(e, item.label, item.href)}
                        className={cn(
                          "flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ease-in-out hover:bg-[#0B2C4D] hover:text-white hover:translate-x-0.5 group",
                          pathname === item.href
                            ? "bg-[#0B2C4D] text-emerald-300 font-bold shadow-xs border-l-2 border-emerald-400"
                            : "text-slate-300"
                        )}
                      >
                        <item.icon className={cn(
                          "mr-2.5 h-4 w-4 transition-colors",
                          pathname === item.href ? "text-emerald-400" : "text-slate-400 group-hover:text-emerald-300"
                        )} />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 border-t border-[#0B2C4D] bg-[#051627] shrink-0">
          <div className="flex items-center px-1 mb-3">
            <div className="p-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mr-2.5">
              <UserCircle className="h-6 w-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate w-36">{user?.full_name || 'Cargando...'}</span>
              <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider">{user?.role || 'User'}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center rounded-xl bg-[#0B2C4D]/60 hover:bg-rose-950/40 hover:border-rose-900/60 px-3 py-2 text-xs font-bold text-rose-300 hover:text-rose-200 transition-all duration-200 border border-[#0B2C4D] cursor-pointer"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Cerrar Sesión
          </button>
        </div>

        <SubscriptionBlockedModal
          isOpen={isBlockedModalOpen}
          onClose={() => setIsBlockedModalOpen(false)}
          targetSection={blockedSectionName}
        />
      </aside>
    </>
  );
}
