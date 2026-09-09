'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, Building2, Warehouse, DollarSign, Package, X, Loader2, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { ShiftDetailsData } from './types';

interface ShiftDetailsModalProps {
  isOpen: boolean;
  shiftId: string | null;
  onClose: () => void;
  onApproveSuccess: () => void;
}

export const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({
  isOpen,
  shiftId,
  onClose,
  onApproveSuccess,
}) => {
  const [data, setData] = useState<ShiftDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !shiftId) {
      setData(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/pos/shifts/${shiftId}/details`);
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar los detalles del arqueo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, shiftId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!shiftId) return;
    if (!confirm('¿Aprobar el arqueo y registrar los fondos liquidados en Cuentas y Bancos?')) return;
    setIsApproving(true);
    try {
      await apiClient.post(`/pos/shifts/${shiftId}/approve`);
      onApproveSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aprobar el turno.');
    } finally {
      setIsApproving(false);
    }
  };

  const shift = data?.shift;
  const isPending = shift?.status === 'PENDING_APPROVAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Auditoría de Cierre y Desglose de Ventas
                </h3>
                {shift && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    shift.status === 'CLOSED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : shift.status === 'PENDING_APPROVAL'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {shift.status === 'CLOSED' ? 'Aprobado y Liquidado' : shift.status === 'PENDING_APPROVAL' ? 'Pendiente de Aprobación' : 'Turno Abierto'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Desglose de efectivo, medios de pago y mercancía despachada en la jornada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="text-sm font-medium text-slate-500">Cargando desglose de arqueo...</span>
            </div>
          ) : error || !data ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
              {error || 'No se encontraron datos del turno.'}
            </div>
          ) : (
            <>
              {/* Luminous Executive Financial Balance Banner */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white/95 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Total Facturado
                    </span>
                    <div className="font-mono font-black text-xl text-slate-900">
                      ${data.stats.total_billed_usd.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {data.stats.sales_count} ventas procesadas
                    </span>
                  </div>

                  <div className="bg-white/95 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Efectivo Esperado ($/Bs)
                    </span>
                    <div className="font-mono font-bold text-sm text-slate-800">
                      ${Number(shift?.expected_cash_usd || 0).toFixed(2)}
                    </div>
                    <div className="font-mono text-xs text-slate-500">
                      Bs. {Number(shift?.expected_cash_ves || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-white/95 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Efectivo Declarado ($/Bs)
                    </span>
                    <div className="font-mono font-bold text-sm text-slate-800">
                      ${Number(shift?.declared_cash_usd || 0).toFixed(2)}
                    </div>
                    <div className="font-mono text-xs text-slate-500">
                      Bs. {Number(shift?.declared_cash_ves || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 shadow-2xs border ${
                    Math.abs(Number(shift?.discrepancy_usd || 0)) < 0.01 && Math.abs(Number(shift?.discrepancy_ves || 0)) < 0.01
                      ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800'
                      : 'bg-amber-50/80 border-amber-200/80 text-amber-800'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
                      Descuadre / Arqueo
                    </span>
                    <div className="font-mono font-black text-lg">
                      {Number(shift?.discrepancy_usd || 0) >= 0 ? '+' : ''}${Number(shift?.discrepancy_usd || 0).toFixed(2)}
                    </div>
                    <div className="font-mono text-xs">
                      {Number(shift?.discrepancy_ves || 0) >= 0 ? '+' : ''}Bs. {Number(shift?.discrepancy_ves || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 4 Columnas: Metadatos del Turno */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Sucursal & Almacén
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{shift?.branch?.name || 'Sede Principal'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {shift?.branch?.default_warehouse?.name || 'Almacén Central'}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Cajero Responsable
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{shift?.cashier?.full_name || 'Cajero'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {shift?.cashier?.email || 'N/A'}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Apertura
                  </span>
                  <span className="font-bold text-slate-900 text-xs block">
                    {new Date(shift?.opened_at || '').toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                    Fondo: ${Number(shift?.opening_balance_usd || 0).toFixed(2)} | Bs. {Number(shift?.opening_balance_ves || 0).toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Cierre
                  </span>
                  <span className="font-bold text-slate-900 text-xs block">
                    {shift?.closed_at ? new Date(shift.closed_at).toLocaleString() : 'En curso'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Auditoría de jornada
                  </span>
                </div>
              </div>

              {/* Medios de Pago Recaudados */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <span>Resumen de Recaudación por Método de Pago</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.payments_summary.map((p, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {p.method}
                      </span>
                      <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                        ${p.total_usd.toFixed(2)}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {p.currency} {p.total_original.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table de Renglones Vendidos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Mercancía Despachada en la Sucursal</span>
                </h4>
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4 text-center">Unidades</th>
                        <th className="py-3 px-4 text-right">Monto Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.products_sold.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            No se registraron ventas de mercancía en este turno.
                          </td>
                        </tr>
                      ) : (
                        data.products_sold.map((prod) => (
                          <tr key={prod.product_id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                              {prod.sku}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {prod.name}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-xl text-xs">
                                {prod.quantity}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              ${prod.total_usd.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
          >
            Cerrar
          </button>

          {isPending && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Aprobar Arqueo & Liquidar en Cuentas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
