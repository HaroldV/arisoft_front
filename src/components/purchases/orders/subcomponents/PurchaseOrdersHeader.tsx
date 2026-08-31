import React from 'react';
import { ShoppingBag, Plus } from 'lucide-react';

interface PurchaseOrdersHeaderProps {
  onOpenCreateModal: () => void;
}

export function PurchaseOrdersHeader({ onOpenCreateModal }: PurchaseOrdersHeaderProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Órdenes de Compra</h1>
          <p className="text-xs text-slate-500">Emisión bimoneda con control de RIF, términos de pago y descuentos/recargos desglosados</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenCreateModal}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all cursor-pointer text-sm shadow-xs"
      >
        <Plus className="h-4 w-4" />
        <span>Emitir Orden de Compra</span>
      </button>
    </div>
  );
}
