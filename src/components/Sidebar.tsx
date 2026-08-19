'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  PackageSearch,
  ChevronDown,
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
        module: 'INVENTORY',
        tenantOnly: true,
        children: [
          { label: 'Órdenes de Compra', icon: FileText, href: '/inventory/purchases/orders', permission: 'purchases:orders' },
          { label: 'Notas de Recepción', icon: Truck, href: '/inventory/purchases/receptions', permission: 'purchases:receptions' },
          { label: 'Registrar Compra', icon: ShoppingBag, href: '/inventory/purchases/new', permission: 'purchases:new' },
          { label: 'Facturación de Compra', icon: FileSpreadsheet, href: '/inventory/purchases', permission: 'purchases:invoices' },
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

export default function Sidebar() {
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 flex flex-col" >
      <div className="flex h-16 items-center justify-center px-6 bg-white border-b border-slate-200 shrink-0">
        <img src="/logo-arisoft.png" alt="ARI Soft Logo" className="h-10 w-auto object-contain" />
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4 min-h-0 scrollbar-hide">
        {filteredMenu.map((group: any) => (
          <div key={group.title} className="space-y-1.5">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                          "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out hover:bg-slate-800 hover:text-white",
                          openMenus.includes(item.label) && "bg-slate-800 text-white"
                        )}
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5 text-primary-400" />
                          {item.label}
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          openMenus.includes(item.label) && "rotate-180"
                        )} />
                      </button>
                      <div className={cn(
                        "mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out pl-6",
                        openMenus.includes(item.label) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                      )}>
                        {item.children.map((sub: any) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={(e) => handleRestrictedNavigation(e, sub.label, sub.href)}
                              className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ease-in-out hover:translate-x-0.5",
                                isSubActive
                                  ? "text-indigo-300 bg-slate-800 font-bold animate-in fade-in duration-200"
                                  : "text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60"
                              )}
                            >
                              {sub.icon && <sub.icon className={cn("mr-2.5 h-4 w-4 shrink-0", isSubActive ? "text-indigo-300" : "text-indigo-400")} />}
                              {sub.label}
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
                        "flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out hover:bg-slate-800 hover:text-white hover:translate-x-0.5",
                        pathname === item.href
                          ? "bg-slate-800 text-white font-bold"
                          : "text-slate-350"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5 text-primary-400" />
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center px-2 mb-4">
          <UserCircle className="h-8 w-8 text-primary-400 mr-3" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white truncate w-32">{user?.full_name || 'Cargando...'}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{user?.role || 'User'}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center rounded-xl bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all duration-200 border border-slate-700/50 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>

      <SubscriptionBlockedModal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        targetSection={blockedSectionName}
      />
    </aside>
  );
}
