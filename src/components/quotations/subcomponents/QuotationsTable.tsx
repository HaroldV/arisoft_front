'use client';

import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Eye, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  X,
  CreditCard,
  Building2,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { ActionTooltip } from '@/components/ActionTooltip';
import { CommercialQuotation } from '../types';

interface QuotationsTableProps {
  quotations: CommercialQuotation[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectQuotation?: (quotation: CommercialQuotation) => void;
}

export const QuotationsTable: React.FC<QuotationsTableProps> = ({
  quotations,
  isLoading,
  onRefresh,
  onSelectQuotation,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<CommercialQuotation | null>(null);

  const filtered = quotations.filter(q => 
    q.document_number.toLowerCase().includes(search.toLowerCase()) ||
    q.client_name.toLowerCase().includes(search.toLowerCase()) ||
    (q.client_tax_id && q.client_tax_id.toLowerCase().includes(search.toLowerCase())) ||
    (q.created_by_user_name && q.created_by_user_name.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Aceptada
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Convertida a Pedido
          </span>
        );
      case 'DRAFT':
        return (
          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Borrador
          </span>
        );
      case 'SENT':
      default:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Emitida / Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por correlativo, cliente, RIF o vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <strong className="text-slate-800">{filtered.length}</strong> cotizaciones
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 font-bold">N° Cotización</th>
                <th className="py-3.5 px-4 font-bold">Cliente / RIF</th>
                <th className="py-3.5 px-4 font-bold">Vendedor</th>
                <th className="py-3.5 px-4 font-bold">Fecha / Vence</th>
                <th className="py-3.5 px-4 font-bold text-right">Total ($ USD)</th>
                <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                <th className="py-3.5 px-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100/90 px-2.5 py-1 rounded-md">
                      {doc.document_number}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block text-xs truncate max-w-xs">{doc.client_name}</span>
                    {doc.client_tax_id && (
                      <span className="font-mono text-[10px] text-slate-500">
                        {doc.client_tax_id}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate max-w-[140px]">{doc.created_by_user_name || 'Vendedor'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    <div>{doc.issue_date || '—'}</div>
                    {doc.valid_until && (
                      <div className="text-[10px] text-slate-400">Vence: {doc.valid_until}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      ${Number(doc.total_usd).toFixed(2)}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      Bs. {Number(doc.total_bs).toFixed(2)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ActionTooltip content="Ver Detalle de Cotización">
                        <button
                          type="button"
                          onClick={() => setSelectedDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </ActionTooltip>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron cotizaciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Cotización */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/40 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-2.5 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Cotización #{selectedDoc.document_number}</span>
                    {getStatusBadge(selectedDoc.status)}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Emitida por: <strong>{selectedDoc.created_by_user_name || 'Vendedor'}</strong> el {selectedDoc.issue_date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Metadatos en Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Cliente</span>
                  <span className="font-bold text-slate-900 block truncate">{selectedDoc.client_name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{selectedDoc.client_tax_id || 'Sin RIF'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Fecha Emisión</span>
                  <span className="font-bold text-slate-900 block">{selectedDoc.issue_date}</span>
                  <span className="text-[10px] text-slate-500">Válida: {selectedDoc.valid_until || '15 días'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Forma de Pago</span>
                  <span className="font-bold text-slate-900 block truncate">{selectedDoc.payment_method || 'Por definir'}</span>
                  <span className="text-[10px] text-slate-500">Tasa: Bs. {Number(selectedDoc.exchange_rate).toFixed(2)}</span>
                </div>
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">Total Estimado</span>
                  <span className="font-mono font-black text-indigo-900 text-base block">${Number(selectedDoc.total_usd).toFixed(2)}</span>
                  <span className="font-mono text-[10px] text-indigo-600">Bs. {Number(selectedDoc.total_bs).toFixed(2)}</span>
                </div>
              </div>

              {/* Renglones Cotizados */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Producto</th>
                      <th className="px-4 py-2.5 text-center">Cant.</th>
                      <th className="px-4 py-2.5 text-right">Precio Unit. ($)</th>
                      <th className="px-4 py-2.5 text-right">Subtotal ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedDoc.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-900 block">{item.product_name}</span>
                          {item.sku && (
                            <span className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700">
                          ${Number(item.unit_price_usd).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                          ${Number(item.subtotal_usd || (Number(item.quantity) * Number(item.unit_price_usd))).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedDoc.notes && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                  <span className="font-bold text-slate-700 block mb-0.5">Observaciones:</span>
                  <p className="text-slate-600">{selectedDoc.notes}</p>
                </div>
              )}
            </div>

            {/* Footer Fijo */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cotización</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
