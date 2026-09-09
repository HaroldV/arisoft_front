'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle, Loader2, Check } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { InventoryProduct } from '../types/stock.types';

interface BulkTransferModalProps {
  products: InventoryProduct[];
  warehouses: { id: string; name: string; type?: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkTransferModal: React.FC<BulkTransferModalProps> = ({
  products,
  warehouses,
  onClose,
  onSuccess,
}) => {
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string>(
    warehouses.length > 0 ? warehouses[0].id : ''
  );
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>(
    warehouses.length > 1 ? warehouses[1].id : ''
  );

  // Sync state if warehouses prop changes dynamically
  React.useEffect(() => {
    if (warehouses.length > 0) {
      if (!sourceWarehouseId || !warehouses.some(w => w.id === sourceWarehouseId)) {
        setSourceWarehouseId(warehouses[0].id);
      }
      const otherWh = warehouses.find(w => w.id !== (sourceWarehouseId || warehouses[0].id));
      if (otherWh && (!destinationWarehouseId || destinationWarehouseId === sourceWarehouseId)) {
        setDestinationWarehouseId(otherWh.id);
      }
    }
  }, [warehouses]);

  const [justification, setJustification] = useState<string>('Reubicación interna de inventario');
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.id] = p.current_stock && p.current_stock > 0 ? p.current_stock : 1;
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSourceChange = (newSourceId: string) => {
    setSourceWarehouseId(newSourceId);
    if (newSourceId === destinationWarehouseId) {
      const nextAvailable = warehouses.find((w) => w.id !== newSourceId);
      if (nextAvailable) {
        setDestinationWarehouseId(nextAvailable.id);
      }
    }
  };

  const handleQuantityChange = (productId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !destinationWarehouseId) {
      setError('Debes seleccionar un almacén de origen y un almacén de destino.');
      return;
    }

    if (sourceWarehouseId === destinationWarehouseId) {
      setError('El almacén de origen y el almacén de destino no pueden ser el mismo.');
      return;
    }

    if (products.length === 0) {
      setError('No hay productos seleccionados para transferir.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Execute transfers for each selected product
      for (const prod of products) {
        const qty = quantities[prod.id] || 1;
        await apiClient.post('/inventory/moves/transfer', {
          product_id: prod.id,
          quantity: qty,
          source_location_id: sourceWarehouseId,
          destination_location_id: destinationWarehouseId,
          justification: justification.trim() || 'Transferencia entre almacenes',
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error during bulk transfer:', err);
      setError(err.response?.data?.message || 'Error al procesar la transferencia de inventario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header (Fixed Top) */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Trasladar Stock entre Almacenes
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mover {products.length} producto(s) seleccionado(s) a otra ubicación
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

        {/* Form Body (Scrollable Center) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Warehouse Route Selection Card */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              
              {/* Source Warehouse */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Almacén Origen (Salida)
                </label>
                <div className="relative">
                  <select
                    value={sourceWarehouseId}
                    onChange={(e) => handleSourceChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-2xs"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        🏢 {wh.name} {wh.type ? `(${wh.type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destination Warehouse */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Almacén Destino (Entrada)
                </label>
                <div className="relative">
                  <select
                    value={destinationWarehouseId}
                    onChange={(e) => setDestinationWarehouseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-2xs"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id} disabled={wh.id === sourceWarehouseId}>
                        🏢 {wh.name} {wh.id === sourceWarehouseId ? '(Origen actual - no seleccionable)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Justification Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Motivo / Justificación del Traslado
            </label>
            <input
              type="text"
              required
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ej. Reabastecimiento de sucursal centro, balanceo de stock..."
              className="w-full px-4 py-2 bg-slate-50/80 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Products to Transfer Table */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Cantidades a Transferir por Producto ({products.length})
            </label>
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">SKU / Producto</th>
                      <th className="py-2.5 px-4 text-center">Stock Actual</th>
                      <th className="py-2.5 px-4 text-right">Cant. a Trasladar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600">
                          {p.current_stock ?? 0} {p.unit_of_measure ?? 'un'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="1"
                            value={quantities[p.id] ?? 1}
                            onChange={(e) => handleQuantityChange(p.id, Number(e.target.value))}
                            className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-right font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer (Fixed Bottom) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || products.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando traslado...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Traslado ({products.length})</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
