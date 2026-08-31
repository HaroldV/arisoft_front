'use client';

import React from 'react';
import { 
  X, 
  Receipt, 
  Lock, 
  Upload, 
  UserCheck, 
  PackageCheck, 
  Calculator, 
  ArrowRight, 
  Check 
} from 'lucide-react';
import { CurrencyInput } from '@/components/CurrencyInput';
import { ACCOUNT_TYPES, AccountType, PaymentMethod, PAYMENT_METHODS } from '@/constants/domain-constants';
import { AccountItem } from '../types';

interface AccountPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount: AccountItem | null;
  activeTab: AccountType;
  currentUser: string;
  payMethod: PaymentMethod;
  setPayMethod: (m: PaymentMethod) => void;
  payAmount: string;
  setPayAmount: (amt: string) => void;
  payExchangeRate: string;
  setPayExchangeRate: (rate: string) => void;
  payReference: string;
  setPayReference: (ref: string) => void;
  supplierInvoiceNumber: string;
  setSupplierInvoiceNumber: (inv: string) => void;
  attachedFileName: string;
  attachedFilePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  receptionDetailItems: any[];
  handleRegisterPayment: (e: React.FormEvent) => void;
}

export function AccountPaymentModal({
  isOpen,
  onClose,
  selectedAccount,
  activeTab,
  currentUser,
  payMethod,
  setPayMethod,
  payAmount,
  setPayAmount,
  payExchangeRate,
  setPayExchangeRate,
  payReference,
  setPayReference,
  supplierInvoiceNumber,
  setSupplierInvoiceNumber,
  attachedFileName,
  attachedFilePreview,
  fileInputRef,
  handleFileSelect,
  receptionDetailItems,
  handleRegisterPayment,
}: AccountPaymentModalProps) {
  if (!isOpen || !selectedAccount) return null;

  const currentBalance = Number(selectedAccount.balance_due || 0);
  const rawPayAmountNum = parseFloat(payAmount) || 0;
  const rawExchangeRateNum = parseFloat(payExchangeRate) || 1;
  const calculatedDeductionUsd = payMethod.includes('BS')
    ? rawPayAmountNum / (rawExchangeRateNum || 1)
    : rawPayAmountNum;
  const estimatedNewBalance = Math.max(0, currentBalance - calculatedDeductionUsd);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registrar Abono / Pago</h3>
            <p className="text-xs text-slate-500 font-medium">{selectedAccount.entity_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRegisterPayment} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* FINANCIAL BALANCE STATUS BAR (LUMINOUS EXECUTIVE THEME) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100/90 shadow-2xs">
              <div className="text-center p-3 bg-white/95 border border-slate-200/80 rounded-xl shadow-2xs">
                <p className="text-xs uppercase tracking-wider text-rose-800 font-bold">Deuda Actual</p>
                <p className="text-lg sm:text-xl font-black text-rose-600 mt-1 font-mono">${currentBalance.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl shadow-2xs">
                <p className="text-xs uppercase tracking-wider text-emerald-800 font-bold">Abono (-USD)</p>
                <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1 font-mono">-${calculatedDeductionUsd.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl shadow-2xs">
                <p className="text-xs uppercase tracking-wider text-indigo-800 font-bold">Nuevo Saldo</p>
                <p className="text-lg sm:text-xl font-black text-indigo-700 mt-1 font-mono">${estimatedNewBalance.toFixed(2)}</p>
              </div>
            </div>

            {/* Supplier Invoice Metadata */}
            {activeTab === ACCOUNT_TYPES.PAYABLE && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span>Formalización de Factura del Proveedor</span>
                  </div>
                  {selectedAccount.supplier_invoice_number ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      Factura Formalizada
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Registro Inicial Requerido
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef as any}
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {selectedAccount.supplier_invoice_number ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        N° Factura del Proveedor
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {selectedAccount.supplier_invoice_number}
                      </span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Comprobante Adjunto
                        </span>
                        <span className="font-semibold text-slate-700 text-xs truncate max-w-[180px] block">
                          {selectedAccount.voucher_attachment_url || 'comprobante_fiscal.pdf'}
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100 font-bold">
                        Verificado
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          N° Factura Fiscal del Proveedor *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: FACT-99214 o 000412"
                          value={supplierInvoiceNumber}
                          onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Comprobante / Soporte Digital *
                        </label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs text-slate-700 font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Upload className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="truncate">{attachedFileName || 'Adjuntar Imagen o PDF...'}</span>
                          </span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-bold shrink-0">
                            Subir
                          </span>
                        </button>
                      </div>
                    </div>

                    {attachedFilePreview && (
                      <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200">
                        <img
                          src={attachedFilePreview}
                          alt="Previsualización"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-100 shadow-2xs"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-800 truncate">{attachedFileName}</p>
                          <p className="text-[10px] text-emerald-600 font-medium">✓ Imagen de comprobante cargada</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Se registrará la formalización fiscal a nombre de: <strong className="text-slate-700">{currentUser}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* READ-ONLY RECEIVED ITEMS CARD FOR PURCHASES */}
            {activeTab === ACCOUNT_TYPES.PAYABLE && receptionDetailItems.length > 0 && (
              <div className="space-y-2 p-3.5 bg-slate-100/70 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    Detalle de Artículos Recepcionados en Almacén
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Solo Lectura
                  </span>
                </div>

                <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[9px]">
                      <tr>
                        <th className="py-1.5 px-3 font-semibold">Producto / Modelo</th>
                        <th className="py-1.5 px-3 text-right font-semibold">Cant. Recibida</th>
                        <th className="py-1.5 px-3 text-right font-semibold">Costo U.</th>
                        <th className="py-1.5 px-3 text-right font-semibold">Neto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {receptionDetailItems.map((ri: any, idx: number) => {
                        const qty = Number(ri.quantity_received || ri.quantity || 0);
                        const cost = Number(ri.unit_cost_usd || ri.unit_price || 0);
                        const net = Number(ri.net_total || (qty * cost));
                        return (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="py-1.5 px-3 font-sans font-bold text-slate-800">{ri.product_name || ri.description || 'Producto'}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-emerald-700">{qty}</td>
                            <td className="py-1.5 px-3 text-right text-slate-600">${cost.toFixed(2)}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-900">${net.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayMethod(PAYMENT_METHODS.CASH_USD)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                    payMethod === PAYMENT_METHODS.CASH_USD 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  💵 Efectivo USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod(PAYMENT_METHODS.TRANSFER_USD)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                    payMethod === PAYMENT_METHODS.TRANSFER_USD 
                      ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  🏦 Zelle / Transf. USD
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod(PAYMENT_METHODS.CASH_BS)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                    payMethod === PAYMENT_METHODS.CASH_BS 
                      ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  💵 Efectivo Bs.
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod(PAYMENT_METHODS.DEBIT_BS)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                    payMethod === PAYMENT_METHODS.DEBIT_BS 
                      ? 'bg-purple-50 border-purple-300 text-purple-800 ring-2 ring-purple-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  💳 Débito / Transf. Bs.
                </button>
              </div>
            </div>

            {/* Amount and Exchange Rate Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Monto a Abonar ({payMethod.includes('BS') ? 'Bs.' : '$'}) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const remainingDebtUsd = Number(selectedAccount.balance_due || 0);
                      if (payMethod.includes('BS')) {
                        const rate = parseFloat(payExchangeRate) || 1;
                        setPayAmount((remainingDebtUsd * rate).toFixed(2));
                      } else {
                        setPayAmount(remainingDebtUsd.toFixed(2));
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-2 py-0.5 rounded-lg border border-indigo-200/60 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    title="Pagar la totalidad de la deuda pendiente"
                  >
                    <span>Pagar Total (${currentBalance.toFixed(2)})</span>
                  </button>
                </div>
                <CurrencyInput
                  value={payAmount}
                  onChange={(val) => setPayAmount(val ? val.toString() : '')}
                  placeholder="0.00"
                  currencyPrefix={payMethod.includes('BS') ? 'Bs.' : '$'}
                  required
                />
              </div>

              {payMethod.includes('BS') && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Tasa de Cambio (Bs / USD) *
                  </label>
                  <CurrencyInput
                    value={payExchangeRate}
                    onChange={(val) => setPayExchangeRate(val ? val.toString() : '')}
                    placeholder="0.00"
                    currencyPrefix="Bs."
                    decimals={4}
                    required
                  />
                </div>
              )}
            </div>

            {/* LIVE EQUATION PREVIEW BOX FOR BOLÍVARES */}
            {payMethod.includes('BS') && rawPayAmountNum > 0 && (
              <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-200 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    Ecuación de Descuento Exacto
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    4 decimales exactos
                  </span>
                </div>

                <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-100 text-xs font-mono space-y-1.5 text-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Abono en Bs / Tasa:</span>
                    <span className="font-bold text-slate-900">
                      Bs. {rawPayAmountNum.toFixed(2)} ÷ {rawExchangeRateNum.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-1 text-emerald-700 font-bold">
                    <span>Deducción en Dólares:</span>
                    <span className="text-sm">-${calculatedDeductionUsd.toFixed(4)} USD</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-indigo-950 font-medium pt-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    Saldo previo: <strong className="text-slate-800">${currentBalance.toFixed(2)}</strong>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-indigo-900 font-bold">
                    Quedará en: <strong className="text-indigo-600 text-sm font-mono">${estimatedNewBalance.toFixed(2)} USD</strong>
                  </span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {payMethod === PAYMENT_METHODS.CASH_USD || payMethod === PAYMENT_METHODS.CASH_BS
                    ? 'N° Recibo / Comprobante de Caja *'
                    : 'N° de Referencia Bancaria / Confirmación *'}
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Requerido para auditoría contable</span>
              </div>
              <input
                type="text"
                required
                placeholder={
                  payMethod === PAYMENT_METHODS.CASH_USD || payMethod === PAYMENT_METHODS.CASH_BS
                    ? 'Ej: RECIBO-0012, CAJA-01 o EF-048'
                    : 'Ej: REF-881940, ZELLE-JUAN o TRANSF-1049'
                }
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-medium"
              />
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Abono / Pago</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
