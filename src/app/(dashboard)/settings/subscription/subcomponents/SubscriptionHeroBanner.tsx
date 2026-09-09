'use client';

import React from 'react';
import { Zap, Users, Package, Calendar, CreditCard, ArrowUpRight } from 'lucide-react';

interface CurrentPlanInfo {
  code: string;
  name: string;
  user_count: number;
  max_users: number;
  product_count: number;
  max_products: number;
  subscription_expires_at?: string;
}

interface SubscriptionHeroBannerProps {
  currentPlan: CurrentPlanInfo;
  hasPendingPayment: boolean;
  onOpenPayment: (planCode: string) => void;
}

export const SubscriptionHeroBanner: React.FC<SubscriptionHeroBannerProps> = ({
  currentPlan,
  hasPendingPayment,
  onOpenPayment,
}) => {
  const userPct = currentPlan.max_users > 0 
    ? Math.min(100, Math.round((currentPlan.user_count / currentPlan.max_users) * 100)) 
    : 0;

  const productPct = currentPlan.max_products >= 999999
    ? 15
    : currentPlan.max_products > 0
    ? Math.min(100, Math.round((currentPlan.product_count / currentPlan.max_products) * 100))
    : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
      {/* Subtle Ambient Light Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10 space-y-6">
        {/* Top Identity Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-white/10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-500/30 to-violet-500/20 backdrop-blur-md rounded-2xl border border-white/20 text-white shadow-inner shrink-0">
              <Zap className="w-7 h-7 text-amber-300 fill-amber-300/20" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
                  Suscripción Activa
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Operativo al 100%
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                Plan {currentPlan.name}
              </h2>
              <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                Tu empresa cuenta con acceso total a los módulos y capacidades de este nivel.
              </p>
            </div>
          </div>

          {/* Botón de Acción Principal de Suscripción */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenPayment(currentPlan.code)}
              disabled={hasPendingPayment}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-700 active:to-teal-700 text-white font-black text-xs rounded-2xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Reportar Pago / Renovar Cuota</span>
              <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 -translate-y-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Medidores de Capacidad & Uso */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tarjeta 1: Usuarios y Licencias */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="text-[10px] font-bold uppercase tracking-wider">Usuarios & Licencias</span>
              <Users className="w-4 h-4 opacity-70" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="font-mono font-black text-2xl text-white">
                  {currentPlan.user_count}
                  <span className="text-xs font-semibold text-indigo-200 font-sans ml-1">
                    / {currentPlan.max_users} activos
                  </span>
                </p>
                <span className="text-[10px] font-bold text-indigo-300">
                  {userPct}%
                </span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all"
                  style={{ width: `${userPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Catálogo de Productos */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="text-[10px] font-bold uppercase tracking-wider">Inventario & Catálogo</span>
              <Package className="w-4 h-4 opacity-70" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="font-mono font-black text-2xl text-white">
                  {currentPlan.product_count}
                  <span className="text-xs font-semibold text-indigo-200 font-sans ml-1">
                    / {currentPlan.max_products >= 999999 ? 'Ilimitado' : currentPlan.max_products}
                  </span>
                </p>
                {currentPlan.max_products < 999999 && (
                  <span className="text-[10px] font-bold text-indigo-300">
                    {productPct}%
                  </span>
                )}
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${productPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Próximo Vencimiento */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="text-[10px] font-bold uppercase tracking-wider">Próxima Renovación</span>
              <Calendar className="w-4 h-4 opacity-70" />
            </div>
            <div className="mt-3">
              <p className="font-mono font-bold text-lg text-emerald-300">
                {currentPlan.subscription_expires_at || 'Al día'}
              </p>
              <p className="text-[10px] font-medium text-indigo-200/80 mt-1">
                Facturación recurrente activa
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
