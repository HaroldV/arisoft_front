import React from 'react';
import { Calendar, Filter, DollarSign } from 'lucide-react';
import { BankAccount } from '../types';

export type DateFilterPreset = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | 'ALL';

interface BankMovementFiltersProps {
  accounts: BankAccount[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
  datePreset: DateFilterPreset;
  onSelectDatePreset: (preset: DateFilterPreset) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  totalIngresosUsd: number;
  totalIngresosVes: number;
  totalEgresosUsd: number;
  totalEgresosVes: number;
  netoUsd: number;
  netoVes: number;
  movementsCount: number;
}

export const BankMovementFilters: React.FC<BankMovementFiltersProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  datePreset,
  onSelectDatePreset,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  totalIngresosUsd,
  totalIngresosVes,
  totalEgresosUsd,
  totalEgresosVes,
  netoUsd,
  netoVes,
  movementsCount,
}) => {
  return (
    <div className="space-y-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
      {/* Controls row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Preset buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200/80 p-1 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => onSelectDatePreset('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'TODAY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onSelectDatePreset('WEEK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'WEEK'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Esta Semana
          </button>
          <button
            type="button"
            onClick={() => onSelectDatePreset('MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'MONTH'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Este Mes
          </button>
          <button
            type="button"
            onClick={() => onSelectDatePreset('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Todo el Historial
          </button>
          <button
            type="button"
            onClick={() => onSelectDatePreset('CUSTOM')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'CUSTOM'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Personalizado
          </button>
        </div>

        {/* Account Selector filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedAccountId}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="w-full lg:w-64 px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">Todas las Cuentas y Cajas (Consolidado)</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.bank_name} - {acc.currency})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Pickers (Custom range) */}
      {datePreset === 'CUSTOM' && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Reactive Financial Summary of Period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Total Ingresos / Cobros */}
        <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Cobrado (Ingresos)</span>
            <span className="text-[10px] font-extrabold bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded">
              +{movementsCount} mov.
            </span>
          </div>
          <div className="mt-1">
            <span className="font-mono font-black text-lg text-emerald-700 tracking-tight block">
              +${totalIngresosUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-600 block">
              +{totalIngresosVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
            </span>
          </div>
        </div>

        {/* Total Egresos / Retiros */}
        <div className="p-3 bg-rose-50/80 border border-rose-100 rounded-xl shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Egresos (Retiros/Dev.)</span>
          </div>
          <div className="mt-1">
            <span className="font-mono font-black text-lg text-rose-700 tracking-tight block">
              -${totalEgresosUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-mono text-[11px] font-bold text-rose-600 block">
              -{totalEgresosVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
            </span>
          </div>
        </div>

        {/* Balance Neto del Periodo */}
        <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">Flujo Neto del Periodo</span>
            <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-1">
            <span className={`font-mono font-black text-lg tracking-tight block ${netoUsd >= 0 ? 'text-indigo-900' : 'text-rose-700'}`}>
              {netoUsd >= 0 ? '+' : ''}${netoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-mono text-[11px] font-bold text-indigo-700 block">
              {netoVes >= 0 ? '+' : ''}{netoVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
