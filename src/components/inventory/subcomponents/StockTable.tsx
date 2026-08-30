'use client';

import React from 'react';
import { Package, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ActionTooltip } from '@/components/ActionTooltip';
import { InventoryProduct, SortField, SortOrder } from '../types/stock.types';

interface StockTableProps {
  products: InventoryProduct[];
  isLoading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  onToggleSort: (field: SortField) => void;
  onEdit: (product: InventoryProduct) => void;
  onDelete: (productId: string) => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  products,
  isLoading,
  sortField,
  sortOrder,
  onToggleSort,
  onEdit,
  onDelete,
}) => {
  const getStockBadge = (stock: number) => {
    if (stock > 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          {stock} un
        </span>
      );
    }
    if (stock > 0 && stock <= 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          {stock} un (Bajo)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
        <XCircle className="h-3.5 w-3.5 text-rose-500" />
        Sin Stock
      </span>
    );
  };

  if (!isLoading && products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center space-y-2">
        <Package className="h-10 w-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-700">No se encontraron productos con los filtros aplicados</p>
        <p className="text-xs text-slate-400">Modifica los criterios de búsqueda o haz clic en "Limpiar".</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {/* SKU Header */}
              <th 
                onClick={() => onToggleSort('sku')}
                className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>SKU</span>
                  {sortField === 'sku' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary-600" /> : <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>

              {/* Name Header */}
              <th 
                onClick={() => onToggleSort('name')}
                className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Nombre del Producto</span>
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary-600" /> : <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>

              {/* Category Header */}
              <th 
                onClick={() => onToggleSort('category')}
                className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Categoría</span>
                  {sortField === 'category' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary-600" /> : <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>

              <th className="py-4 px-6">Medida</th>

              {/* Cost Header */}
              <th 
                onClick={() => onToggleSort('costUsd')}
                className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Costo (USD)</span>
                  {sortField === 'costUsd' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary-600" /> : <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>

              {/* Price Header */}
              <th 
                onClick={() => onToggleSort('priceUsd')}
                className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Precio (USD)</span>
                  {sortField === 'priceUsd' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary-600" /> : <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>

              <th className="py-4 px-6">IVA</th>

              {/* Stock Header */}
              <th 
                onClick={() => onToggleSort('current_stock')}
                className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Stock Disponible</span>
                  {sortField === 'current_stock' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary-600" /> : <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>

              <th className="py-4 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">
                  <span className="bg-slate-100/90 border border-slate-200/70 px-2.5 py-1 rounded-md">
                    {product.sku}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <p className="font-bold text-slate-900">{product.name}</p>
                    {product.created_by_user_name && (
                      <p className="text-[10px] text-slate-400 font-normal">
                        Reg: {product.created_by_user_name}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-600 font-medium">{product.category ?? 'General'}</td>
                <td className="py-4 px-6 text-slate-500 font-mono text-xs">{product.unit_of_measure ?? 'unidades'}</td>
                <td className="py-4 px-6 font-medium text-slate-800">${Number(product.costUsd ?? 0).toFixed(2)}</td>
                <td className="py-4 px-6 font-bold text-indigo-600 font-mono">${Number(product.priceUsd ?? 0).toFixed(2)}</td>
                <td className="py-4 px-6">
                  {product.tax_type === 'EXEMPT' ? (
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded">Exento</span>
                  ) : product.tax_type === 'EXONERATED' ? (
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-semibold px-2 py-0.5 rounded">Exonerado</span>
                  ) : (
                    <span className="text-slate-700 font-mono text-xs font-semibold">{product.taxRate ?? 16}%</span>
                  )}
                </td>
                <td className="py-4 px-6">{getStockBadge(product.current_stock ?? 0)}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <ActionTooltip content="Editar producto">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </ActionTooltip>
                    <ActionTooltip content="Desactivar producto">
                      <button
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </ActionTooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
