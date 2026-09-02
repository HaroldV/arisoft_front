'use client';

import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, Plus, FileSpreadsheet } from 'lucide-react';
import { ACCOUNT_TYPES, AccountType } from '@/constants/domain-constants';

interface AccountHeaderProps {
  activeTab: AccountType;
  setActiveTab: (tab: AccountType) => void;
  hideTabs?: boolean;
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
}

export function AccountHeader({
  activeTab,
  setActiveTab,
  hideTabs = false,
  onOpenCreateModal,
  onOpenImportModal,
}: AccountHeaderProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {activeTab === ACCOUNT_TYPES.PAYABLE ? 'Cuentas por Pagar (CxP)' : 'Cuentas por Cobrar (CxC)'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {activeTab === ACCOUNT_TYPES.PAYABLE
              ? 'Control de compromisos financieros con proveedores, compras y egresos'
              : 'Gestión de saldos pendientes de clientes, facturas fiscales y cobranzas'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {!hideTabs && (
          <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab(ACCOUNT_TYPES.PAYABLE)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === ACCOUNT_TYPES.PAYABLE
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Por Pagar (CxP)</span>
            </button>
            <button
              onClick={() => setActiveTab(ACCOUNT_TYPES.RECEIVABLE)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === ACCOUNT_TYPES.RECEIVABLE
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Por Cobrar (CxC)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
