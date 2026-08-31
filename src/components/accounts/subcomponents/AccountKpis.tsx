'use client';

import React from 'react';
import { DollarSign, Clock, CreditCard, Wallet } from 'lucide-react';
import { ACCOUNT_TYPES, AccountType } from '@/constants/domain-constants';
import { SummaryKPIs } from '../types';

interface AccountKpisProps {
  kpis: SummaryKPIs;
  activeTab: AccountType;
}

export function AccountKpis({ kpis, activeTab }: AccountKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {activeTab === ACCOUNT_TYPES.PAYABLE ? 'Total Deuda Pendiente' : 'Total por Cobrar'}
          </p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">${kpis.total_balance_due.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Meses Anteriores</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">${kpis.total_previous_balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monto Facturado</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">${kpis.total_period_amount.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pagado / Cobrado</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">${kpis.total_paid.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
