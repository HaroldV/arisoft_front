'use client';

import React, { useState } from 'react';
import { Scissors, Loader2, AlertCircle, CheckCircle, X, Layers, ArrowRight } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

export interface InventoryDisassembleModalProps {
  isOpen: boolean;
  bundle: {
    parent_id: string;
    parent_name: string;
    parent_sku: string;
    parent_stock: number;
    child_id: string;
    child_name: string;
    child_sku: string;
    child_stock: number;
    units_per_bundle: number;
  } | null;
  warehouses: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export const InventoryDisassembleModal: React.FC<InventoryDisassembleModalProps> = ({
  isOpen,
  bundle,
  warehouses,
  onClose,
  onSuccess,
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    warehouses[0]?.id || ''
  );
  const [bundlesToDisassemble, setBundlesToDisassemble] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (warehouses.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(warehouses[0].id);
      }
      setBundlesToDisassemble(1);
      setNotes('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, warehouses]);

  if (!isOpen || !bundle) return null;

  const totalUnitsYielded = (bundlesToDisassemble || 0) * (bundle.units_per_bundle || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) {
      setError('Por favor selecciona el almacén donde se realizará el desempacado.');
      return;
    }

    if (bundlesToDisassemble <= 0) {
      setError('La cantidad de bultos a abrir debe ser mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await apiClient.post(`/inventory/products/${bundle.parent_id}/disassemble`, {
        warehouseId: selectedWarehouseId,
        bundlesToDisassemble,
        notes: notes.trim() || 'Apertura de bultos recibidos para abastecer anaqueles / venta al detal',
      });

      setSuccessMsg(response.data?.message || 'Bultos desestructurados exitosamente.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1300);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desestructurar el bulto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Fijo Luminous Executive */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-amber-100 text-amber-700 rounded-xl p-2.5 shadow-xs flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Abrir / Desestructurar Bulto
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pasa bultos recibidos del almacén a unidades sueltas para venta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Selector de Almacén */}
          {warehouses.length > 1 ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Almacén Origen / Destino <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            warehouses[0] && (
              <div className="text-[11px] text-slate-500 font-medium">
                Almacén de destino: <strong className="text-slate-800">{warehouses[0].name}</strong>
              </div>
            )
          )}

          {/* Tarjeta Visual de Conversión */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="uppercase tracking-wider">Flujo de Desestructuración</span>
              <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                1 Bulto = {bundle.units_per_bundle} unidades
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
              {/* Bulto Padre */}
              <div className="sm:col-span-5 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Bulto Cerrado</span>
                <p className="font-bold text-slate-900 text-xs truncate mt-0.5">{bundle.parent_name}</p>
                <div className="flex justify-between items-center mt-1 text-[11px] font-mono text-slate-500">
                  <span>SKU: {bundle.parent_sku}</span>
                  <span className="text-amber-700 font-bold">Stock: {bundle.parent_stock}</span>
                </div>
              </div>

              {/* Flecha */}
              <div className="sm:col-span-1 flex justify-center">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-full">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Producto Hijo */}
              <div className="sm:col-span-5 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Unidades a Detal</span>
                <p className="font-bold text-slate-900 text-xs truncate mt-0.5">{bundle.child_name}</p>
                <div className="flex justify-between items-center mt-1 text-[11px] font-mono text-slate-500">
                  <span>SKU: {bundle.child_sku}</span>
                  <span className="text-emerald-700 font-bold">Stock: {bundle.child_stock}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cantidad a Desarmar */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              ¿Cuántos Bultos deseas abrir? <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                max={bundle.parent_stock > 0 ? bundle.parent_stock : 9999}
                required
                value={bundlesToDisassemble}
                onChange={(e) => setBundlesToDisassemble(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-black text-center text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Resumen Calculado en Vivo */}
          <div className="p-4 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/60 border border-amber-200/70 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
            <div>
              <span className="font-bold text-slate-900 block text-xs">Resultado de la Operación:</span>
              <span className="text-slate-600 text-[11px] mt-0.5 block">
                Se descontarán <strong className="text-rose-600 font-mono">-{bundlesToDisassemble} bulto(s)</strong> y se sumarán:
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-base text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs inline-block">
                +{totalUnitsYielded} {totalUnitsYielded === 1 ? 'unidad' : 'unidades / kg'}
              </span>
            </div>
          </div>

          {/* Justificación o Nota Opcional */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Justificación / Notas (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Bultos recibidos de factura #4821 para pasar al anaquel"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            />
          </div>

          {/* Footer Fijo */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || bundle.parent_stock <= 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl text-sm shadow-md shadow-amber-200 transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Scissors className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Procesando...' : 'Confirmar Apertura de Bultos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
