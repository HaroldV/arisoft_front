'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  FileText, 
  Percent, 
  ChevronLeft 
} from 'lucide-react';
import { QuotationCartItem, QuotationClient } from '../types';

interface QuotationCartSidebarProps {
  cart: QuotationCartItem[];
  clients: QuotationClient[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  discountPercent: number;
  onDiscountPercentChange: (val: number) => void;
  applyTax: boolean;
  onToggleApplyTax: (val: boolean) => void;
  onUpdateQuantity: (productId: string, delta: number, variationName?: string) => void;
  onRemoveItem: (productId: string, variationName?: string) => void;
  onGenerateQuotationClick: () => void;
  onOpenQuickClientModal: () => void;
  onCloseMobileCart: () => void;
  userName?: string;
}

export const QuotationCartSidebar: React.FC<QuotationCartSidebarProps> = ({
  cart,
  clients,
  selectedClientId,
  onSelectClient,
  exchangeRate,
  onExchangeRateChange,
  discountPercent,
  onDiscountPercentChange,
  applyTax,
  onToggleApplyTax,
  onUpdateQuantity,
  onRemoveItem,
  onGenerateQuotationClick,
  onOpenQuickClientModal,
  onCloseMobileCart,
  userName,
}) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.product.priceUsd * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = applyTax ? (taxableBase * 0.16) : 0;
  const totalUsd = taxableBase + taxAmount;
  const totalBs = totalUsd * exchangeRate;
  const totalItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Seller Header Banner */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onCloseMobileCart}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer lg:hidden"
            title="Volver al catálogo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              Vendedor / Asesor
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {userName || 'Vendedor'}
            </span>
          </div>
        </div>
        <div className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] font-bold text-indigo-700">
          Cotización
        </div>
      </div>

      {/* Client select block */}
      <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Cliente Prospecto
          </span>
          <button
            type="button"
            onClick={onOpenQuickClientModal}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar rápido
          </button>
        </div>
        
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
            value={selectedClientId}
            onChange={(e) => onSelectClient(e.target.value)}
          >
            <option value="">-- Cliente Genérico (Mostrador) --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.tax_id ? `(${c.tax_id})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold">Tasa (VES/USD)</span>
            <Link
              href="/settings/company"
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 hover:border-indigo-200 px-1.5 py-0.5 rounded-md transition-all flex items-center gap-0.5"
            >
              ⚙️
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.01"
              className="w-24 text-right text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              value={exchangeRate}
              onChange={(e) => onExchangeRateChange(Number(e.target.value))}
            />
            <span className="text-[10px] font-bold text-slate-400 font-mono">Bs.</span>
          </div>
        </div>
      </div>

      {/* Cart Items list */}
      <div className="flex-1 min-h-[140px] max-h-[30vh] lg:max-h-none p-3.5 overflow-y-auto custom-scrollbar space-y-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-slate-50/95 py-1 z-10 backdrop-blur-xs">
          <ShoppingCart className="h-4 w-4 text-indigo-600" />
          Productos a Cotizar ({totalItemsCount})
        </h3>

        {cart.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <ShoppingCart className="h-7 w-7 text-slate-300 stroke-[1.5]" />
            <p>Selecciona productos del catálogo para armar la cotización</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item, idx) => (
              <div 
                key={`${item.product.id}-${item.variation?.name || 'main'}-${idx}`} 
                className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2.5 shadow-2xs hover:border-indigo-200 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-800 text-xs truncate">
                    {item.product.name}
                  </h5>
                  {item.variation && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded">
                        {item.variation.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold text-indigo-600 font-mono">
                      ${item.product.priceUsd.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({(item.product.priceUsd * exchangeRate).toFixed(2)} Bs.)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product.id, -1, item.variation?.name)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center font-bold text-xs text-slate-800 font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product.id, 1, item.variation?.name)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product.id, item.variation?.name)}
                    className="p-1 hover:bg-rose-50 text-rose-500 rounded ml-0.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals panel & Generar Cotización CTA */}
      <div className="p-4 bg-white border-t border-slate-200 space-y-3 shrink-0">
        <div className="text-xs text-slate-500 space-y-1.5 border-b border-slate-100 pb-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono font-bold text-slate-700">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3 text-slate-400" /> Descuento (%)
            </span>
            <input
              type="number"
              min="0"
              max="100"
              className="w-14 text-right text-xs font-bold text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={discountPercent}
              onChange={(e) => onDiscountPercentChange(Math.min(100, Math.max(0, Number(e.target.value))))}
            />
          </div>

          {discountPercent > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Descuento ({discountPercent}%)</span>
              <span className="font-mono">-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-slate-500">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applyTax}
                onChange={(e) => onToggleApplyTax(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Aplicar IVA (16%)</span>
            </label>
            <span className="font-mono font-bold text-slate-700">
              {applyTax ? `$${taxAmount.toFixed(2)}` : '$0.00'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-baseline py-1">
          <span className="text-sm font-bold text-slate-800">Total Cotización</span>
          <div className="text-right">
            <div className="text-xl font-black text-slate-900 font-mono">${totalUsd.toFixed(2)}</div>
            <div className="text-xs font-semibold text-slate-500 font-mono">
              {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
            </div>
          </div>
        </div>

        {/* Action Button: Replaces POS 'Pagar / Facturar' with 'Generar Cotización' */}
        <button
          type="button"
          onClick={onGenerateQuotationClick}
          disabled={cart.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl shadow-md transition-all bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          <FileText className="h-4.5 w-4.5" />
          <span>Generar Cotización</span>
        </button>
      </div>
    </div>
  );
};
