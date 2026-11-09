'use client';

import React from 'react';
import { 
  Building2, 
  Plus, 
  Minus, 
  Trash2, 
  Scissors 
} from 'lucide-react';
import { QuotationProduct, QuotationCartItem } from '../types';

interface ProductCatalogProps {
  products: QuotationProduct[];
  viewMode: 'GRID' | 'LIST';
  exchangeRate: number;
  onAddToCart: (product: QuotationProduct) => void;
  onSelectVariation?: (product: QuotationProduct) => void;
}

export const QuotationProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  viewMode,
  exchangeRate,
  onAddToCart,
}) => {
  if (products.length === 0) {
    return null;
  }

  if (viewMode === 'LIST') {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="divide-y divide-slate-100">
          {products.map((p) => {
            const stock = p.current_stock ?? 0;
            const isCritical = stock <= 5 && stock > 0;
            const isOut = stock <= 0;

            const alternateStocks = (p.warehouse_stocks || []).filter(ws => ws.stock > 0);
            const hasAlternateStock = alternateStocks.length > 0;
            const primaryAlt = alternateStocks[0];
            const altLocationLabel = primaryAlt 
              ? (primaryAlt.branch_name || primaryAlt.warehouse_name) 
              : null;

            return (
              <div
                key={p.id}
                onClick={() => onAddToCart(p)}
                className={`p-3 transition-colors flex items-center justify-between gap-3 cursor-pointer group select-none ${
                  isOut ? 'hover:bg-slate-50 opacity-90' : 'hover:bg-indigo-50/40 active:bg-indigo-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100/90 border border-slate-200/70 px-2 py-0.5 rounded-md shrink-0">
                    {p.sku}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition-colors">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.variations && p.variations.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-full">
                          {p.variations.length} {p.variations.length === 1 ? 'Variante' : 'Variantes'}
                        </span>
                      )}
                      
                      {!isOut ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isCritical 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isCritical ? 'Stock Crítico' : 'Disponible'}
                        </span>
                      ) : hasAlternateStock ? (
                        <span 
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1.5 max-w-full truncate shadow-2xs"
                          title={`Disponible en ${alternateStocks.map(a => `${a.branch_name || a.warehouse_name} (${a.stock} un)`).join(', ')}`}
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                          <span className="truncate">
                            📍 En {altLocationLabel}: <strong>{primaryAlt.stock} un</strong>
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                          Sin Stock (Cotizable)
                        </span>
                      )}

                      <span className="text-[11px] text-slate-500 font-medium">
                        Stock: <strong className={`font-mono ${isOut ? 'text-amber-600 font-bold' : 'text-slate-700'}`}>{stock} un</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-black text-slate-900 font-mono leading-tight">
                      ${(p.priceUsd ?? 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 font-mono">
                      Bs. {((p.priceUsd ?? 0) * exchangeRate).toFixed(2)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(p);
                    }}
                    className="p-2 rounded-xl border border-indigo-200/70 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-2xs cursor-pointer active:scale-90"
                    title="Añadir a la cotización"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // GRID VIEW
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map((p) => {
        const stock = p.current_stock ?? 0;
        const isCritical = stock <= 5 && stock > 0;
        const isOut = stock <= 0;

        return (
          <div
            key={p.id}
            onClick={() => onAddToCart(p)}
            className="group relative bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                  {p.sku}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                  isOut 
                    ? 'bg-slate-100 text-slate-600 border-slate-200' 
                    : isCritical 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {stock} un
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {p.name}
              </h4>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  ${(p.priceUsd ?? 0).toFixed(2)}
                </div>
                <div className="text-[10px] font-bold text-slate-400 font-mono">
                  Bs. {((p.priceUsd ?? 0) * exchangeRate).toFixed(2)}
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs">
                <Plus className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
