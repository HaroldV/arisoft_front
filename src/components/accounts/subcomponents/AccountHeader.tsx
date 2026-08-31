'use client';

import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, Plus, FileSpreadsheet } from 'lucide-react';
import { ACCOUNT_TYPES, AccountType } from '@/constants/domain-constants';

interface AccountHeaderProps {
  activeTab: AccountType;
  setActiveTab: (tab: AccountType) => void;
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
}

export function AccountHeader({
  activeTab,
  setActiveTab,
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
        <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab(ACCOUNT_TYPES.PAYABLE)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === ACCOUNT_TYPES.PAYABLE
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Por Pagar (CxP)</span>
          </button>
          <button
            onClick={() => setActiveTab(ACCOUNT_TYPES.RECEIVABLE)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === ACCOUNT_TYPES.RECEIVABLE
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Por Cobrar (CxC)</span>
          </button>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cuenta</span>
        </button>

        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all shadow-2xs text-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Importar Excel</span>
        </button>
      </div>
    </div>
  );
}
