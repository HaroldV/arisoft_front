'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Search, Loader2, CheckCircle, AlertCircle, X, Package } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { InventoryProduct } from '../types/stock.types';

export interface ProductComponentItem {
  id?: string;
  child_product_id: string;
  child_product?: InventoryProduct;
  quantity: number;
  unit_cost_at_definition?: number;
}

interface ProductComponentsModalProps {
  product: InventoryProduct;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductComponentsModal: React.FC<ProductComponentsModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [components, setComponents] = useState<{ childProductId: string; quantity: number; unitCostAtDefinition: number; childName: string; childSku: string }[]>([]);
  const [allProducts, setAllProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form para agregar nuevo componente
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [componentQty, setComponentQty] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Cargar productos disponibles para componentes
        const prodRes = await apiClient.get('/inventory/products');
        const available = (prodRes.data?.data || prodRes.data || []).filter((p: InventoryProduct) => p.id !== product.id);
        setAllProducts(available);

        // 2. Cargar componentes actuales
        const compRes = await apiClient.get(`/inventory/products/${product.id}/components`);
        const currentComps = compRes.data || [];
        setComponents(
          currentComps.map((c: any) => ({
            childProductId: c.child_product_id,
            quantity: Number(c.quantity),
            unitCostAtDefinition: Number(c.unit_cost_at_definition || 0),
            childName: c.child_product?.name || 'Producto Componente',
            childSku: c.child_product?.sku || '',
          }))
        );
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar los componentes del producto.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, product.id]);

  if (!isOpen) return null;

  const handleAddComponent = () => {
    if (!selectedChildId) return;
    const child = allProducts.find(p => p.id === selectedChildId);
    if (!child) return;

    if (components.some(c => c.childProductId === selectedChildId)) {
      setError('Este producto ya está agregado en la receta.');
      return;
    }

    setComponents(prev => [
      ...prev,
      {
        childProductId: child.id,
        quantity: componentQty > 0 ? componentQty : 1,
        unitCostAtDefinition: Number(child.costUsd || 0),
        childName: child.name,
        childSku: child.sku,
      },
    ]);

    setSelectedChildId('');
    setSearchQuery('');
    setComponentQty(1);
    setError(null);
  };

  const handleRemoveComponent = (childId: string) => {
    setComponents(prev => prev.filter(c => c.childProductId !== childId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.post(`/inventory/products/${product.id}/components`, {
        components: components.map(c => ({
          childProductId: c.childProductId,
          quantity: c.quantity,
          unitCostAtDefinition: c.unitCostAtDefinition,
        })),
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar los componentes.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCalculatedCost = components.reduce((sum, c) => sum + (c.quantity * c.unitCostAtDefinition), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Componentes / Receta del Producto Compuesto
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {product.name} • SKU: <span className="font-mono font-semibold">{product.sku}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Componentes guardados exitosamente!</span>
            </div>
          )}

          {/* Banner Informativo */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/40 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 block">
                Definición de Bulto / Combo
              </span>
              <p className="text-xs text-slate-600">
                Los productos configurados aquí podrán desarmarse en unidades en el POS o venderse como bulto cerrado.
              </p>
            </div>
            <div className="text-right shrink-0 bg-white/90 border border-indigo-100 px-3.5 py-2 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Costo Base Calculado</span>
              <span className="font-mono font-black text-sm text-indigo-900">${totalCalculatedCost.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Selector de Nuevo Componente */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Agregar Producto a la Receta
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8 space-y-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchQuery && (
                  <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg mt-1 p-1 space-y-1 z-10">
                    {filteredProducts.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedChildId(p.id);
                          setSearchQuery(`${p.name} (${p.sku})`);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-50 flex justify-between items-center transition-all cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                        <span className="font-mono text-slate-500 text-[10px] shrink-0 ml-2">{p.sku} • ${Number(p.costUsd || 0).toFixed(2)}</span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="p-2 text-center text-xs text-slate-400">No se encontraron productos</div>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={componentQty}
                  onChange={(e) => setComponentQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddComponent}
                  disabled={!selectedChildId}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Componentes Actuales */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Componentes Configurados ({components.length})
            </span>
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-xs">Cargando receta...</span>
              </div>
            ) : components.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-1">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Este producto es actualmente Simple</p>
                <p className="text-[11px] text-slate-400">Agrega componentes arriba para transformarlo en Bulto o Combo.</p>
              </div>
            ) : (
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Producto Componente</th>
                      <th className="px-4 py-3 text-center">Cantidad en Combo</th>
                      <th className="px-4 py-3 text-right">Costo Unitario ($)</th>
                      <th className="px-4 py-3 text-right">Subtotal ($)</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {components.map((c) => (
                      <tr key={c.childProductId} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{c.childName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{c.childSku}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg">
                            {c.quantity} unidades
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                          ${c.unitCostAtDefinition.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ${(c.quantity * c.unitCostAtDefinition).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(c.childProductId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Eliminar de la receta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Fijo */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
            <span>{isSaving ? 'Guardando...' : 'Guardar Componentes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
