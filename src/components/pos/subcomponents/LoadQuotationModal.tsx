'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  CheckCircle2,
  Package
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { CommercialQuotation } from '@/components/quotations/types';

interface LoadQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuotation: (quotation: CommercialQuotation) => void;
}

export const LoadQuotationModal: React.FC<LoadQuotationModalProps> = ({
  isOpen,
  onClose,
  onSelectQuotation,
}) => {
  const [quotations, setQuotations] = useState<CommercialQuotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<CommercialQuotation | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadQuotations();
    } else {
      setSelectedPreview(null);
      setSearch('');
    }
  }, [isOpen]);

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/sales/documents', {
        params: {
          type: 'QUOTATION',
          limit: 100,
        },
      });
      const data = res.data?.data || res.data || [];
      // Filter active quotations that are SENT or ACCEPTED
      const active = data.filter((q: CommercialQuotation) => q.status === 'SENT' || q.status === 'ACCEPTED');
      setQuotations(active);
    } catch (err) {
      console.error('Error fetching quotations for POS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = quotations.filter((q) => {
    const term = search.toLowerCase();
    return (
      q.document_number?.toLowerCase().includes(term) ||
      q.client_name?.toLowerCase().includes(term) ||
      (q.client_tax_id && q.client_tax_id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Cargar Cotización a Venta Comercial
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Selecciona una cotización activa para poblar el carrito y sincronizar existencias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número de cotización, cliente o RIF/Cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold">Buscando cotizaciones vigentes...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No hay cotizaciones activas disponibles</p>
              <p className="text-xs text-slate-400 mt-1">Solo se muestran cotizaciones en estado Enviada o Aceptada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((q) => {
                const isSelected = selectedPreview?.id === q.id;
                const totalUsd = Number(q.total_usd || 0).toFixed(2);
                const itemsCount = q.items?.length || 0;

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedPreview(q)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
                          #{q.document_number}
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {q.status === 'ACCEPTED' ? 'Aceptada' : 'Enviada'}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900 truncate">
                        {q.client_name}
                      </div>
                      {q.client_tax_id && (
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {q.client_tax_id}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>{itemsCount} {itemsCount === 1 ? 'renglón' : 'renglones'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total</span>
                        <span className="font-mono font-black text-sm text-slate-900">${totalUsd}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Quotation Items Details Preview */}
          {selectedPreview && selectedPreview.items && selectedPreview.items.length > 0 && (
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Renglones de #{selectedPreview.document_number}
                </span>
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  {selectedPreview.items.length} productos
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-right">P. Unit</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPreview.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium text-slate-800">{it.product_name}</td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-slate-700">{it.quantity}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">${Number(it.unit_price_usd).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">${Number(it.subtotal_usd || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Fijo */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedPreview}
            onClick={() => {
              if (selectedPreview) {
                onSelectQuotation(selectedPreview);
                onClose();
              }
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Cargar a la Venta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
