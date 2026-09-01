'use client';

import React from 'react';
import { Loader2, ArrowRightLeft, FileMinus, FilePlus, X } from 'lucide-react';
import { SearchableSelect, SelectOption } from '@/components/SearchableSelect';
import { NoteItemForm, LocationOption } from '../types';

interface PurchaseFiscalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseDetails: any;
  purchasesList: any[];
  onSelectPurchase: (id: string) => void;
  noteType: 'CREDIT' | 'DEBIT';
  onNoteTypeChange: (val: 'CREDIT' | 'DEBIT') => void;
  noteReason: 'RETURN' | 'DISCOUNT' | 'PRICE_ERR' | 'TAX_ERR' | 'OTHER';
  onNoteReasonChange: (val: 'RETURN' | 'DISCOUNT' | 'PRICE_ERR' | 'TAX_ERR' | 'OTHER') => void;
  documentNumber: string;
  onDocumentNumberChange: (val: string) => void;
  controlNumber: string;
  onControlNumberChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  exchangeRate: number;
  onExchangeRateChange: (val: number) => void;
  adjustStock: boolean;
  onAdjustStockChange: (val: boolean) => void;
  locationId: string;
  onLocationIdChange: (val: string) => void;
  locations: LocationOption[];
  noteItems: NoteItemForm[];
  onToggleItemSelect: (productId: string) => void;
  onQtyChange: (productId: string, val: number) => void;
  onUnitPriceChange: (productId: string, val: number) => void;
  totalUsdInput: string;
  onTotalUsdInputChange: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const PurchaseFiscalNoteModal: React.FC<PurchaseFiscalNoteModalProps> = ({
  isOpen,
  onClose,
  purchaseDetails,
  purchasesList,
  onSelectPurchase,
  noteType,
  onNoteTypeChange,
  noteReason,
  onNoteReasonChange,
  documentNumber,
  onDocumentNumberChange,
  controlNumber,
  onControlNumberChange,
  description,
  onDescriptionChange,
  exchangeRate,
  onExchangeRateChange,
  adjustStock,
  onAdjustStockChange,
  locationId,
  onLocationIdChange,
  locations,
  noteItems,
  onToggleItemSelect,
  onQtyChange,
  onUnitPriceChange,
  totalUsdInput,
  onTotalUsdInputChange,
  isSubmitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const invoiceOptions: SelectOption[] = purchasesList.map((p) => ({
    value: p.id,
    label: `${p.invoice_number} - ${p.supplier_name} ($${Number(p.total_amount_usd).toFixed(2)})`,
  }));

  const locationOptions: SelectOption[] = locations.map((loc) => ({
    value: loc.id,
    label: `${'—'.repeat(loc.depth)} ${loc.name} (${loc.type})`,
  }));

  const calculatedTotalUsd = noteItems
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Emitir Nota Fiscal de Compra (NC / ND)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ajuste comercial, devolución de inventario o descuento sobre factura
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Selector de Factura */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Factura de Compra Afectada *</label>
            <SearchableSelect
              options={invoiceOptions}
              value={purchaseDetails?.id || ''}
              onChange={(val) => onSelectPurchase(val)}
              placeholder="Seleccionar factura de compra..."
            />
          </div>

          {purchaseDetails && (
            <>
              {/* Tipo de Nota y Motivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Tipo de Documento *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onNoteTypeChange('CREDIT')}
                      className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        noteType === 'CREDIT'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <FileMinus className="w-3.5 h-3.5" />
                      <span>Nota de Crédito</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNoteTypeChange('DEBIT')}
                      className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        noteType === 'DEBIT'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>Nota de Débito</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Motivo de Emisión *</label>
                  <select
                    value={noteReason}
                    onChange={(e: any) => onNoteReasonChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="RETURN">Devolución de Mercancía</option>
                    <option value="DISCOUNT">Descuento o Rebaja Posterior</option>
                    <option value="PRICE_ERR">Corrección de Precio / Valor</option>
                    <option value="TAX_ERR">Ajuste de Impuesto</option>
                    <option value="OTHER">Otro Motivo</option>
                  </select>
                </div>
              </div>

              {/* Números Fiscales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">N° de Nota *</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => onDocumentNumberChange(e.target.value)}
                    placeholder="Ej: NC-0001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">N° de Control *</label>
                  <input
                    type="text"
                    value={controlNumber}
                    onChange={(e) => onControlNumberChange(e.target.value)}
                    placeholder="Ej: 00-00123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tasa de Cambio (VES/USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => onExchangeRateChange(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Ajuste de Inventario */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adjustStock}
                    onChange={(e) => onAdjustStockChange(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">
                    {noteType === 'CREDIT' ? 'Descontar mercancía del inventario' : 'Reingresar mercancía al inventario'}
                  </span>
                </label>
                {adjustStock && (
                  <div className="w-full sm:w-64">
                    <SearchableSelect
                      options={locationOptions}
                      value={locationId}
                      onChange={(val) => onLocationIdChange(val)}
                      placeholder="Almacén de origen/destino..."
                    />
                  </div>
                )}
              </div>

              {/* Tabla de Selección de Renglones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Ítems Afectados de la Factura:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Monto Global ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Auto"
                      value={totalUsdInput}
                      onChange={(e) => onTotalUsdInputChange(e.target.value)}
                      className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3 w-8"></th>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3 text-center">Cant. Afectar</th>
                        <th className="py-2 px-3 text-right">Precio Unit. ($)</th>
                        <th className="py-2 px-3 text-right">Subtotal ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {noteItems.map((item) => (
                        <tr key={item.productId} className={item.selected ? 'bg-indigo-50/20' : 'opacity-60'}>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => onToggleItemSelect(item.productId)}
                              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">{item.name}</td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              max={item.originalQty}
                              disabled={!item.selected}
                              value={item.quantity}
                              onChange={(e) => onQtyChange(item.productId, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-center text-slate-900 disabled:bg-slate-100"
                            />
                            <span className="text-[10px] text-slate-400 block">Máx: {item.originalQty}</span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              disabled={!item.selected}
                              value={item.unitPriceUsd}
                              onChange={(e) => onUnitPriceChange(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-right text-slate-900 disabled:bg-slate-100"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-right text-slate-900">
                            ${(item.quantity * item.unitPriceUsd).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Resumen */}
              <div className="flex items-center justify-between p-3 bg-indigo-50/80 rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-900">Total Nota Fiscal Calculado:</span>
                <span className="font-mono font-black text-base text-indigo-900">
                  ${calculatedTotalUsd.toFixed(2)} USD / Bs. {(calculatedTotalUsd * exchangeRate).toFixed(2)} VES
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {purchaseDetails && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || calculatedTotalUsd <= 0 || !documentNumber}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Emitiendo...</span>
                </>
              ) : (
                <span>Emitir Nota Fiscal</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
