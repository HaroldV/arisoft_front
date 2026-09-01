'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, Download, ExternalLink, X, CreditCard } from 'lucide-react';

interface PurchaseInvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseDetails: any;
  isLoading: boolean;
  error: string | null;
  onEmitNote: (id: string) => void;
}

export const PurchaseInvoiceDetailModal: React.FC<PurchaseInvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  purchaseDetails,
  isLoading,
  error,
  onEmitNote,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {purchaseDetails
                  ? `Detalle de Factura ${purchaseDetails.invoice_number}`
                  : 'Detalle de Factura de Compra'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Información comercial, renglones recibidos y estado financiero en CXP
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
              <p className="text-sm font-medium">Cargando detalles de la factura...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold text-center">
              {error}
            </div>
          ) : purchaseDetails ? (
            <div className="space-y-6">
              {/* Banner Financiero Luminous Standard */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-white/95 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Total Facturado
                    </span>
                    <span className="font-mono font-black text-lg sm:text-xl text-slate-900">
                      ${Number(purchaseDetails.total_amount_usd).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                      Total Liquidado
                    </span>
                    <span className="font-mono font-black text-lg sm:text-xl text-emerald-700">
                      ${Number(purchaseDetails.total_paid_usd ?? purchaseDetails.total_amount_usd).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                      Saldo por Pagar
                    </span>
                    <span className="font-mono font-black text-lg sm:text-xl text-indigo-700">
                      ${Number(purchaseDetails.balance_due_usd ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white/95 border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Estado Financiero
                    </span>
                    <div>
                      {purchaseDetails.payment_status === 'PAID' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          Saldada
                        </span>
                      ) : purchaseDetails.payment_status === 'PARTIAL' ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          Abono Parcial
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          Por Pagar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuadrícula de Metadatos Empresariales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-slate-400 font-medium block">Proveedor:</span>
                  <span className="font-bold text-slate-900">{purchaseDetails.supplier_name}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-slate-400 font-medium block">Fecha de Registro:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(purchaseDetails.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-slate-400 font-medium block">Registrado por:</span>
                  <span className="font-bold text-slate-900">
                    {purchaseDetails.created_by?.full_name || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Tabla de Renglones / Productos */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-2.5 px-4">SKU</th>
                      <th className="py-2.5 px-4">Producto</th>
                      <th className="py-2.5 px-4 text-center">Cantidad</th>
                      <th className="py-2.5 px-4 text-right">Costo Unit. ($)</th>
                      <th className="py-2.5 px-4 text-right">Subtotal ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseDetails.items?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-600">
                          {item.product_sku}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {item.product_name}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg text-xs">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-right text-slate-700">
                          ${Number(item.unit_cost_usd).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-right">
                          ${(item.quantity * item.unit_cost_usd).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        {purchaseDetails && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
              {purchaseDetails.payable_id && purchaseDetails.payment_status !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/accounts?type=PAYABLE&highlight=${purchaseDetails.payable_id}`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Abonar / Saldar en CXP</span>
                </button>
              )}
              {purchaseDetails.payable_id && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/accounts?type=PAYABLE&highlight=${purchaseDetails.payable_id}`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver en Cuentas por Pagar</span>
                </button>
              )}
              {purchaseDetails.proof_file_path && (
                <a
                  href={purchaseDetails.proof_file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Comprobante</span>
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEmitNote(purchaseDetails.id);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Emitir Nota de Débito/Crédito</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
