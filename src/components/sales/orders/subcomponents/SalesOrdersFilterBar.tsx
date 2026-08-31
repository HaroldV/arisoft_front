import React from 'react';
import { Search } from 'lucide-react';

interface SalesOrdersFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
}

export function SalesOrdersFilterBar({ search, onSearchChange }: SalesOrdersFilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por n° pedido o cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
        />
      </div>
    </div>
  );
}
