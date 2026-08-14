'use client';

import React from 'react';
import { TenantCompany } from '../SuperAdminBackoffice';
import { TENANT_STATUS, SAAS_PLAN_NAMES } from '@/constants/domain-constants';

interface BillingTabProps {
  tenants: TenantCompany[];
  masterBcvRate: number;
}

export const BillingTab: React.FC<BillingTabProps> = ({ tenants, masterBcvRate }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base font-bold text-slate-900">Cobros de Suscripción y Estado de Licencias</h3>
        <p className="text-xs text-slate-500 font-medium">Monitoreo de vencimientos y recaudación mensual del software</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="py-3 px-4">Empresa</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4">Vencimiento Licencia</th>
              <th className="py-3 px-4 text-right">Cuota Mensual ($)</th>
              <th className="py-3 px-4 text-right">Cuota (Bs. BCV)</th>
              <th className="py-3 px-4 text-center">Estado Cobro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                <td className="py-3 px-4 font-semibold text-slate-600">
                  {SAAS_PLAN_NAMES[t.plan_name] || t.plan_name}
                </td>
                <td className="py-3 px-4 font-mono text-slate-700">{t.subscription_expires_at}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  ${Number(t.monthly_fee_usd || 0).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                  Bs. {(Number(t.monthly_fee_usd || 0) * masterBcvRate).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${t.status === TENANT_STATUS.ACTIVE
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                    {t.status === TENANT_STATUS.ACTIVE ? 'Al Día' : 'Pago Pendiente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
