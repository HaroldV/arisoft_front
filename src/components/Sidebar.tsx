'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Building2, 
  Settings, 
  PackageSearch, 
  ChevronDown,
  LogOut,
  UserCircle,
  ShoppingCart,
  Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuConfig = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    title: 'Ventas',
    module: 'POS',
    items: [
      { label: 'Punto de Venta', icon: ShoppingCart, href: '/pos' },
    ]
  },
  {
    title: 'Operaciones',
    items: [
      { 
        label: 'Inventario', 
        icon: PackageSearch, 
        module: 'INVENTORY',
        children: [
          { label: 'Stock Actual', href: '/inventory/stock' },
          { label: 'Movimientos', href: '/inventory/moves' },
        ] 
      },
      { 
        label: 'Nómina', 
        icon: Users, 
        module: 'PAYROLL',
        children: [
          { label: 'Procesar Nómina', href: '/payroll' },
          { label: 'Fórmulas Legales', href: '/payroll/formulas' },
        ] 
      },
    ]
  },
  {
    title: 'Configuración',
    items: [
      { 
        label: 'Ajustes', 
        icon: Settings, 
        module: 'SETTINGS',
        children: [
          { label: 'Perfil de Empresa', href: '/settings/company' },
          { label: 'Usuarios y Roles', href: '/settings/users' },
          { label: 'Seguridad', href: '/settings/security' },
        ] 
      },
    ]
  }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(i => i !== label) 
        : [...prev, label]
    );
  };

  const filteredMenu = menuConfig.map(group => {
    // If group has a module, check if it's enabled
    if (group.module && !user?.enabled_modules.includes(group.module)) {
      return null;
    }

    // Filter items within the group
    const filteredItems = group.items.filter(item => {
      if (item.module && !user?.enabled_modules.includes(item.module)) {
        return false;
      }
      return true;
    });

    if (filteredItems.length === 0) return null;

    return { ...group, items: filteredItems };
  }).filter(Boolean);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center mr-3 shadow-lg shadow-primary-500/20">
          <span className="text-white font-bold">A</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">ARI Soft</span>
      </div>

      <div className="h-[calc(100vh-140px)] overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {filteredMenu.map((group: any) => (
          <div key={group.title} className="space-y-2">
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
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
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
                        "mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out pl-8",
                        openMenus.includes(item.label) ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                      )}>
                        {item.children.map((sub: any) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className="block rounded-md px-3 py-2 text-xs font-medium text-slate-400 hover:text-primary-300 transition-colors"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white"
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

      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center px-2 mb-4">
          <UserCircle className="h-8 w-8 text-primary-400 mr-3" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white truncate w-32">{user?.full_name || 'Cargando...'}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{user?.role || 'User'}</span>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
