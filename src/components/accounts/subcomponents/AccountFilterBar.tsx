'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { ACCOUNT_TYPES, AccountType } from '@/constants/domain-constants';

interface AccountFilterBarProps {
  search: string;
  setSearch: (s: string) => void;
  activeTab: AccountType;
}

export function AccountFilterBar({
  search,
  setSearch,
  activeTab,
}: AccountFilterBarProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={
            activeTab === ACCOUNT_TYPES.PAYABLE
              ? 'Buscar por proveedor, referencia o nota...'
              : 'Buscar por cliente, cédula/RIF o nota...'
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
        />
      </div>
    </div>
  );
}
