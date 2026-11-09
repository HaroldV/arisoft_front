'use client';

import React, { useState } from 'react';
import { Package, Scissors, Loader2, AlertCircle, CheckCircle, X, Sparkles, ArrowRight } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

export interface ParentBundleOption {
  bundle_id: string;
  bundle_name: string;
  bundle_sku: string;
  bundle_price_usd: number;
  units_per_bundle: number;
  available_bundles: number;
}

interface SmartDeBundleModalProps {
  isOpen: boolean;
  childProduct: {
    id: string;
    name: string;
    sku: string;
    current_stock?: number;
  } | null;
  parentBundles: ParentBundleOption[];
  warehouseId?: string;
  onClose: () => void;
  onSuccess: (addedUnits: number) => void;
}

export const SmartDeBundleModal: React.FC<SmartDeBundleModalProps> = ({
  isOpen,
  childProduct,
  parentBundles,
  warehouseId,
  onClose,
  onSuccess,
}) => {
  const [selectedBundleId, setSelectedBundleId] = useState<string>(
    parentBundles.length > 0 ? parentBundles[0].bundle_id : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !childProduct || parentBundles.length === 0) return null;

  const currentBundle = parentBundles.find(b => b.bundle_id === selectedBundleId) || parentBundles[0];

  const handleConfirmDisassemble = async () => {
    if (!warehouseId) {
      setError('No se ha detectado el almacén activo de la sucursal.');
      return;
    }
    if (!currentBundle || currentBundle.available_bundles < 1) {
      setError('No hay existencias disponibles de este bulto.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/inventory/products/${currentBundle.bundle_id}/disassemble`, {
        warehouseId,
        bundlesToDisassemble: 1,
        notes: `Desarmado inteligente en POS para abastecer '${childProduct.name}'`,
      });

      onSuccess(currentBundle.units_per_bundle);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desarmar el bulto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Fijo Luminous Executive */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl p-2.5 shadow-md shadow-amber-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Abastecimiento Rápido de Stock en POS
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Desarmado asistido de bultos cerrados
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

        {/* Cuerpo */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Estado de Anaquel Actual */}
          <div className="p-3.5 bg-rose-50/60 border border-rose-200/60 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Stock Actual en Anaquel</span>
              <p className="font-bold text-slate-900 text-sm">{childProduct.name}</p>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-sm text-rose-700">
                {childProduct.current_stock ?? 0} unidades
              </span>
              <span className="text-[10px] text-rose-500 block">Agotado / Insuficiente</span>
            </div>
          </div>

          {/* Opciones de Bulto Disponibles */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Bulto Disponible para Romper / Desarmar:
            </label>
            
            {parentBundles.map(bundle => (
              <label
                key={bundle.bundle_id}
                onClick={() => setSelectedBundleId(bundle.bundle_id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedBundleId === bundle.bundle_id
                    ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/20 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-amber-600 shrink-0">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{bundle.bundle_name}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      SKU: {bundle.bundle_sku} • Disponibles: <strong className="text-slate-800">{bundle.available_bundles} bultos</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                    +{bundle.units_per_bundle} unidades
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 leading-relaxed">
            💡 Al confirmar, el sistema restará <strong>1 bulto</strong> del depósito y sumará inmediatamente <strong>+{currentBundle?.units_per_bundle} unidades</strong> sueltas para completar la venta.
          </div>
        </div>

        {/* Footer Fijo */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmDisassemble}
            disabled={isSubmitting || !currentBundle || currentBundle.available_bundles < 1}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-amber-200 transition-all cursor-pointer disabled:opacity-40 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Desarmando...</span>
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                <span>Romper 1 Bulto (+{currentBundle?.units_per_bundle || 20} un)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
