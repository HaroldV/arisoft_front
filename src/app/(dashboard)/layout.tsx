'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from "@/components/Sidebar";
import SandboxBanner from "@/components/SandboxBanner";
import { SubscriptionBlockedModal } from "@/components/modals/SubscriptionBlockedModal";
import { Bell, Search, Wifi, WifiOff } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [rate, setRate] = useState<number>(772.54);
  const [rateLabel, setRateLabel] = useState<string>('Tasa USD');

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await apiClient.get('/tenant/profile');
        const settings = res.data?.settings || {};
        const activeRate = settings.exchangeRate || Number(settings.manualRate) || 772.54;
        setRate(activeRate);

        if (settings.currencyMode === 'MANUAL') {
          setRateLabel('Tasa Propia');
        } else if (settings.officialCurrency === 'EUR') {
          setRateLabel('Tasa BCV EUR');
        } else {
          setRateLabel('Tasa BCV USD');
        }
      } catch (err) {
        console.error('Error fetching exchange rate for layout:', err);
      }
    };
    if (user) {
      fetchRate();
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRateUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail && typeof customEvent.detail.rate === 'number') {
          setRate(customEvent.detail.rate);
          if (customEvent.detail.mode === 'MANUAL') {
            setRateLabel('Tasa Propia');
          } else if (customEvent.detail.officialCurrency === 'EUR') {
            setRateLabel('Tasa BCV EUR');
          } else {
            setRateLabel('Tasa BCV USD');
          }
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

  return (
    <div className="bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="sm:ml-64 flex flex-col min-h-screen">
        <SandboxBanner />
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar en el sistema..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status Badge with BCV / Custom Rate */}
            <Link href="/settings/company" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold select-none transition-all cursor-pointer hover:bg-indigo-100/30 ${
              isOnline 
                ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700 hover:border-indigo-200' 
                : 'bg-rose-50 border-rose-100 text-rose-700 animate-pulse hover:border-rose-200'
            }`} title="Ir a Configuración de Moneda y Tasa">
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                  <span>{rateLabel}: Bs. {rate.toFixed(2)}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-rose-500" />
                  <span>Modo Offline (Bs. {rate.toFixed(2)})</span>
                </>
              )}
            </Link>

            <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-full transition-all relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center cursor-pointer group">
              <div 
                title={user.full_name}
                className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 group-hover:border-primary-400 transition-all"
              >
                {getInitials(user.full_name)}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-[1600px] mx-auto">
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
