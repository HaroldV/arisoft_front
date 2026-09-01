import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Eye, X, Truck } from 'lucide-react';
import { ORDER_STATUS } from '@/constants/domain-constants';
import { ActionTooltip } from '@/components/ActionTooltip';
import { PurchaseOrder } from '../types';

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[];
  isLoading: boolean;
  onViewOrder: (order: PurchaseOrder) => void;
  onCancelOrder?: (order: PurchaseOrder) => void;
}

export function PurchaseOrdersTable({ orders, isLoading, onViewOrder, onCancelOrder }: PurchaseOrdersTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Cargando órdenes de compra...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-20 text-center space-y-2">
        <FileText className="h-10 w-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-600">No hay órdenes de compra emitidas</p>
        <p className="text-xs text-slate-400">Genera una nueva orden de compra para acordar precios con tus proveedores.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-4 px-6">N° Orden</th>
              <th className="py-4 px-6">Proveedor</th>
              <th className="py-4 px-6">Cond. Pago</th>
              <th className="py-4 px-6">Moneda</th>
              <th className="py-4 px-6">Fecha Emisión</th>
              <th className="py-4 px-6 text-right">Total USD</th>
              <th className="py-4 px-6 text-center">Estado</th>
              <th className="py-4 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-900 font-mono text-xs">{o.order_number}</td>
                <td className="py-4 px-6">
                  <div className="font-bold text-slate-900">{o.supplier_name}</div>
                  {o.supplier_rif && <div className="text-xs text-slate-400 font-mono">RIF: {o.supplier_rif}</div>}
                </td>
                <td className="py-4 px-6 text-xs text-slate-600 font-semibold">{o.payment_term || 'CONTADO'}</td>
                <td className="py-4 px-6 text-xs text-slate-600">
                  {o.currency || 'USD'} ({o.is_national ? 'Nacional' : 'Importación'})
                </td>
                <td className="py-4 px-6 text-slate-500 text-xs">
                  {o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A'}
                </td>
                <td className="py-4 px-6 text-right font-mono font-bold text-indigo-600 text-base">
                  ${Number(o.total_usd || 0).toFixed(2)}
                </td>
                <td className="py-4 px-6 text-center">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      o.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : o.status === ORDER_STATUS.COMPLETED
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : o.status === ORDER_STATUS.SENT
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {o.status === 'CANCELLED'
                      ? 'Anulada'
                      : o.status === ORDER_STATUS.SENT
                      ? 'Sin Procesar'
                      : o.status === ORDER_STATUS.COMPLETED
                      ? 'Procesado'
                      : o.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {/* Action: Ver Detalle */}
                    <ActionTooltip content="Ver detalle de la orden">
                      <button
                        type="button"
                        onClick={() => onViewOrder(o)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                        aria-label="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </ActionTooltip>

                    {/* Action: Procesar Recepción */}
                    {o.status !== 'CANCELLED' && o.status !== ORDER_STATUS.COMPLETED && (
                      <ActionTooltip content="Procesar recepción de mercancía">
                        <button
                          type="button"
                          onClick={() => router.push(`/inventory/purchases/receptions?orderId=${o.id}&new=true`)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 cursor-pointer"
                          aria-label="Procesar recepción"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      </ActionTooltip>
                    )}

                    {/* Action: Anular Orden */}
                    {o.status !== 'CANCELLED' && o.status !== ORDER_STATUS.COMPLETED && onCancelOrder && (
                      <ActionTooltip content="Anular orden de compra">
                        <button
                          type="button"
                          onClick={() => onCancelOrder(o)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 cursor-pointer"
                          aria-label="Anular orden"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </ActionTooltip>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
