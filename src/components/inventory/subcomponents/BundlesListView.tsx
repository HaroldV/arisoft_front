'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Package, 
  ArrowRight, 
  Sparkles,
  Scissors
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { InventoryProduct } from '../types/stock.types';
import { LinkBundleModal } from './LinkBundleModal';
import { InventoryDisassembleModal } from './InventoryDisassembleModal';

interface BundlesListViewProps {
  products: InventoryProduct[];
  warehouses?: { id: string; name: string }[];
  onRefresh: () => void;
}

interface BundleRelationItem {
  parent_id: string;
  parent_name: string;
  parent_sku: string;
  parent_stock: number;
  child_id: string;
  child_name: string;
  child_sku: string;
  child_stock: number;
  units_per_bundle: number;
}

export const BundlesListView: React.FC<BundlesListViewProps> = ({ products, warehouses = [], onRefresh }) => {
  const [bundlesList, setBundlesList] = useState<BundleRelationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [deletingParentId, setDeletingParentId] = useState<string | null>(null);
  const [disassemblingBundle, setDisassemblingBundle] = useState<BundleRelationItem | null>(null);

  const loadBundles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const compoundProducts = products.filter(p => p.product_type === 'COMPOUND' || p.productType === 'COMPOUND');
      
      const loaded: BundleRelationItem[] = [];
      for (const comp of compoundProducts) {
        try {
          const res = await apiClient.get(`/inventory/products/${comp.id}/components`);
          const items = res.data || [];
          for (const item of items) {
            loaded.push({
              parent_id: comp.id,
              parent_name: comp.name,
              parent_sku: comp.sku,
              parent_stock: comp.current_stock ?? 0,
              child_id: item.child_product_id,
              child_name: item.child_product?.name || 'Producto Unitario',
              child_sku: item.child_product?.sku || '',
              child_stock: item.child_product?.current_stock ?? 0,
              units_per_bundle: Number(item.quantity),
            });
          }
        } catch {
          // Ignorar silenciosamente si no tiene componentes
        }
      }
      setBundlesList(loaded);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las vinculaciones de bultos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBundles();
  }, [products]);

  const handleUnlink = async (parentId: string) => {
    if (!confirm('¿Deseas desvincular este bulto? Volverá a ser un producto simple.')) return;
    setDeletingParentId(parentId);
    try {
      await apiClient.post(`/inventory/products/${parentId}/components`, { components: [] });
      await loadBundles();
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al desvincular.');
    } finally {
      setDeletingParentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Cabecera y Acción */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Bultos y Empaques al Mayor
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Gestiona productos compuestos y equivalencias para desarmado en POS
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLinkModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Vincular Bulto con Unidades</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Listado de Vinculaciones Activas */}
      {isLoading ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Cargando relaciones de bultos...</span>
        </div>
      ) : bundlesList.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-100 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-900 text-base">No hay bultos vinculados aún</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Registra tu bulto y tu producto unitario en el inventario como siempre lo haces, y luego vincúlalos con el botón superior para habilitar el desarmado en el POS.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primera vinculación</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundlesList.map((bundle) => (
            <div
              key={`${bundle.parent_id}-${bundle.child_id}`}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Tarjeta de Relación */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Bulto al Mayor
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    Stock: {bundle.parent_stock} bultos
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{bundle.parent_name}</h4>
                  <span className="font-mono text-[10px] text-slate-400">SKU: {bundle.parent_sku}</span>
                </div>

                {/* Flecha de transformación */}
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-slate-700">
                    Rinde <strong className="text-indigo-600 font-mono font-bold">+{bundle.units_per_bundle}</strong> unidades de:
                  </div>
                </div>

                {/* Producto Unitario Hijo */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Producto Unitario</span>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">{bundle.child_name}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-500">
                    <span>SKU: {bundle.child_sku}</span>
                    <span>Stock actual: {bundle.child_stock} un.</span>
                  </div>
                </div>
              </div>

              {/* Acciones de la tarjeta */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDisassemblingBundle(bundle)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
                >
                  <Scissors className="w-3.5 h-3.5 text-amber-700" />
                  <span>Abrir / Desestructurar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnlink(bundle.parent_id)}
                  disabled={deletingParentId === bundle.parent_id}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  {deletingParentId === bundle.parent_id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Desvincular</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Nueva Vinculación */}
      <LinkBundleModal
        isOpen={isLinkModalOpen}
        products={products}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={() => {
          loadBundles();
          onRefresh();
        }}
      />

      {/* Modal de Desestructuración / Apertura de Bultos */}
      {disassemblingBundle && (
        <InventoryDisassembleModal
          isOpen={!!disassemblingBundle}
          bundle={disassemblingBundle}
          warehouses={warehouses}
          onClose={() => setDisassemblingBundle(null)}
          onSuccess={() => {
            loadBundles();
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
