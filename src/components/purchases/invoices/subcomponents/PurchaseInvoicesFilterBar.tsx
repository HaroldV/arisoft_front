'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface PurchaseInvoicesFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (val: string) => void;
}

export const PurchaseInvoicesFilterBar: React.FC<PurchaseInvoicesFilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Barra de Búsqueda */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por factura, proveedor o creador..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border-transparent rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filtro por Estado Documental */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 hover:border-indigo-300 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Todos los Estados (Documento)</option>
            <option value="PAGADA">Registrada / Pagada</option>
            <option value="AJUSTADA">Ajustada (Notas de Débito/Crédito)</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>

        {/* Filtro por Estado Financiero CXP */}
        <div className="sm:col-span-3">
          <select
            value={paymentFilter}
            onChange={(e) => onPaymentFilterChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 hover:border-indigo-300 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Todos los Pagos (CXP)</option>
            <option value="PENDING">Pendiente de Pago</option>
            <option value="PARTIAL">Abono Parcial</option>
            <option value="PAID">Saldada / Liquidada</option>
          </select>
        </div>
      </div>
    </div>
  );
};
