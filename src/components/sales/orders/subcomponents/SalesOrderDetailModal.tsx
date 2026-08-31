import React from 'react';
import { ShoppingCart, X, Package, Printer } from 'lucide-react';
import { ORDER_STATUS } from '@/constants/domain-constants';
import { SalesOrder, getPaymentMethodLabel } from '../types';

interface SalesOrderDetailModalProps {
  order: SalesOrder | null;
  onClose: () => void;
  onDispatch: (order: SalesOrder) => void;
}

export function SalesOrderDetailModal({ order, onClose, onDispatch }: SalesOrderDetailModalProps) {
  if (!order) return null;

  const isDispatched = order.status === 'CONVERTED' || order.status === 'DISPATCHED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Nota de Pedido #{order.document_number}
                </h3>
                {order.status === 'CONVERTED' && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Facturada
                  </span>
                )}
                {order.status === 'DISPATCHED' && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Despachada
                  </span>
                )}
                {(order.status === ORDER_STATUS.APPROVED || order.status === ORDER_STATUS.DRAFT) && (
                  <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Pendiente Despacho
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Comprobante de reserva de stock y preparación de entrega
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* 4-Column Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Cliente / Razón Social
              </span>
              <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{order.client_name}</p>
              <p className="font-mono font-semibold text-xs text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md inline-block mt-1">
                {order.client_tax_id || 'SIN RIF'}
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Fecha Emisión</span>
              <p className="font-bold text-slate-900 text-sm sm:text-base">{order.issue_date || '-'}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Válida Hasta</span>
              <p className="font-bold text-slate-900 text-sm sm:text-base">{order.valid_until || '-'}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Método de Pago</span>
              <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                {getPaymentMethodLabel(order.payment_method) || 'Por definir'}
              </p>
            </div>
          </div>

          {/* Items Data Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>Productos Reservados en esta Orden ({order.items?.length || 0})</span>
            </h4>

            <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Producto / Concepto</th>
                    <th className="py-3 px-4 text-center">Cant.</th>
                    <th className="py-3 px-4 text-right">Precio ($)</th>
                    <th className="py-3 px-4 text-right">Subtotal ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it: any, idx: number) => {
                      const price = Number(it.unit_price_usd || 0);
                      const qty = Number(it.quantity || 0);
                      const subtotal = Number(it.subtotal_usd || qty * price);
                      return (
                        <tr key={it.id || idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-xs text-slate-600 bg-slate-50/60">
                            {it.sku || 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-sm">{it.product_name}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-xl text-xs inline-block">
                              {qty}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 text-sm">
                            ${price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                            ${subtotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No se encontraron ítems detallados para esta orden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Luminous Balance Banner */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <p className="text-xs text-indigo-950 font-bold uppercase tracking-wider">Resumen Financiero del Pedido</p>
              <p className="text-xs text-indigo-700/80 font-medium">
                Tasa oficial aplicada: <span className="font-bold font-mono">Bs. {Number(order.exchange_rate || 36.5).toFixed(2)}</span> / USD
              </p>
            </div>
            <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-indigo-100/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Monto Total Liquidado</span>
              <p className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                ${Number(order.total_usd || 0).toFixed(2)} USD
              </p>
              <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                Equivalente en moneda nacional: <span className="text-slate-900 font-black">Bs. {Number(order.total_bs || 0).toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Fijo */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Pedido</span>
          </button>
          <div className="flex items-center gap-3">
            {!isDispatched && (
              <button
                type="button"
                onClick={() => onDispatch(order)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-200 cursor-pointer active:scale-98"
              >
                <Package className="w-4 h-4" />
                <span>Generar Nota de Entrega</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
