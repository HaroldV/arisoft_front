import React from 'react';
import { ClipboardList } from 'lucide-react';

export function SalesOrdersHeader() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Notas de Pedido (Órdenes de Venta)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de pedidos confirmados con reserva de inventario en almacén
          </p>
        </div>
      </div>
    </div>
  );
}
