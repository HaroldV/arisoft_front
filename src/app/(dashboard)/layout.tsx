'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from "@/components/Sidebar";
import SandboxBanner from "@/components/SandboxBanner";
import { SubscriptionBlockedModal } from "@/components/modals/SubscriptionBlockedModal";
import { Bell, Wifi, WifiOff, ChevronRight, Home, DollarSign, Euro, Menu, FileSpreadsheet, Wallet } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [bcvUsdRate, setBcvUsdRate] = useState<number>(772.54);
  const [bcvEurRate, setBcvEurRate] = useState<number>(894.49);
  const [currencyMode, setCurrencyMode] = useState<string>('BCV');
  const [manualRate, setManualRate] = useState<number>(780.00);

  // Financial Badges State (CxP & CxC)
  const [cxpPendingCount, setCxpPendingCount] = useState<number>(0);
  const [cxpPendingTotal, setCxpPendingTotal] = useState<number>(0);
  const [cxcPendingCount, setCxcPendingCount] = useState<number>(0);
  const [cxcPendingTotal, setCxcPendingTotal] = useState<number>(0);

  // En pantallas móviles/tablets (< 1024px), inicializar cerrado
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // En pantallas móviles/tablets (< 1024px), cerrar automáticamente al navegar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  // Bloquear el scroll del body en móviles/tablets cuando el menú esté desplegado
  useEffect(() => {
    if (isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  // Mapeo amigable de rutas para el Breadcrumb
  const getBreadcrumbItems = () => {
    if (!pathname || pathname === '/') return [{ label: 'Inicio', href: '/' }];

    const routeMap: Record<string, { label: string; parent?: { label: string; href: string } }> = {
      '/pos': { label: 'Punto de Venta (POS)', parent: { label: 'Ventas', href: '/pos' } },
      '/sales': { label: 'Facturación de Venta', parent: { label: 'Ventas', href: '/sales' } },
      '/sales/quotations': { label: 'Cotizaciones', parent: { label: 'Ventas', href: '/sales' } },
      '/sales/orders': { label: 'Notas de Pedido', parent: { label: 'Ventas', href: '/sales' } },
      '/sales/deliveries': { label: 'Notas de Entrega', parent: { label: 'Ventas', href: '/sales' } },
      '/sales/clients': { label: 'Directorio de Clientes', parent: { label: 'Ventas', href: '/sales' } },
      '/admin/shifts': { label: 'Turnos y Arqueos de Caja', parent: { label: 'Ventas', href: '/pos' } },

      '/inventory/purchases': { label: 'Listado de Compras', parent: { label: 'Compras', href: '/inventory/purchases' } },
      '/inventory/purchases/new': { label: 'Registrar Factura de Compra', parent: { label: 'Compras', href: '/inventory/purchases' } },
      '/inventory/purchases/orders': { label: 'Órdenes de Compra', parent: { label: 'Compras', href: '/inventory/purchases' } },
      '/inventory/purchases/receptions': { label: 'Recepciones de Almacén', parent: { label: 'Compras', href: '/inventory/purchases' } },
      '/inventory/providers': { label: 'Proveedores', parent: { label: 'Compras', href: '/inventory/purchases' } },

      '/inventory/stock': { label: 'Existencias y Stock', parent: { label: 'Inventario', href: '/inventory/stock' } },
      '/inventory/warehouse': { label: 'Almacenes y Sucursales', parent: { label: 'Inventario', href: '/inventory/stock' } },
      '/inventory/categories': { label: 'Categorías', parent: { label: 'Inventario', href: '/inventory/stock' } },
      '/inventory/moves': { label: 'Movimientos (Kardex)', parent: { label: 'Inventario', href: '/inventory/stock' } },
      '/inventory/prices/bulk-update': { label: 'Ajuste Masivo de Precios', parent: { label: 'Inventario', href: '/inventory/stock' } },
      '/inventory/audit-reports': { label: 'Reportes de Valuación', parent: { label: 'Inventario', href: '/inventory/stock' } },

      '/accounts/banks': { label: 'Cuentas Bancarias', parent: { label: 'Finanzas', href: '/accounts/banks' } },
      '/accounts/receivables': { label: 'Cuentas por Cobrar (CxC)', parent: { label: 'Finanzas', href: '/accounts/banks' } },
      '/accounts/payables': { label: 'Cuentas por Pagar (CxP)', parent: { label: 'Finanzas', href: '/accounts/banks' } },
      '/accounts/history': { label: 'Historial Financiero', parent: { label: 'Finanzas', href: '/accounts/banks' } },

      '/payroll': { label: 'Procesamiento de Nómina', parent: { label: 'Nómina', href: '/payroll' } },
      '/payroll/formulas': { label: 'Conceptos y Asignaciones', parent: { label: 'Nómina', href: '/payroll' } },

      '/reports': { label: 'Métricas & Tableros BI', parent: { label: 'Reportes', href: '/reports' } },

      '/settings/company': { label: 'Perfil de Empresa & Divisas', parent: { label: 'Configuración', href: '/settings/company' } },
      '/settings/fiscal': { label: 'Parámetros Fiscales SENIAT', parent: { label: 'Configuración', href: '/settings/company' } },
      '/settings/users': { label: 'Usuarios y Accesos', parent: { label: 'Configuración', href: '/settings/company' } },
      '/settings/security': { label: 'Seguridad y Clave', parent: { label: 'Configuración', href: '/settings/company' } },
      '/settings/subscription': { label: 'Planes y Suscripción SaaS', parent: { label: 'Configuración', href: '/settings/company' } },

      '/admin': { label: 'SuperAdmin Backoffice', parent: { label: 'Plataforma', href: '/admin' } },
    };

    const current = routeMap[pathname];
    if (current) {
      const items = [{ label: 'Inicio', href: '/' }];
      if (current.parent) items.push(current.parent);
      items.push({ label: current.label, href: pathname });
      return items;
    }

    return [{ label: 'Inicio', href: '/' }, { label: pathname.replace('/', ''), href: pathname }];
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // 1. Obtener tasas maestras del backend (actualizadas por cronjob BCV o superadmin)
        const bcvRes = await apiClient.get('/auth/bcv/rate');
        if (bcvRes.data) {
          if (bcvRes.data.USD?.rate) setBcvUsdRate(Number(bcvRes.data.USD.rate));
          else if (bcvRes.data.rate) setBcvUsdRate(Number(bcvRes.data.rate));
          if (bcvRes.data.EUR?.rate) setBcvEurRate(Number(bcvRes.data.EUR.rate));
        }

        // 2. Obtener configuración de la empresa
        const profileRes = await apiClient.get('/tenant/profile');
        const settings = profileRes.data?.settings || {};
        if (settings.currencyMode) {
          setCurrencyMode(settings.currencyMode);
        }
        if (settings.manualRate) {
          setManualRate(Number(settings.manualRate));
        }
      } catch (err) {
        console.error('Error fetching exchange rates for layout:', err);
      }
    };

    const fetchBadges = async () => {
      try {
        const res = await apiClient.get('/accounts/badges/summary');
        if (res.data) {
          if (res.data.cxp) {
            setCxpPendingCount(Number(res.data.cxp.count || 0));
            setCxpPendingTotal(Number(res.data.cxp.total_balance_due || 0));
          }
          if (res.data.cxc) {
            setCxcPendingCount(Number(res.data.cxc.count || 0));
            setCxcPendingTotal(Number(res.data.cxc.total_balance_due || 0));
          }
        }
      } catch (err) {
        // Silently skip if tenant not selected or banks permission not granted
      }
    };

    if (user) {
      fetchRates();
      fetchBadges();

      // Re-sincronizar solo cuando el usuario cambia o enfoca la pestaña
      const handleFocus = () => {
        if (document.visibilityState === 'visible') {
          fetchRates();
          fetchBadges();
        }
      };
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleFocus);

      const handleAccountsUpdate = () => {
        fetchBadges();
      };
      window.addEventListener('accounts-updated', handleAccountsUpdate);

      return () => {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
        window.removeEventListener('accounts-updated', handleAccountsUpdate);
      };
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRateUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
          if (typeof customEvent.detail.usdRate === 'number') setBcvUsdRate(customEvent.detail.usdRate);
          if (typeof customEvent.detail.eurRate === 'number') setBcvEurRate(customEvent.detail.eurRate);
          if (typeof customEvent.detail.rate === 'number' && !customEvent.detail.usdRate) {
            if (customEvent.detail.officialCurrency === 'EUR') {
              setBcvEurRate(customEvent.detail.rate);
            } else {
              setBcvUsdRate(customEvent.detail.rate);
            }
          }
          if (customEvent.detail.mode) setCurrencyMode(customEvent.detail.mode);
        }
      };
      window.addEventListener('exchange-rate-updated', handleRateUpdate);
      return () => {
        window.removeEventListener('exchange-rate-updated', handleRateUpdate);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user?.must_change_password) {
      router.replace('/change-password');
    } else if (!isLoading && user?.role === 'SUPER_ADMIN' && typeof window !== 'undefined' && window.location.pathname === '/') {
      router.replace('/admin');
    } else if (!isLoading && user && user.role !== 'SUPER_ADMIN' && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      // Mapeo de rutas a permisos requeridos
      const routePermissions: Record<string, string> = {
        '/sales/quotations': 'sales:quotations',
        '/sales/orders': 'sales:orders',
        '/sales/deliveries': 'sales:deliveries',
        '/admin/shifts': 'pos:shifts',
        '/inventory/purchases/orders': 'purchases:orders',
        '/inventory/purchases/receptions': 'purchases:receptions',
        '/inventory/purchases/new': 'purchases:new',
        '/inventory/prices/bulk-update': 'inventory:bulk_prices',
        '/inventory/audit-reports': 'inventory:valuation',
        '/inventory/moves': 'inventory:moves',
        '/accounts/receivables': 'accounts:receivables',
        '/accounts/payables': 'accounts:payables',
        '/accounts/history': 'accounts:history',
        '/payroll': 'payroll:manage',
        '/payroll/formulas': 'payroll:manage',
        '/reports': 'reports:view',
      };

      const requiredPermission = routePermissions[currentPath];
      if (requiredPermission && user.permissions && !user.permissions.includes(requiredPermission)) {
        // Redirigir a ruta permitida por defecto
        if (currentPath.startsWith('/accounts')) {
          router.replace('/accounts/banks');
        } else if (currentPath === '/inventory/purchases/new') {
          router.replace('/inventory/purchases/orders');
        } else {
          router.replace('/');
        }
      }
    }
  }, [user, isLoading, router]);

  const getInitials = (name?: string) => {
    if (!name) return 'HV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || user.must_change_password) {
    return null;
  }

  const breadcrumbs = getBreadcrumbItems();

  return (
    <div className="bg-slate-50 min-h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onToggle={() => setIsSidebarOpen(prev => !prev)} 
      />
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:ml-64" : "ml-0"
      )}>
        <SandboxBanner />
        {/* Top Header con Breadcrumb y Monitor de Divisas Proporcional y Responsivo */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-2xs gap-2 min-w-0">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Botón Toggle en Cabecera (Accesible en todos los dispositivos) */}
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 active:scale-95 transition-all border border-slate-200/80 shadow-2xs cursor-pointer shrink-0 flex items-center justify-center group"
              aria-label="Alternar menú de navegación"
              title={isSidebarOpen ? "Colapsar menú lateral" : "Expandir menú lateral"}
            >
              <Menu className="w-4.5 h-4.5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
            </button>

            {/* 🧭 Breadcrumb Dinámico Adaptativo */}
            <nav className="flex items-center gap-1 sm:gap-1.5 text-xs text-slate-500 overflow-x-auto py-1 scrollbar-hide min-w-0">
              <Link 
                href="/" 
                className="flex items-center gap-1 font-semibold text-slate-400 hover:text-[#0B2C4D] transition-colors shrink-0"
                title="Ir al Inicio"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              {breadcrumbs.slice(1).map((crumb, idx) => {
                const isLast = idx === breadcrumbs.slice(1).length - 1;
                return (
                  <div key={crumb.href + idx} className="flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
                    <ChevronRight className="w-3 h-3 text-slate-300 stroke-[2.5] shrink-0" />
                    {isLast ? (
                      <span className="font-bold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded-md truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-none">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link 
                        href={crumb.href} 
                        className="font-medium text-slate-500 hover:text-[#0B2C4D] transition-colors truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none hidden sm:inline"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* 💱 Monitor Dual de Divisas & Badges de Tesorería (BCV USD + BCV EUR + CxP + CxC) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link 
                href="/settings/company" 
                className="flex items-center gap-1.5 select-none group cursor-pointer bg-slate-50 hover:bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 transition-all shadow-2xs"
                title="Tasas oficiales vigentes del Banco Central de Venezuela (BCV). Clic para configurar."
              >
                {/* Badge Tasa BCV USD */}
                <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-white border border-emerald-100 text-emerald-800 shadow-2xs group-hover:border-emerald-200 transition-all">
                  <span className="text-[10px] font-black text-emerald-600">$</span>
                  <span className="font-mono text-xs font-black text-slate-800">
                    {currencyMode === 'MANUAL' ? manualRate.toFixed(2) : bcvUsdRate.toFixed(2)}
                  </span>
                  <span className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold ml-0.5 hidden md:inline-block">
                    {currencyMode === 'MANUAL' ? 'Manual' : 'BCV'}
                  </span>
                </div>

                {/* Badge Tasa BCV EUR */}
                <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-white border border-blue-100 text-blue-800 shadow-2xs group-hover:border-blue-200 transition-all">
                  <span className="text-[10px] font-black text-blue-600">€</span>
                  <span className="font-mono text-xs font-black text-slate-800">
                    {bcvEurRate.toFixed(2)}
                  </span>
                  <span className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold ml-0.5 hidden md:inline-block">
                    BCV
                  </span>
                </div>
              </Link>

              {/* 💳 Badge Cuentas por Pagar (CxP) */}
              <Link
                href="/accounts/payables"
                className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-50/90 hover:bg-rose-100/80 border border-rose-200 text-rose-700 transition-all shadow-2xs cursor-pointer group"
                title={`Cuentas por Pagar Pendientes: ${cxpPendingCount} facturas ($${cxpPendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span className="text-rose-900">CxP:</span>
                  <span className="px-1.5 py-0.2 bg-rose-200/80 text-rose-900 rounded-full font-mono text-[10px] font-black">
                    {cxpPendingCount}
                  </span>
                  <span className="font-mono text-rose-800 hidden lg:inline">
                    ${cxpPendingTotal.toFixed(0)}
                  </span>
                </div>
              </Link>

              {/* 📥 Badge Cuentas por Cobrar (CxC) */}
              <Link
                href="/accounts/receivables"
                className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-emerald-50/90 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-700 transition-all shadow-2xs cursor-pointer group"
                title={`Cuentas por Cobrar Pendientes: ${cxcPendingCount} cuentas ($${cxcPendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span className="text-emerald-900">CxC:</span>
                  <span className="px-1.5 py-0.2 bg-emerald-200/80 text-emerald-900 rounded-full font-mono text-[10px] font-black">
                    {cxcPendingCount}
                  </span>
                  <span className="font-mono text-emerald-800 hidden lg:inline">
                    ${cxcPendingTotal.toFixed(0)}
                  </span>
                </div>
              </Link>
            </div>

            {/* Offline Alert Badge if connection lost */}
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Offline</span>
              </div>
            )}

            <button 
              className="p-1.5 sm:p-2 text-slate-400 hover:text-[#0B2C4D] hover:bg-slate-100 rounded-xl transition-all relative cursor-pointer"
              title="Notificaciones del Sistema"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
            </button>

            <div className="h-5 sm:h-6 w-px bg-slate-200"></div>

            <div className="flex items-center cursor-pointer group" title={user.full_name}>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center text-[#0B2C4D] font-black text-xs border border-slate-200 group-hover:border-indigo-300 transition-all shadow-2xs">
                {getInitials(user.full_name)}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto min-w-0 w-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-8 bg-white border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            © 2026 Ari Soft - Administración Resiliente e Inteligente. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
