'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  Loader2, 
  AlertCircle,
  Printer,
  ChevronRight,
  X,
  FileText,
  AlertTriangle,
  ArrowRightLeft,
  Building,
  Plus
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { Modal } from '@/components/Modal';

interface SaleSummary {
  id: string;
  total_amount_usd: number;
  exchange_rate_applied: number;
  status: string;
  created_at: string;
  invoice_number?: string;
  control_number?: string;
  cashier: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface SaleDetailItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_time_usd: number;
  product_sku: string;
  product_name: string;
  justification?: string | null;
}

interface SaleDetail {
  id: string;
  total_amount_usd: number;
  exchange_rate_applied: number;
  status: string;
  created_at: string;
  invoice_number?: string;
  control_number?: string;
  cashier: {
    id: string;
    full_name: string;
    email: string;
  };
  client?: {
    id: string;
    name: string;
    tax_id: string;
  } | null;
  items: SaleDetailItem[];
}

interface FiscalNoteSummary {
  id: string;
  document_number: string;
  control_number: string;
  type: 'CREDIT' | 'DEBIT';
  date: string;
  reason_code: string;
  total_usd: number;
  total_ves: number;
  status: string;
}

interface LocationOption {
  id: string;
  name: string;
  type: string;
  depth: number;
}

export default function SalesHistoryPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'notes'>('sales');
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [notes, setNotes] = useState<FiscalNoteSummary[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invoice Selector Modal State
  const [isSelectingInvoice, setIsSelectingInvoice] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Detail Modal State
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [saleDetail, setSaleDetail] = useState<SaleDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Note Detail Modal State (For printing/viewing notes)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteDetail, setNoteDetail] = useState<any | null>(null);
  const [isLoadingNoteDetail, setIsLoadingNoteDetail] = useState(false);

  // Emit Note Form State
  const [isEmittingNote, setIsEmittingNote] = useState(false);
  const [noteType, setNoteType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [noteReason, setNoteReason] = useState<'RETURN' | 'DISCOUNT' | 'PRICE_ERR' | 'TAX_ERR' | 'OTHER'>('RETURN');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteExchangeRate, setNoteExchangeRate] = useState(1.0);
  const [noteReenterStock, setNoteReenterStock] = useState(true);
  const [noteLocationId, setNoteLocationId] = useState('');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [noteItems, setNoteItems] = useState<{
    productId: string;
    name: string;
    originalQty: number;
    quantity: number;
    unitPriceUsd: number;
    selected: boolean;
  }[]>([]);

  // Feedback Notification Modal
  const [feedbackMessage, setFeedbackMessage] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  const fetchSales = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/sales');
      setSales(response.data);
    } catch (err: any) {
      setError('Error al cargar el historial de ventas.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/sales/notes');
      setNotes(response.data);
    } catch (err: any) {
      setError('Error al cargar el historial de notas fiscales.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get('/inventory/warehouse-locations/tree');
      const list: LocationOption[] = [];
      const flatten = (nodes: any[], depth = 0) => {
        for (const node of nodes) {
          list.push({
            id: node.id,
            name: node.name,
            type: node.type,
            depth,
          });
          if (node.children && node.children.length > 0) {
            flatten(node.children, depth + 1);
          }
        }
      };
      flatten(response.data);
      setLocations(list);
      if (list.length > 0) {
        setNoteLocationId(list[0].id);
      }
    } catch (err) {
      console.error('Error al cargar almacenes:', err);
    }
  };

  const fetchSaleDetail = async (id: string, autoOpenEmitForm = false) => {
    setIsLoadingDetail(true);
    try {
      const response = await apiClient.get(`/sales/${id}`);
      setSaleDetail(response.data);
      // Initialize noteItems with original sale detail items
      const itemsPayload = response.data.items.map((item: SaleDetailItem) => ({
        productId: item.product_id,
        name: item.product_name,
        originalQty: item.quantity,
        quantity: item.quantity,
        unitPriceUsd: item.price_at_time_usd,
        selected: true,
      }));
      setNoteItems(itemsPayload);
      setNoteExchangeRate(response.data.exchange_rate_applied);
      
      if (autoOpenEmitForm) {
        fetchLocations();
        setIsEmittingNote(true);
      }
    } catch (err: any) {
      setError('No se pudo cargar el detalle de la venta.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const fetchNoteDetails = async (id: string) => {
    setIsLoadingNoteDetail(true);
    try {
      const response = await apiClient.get(`/sales/notes/${id}`);
      setNoteDetail(response.data);
    } catch (err: any) {
      setError('No se pudo cargar el detalle de la nota fiscal.');
    } finally {
      setIsLoadingNoteDetail(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'notes') {
        setActiveTab('notes');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSales();
    } else {
      fetchNotes();
    }
  }, [activeTab]);

  const handleSaleClick = (id: string) => {
    setSelectedSaleId(id);
    fetchSaleDetail(id);
  };

  const handleNoteClick = (id: string) => {
    setSelectedNoteId(id);
    fetchNoteDetails(id);
  };

  const handleOpenEmitNoteForm = () => {
    fetchLocations();
    setIsEmittingNote(true);
  };

  const handleCloseEmitNoteForm = () => {
    setIsEmittingNote(false);
    setNoteDescription('');
    setNoteType('CREDIT');
    setNoteReason('RETURN');
  };

  const handleToggleItemSelect = (productId: string) => {
    setNoteItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleQtyChange = (productId: string, val: number) => {
    setNoteItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const limited = Math.min(item.originalQty, Math.max(1, val));
        return { ...item, quantity: limited };
      }
      return item;
    }));
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeItems = noteItems.filter(i => i.selected);
    if (activeItems.length === 0) {
      setFeedbackMessage({
        title: 'Error de validación',
        message: 'Debe seleccionar al menos un artículo para emitir la nota fiscal.',
        type: 'error'
      });
      return;
    }

    const payload = {
      originalInvoiceId: selectedSaleId,
      type: noteType,
      reasonCode: noteReason,
      reasonDescription: noteDescription,
      currency: 'USD',
      exchangeRate: noteExchangeRate,
      reenterStock: noteType === 'CREDIT' ? noteReenterStock : false,
      locationId: noteType === 'CREDIT' && noteReenterStock ? noteLocationId : undefined,
      items: activeItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        description: `Ajuste por ${noteReason === 'RETURN' ? 'devolución' : 'descuento'}`,
        unitPriceUsd: i.unitPriceUsd,
      })),
    };

    try {
      const res = await apiClient.post('/sales/notes', payload);
      setFeedbackMessage({
        title: 'Nota Fiscal Emitida',
        message: `La ${noteType === 'CREDIT' ? 'Nota de Crédito' : 'Nota de Débito'} ${res.data.documentNumber} se registró y publicó exitosamente.`,
        type: 'success'
      });
      handleCloseEmitNoteForm();
      setSelectedSaleId(null);
      setSaleDetail(null);
      fetchNotes();
    } catch (err: any) {
      setFeedbackMessage({
        title: 'Error de emisión',
        message: err.response?.data?.message || 'Ocurrió un error al emitir la nota fiscal.',
        type: 'error'
      });
    }
  };

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.cashier.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.invoice_number && s.invoice_number.toLowerCase().includes(search.toLowerCase())) ||
    (s.control_number && s.control_number.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredNotes = notes.filter(n => 
    n.document_number.toLowerCase().includes(search.toLowerCase()) ||
    n.control_number.toLowerCase().includes(search.toLowerCase())
  );

  // Invoices filtered inside selector modal
  const selectorFilteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    s.cashier.full_name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    (s.invoice_number && s.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
    (s.control_number && s.control_number.toLowerCase().includes(invoiceSearch.toLowerCase()))
  );

  // Note Calculations
  const selectedSubtotalUsd = noteItems
    .filter(i => i.selected)
    .reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
  const selectedTaxUsd = selectedSubtotalUsd * 0.16;
  const selectedTotalUsd = selectedSubtotalUsd + selectedTaxUsd;
  const selectedTotalVes = selectedTotalUsd * noteExchangeRate;

  // QR Code Payload Generator
  const getQrUrl = (doc: any) => {
    if (!doc) return '';
    const qrPayload = {
      rif_emisor: 'J-12345678-9',
      rif_receptor: doc.client?.tax_id || 'V-00000000-0',
      doc_number: doc.document_number,
      ctrl_number: doc.control_number,
      total_usd: doc.total_usd,
      total_ves: doc.total_ves,
      date: doc.date
    };
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(qrPayload))}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Facturas de Venta e Impuestos</h1>
            <p className="text-xs text-slate-500">Consulta transacciones facturadas y emite Notas de Crédito y Débito.</p>
          </div>
        </div>

        {/* Tabs for switching views */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'sales' 
                ? 'bg-white text-indigo-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Facturas de Ventas
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'notes' 
                ? 'bg-white text-indigo-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Notas de Crédito / Débito
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950">Error detectado</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'sales' ? "Buscar por Ticket ID o Nombre de Cajero..." : "Buscar por Nro Nota o Nro Control..."}
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {activeTab === 'notes' && (
          <button
            onClick={() => { setIsSelectingInvoice(true); setInvoiceSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-lg cursor-pointer shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            Emitir Nota Fiscal
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Cargando registros...</span>
          </div>
        ) : activeTab === 'sales' ? (
          filteredSales.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No se encontraron ventas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Ticket ID</th>
                    <th className="py-4 px-6">Factura / Control</th>
                    <th className="py-4 px-6">Cajero</th>
                    <th className="py-4 px-6">Total USD</th>
                    <th className="py-4 px-6">Total VES</th>
                    <th className="py-4 px-6">Fecha / Hora</th>
                    <th className="py-4 px-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">#{s.id.substring(0, 8).toUpperCase()}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-800">
                        {s.invoice_number ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-950">{s.invoice_number}</span>
                            <span className="text-[10px] text-slate-400">Ctrl: {s.control_number}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No fiscal (Pre-registro)</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">{s.cashier.full_name}</td>
                      <td className="py-4 px-6 font-semibold">${Number(s.total_amount_usd).toFixed(2)}</td>
                      <td className="py-4 px-6 font-medium text-slate-500">{(s.total_amount_usd * s.exchange_rate_applied).toLocaleString('es-VE')} Bs.</td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleSaleClick(s.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                          Ver Detalle
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredNotes.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No se encontraron notas fiscales registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Nro Documento</th>
                    <th className="py-4 px-6">Nro Control</th>
                    <th className="py-4 px-6">Tipo</th>
                    <th className="py-4 px-6">Motivo</th>
                    <th className="py-4 px-6">Total USD</th>
                    <th className="py-4 px-6">Total VES</th>
                    <th className="py-4 px-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredNotes.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-900">{n.document_number}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">{n.control_number}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          n.type === 'CREDIT' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {n.type === 'CREDIT' ? 'CRÉDITO' : 'DÉBITO'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs uppercase font-medium">{n.reason_code}</td>
                      <td className="py-4 px-6 font-semibold">${Number(n.total_usd).toFixed(2)}</td>
                      <td className="py-4 px-6 font-medium text-slate-500">{Number(n.total_ves).toLocaleString('es-VE')} Bs.</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleNoteClick(n.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                          Ver Detalle
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Invoice Selector Modal */}
      {isSelectingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Seleccionar Factura de Venta</h3>
              <button 
                onClick={() => setIsSelectingInvoice(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">Toda nota de crédito o débito debe modificar un documento fiscal registrado. Por favor busque y seleccione la factura original a continuación:</p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar por Ticket ID o Cajero..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
                {selectorFilteredSales.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic">No se encontraron facturas coincidentes</div>
                ) : (
                  selectorFilteredSales.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setIsSelectingInvoice(false);
                        setSelectedSaleId(s.id);
                        fetchSaleDetail(s.id, true);
                      }}
                      className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex justify-between items-center text-xs cursor-pointer"
                    >
                      <div>
                        {s.invoice_number ? (
                          <span className="font-mono font-bold text-slate-800 block">
                            {s.invoice_number} <span className="text-[10px] text-slate-400 font-normal">(Ctrl: {s.control_number})</span>
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-700 block">#{s.id.substring(0, 8).toUpperCase()}</span>
                        )}
                        <span className="text-slate-500">Cajero: {s.cashier.full_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">${Number(s.total_amount_usd).toFixed(2)} USD</span>
                        <span className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSelectingInvoice(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Detail Receipt Drawer Modal */}
      {selectedSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Detalle de Ticket</h3>
              <button 
                onClick={() => { setSelectedSaleId(null); setSaleDetail(null); }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingDetail || !saleDetail ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-semibold">Cargando ticket...</span>
              </div>
            ) : (
              <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                {/* Header info */}
                <div className="text-xs font-mono border-b border-dashed border-slate-200 pb-3 space-y-1.5 text-slate-600">
                  {saleDetail.invoice_number && (
                    <>
                      <p className="flex justify-between">
                        <span>Factura Nro:</span>
                        <span className="font-bold text-slate-900">{saleDetail.invoice_number}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Nro. Control:</span>
                        <span className="font-bold text-slate-900">{saleDetail.control_number}</span>
                      </p>
                    </>
                  )}
                  <p className="flex justify-between">
                    <span>Ticket ID:</span>
                    <span className="font-bold text-slate-900">#{saleDetail.id.toUpperCase()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Cajero:</span>
                    <span className="font-bold text-slate-900">{saleDetail.cashier.full_name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-bold text-slate-900">{saleDetail.client?.name || 'Cliente Genérico'}</span>
                  </p>
                  {saleDetail.client && (
                    <p className="flex justify-between">
                      <span>Cédula/RIF:</span>
                      <span className="font-bold text-slate-900">{saleDetail.client.tax_id}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span>Fecha / Hora:</span>
                    <span>{new Date(saleDetail.created_at).toLocaleString()}</span>
                  </p>
                </div>

                {/* Items list */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Artículos facturados</span>
                  <div className="space-y-2">
                    {saleDetail.items.map((item, i) => {
                      const isNegative = item.justification && item.justification.length > 0;
                      return (
                        <div key={i} className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isNegative ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/30 border-slate-200/60'
                        }`}>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-800 truncate max-w-48">{item.product_name} (x{item.quantity})</span>
                            <span className={isNegative ? 'text-rose-600' : 'text-slate-900'}>
                              ${(item.price_at_time_usd * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals block */}
                <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-right font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tasa Aplicada:</span>
                    <span>{saleDetail.exchange_rate_applied.toFixed(2)} Bs.</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm">
                    <span>TOTAL USD:</span>
                    <span>${saleDetail.total_amount_usd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-500 text-xs">
                    <span>TOTAL VES:</span>
                    <span>{(saleDetail.total_amount_usd * saleDetail.exchange_rate_applied).toLocaleString('es-VE')} Bs.</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleOpenEmitNoteForm}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded-xl font-medium text-xs transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Emitir Nota de Crédito / Débito
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-medium text-slate-700 text-xs transition-colors cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      Reimprimir
                    </button>
                    <button
                      onClick={() => { setSelectedSaleId(null); setSaleDetail(null); }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700 text-xs transition-colors cursor-pointer"
                    >
                      Cerrar Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emit Note Modal Form */}
      {isEmittingNote && saleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSubmitNote} className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Emitir Nota Fiscal de Ajuste</h3>
              <button 
                type="button"
                onClick={handleCloseEmitNoteForm} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Associated invoice details */}
              <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Factura original a ajustar:</span>
                  <span className="font-mono font-bold text-indigo-950">
                    {saleDetail.invoice_number || `#${saleDetail.id.substring(0, 8).toUpperCase()}`}
                  </span>
                </div>
                {saleDetail.control_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Número de Control:</span>
                    <span className="font-mono font-bold text-indigo-950">{saleDetail.control_number}</span>
                  </div>
                )}
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Tipo de Documento</label>
                  <select 
                    value={noteType} 
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  >
                    <option value="CREDIT">Nota de Crédito</option>
                    <option value="DEBIT">Nota de Débito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Motivo Fiscal</label>
                  <select 
                    value={noteReason} 
                    onChange={(e) => setNoteReason(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  >
                    <option value="RETURN">Devolución de mercancía</option>
                    <option value="DISCOUNT">Descuento comercial</option>
                    <option value="PRICE_ERR">Error en el precio</option>
                    <option value="TAX_ERR">Error en cálculo de IVA</option>
                    <option value="OTHER">Otro motivo especificado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Descripción / Justificación</label>
                <input 
                  type="text" 
                  required
                  placeholder="Detalles sobre el ajuste del documento..."
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Items Table for notes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Seleccionar artículos a ajustar</span>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {noteItems.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 bg-slate-50/20">
                      <input 
                        type="checkbox" 
                        checked={item.selected}
                        onChange={() => handleToggleItemSelect(item.productId)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-200 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500">Max original: {item.originalQty}</span>
                      </div>
                      {item.selected && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Cant:</span>
                          <input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* WMS location selector for re-entry */}
              {noteType === 'CREDIT' && noteReason === 'RETURN' && (
                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-950 text-xs font-bold">
                    <Building className="h-4 w-4 text-indigo-600" />
                    <span>Control de Inventario WMS (Devolución Física)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input 
                        type="checkbox" 
                        checked={noteReenterStock}
                        onChange={(e) => setNoteReenterStock(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-200 focus:ring-indigo-500"
                      />
                      <span>¿Reingresar mercadería al inventario?</span>
                    </label>
                  </div>
                  {noteReenterStock && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Destino de Reingreso WMS</label>
                      <select
                        value={noteLocationId}
                        onChange={(e) => setNoteLocationId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {'\u00A0'.repeat(loc.depth * 3)}
                            {loc.name} ({loc.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Reactive Totals display */}
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-mono bg-slate-50/50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tasa BCV</span>
                  <span className="font-bold text-slate-700">{noteExchangeRate.toFixed(2)} Bs.</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block text-sm">Total USD: ${selectedTotalUsd.toFixed(2)}</span>
                  <span className="font-bold text-slate-500 block">Total VES: {selectedTotalVes.toLocaleString('es-VE')} Bs.</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                type="button" 
                onClick={handleCloseEmitNoteForm}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all cursor-pointer text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all cursor-pointer text-sm"
              >
                Emitir Nota Fiscal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Note Print / Receipt Preview Modal (QR and Fiscal Leyend) */}
      {selectedNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Documento de Ajuste Fiscal</h3>
              <button 
                onClick={() => { setSelectedNoteId(null); setNoteDetail(null); }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingNoteDetail || !noteDetail ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-semibold">Cargando documento fiscal...</span>
              </div>
            ) : (
              <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh] print-container">
                {/* Print Invoice Style header */}
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 uppercase">ARI Soft ERP C.A.</h4>
                  <p className="text-[10px] text-slate-500">RIF: J-12345678-9</p>
                  <p className="text-[10px] text-slate-500">Dirección Fiscal: Caracas, Venezuela</p>
                </div>

                <div className="border-t border-b border-dashed border-slate-200 py-3 text-xs font-mono space-y-1 text-slate-700">
                  <p className="text-center font-bold text-sm uppercase text-indigo-700">
                    {noteDetail.type === 'CREDIT' ? 'Nota de Crédito' : 'Nota de Débito'}
                  </p>
                  <p className="flex justify-between">
                    <span>Nro Documento:</span>
                    <span className="font-bold text-slate-950">{noteDetail.document_number}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Nro Control:</span>
                    <span className="font-bold text-slate-950">{noteDetail.control_number}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{new Date(noteDetail.date).toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-bold">{noteDetail.client?.name || 'Cliente Genérico'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Cédula/RIF:</span>
                    <span>{noteDetail.client?.tax_id || 'V-00000000-0'}</span>
                  </p>
                  <div className="border-t border-slate-100/80 pt-2 text-[10px] text-slate-500 italic">
                    <span>Referencia: Modifica a Factura ID #{noteDetail.original_invoice_id.substring(0, 8).toUpperCase()}</span>
                  </div>
                </div>

                {/* Items table */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                    <span>Artículo / Concepto</span>
                    <span>Total USD</span>
                  </div>
                  <div className="space-y-1.5">
                    {noteDetail.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-slate-800">
                        <span>{item.product_name} (x{item.quantity})</span>
                        <span className="font-mono">${item.total_usd.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-right font-mono text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Tasa BCV:</span>
                    <span>{noteDetail.exchange_rate.toFixed(2)} Bs.</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm">
                    <span>TOTAL USD:</span>
                    <span>${noteDetail.total_usd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>TOTAL VES:</span>
                    <span>{noteDetail.total_ves.toLocaleString('es-VE')} Bs.</span>
                  </div>
                </div>

                {/* QR and Fiscal Message */}
                <div className="flex flex-col items-center justify-center space-y-3 pt-4 border-t border-dashed border-slate-200">
                  <img 
                    src={getQrUrl(noteDetail)} 
                    alt="QR Fiscal SENIAT" 
                    className="w-32 h-32 border border-slate-200 p-2 rounded-xl"
                  />
                  <div className="text-center space-y-1">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Factura emitida conforme a la Providencia Administrativa N° SNAT/2024/000102</p>
                    <p className="text-[8px] text-slate-400 font-mono">HASH: {noteDetail.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 bg-white no-print">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-bold text-slate-700 text-xs transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Nota
                  </button>
                  <button
                    onClick={() => { setSelectedNoteId(null); setNoteDetail(null); }}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-950 rounded-xl font-bold text-white text-xs transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global feedback message */}
      {feedbackMessage && (
        <Modal
          isOpen={true}
          title={feedbackMessage.title}
          message={feedbackMessage.message}
          type={feedbackMessage.type === 'success' ? 'success' : 'error'}
          onConfirm={() => setFeedbackMessage(null)}
          confirmText="Aceptar"
        />
      )}
    </div>
  );
}
