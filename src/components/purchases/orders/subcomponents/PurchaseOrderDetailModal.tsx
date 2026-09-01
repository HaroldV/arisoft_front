import React from 'react';
import { ShoppingBag, X, Package } from 'lucide-react';
import { ORDER_STATUS } from '@/constants/domain-constants';
import { PurchaseOrder, ProductOption } from '../types';

interface PurchaseOrderDetailModalProps {
  order: PurchaseOrder | null;
  products: ProductOption[];
  onClose: () => void;
}

export function PurchaseOrderDetailModal({ order, products, onClose }: PurchaseOrderDetailModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Detalle de Orden de Compra {order.order_number}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Emisión de acuerdo comercial con proveedor</p>
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
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Proveedor</span>
              <span className="font-bold text-slate-900 text-sm block truncate">{order.supplier_name}</span>
              {order.supplier_rif && (
                <span className="font-mono text-xs text-slate-500">RIF: {order.supplier_rif}</span>
              )}
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Condición & Moneda
              </span>
              <span className="font-bold text-slate-900 text-sm block">{order.payment_term || 'CONTADO'}</span>
              <span className="text-xs text-slate-500">
                {order.currency || 'USD'} ({order.is_national ? 'Nacional' : 'Importación'})
              </span>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Fecha Emisión</span>
              <span className="font-bold text-slate-900 text-sm block">
                {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
              </span>
              <span className="text-xs text-slate-500">
                Hora: {order.created_at ? new Date(order.created_at).toLocaleTimeString() : 'N/A'}
              </span>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Estado de Orden</span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                  order.status === ORDER_STATUS.COMPLETED
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : order.status === ORDER_STATUS.SENT
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {order.status === ORDER_STATUS.SENT
                  ? 'Sin Procesar'
                  : order.status === ORDER_STATUS.COMPLETED
                  ? 'Procesado'
                  : order.status}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
            <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/70 text-slate-700 font-bold text-xs uppercase tracking-wider flex justify-between items-center">
              <span>Renglones Acordados en la Orden</span>
              <span className="text-[11px] font-mono text-slate-500">Total ítems: {order.items?.length || 0}</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-10 text-center">#</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Artículo / Producto</th>
                  <th className="py-2.5 px-4 text-right w-24">Cant. Pedida</th>
                  <th className="py-2.5 px-4 text-right w-24">Cant. Recibida</th>
                  <th className="py-2.5 px-4 text-right w-28">Costo Unit. ($)</th>
                  <th className="py-2.5 px-4 text-right w-28">IVA</th>
                  <th className="py-2.5 px-4 text-right w-32">Total Renglón ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => {
                    const qty = Number(item.quantity_ordered || item.quantityOrdered || 0);
                    const received = Number(item.quantity_received || item.quantityReceived || 0);
                    const cost = Number(item.unit_cost_usd || item.unitCostUsd || 0);
                    const taxRate = Number(item.tax_rate || item.taxRate || 16);
                    const totalLine = Number(item.total_cost_usd || qty * cost * (1 + taxRate / 100) || 0);
                    const prodObj = products.find((p) => p.id === (item.product_id || item.productId));
                    const name = prodObj?.name || item.line_comment || item.lineComment || `Producto #${idx + 1}`;
                    const sku = prodObj?.sku || item.sku;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{name}</span>
                              {sku && <span className="text-[11px] font-mono text-slate-500">SKU: {sku}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{qty}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">{received}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800">${cost.toFixed(4)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{taxRate}%</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">${totalLine.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No hay renglones detallados registrados para esta orden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Luminous Financial Summary */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-500">
              <span>
                Orden registrada por: <strong className="text-slate-700">{order.created_by_user_name || 'Operador'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-slate-500 block">Subtotal:</span>
                <span className="font-bold text-slate-900">${Number(order.subtotal_usd || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">IVA:</span>
                <span className="font-bold text-slate-900">${Number(order.tax_usd || 0).toFixed(2)}</span>
              </div>
              <div className="border-l border-indigo-200 pl-6 text-base font-bold text-indigo-700">
                <span className="text-xs text-slate-500 block">TOTAL ORDEN:</span>
                <span>${Number(order.total_usd || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            {order.status !== 'CANCELLED' && order.status !== ORDER_STATUS.COMPLETED && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = `/inventory/purchases/receptions?orderId=${order.id}&new=true`;
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-200 text-sm cursor-pointer"
              >
                <span>Procesar Recepción de Almacén</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
