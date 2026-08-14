'use client';

import React from 'react';
import { CreditCard, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { ActionTooltip } from '@/components/ActionTooltip';
import { SAAS_PLAN_NAMES } from '@/constants/domain-constants';

export interface SubscriptionPayment {
  id: string;
  tenant_id: string;
  plan_code: string;
  billing_cycle: 'MONTHLY' | 'ANNUAL';
  amount_usd: number;
  amount_bcv_bs: number;
  bcv_rate_used: number;
  payment_method: string;
  payment_reference: string;
  bank_origin?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

interface PendingPaymentsTabProps {
  payments: SubscriptionPayment[];
  onApprove: (paymentId: string) => void;
  isApproving: boolean;
}

export const PendingPaymentsTab: React.FC<PendingPaymentsTabProps> = ({
  payments,
  onApprove,
  isApproving,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Solicitudes de Pago de Suscripción</h2>
          <p className="text-xs text-slate-500">Valida las transferencias y activa las licencias de las empresas de forma inmediata</p>
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
          {payments.filter(p => p.status === 'PENDING_APPROVAL').length} Pendientes por Revisión
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Plan Solicitado</th>
                <th className="py-3.5 px-4">Método & Banco</th>
                <th className="py-3.5 px-4">Referencia</th>
                <th className="py-3.5 px-4 text-right">Monto USD</th>
                <th className="py-3.5 px-4 text-right">Monto Bs (BCV)</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No hay solicitudes de pago registradas.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(p.created_at).toLocaleDateString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {SAAS_PLAN_NAMES[p.plan_code] || p.plan_code}
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">
                        {p.billing_cycle === 'ANNUAL' ? 'Anual' : 'Mensual'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      <span className="font-semibold">{p.payment_method}</span>
                      <span className="text-[10px] text-slate-400 block">{p.bank_origin || 'Banco Nacional'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {p.payment_reference}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${Number(p.amount_usd).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      Bs. {Number(p.amount_bcv_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.status === 'PENDING_APPROVAL' && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                      {p.status === 'APPROVED' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Aprobado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => onApprove(p.id)}
                          disabled={isApproving}
                          className="flex items-center gap-1.5 mx-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobar & Activar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
