'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Download,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  Eye,
  X,
  ArrowRightLeft,
  Building,
  Printer,
  ChevronRight,
  FileMinus,
  FilePlus
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { ActionTooltip } from '@/components/ActionTooltip';
import { Modal } from '@/components/Modal';
import { SearchableSelect, SelectOption } from '@/components/SearchableSelect';

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  total_amount_usd: number;
  discount_percentage?: number;
  discount_amount_usd?: number;
  proof_file_path?: string;
  created_at: string;
  creator_name?: string;
  status?: string;
  credit_notes?: string;
  debit_notes?: string;
}

interface PurchaseItemDto {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost_usd: number;
  product_sku: string;
  product_name: string;
}

interface PurchaseNoteSummary {
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

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [notes, setNotes] = useState<PurchaseNoteSummary[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Details Modal state
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Note Detail Modal State
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteDetail, setNoteDetail] = useState<any | null>(null);
  const [isLoadingNoteDetail, setIsLoadingNoteDetail] = useState(false);

  // Register Note Form State
  const [isRegisteringNote, setIsRegisteringNote] = useState(false);
  const [noteDocumentNumber, setNoteDocumentNumber] = useState('');
  const [noteControlNumber, setNoteControlNumber] = useState('');
  const [noteType, setNoteType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [noteReason, setNoteReason] = useState<'RETURN' | 'DISCOUNT' | 'PRICE_ERR' | 'TAX_ERR' | 'OTHER'>('RETURN');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteExchangeRate, setNoteExchangeRate] = useState(50.0);
  const [noteAdjustStock, setNoteAdjustStock] = useState(true);
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
  const [noteTotalUsdInput, setNoteTotalUsdInput] = useState<string>('');

  // Feedback Notification Modal
  const [feedbackMessage, setFeedbackMessage] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  const fetchPurchaseDetails = async (id: string, autoOpenEmitForm = false) => {
    setIsDetailsLoading(true);
    setDetailsError(null);
    setSelectedPurchaseId(id);
    try {
      const res = await apiClient.get(`/inventory/purchases/${id}`);
      setPurchaseDetails(res.data);
      // Initialize noteItems with original invoice items
      const itemsPayload = res.data.items.map((item: PurchaseItemDto) => ({
        productId: item.product_id,
        name: item.product_name,
        originalQty: item.quantity,
        quantity: item.quantity,
        unitPriceUsd: Number(item.unit_cost_usd || 0),
        selected: true,
      }));
      setNoteItems(itemsPayload);
      const total = itemsPayload.reduce((sum: number, i: any) => sum + i.quantity * i.unitPriceUsd, 0);
      setNoteTotalUsdInput(total > 0 ? total.toFixed(2) : '');

      if (autoOpenEmitForm) {
        fetchLocations();
        setIsRegisteringNote(true);
      }
    } catch (err) {
      setDetailsError('No se pudieron cargar los detalles de la compra.');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedPurchaseId(null);
    setPurchaseDetails(null);
  };

  const fetchPurchases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/inventory/purchases');
      setPurchases(response.data);
    } catch (err: any) {
      setError('Error al cargar el historial de compras.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/inventory/purchases/notes');
      setNotes(response.data);
    } catch (err: any) {
      setError('Error al cargar el historial de notas fiscales de compras.');
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

  const fetchNoteDetails = async (id: string) => {
    setIsLoadingNoteDetail(true);
    try {
      const response = await apiClient.get(`/inventory/purchases/notes/${id}`);
      setNoteDetail(response.data);
    } catch (err: any) {
      setError('No se pudo cargar el detalle de la nota fiscal.');
    } finally {
      setIsLoadingNoteDetail(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleNoteClick = (id: string) => {
    setSelectedNoteId(id);
    fetchNoteDetails(id);
  };

  const handleOpenRegisterNoteForm = () => {
    fetchLocations();
    setIsRegisteringNote(true);
  };

  const handleCloseRegisterNoteForm = () => {
    setIsRegisteringNote(false);
    setNoteDocumentNumber('');
    setNoteControlNumber('');
    setNoteDescription('');
    setNoteType('CREDIT');
    setNoteReason('RETURN');
    setSelectedPurchaseId(null);
    setPurchaseDetails(null);
  };

  const handleToggleItemSelect = (productId: string) => {
    setNoteItems(prev => {
      const next = prev.map(item =>
        item.productId === productId ? { ...item, selected: !item.selected } : item
      );
      const total = next.filter(i => i.selected).reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
      setNoteTotalUsdInput(total > 0 ? total.toFixed(2) : '');
      return next;
    });
  };

  const handleQtyChange = (productId: string, val: number) => {
    setNoteItems(prev => {
      const next = prev.map(item => {
        if (item.productId === productId) {
          const limited = Math.min(item.originalQty, Math.max(1, val));
          return { ...item, quantity: limited };
        }
        return item;
      });
      const total = next.filter(i => i.selected).reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
      setNoteTotalUsdInput(total > 0 ? total.toFixed(2) : '');
      return next;
    });
  };

  const handleUnitPriceChange = (productId: string, val: number) => {
    setNoteItems(prev => {
      const next = prev.map(item => {
        if (item.productId === productId) {
          return { ...item, unitPriceUsd: Math.max(0, val) };
        }
        return item;
      });
      const total = next.filter(i => i.selected).reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
      setNoteTotalUsdInput(total > 0 ? total.toFixed(2) : '');
      return next;
    });
  };

  const handleTotalAjusteChange = (valStr: string) => {
    setNoteTotalUsdInput(valStr);
    const val = parseFloat(valStr);
    if (isNaN(val) || val <= 0) return;

    // Distribute the total among the selected items
    const selected = noteItems.filter(i => i.selected);
    if (selected.length === 0) return;

    const totalQty = selected.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQty === 0) return;

    const pricePerUnit = val / totalQty;

    setNoteItems(prev => prev.map(item => {
      if (item.selected) {
        return { ...item, unitPriceUsd: pricePerUnit };
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
        message: 'Debe seleccionar al menos un artículo para registrar la nota.',
        type: 'error'
      });
      return;
    }

    if (!noteDescription.trim()) {
      setFeedbackMessage({
        title: 'Error de validación',
        message: 'La descripción / razón del ajuste es de carácter obligatorio.',
        type: 'error'
      });
      return;
    }

    const payload = {
      originalInvoiceId: selectedPurchaseId,
      documentNumber: noteDocumentNumber,
      controlNumber: noteControlNumber,
      type: noteType,
      reasonCode: noteReason,
      reasonDescription: noteDescription,
      currency: 'USD',
      exchangeRate: noteExchangeRate,
      adjustStock: false,
      locationId: undefined,
      items: activeItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        description: `Ajuste de compra por ${noteReason === 'RETURN' ? 'devolución' : 'descuento'}`,
        unitPriceUsd: i.unitPriceUsd,
      })),
    };

    try {
      await apiClient.post('/inventory/purchases/notes', payload);
      setFeedbackMessage({
        title: 'Nota Fiscal Registrada',
        message: `La Nota de ajuste de proveedor ${noteDocumentNumber} se registró exitosamente en el sistema.`,
        type: 'success'
      });
      handleCloseRegisterNoteForm();
      setSelectedPurchaseId(null);
      setPurchaseDetails(null);
      fetchPurchases();
    } catch (err: any) {
      setFeedbackMessage({
        title: 'Error de registro',
        message: err.response?.data?.message || 'Ocurrió un error al registrar la nota de compra.',
        type: 'error'
      });
    }
  };

  const filteredPurchases = purchases.filter(p =>
    p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name.toLowerCase().includes(search.toLowerCase())
  );



  // Live Note Calculations
  const selectedTotalUsd = noteItems
    .filter(i => i.selected)
    .reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
  const selectedTotalVes = selectedTotalUsd * noteExchangeRate;

  // QR Code Payload Generator
  const getQrUrl = (doc: any) => {
    if (!doc) return '';
    const qrPayload = {
      rif_emisor: doc.provider?.rif || 'J-00000000-0',
      rif_receptor: 'J-12345678-9', // Client RIF
      doc_number: doc.document_number,
      ctrl_number: doc.control_number,
      total_usd: doc.total_usd,
      total_ves: doc.total_ves,
      date: doc.date
    };
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(qrPayload))}`;
  };

  // Select Options for SearchableSelect
  const noteTypeOptions: SelectOption[] = [
    { value: 'CREDIT', label: 'Nota de Crédito', sublabel: 'Descuento o devolución (reduce saldo / stock)' },
    { value: 'DEBIT', label: 'Nota de Débito', sublabel: 'Aumento de precio o recargo (incrementa saldo)' }
  ];

  const noteReasonOptions: SelectOption[] = [
    { value: 'RETURN', label: 'Devolución de mercancía', sublabel: 'Reingreso físico y ajuste de stock' },
    { value: 'DISCOUNT', label: 'Descuento del proveedor', sublabel: 'Ajuste financiero de cuenta por pagar' },
    { value: 'PRICE_ERR', label: 'Error en precio facturado', sublabel: 'Discrepancia en costo acordado' },
    { value: 'TAX_ERR', label: 'Error en cálculo de IVA', sublabel: 'Corrección de alícuotas o base imponible' },
    { value: 'OTHER', label: 'Otro motivo especificado', sublabel: 'Causas varias no tabuladas' }
  ];

  const wmsLocationOptions: SelectOption[] = locations.map(loc => ({
    value: loc.id,
    label: `${'\u00A0'.repeat(loc.depth * 3)}${loc.name}`,
    sublabel: `Tipo: ${loc.type} (Nivel ${loc.depth})`,
    badge: loc.type
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <FileText className="h-6 w-6" />
            <FileText className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Registro de Compras e Impuestos</h1>
            <p className="text-xs text-slate-500">Consulta facturas de compras de proveedores y registra notas de ajuste recibidas.</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/inventory/purchases/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-755 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-lg cursor-pointer animate-in fade-in"
        >
          <Plus className="h-4 w-4" />
          Registrar Compra
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950">Error al cargar datos</p>
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
            placeholder="Buscar por Factura o Proveedor..."
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Cargando registros...</span>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <FileText className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No se encontraron facturas de compras</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Nro. Factura</th>
                  <th className="py-4 px-6">Proveedor</th>
                  <th className="py-4 px-6 text-center">Estado / Notas</th>
                  <th className="py-4 px-6">Monto Total</th>
                  <th className="py-4 px-6">Cargado Por</th>
                  <th className="py-4 px-6">Fecha / Hora</th>
                  <th className="py-4 px-6 text-right">Comprobante</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">{p.invoice_number}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{p.supplier_name}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border inline-flex items-center gap-1 ${p.status === 'ANULADA'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : p.status === 'AJUSTADA'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                          {p.status === 'ANULADA' ? 'Anulada' : p.status === 'AJUSTADA' ? 'Ajustada' : 'Registrada'}
                        </span>
                        {p.credit_notes && (
                          <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                            {p.credit_notes.split(',').map((noteStr) => {
                              const [docNum, noteId] = noteStr.split(':');
                              return (
                                <button
                                  key={noteId}
                                  onClick={() => handleNoteClick(noteId)}
                                  className="font-mono text-[9px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors"
                                  title="Ver detalle de Nota de Crédito"
                                >
                                  NC: {docNum}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {p.debit_notes && (
                          <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                            {p.debit_notes.split(',').map((noteStr) => {
                              const [docNum, noteId] = noteStr.split(':');
                              return (
                                <button
                                  key={noteId}
                                  onClick={() => handleNoteClick(noteId)}
                                  className="font-mono text-[9px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors"
                                  title="Ver detalle de Nota de Débito"
                                >
                                  ND: {docNum}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-emerald-600">${Number(p.total_amount_usd).toFixed(2)}</td>
                    <td className="py-4 px-6 text-slate-500">{p.creator_name || 'Admin'}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {p.proof_file_path ? (
                        <a
                          href={p.proof_file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          Ver factura
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">Sin archivo</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <ActionTooltip content="Ver detalle de compra">
                          <button
                            onClick={() => fetchPurchaseDetails(p.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </ActionTooltip>

                        <ActionTooltip content={p.status === 'ANULADA' ? "Compra anulada" : "Registrar Nota de Ajuste (Crédito/Débito)"}>
                          <button
                            onClick={() => {
                              if (p.status === 'ANULADA') return;
                              setNoteType('CREDIT');
                              fetchPurchaseDetails(p.id, true);
                            }}
                            disabled={p.status === 'ANULADA'}
                            className={`p-1.5 rounded-lg transition-all duration-200 inline-flex items-center ${p.status === 'ANULADA'
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                              }`}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedPurchaseId && !isRegisteringNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Detalle de Compra: {purchaseDetails?.invoice_number || '...'}
              </h3>
              <button
                onClick={handleCloseDetails}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isDetailsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  <span className="text-sm font-semibold text-slate-500">Cargando detalles...</span>
                </div>
              ) : detailsError ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                  <span>{detailsError}</span>
                </div>
              ) : purchaseDetails && (
                <div className="space-y-6">
                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Proveedor</p>
                      <p className="font-bold text-slate-800 mt-0.5">{purchaseDetails.supplier_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Cargado Por</p>
                      <p className="font-medium text-slate-800 mt-0.5">{purchaseDetails.created_by?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Fecha Registro</p>
                      <p className="text-slate-600 mt-0.5">{new Date(purchaseDetails.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Comprobante</p>
                      <div className="mt-0.5">
                        {purchaseDetails.proof_file_path ? (
                          <a
                            href={purchaseDetails.proof_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            Ver Archivo
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold italic">No adjunto</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Productos Ingresados</h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                            <th className="p-3">SKU</th>
                            <th className="p-3">Producto</th>
                            <th className="p-3 text-right">Cant.</th>
                            <th className="p-3 text-right">Costo Unit.</th>
                            <th className="p-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {purchaseDetails.items?.map((item: any) => (
                            <tr key={item.id}>
                              <td className="p-3 font-mono text-[11px] text-slate-500">{item.product_sku}</td>
                              <td className="p-3 font-bold text-slate-800">{item.product_name}</td>
                              <td className="p-3 text-right">{item.quantity}</td>
                              <td className="p-3 text-right">${Number(item.unit_cost_usd).toFixed(2)}</td>
                              <td className="p-3 text-right">${(item.quantity * item.unit_cost_usd).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Settlement calculations */}
                  <div className="border-t border-slate-100 pt-4 flex flex-col items-end space-y-1.5 text-sm">
                    {(() => {
                      const computedSubtotal = purchaseDetails.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_cost_usd), 0) || 0;
                      const pct = purchaseDetails.discount_percentage || 0;
                      const amt = purchaseDetails.discount_amount_usd || 0;
                      return (
                        <div className="w-full max-w-xs space-y-1.5">
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Subtotal:</span>
                            <span className="font-semibold">${computedSubtotal.toFixed(2)} USD</span>
                          </div>
                          {pct > 0 && (
                            <div className="flex justify-between items-center text-rose-600">
                              <span>Descuento ({pct}%):</span>
                              <span className="font-semibold">-${amt.toFixed(2)} USD</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center font-bold text-slate-800 border-t border-slate-100 pt-1.5">
                            <span>Total Factura:</span>
                            <span className="text-base font-black text-emerald-600">${Number(purchaseDetails.total_amount_usd).toFixed(2)} USD</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
              <button
                onClick={handleOpenRegisterNoteForm}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Registrar Nota de Ajuste de Proveedor
              </button>
              <button
                onClick={handleCloseDetails}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Note Modal Form */}
      {isRegisteringNote && purchaseDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSubmitNote} className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Registrar Nota Fiscal de Compra</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Registro de Nota de Crédito o Débito emitida por el proveedor</p>
              </div>
              <button
                type="button"
                onClick={handleCloseRegisterNoteForm}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Associated invoice details */}
              <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-150 p-4 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">Factura original a ajustar:</span>
                  <span className="font-mono font-extrabold text-sm text-indigo-950 bg-white/90 border border-indigo-100 px-3 py-1 rounded-xl shadow-3xs">
                    {purchaseDetails.invoice_number}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-100/60 pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">Proveedor:</span>
                  <span className="font-extrabold text-sm text-indigo-950 truncate max-w-[280px]">{purchaseDetails.supplier_name}</span>
                </div>
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tipo de Ajuste</label>
                  <SearchableSelect
                    options={noteTypeOptions}
                    value={noteType}
                    onChange={(val) => setNoteType(val as any)}
                    placeholder="Seleccionar tipo..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Motivo del Ajuste</label>
                  <SearchableSelect
                    options={noteReasonOptions}
                    value={noteReason}
                    onChange={(val) => setNoteReason(val as any)}
                    placeholder="Seleccionar motivo..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nro Documento Proveedor</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. NC-10293"
                    value={noteDocumentNumber}
                    onChange={(e) => setNoteDocumentNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nro Control Proveedor</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 00-1002"
                    value={noteControlNumber}
                    onChange={(e) => setNoteControlNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Descripción / Razón de este Ajuste <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Escriba obligatoriamente la razón comercial de este ajuste..."
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-2xs"
                />
              </div>

              {/* Items Table for notes */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Artículos Facturados (Solo Lectura)</label>
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                          <th className="p-3">Artículo</th>
                          <th className="p-3 text-center">Costo Unit. original</th>
                          <th className="p-3 text-center">Costo Unit. ajuste</th>
                          <th className="p-3 text-center">Cant. Facturada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {noteItems.map((item) => (
                          <tr key={item.productId} className="bg-slate-50/20 hover:bg-indigo-50/30 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block truncate max-w-[280px]">{item.name}</span>
                            </td>
                            <td className="p-3 text-center font-mono font-semibold text-slate-500">
                              ${(purchaseDetails.items?.find((i: any) => i.product_id === item.productId)?.unit_cost_usd || item.unitPriceUsd).toFixed(2)}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-600">
                              ${item.unitPriceUsd.toFixed(2)}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-700">
                              {item.originalQty}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Reactive Totals display (Luminous Executive Theme) */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Ajuste Proveedor ($ USD)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={noteTotalUsdInput}
                      onChange={(e) => handleTotalAjusteChange(e.target.value)}
                      placeholder="0.00"
                      className="w-36 px-3 py-2 bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-center text-sm font-black text-slate-900 mt-1.5 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Monto en Bolívares (VES)</span>
                    <span className="font-mono font-black text-2xl sm:text-3xl text-indigo-700 tracking-tight block mt-1">
                      {((parseFloat(noteTotalUsdInput) || 0) * noteExchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500 block mt-0.5">
                      Tasa de Cambio: {noteExchangeRate.toFixed(2)} Bs/$
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={handleCloseRegisterNoteForm}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
              >
                Registrar Nota
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Nota de Ajuste de Proveedor</h3>
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
                <span className="text-xs text-slate-400 font-semibold">Cargando documento...</span>
              </div>
            ) : (
              <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh] print-container">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 uppercase">{noteDetail.provider?.name || 'Proveedor'}</h4>
                  <p className="text-[10px] text-slate-500">RIF: {noteDetail.provider?.rif || 'N/A'}</p>
                </div>

                <div className="border-t border-b border-dashed border-slate-200 py-3 text-xs font-mono space-y-1 text-slate-700">
                  <p className="text-center font-bold text-sm uppercase text-indigo-700">
                    {noteDetail.type === 'CREDIT' ? 'Nota de Crédito' : 'Nota de Débito'}
                  </p>
                  <p className="flex justify-between">
                    <span>Nro Documento:</span>
                    <span className="font-bold text-slate-955">{noteDetail.document_number}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Nro Control:</span>
                    <span className="font-bold text-slate-955">{noteDetail.control_number}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Fecha Registro:</span>
                    <span>{new Date(noteDetail.date).toLocaleString()}</span>
                  </p>
                  <div className="border-t border-slate-100/80 pt-2 text-[10px] text-slate-500 italic">
                    <span>Referencia: Modifica a Factura Compra ID #{noteDetail.original_invoice_id.substring(0, 8).toUpperCase()}</span>
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
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Representación gráfica de Nota Fiscal de Proveedor</p>
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
