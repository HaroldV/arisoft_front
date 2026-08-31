import React from 'react';
import { Eye, Package } from 'lucide-react';
import { ActionTooltip } from '@/components/ActionTooltip';
import { SalesOrder, getPaymentMethodLabel } from '../types';

interface SalesOrdersTableProps {
  orders: SalesOrder[];
  onViewDetail: (order: SalesOrder) => void;
  onOpenTransportModal: (order: SalesOrder) => void;
}

export function SalesOrdersTable({ orders, onViewDetail, onOpenTransportModal }: SalesOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 text-xs">
        No se encontraron pedidos de venta registrados.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">N° Pedido</th>
              <th className="py-3.5 px-4">Cliente</th>
              <th className="py-3.5 px-4">Fecha Emisión</th>
              <th className="py-3.5 px-4">Método Pago</th>
              <th className="py-3.5 px-4 text-right">Total ($ USD)</th>
              <th className="py-3.5 px-4 text-right">Total (Bs.)</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {orders.map((item) => {
              const pmLabel = getPaymentMethodLabel(item.payment_method);
              const isDispatched = item.status === 'CONVERTED' || item.status === 'DISPATCHED';

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {item.document_number}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {item.client_name}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] font-mono text-slate-400">{item.client_tax_id}</p>
                      {item.items && item.items.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-normal">
                          <Package className="w-3 h-3 text-slate-400" />
                          {item.items.length} {item.items.length === 1 ? 'producto' : 'productos'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600">{item.issue_date || '-'}</td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                    {pmLabel ? (
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {pmLabel}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Por definir</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600">
                    ${Number(item.total_usd || 0).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600 text-xs">
                    Bs. {Number(item.total_bs || 0).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {!isDispatched ? (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Stock Reservado
                      </span>
                    ) : (
                      <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Despachado
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ActionTooltip content="Ver detalle de productos">
                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </ActionTooltip>
                      {!isDispatched && (
                        <ActionTooltip content="Generar Nota de Entrega (Guía de Despacho)">
                          <button
                            type="button"
                            onClick={() => onOpenTransportModal(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        </ActionTooltip>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
