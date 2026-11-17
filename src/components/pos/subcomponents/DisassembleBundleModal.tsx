'use client';

import React, { useState } from 'react';
import { Package, Scissors, Loader2, AlertCircle, CheckCircle, X, Layers } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

export interface DisassembleModalProps {
  isOpen: boolean;
  product: {
    id: string;
    name: string;
    sku: string;
    current_stock?: number;
  } | null;
  warehouseId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisassembleBundleModal: React.FC<DisassembleModalProps> = ({
  isOpen,
  product,
  warehouseId,
  onClose,
  onSuccess,
}) => {
  const [bundlesToDisassemble, setBundlesToDisassemble] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      setError('No se ha detectado el almacén activo de la sucursal.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await apiClient.post(`/inventory/products/${product.id}/disassemble`, {
        warehouseId,
        bundlesToDisassemble,
        notes: notes.trim() || 'Desarmado rápido desde POS para venta al detal',
      });

      setSuccessMsg(response.data?.message || 'Bulto desarmado exitosamente.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desarmar el bulto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-700 rounded-xl p-2.5 shadow-xs flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Desarmar Bulto / Combo
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Convertir bulto cerrado a unidades sueltas
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Producto a Desarmar</span>
            <p className="font-bold text-slate-900 text-sm">{product.name}</p>
            <div className="flex items-center gap-2 pt-1 font-mono text-xs">
              <span className="text-slate-500">SKU: {product.sku}</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-bold">Disponible: {product.current_stock ?? '—'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Cantidad de Bultos a Romper / Desarmar <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              max={product.current_stock && product.current_stock > 0 ? product.current_stock : 999}
              required
              value={bundlesToDisassemble}
              onChange={(e) => setBundlesToDisassemble(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Se restará {bundlesToDisassemble} bulto(s) y se ingresarán automáticamente las unidades de su receta al almacén.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Motivo o Notas (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Cliente solicitó 3 paquetes sueltos"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (product.current_stock !== undefined && product.current_stock < 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-amber-200 transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Desarmando...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Desarmar Bulto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
