'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, DollarSign, CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { useAuth } from '@/context/AuthContext';

interface CashShift {
  id: string;
  cashier_id: string;
  status: 'OPEN' | 'PENDING_APPROVAL' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
  opening_balance_usd: number;
  opening_balance_ves: number;
  expected_cash_usd: number;
  expected_cash_ves: number;
  declared_cash_usd: number;
  declared_cash_ves: number;
  discrepancy_usd: number;
  discrepancy_ves: number;
  approved_by_id?: string;
}

export default function AdminShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  const fetchShifts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/pos/shifts');
      setShifts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener la lista de turnos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleApprove = async (shiftId: string) => {
    if (!confirm('¿Estás seguro de que deseas aprobar el arqueo y cierre definitivo de esta caja?')) return;
    setIsApproving(shiftId);
    try {
      await apiClient.post(`/pos/shifts/${shiftId}/approve`);
      await fetchShifts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aprobar el turno.');
    } finally {
      setIsApproving(null);
    }
  };

  const isSupervisor = user?.role === 'OWNER' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Control de Turnos y Arqueos</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Auditoría física de efectivo, arqueos y autorizaciones del POS</p>
          </div>
        </div>
        <button
          onClick={fetchShifts}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* Warning if not admin */}
      {!isSupervisor && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
          <span>Vista restringida. Solo supervisores (MANAGER/OWNER) poseen permisos para autorizar arqueos pendientes.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* List Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center flex-col gap-2">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold">Cargando bitácora de turnos...</span>
          </div>
        ) : shifts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-semibold">
            No se han registrado turnos de caja en este tenant.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-sans">Turno ID / Cajero</th>
                  <th className="p-4 font-sans">Apertura</th>
                  <th className="p-4 font-sans">Cierre</th>
                  <th className="p-4 font-sans text-right">Saldo Inicial</th>
                  <th className="p-4 font-sans text-right">Esperado</th>
                  <th className="p-4 font-sans text-right">Declarado</th>
                  <th className="p-4 font-sans text-right">Diferencia (Arqueo)</th>
                  <th className="p-4 font-sans text-center">Estado</th>
                  {isSupervisor && <th className="p-4 font-sans text-center">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {shifts.map((shift) => {
                  const hasDiscrepancyUsd = Math.abs(shift.discrepancy_usd) > 0.01;
                  const hasDiscrepancyVes = Math.abs(shift.discrepancy_ves) > 0.01;

                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/30 transition-colors font-sans">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">{shift.id}</span>
                          <span className="text-slate-700 font-semibold flex items-center gap-1 mt-0.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {shift.cashier_id === user?.id ? 'Tú (Cajero)' : 'Cajero ID: ' + shift.cashier_id.substring(0, 8)}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-600 font-medium">
                        {new Date(shift.opened_at).toLocaleString('es-VE')}
                      </td>

                      <td className="p-4 text-slate-600 font-medium">
                        {shift.closed_at ? new Date(shift.closed_at).toLocaleString('es-VE') : <span className="text-emerald-600 font-bold">Activo</span>}
                      </td>

                      <td className="p-4 text-right font-mono font-semibold text-slate-700">
                        <div>${Number(shift.opening_balance_usd).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Bs. {Number(shift.opening_balance_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                      </td>

                      <td className="p-4 text-right font-mono font-semibold text-slate-700">
                        {shift.status === 'OPEN' ? (
                          <span className="text-slate-400 italic">En proceso</span>
                        ) : (
                          <>
                            <div>${Number(shift.expected_cash_usd).toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">Bs. {Number(shift.expected_cash_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                          </>
                        )}
                      </td>

                      <td className="p-4 text-right font-mono font-semibold text-slate-700">
                        {shift.status === 'OPEN' ? (
                          <span className="text-slate-400 italic">Abierto</span>
                        ) : (
                          <>
                            <div>${Number(shift.declared_cash_usd).toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">Bs. {Number(shift.declared_cash_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                          </>
                        )}
                      </td>

                      <td className="p-4 text-right font-mono font-bold">
                        {shift.status === 'OPEN' ? (
                          <span className="text-slate-400 italic font-normal">S/D</span>
                        ) : (
                          <>
                            <div className={hasDiscrepancyUsd ? (shift.discrepancy_usd < 0 ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-500'}>
                              {shift.discrepancy_usd >= 0 ? '+' : ''}${Number(shift.discrepancy_usd).toFixed(2)}
                            </div>
                            <div className={`text-[10px] ${hasDiscrepancyVes ? (shift.discrepancy_ves < 0 ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-400'}`}>
                              {shift.discrepancy_ves >= 0 ? '+' : ''}Bs. {Number(shift.discrepancy_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </div>
                          </>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                          shift.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : shift.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {shift.status === 'OPEN' ? 'Abierto' : shift.status === 'PENDING_APPROVAL' ? 'Pendiente' : 'Aprobado/Cerrado'}
                        </span>
                      </td>

                      {isSupervisor && (
                        <td className="p-4 text-center">
                          {shift.status === 'PENDING_APPROVAL' ? (
                            <button
                              onClick={() => handleApprove(shift.id)}
                              disabled={isApproving === shift.id}
                              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-lg text-[10px] hover:from-indigo-500 hover:to-violet-500 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                            >
                              {isApproving === shift.id ? 'Aprobando...' : 'Aprobar Cierre'}
                            </button>
                          ) : shift.status === 'CLOSED' ? (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Aprobado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">No requiere</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
