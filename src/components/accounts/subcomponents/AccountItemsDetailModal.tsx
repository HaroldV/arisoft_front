'use client';

import React from 'react';
import { X, Receipt, Lock, PackageCheck, Wallet } from 'lucide-react';
import { ACCOUNT_STATUS, ACCOUNT_TYPES, AccountType } from '@/constants/domain-constants';
import { AccountItem } from '../types';

interface AccountItemsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount: AccountItem | null;
  activeTab: AccountType;
  receptionDetailItems: any[];
  isLoadingItems: boolean;
  onProceedToPayment: () => void;
}

export function AccountItemsDetailModal({
  isOpen,
  onClose,
  selectedAccount,
  activeTab,
  receptionDetailItems,
  isLoadingItems,
  onProceedToPayment,
}: AccountItemsDetailModalProps) {
  const [detailTab, setDetailTab] = React.useState<'ITEMS' | 'PAYMENTS'>('ITEMS');

  if (!isOpen || !selectedAccount) return null;

  const paymentsList = selectedAccount.payments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Detalle y Trazabilidad de Cuenta ({activeTab === ACCOUNT_TYPES.PAYABLE ? 'CxP Proveedor' : 'CxC Cliente'})
              </h3>
              <p className="text-xs text-slate-500 font-medium">{selectedAccount.entity_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Luminous Financial Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100/90 shadow-2xs">
            <div className="text-center p-3 bg-white/95 border border-slate-200/80 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Saldo Previo
              </span>
              <span className="font-mono font-bold text-slate-900 text-base">
                ${Number(selectedAccount.previous_balance).toFixed(2)}
              </span>
            </div>
            <div className="text-center p-3 bg-white/95 border border-slate-200/80 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Monto Facturado
              </span>
              <span className="font-mono font-bold text-slate-900 text-base">
                ${Number(selectedAccount.period_amount).toFixed(2)}
              </span>
            </div>
            <div className="text-center p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                Total Pagado
              </span>
              <span className="font-mono font-bold text-emerald-700 text-base">
                ${Number(selectedAccount.total_paid).toFixed(2)}
              </span>
            </div>
            <div className="text-center p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-800 mb-1">
                Saldo Pendiente
              </span>
              <span className="font-mono font-black text-rose-600 text-base">
                ${Number(selectedAccount.balance_due).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Documento de Referencia
              </span>
              <span className="font-bold text-slate-900 text-xs">
                {selectedAccount.reference_document_number || selectedAccount.reference_date || 'Sin Referencia'}
              </span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Factura del Proveedor
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {selectedAccount.supplier_invoice_number || 'Pendiente por Formalizar'}
              </span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Soporte Digital
              </span>
              <span className="font-semibold text-slate-700 text-xs truncate block">
                {selectedAccount.voucher_attachment_url || 'Sin Archivo Adjunto'}
              </span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Estado Actual
              </span>
              <div className="mt-0.5">
                {selectedAccount.status === ACCOUNT_STATUS.PAID && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Saldado
                  </span>
                )}
                {selectedAccount.status === ACCOUNT_STATUS.PARTIAL && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Abono Parcial
                  </span>
                )}
                {selectedAccount.status === ACCOUNT_STATUS.PENDING && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Pendiente
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs between Items & Payments */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setDetailTab('ITEMS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                detailTab === 'ITEMS'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>Renglones de Almacén ({receptionDetailItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('PAYMENTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                detailTab === 'PAYMENTS'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Trazabilidad de Abonos y Facturas ({paymentsList.length})</span>
            </button>
          </div>

          {/* TAB 1: Renglones de Almacén */}
          {detailTab === 'ITEMS' && (
            <div className="space-y-3">
              {isLoadingItems ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Cargando renglones detallados de almacén...</span>
                </div>
              ) : receptionDetailItems.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                  <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No hay renglones detallados de almacén registrados</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                    Esta cuenta corresponde a un saldo inicial o factura consolidada por un monto de <strong className="text-slate-600">${Number(selectedAccount.period_amount).toFixed(2)}</strong>.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Producto / Descripción del Renglón</th>
                        <th className="py-3 px-4 text-center">Cant. Recibida</th>
                        <th className="py-3 px-4 text-right">Costo Unitario ($)</th>
                        <th className="py-3 px-4 text-right">Total Neto ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {receptionDetailItems.map((ri: any, idx: number) => {
                        const qty = Number(ri.quantity_received || ri.quantity || 0);
                        const cost = Number(ri.unit_cost_usd || ri.unit_price || 0);
                        const net = Number(ri.net_total || (qty * cost));
                        return (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px] text-center font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900">{ri.product_name || ri.description || 'Producto'}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-xl text-xs">
                                {qty}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-700 font-medium">
                              ${cost.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                              ${net.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 text-slate-900 text-xs font-bold">
                      <tr>
                        <td colSpan={2} className="py-3 px-4 text-slate-600 uppercase text-[10px] font-bold">
                          Total Renglones Recepcionados:
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-800 font-bold">
                          {receptionDetailItems.reduce((acc, it) => acc + Number(it.quantity_received || it.quantity || 0), 0)} unidades
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 text-[10px] uppercase font-bold">
                          Neto Total:
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 text-sm">
                          ${receptionDetailItems.reduce((acc, it) => acc + Number(it.net_total || (Number(it.quantity_received || it.quantity || 0) * Number(it.unit_cost_usd || it.unit_price || 0))), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Trazabilidad de Abonos, Pagos y Facturas */}
          {detailTab === 'PAYMENTS' && (
            <div className="space-y-3">
              {paymentsList.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                  <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No se registran abonos en esta cuenta</p>
                  <p className="text-[11px] text-slate-400 mt-1">El monto total permanece pendiente de liquidación.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Fecha / Hora</th>
                        <th className="py-3 px-4">Método</th>
                        <th className="py-3 px-4">N° Recibo / Ref</th>
                        <th className="py-3 px-4">Registrado Por</th>
                        <th className="py-3 px-4 text-right">Monto Original</th>
                        <th className="py-3 px-4 text-right">Abono Neto ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {paymentsList.map((p, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {p.paid_at ? new Date(p.paid_at).toLocaleString() : 'Reciente'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              {p.payment_method}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 text-xs">
                            {p.reference_number || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                            {p.created_by_user_name || 'Auditor'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">
                            {p.currency === 'USD' ? `$${Number(p.amount).toFixed(2)}` : `Bs. ${Number(p.amount).toFixed(2)}`}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                            ${Number(p.amount_usd).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 text-slate-900 text-xs font-bold">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 text-slate-600 uppercase text-[10px] font-bold">
                          Total Acumulado de Abonos:
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          ${paymentsList.reduce((acc, p) => acc + Number(p.amount_usd || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
          >
            Cerrar
          </button>
          {Number(selectedAccount.balance_due) > 0 && (
            <button
              type="button"
              onClick={onProceedToPayment}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98"
            >
              <Wallet className="w-4 h-4" />
              <span>Proceder al Abono / Pago</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
