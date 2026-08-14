'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SuperAdminBackoffice from '@/components/admin/SuperAdminBackoffice';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function SuperAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'SUPER_ADMIN') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Verificando credenciales de administración...</p>
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Acceso Denegado</h2>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Esta sección es exclusiva para el SuperAdmin de la plataforma SaaS. Redirigiendo a tu panel...
          </p>
        </div>
      </div>
    );
  }

  return <SuperAdminBackoffice />;
}
