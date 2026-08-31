import React from 'react';
import { Search } from 'lucide-react';

interface PurchaseOrdersFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
}

export function PurchaseOrdersFilterBar({ search, onSearchChange }: PurchaseOrdersFilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por N° Orden de Compra o Proveedor..."
          className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
