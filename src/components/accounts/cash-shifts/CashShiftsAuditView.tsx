'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Building2, User, DollarSign, CheckCircle2, AlertCircle, Eye, Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { CashShiftItem } from './types';
import { ShiftDetailsModal } from './ShiftDetailsModal';

export function CashShiftsAuditView() {
  const [shifts, setShifts] = useState<CashShiftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/pos/shifts');
      setShifts(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener los cierres de caja.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenDetails = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setIsModalOpen(true);
  };

  const branchNames = Array.from(
    new Set(shifts.map((s) => s.branch?.name || 'Sede Principal'))
  );

  const filteredShifts = shifts.filter((s) => {
    const branchName = s.branch?.name || 'Sede Principal';
    const cashierName = s.cashier?.full_name || '';
    const matchSearch =
      branchName.toLowerCase().includes(search.toLowerCase()) ||
      cashierName.toLowerCase().includes(search.toLowerCase());
    const matchBranch = filterBranch === 'ALL' || branchName === filterBranch;
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchSearch && matchBranch && matchStatus;
  });

  const pendingCount = shifts.filter((s) => s.status === 'PENDING_APPROVAL').length;
  const closedCount = shifts.filter((s) => s.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3 shadow-2xs">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Auditoría de Cierres de Caja & Sucursales
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Supervisión de arqueos de caja en tiempo real, desglose de ventas por tienda y liquidación contable.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Pendientes: <strong className="text-amber-600 font-mono">{pendingCount}</strong>
          </span>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Aprobados: <strong className="text-emerald-600 font-mono">{closedCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cajero o sucursal..."
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="px-4 py-2 bg-slate-100 border-transparent rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">Todas las Sucursales</option>
          {branchNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-slate-100 border-transparent rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="PENDING_APPROVAL">Pendiente de Aprobación</option>
          <option value="CLOSED">Aprobado / Liquidado</option>
          <option value="OPEN">Turno en Curso</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Cargando arqueos de caja...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Sucursal / Tienda</th>
                  <th className="py-4 px-6">Cajero</th>
                  <th className="py-4 px-6">Apertura / Cierre</th>
                  <th className="py-4 px-6 text-right">Efectivo ($ / Bs)</th>
                  <th className="py-4 px-6 text-center">Descuadre</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-600 text-sm">No hay cierres de caja registrados</p>
                      <p className="text-xs text-slate-400">Los arqueos realizados en el POS aparecerán en esta tabla.</p>
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((s) => {
                    const isBalanced =
                      Math.abs(Number(s.discrepancy_usd || 0)) < 0.01 &&
                      Math.abs(Number(s.discrepancy_ves || 0)) < 0.01;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {s.branch?.name || 'Sede Principal'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {s.branch?.default_warehouse?.name || 'Almacén Central'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-800 block">
                                {s.cashier?.full_name || 'Cajero'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {s.cashier?.email || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600">
                          <span className="block font-medium">
                            {new Date(s.opened_at).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(s.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {s.closed_at ? new Date(s.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Abierto'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono">
                          <span className="font-bold text-slate-900 text-xs block">
                            ${Number(s.declared_cash_usd || 0).toFixed(2)}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Bs. {Number(s.declared_cash_ves || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-xs">
                          {isBalanced ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" /> Cuadrado
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 border border-amber-100 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              {Number(s.discrepancy_usd) >= 0 ? '+' : ''}${Number(s.discrepancy_usd).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {s.status === 'CLOSED' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              Liquidado
                            </span>
                          ) : s.status === 'PENDING_APPROVAL' ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              Pendiente
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              Abierto
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(s.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Auditar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details & Approval Modal */}
      <ShiftDetailsModal
        isOpen={isModalOpen}
        shiftId={selectedShiftId}
        onClose={() => setIsModalOpen(false)}
        onApproveSuccess={fetchShifts}
      />
    </div>
  );
}
