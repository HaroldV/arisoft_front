'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus } from 'lucide-react';

interface PurchaseInvoicesHeaderProps {
  onOpenRegisterNote: () => void;
}

export const PurchaseInvoicesHeader: React.FC<PurchaseInvoicesHeaderProps> = ({
  onOpenRegisterNote,
}) => {
  const router = useRouter();

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Listado de Compras
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Libro de compras, documentos fiscales recibidos y control de liquidación en Cuentas por Pagar (CXP)
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <button
          onClick={onOpenRegisterNote}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-xs cursor-pointer shadow-2xs"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Emitir Nota Fiscal</span>
        </button>
        <button
          onClick={() => router.push('/inventory/purchases/new')}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Compra</span>
        </button>
      </div>
    </div>
  );
};
