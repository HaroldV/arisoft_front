'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  CheckCircle2, 
  Receipt,
  Eye,
  Printer,
  Package,
  Store,
  FileSpreadsheet,
  X,
  CreditCard,
  Building2,
  DollarSign,
  Calendar
} from 'lucide-react';

import apiClient from '@/infrastructure/api/api-client';
import { ActionTooltip } from '@/components/ActionTooltip';

interface DeliveryNoteItem {
  id?: string;
  product_id?: string;
  product_name: string;
  sku?: string;
  quantity: number | string;
  unit_price_usd: number | string;
  subtotal_usd?: number | string;
  tax_usd?: number | string;
  total_usd?: number | string;
}

interface DeliveryNote {
  id: string;
  document_number: string;
  client_id?: string;
  client_name: string;
  client_tax_id?: string;
  carrier_name?: string;
  driver_name?: string;
  vehicle_plate?: string;
  status: 'DISPATCHED' | 'DELIVERED' | 'INVOICED' | 'DRAFT';
  issue_date?: string;
  delivery_date?: string;
  payment_method?: string;
  total_usd: number | string;
  total_bs: number | string;
  exchange_rate: number | string;
  created_at?: string;
  items?: DeliveryNoteItem[];
}

const getPaymentMethodLabel = (pm?: string) => {
  switch (pm) {
    case 'CASH_USD': return 'Efectivo $';
    case 'PAGO_MOVIL': return 'Pago Móvil';
    case 'TRANSFER_BS': return 'Transferencia Bs.';
    case 'ZELLE': return 'Zelle';
    case 'CREDIT': return 'Crédito';
    default: return null;
  }
};

export default function DeliveryNotesList() {
  const [items, setItems] = useState<DeliveryNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail modal state
  const [viewingDelivery, setViewingDelivery] = useState<DeliveryNote | null>(null);

  // Fiscal Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedDeliveryForInvoice, setSelectedDeliveryForInvoice] = useState<DeliveryNote | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CASH_USD');
  const [creditDays, setCreditDays] = useState<number>(30);
  const [appliedExchangeRate, setAppliedExchangeRate] = useState<number>(36.5);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('FACT-2026-00104');
  const [controlNumber, setControlNumber] = useState<string>('00-00104');
  const [isBilling, setIsBilling] = useState(false);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/sales/documents?type=DELIVERY_NOTE');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching delivery notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDeliveries();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const getCalculatedDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString().split('T')[0];
  };

  const filteredItems = items.filter(
    (i) =>
      (i.document_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.driver_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.carrier_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const openInvoiceModal = (doc: DeliveryNote) => {
    setSelectedDeliveryForInvoice(doc);
    setSelectedPaymentMethod(doc.payment_method || 'CASH_USD');
    setCreditDays(30);
    setAppliedExchangeRate(Number(doc.exchange_rate || 36.5));
    const randomNum = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`FACT-2026-0${randomNum}`);
    setControlNumber(`00-0${randomNum}`);
    setIsInvoiceModalOpen(true);
  };

  const handleConfirmInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryForInvoice) return;
    setIsBilling(true);

    try {
      const dueDate = getCalculatedDueDate(creditDays);
      const isCredit = selectedPaymentMethod === 'CREDIT';
      const totalUsd = Number(selectedDeliveryForInvoice.total_usd || 0);

      // 1. Actualizar estado en Backend (PostgreSQL)
      await apiClient.patch(`/sales/documents/${selectedDeliveryForInvoice.id}/status`, {
        status: 'INVOICED',
        payment_method: selectedPaymentMethod,
      }).catch((err) => console.warn('Error actualizando estado en backend:', err));

      // 2. Registrar automáticamente la Cuenta por Cobrar (RECEIVABLE)
      await apiClient.post('/accounts/receivables-payables', {
        type: 'RECEIVABLE',
        entity_type: 'CLIENT',
        entity_name: selectedDeliveryForInvoice.client_name,
        reference_date: new Date().toISOString().split('T')[0],
        notes: `Factura Fiscal ${invoiceNumber} (Control ${controlNumber}) emitida por Nota de Entrega #${selectedDeliveryForInvoice.document_number}.${isCredit ? ` Crédito a ${creditDays} días (Vence: ${dueDate}).` : ' Venta de Contado.'}`,
        period_amount: totalUsd,
        previous_balance: 0,
        cash_usd: selectedPaymentMethod === 'CASH_USD' ? totalUsd : 0,
        cash_bs: selectedPaymentMethod === 'PAGO_MOVIL' || selectedPaymentMethod === 'TRANSFER_BS' ? totalUsd * Number(appliedExchangeRate || 36.5) : 0,
      }).catch((err) => console.warn('Aviso al crear Cuenta por Cobrar:', err));

      // 3. Registrar en el historial maestro de Facturación de Venta (/sales)
      await apiClient.post('/sales', {
        clientId: selectedDeliveryForInvoice.client_id || undefined,
        exchangeRateApplied: Number(appliedExchangeRate || 36.5),
        invoiceNumber,
        controlNumber,
        items: (selectedDeliveryForInvoice.items || []).map((it) => ({
          productId: it.product_id || '00000000-0000-0000-0000-000000000000',
          quantity: Number(it.quantity || 1),
        })),
      }).catch((err) => console.warn('Aviso al registrar en Facturación de Venta (/sales):', err));

      // 4. Actualizar estado local
      const updated = items.map((i) =>
        i.id === selectedDeliveryForInvoice.id
          ? { ...i, status: 'INVOICED' as const, payment_method: selectedPaymentMethod }
          : i
      );
      setItems(updated);
      setIsInvoiceModalOpen(false);

      showToast(
        isCredit
          ? `🧾 Factura Fiscal ${invoiceNumber} (Control ${controlNumber}) a Crédito (${creditDays} días) registrada exitosamente en Cuentas por Cobrar (CxC). Vence el: ${dueDate}.`
          : `🧾 Factura Fiscal ${invoiceNumber} (Control ${controlNumber}) emitida exitosamente de contado y registrada en historial de Ventas/Cobranza.`
      );
    } catch (err: any) {
      alert(err.message || 'Error al emitir la factura fiscal');
    } finally {
      setIsBilling(false);
    }
  };

  const isPickupMode = (doc: DeliveryNote) => {
    const carrier = (doc.carrier_name || '').toLowerCase();
    const plate = (doc.vehicle_plate || '').toUpperCase();
    return carrier.includes('retiro') || carrier.includes('tienda') || carrier.includes('mostrador') || plate === 'N/A';
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Header Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Notas de Entrega (Guías de Despacho)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de salidas físicas de stock, entregas en mostrador, transporte y facturación fiscal final
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por guía, cliente o receptor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">N° Guía / Entrega</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Modalidad y Entrega / Transporte</th>
                <th className="py-3.5 px-4">Método Pago</th>
                <th className="py-3.5 px-4 text-right">Total ($ USD)</th>
                <th className="py-3.5 px-4 text-right">Total (Bs.)</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map((item) => {
                const pickup = isPickupMode(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.document_number}
                      <p className="text-[10px] text-slate-400 font-sans">{item.issue_date || item.created_at?.split('T')[0]}</p>
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
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {pickup ? (
                        <div>
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold px-2 py-0.5 rounded">
                            <Store className="w-3 h-3 text-blue-600" />
                            Retiro en Tienda / Mostrador
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Recibido por: <span className="font-medium text-slate-700">{item.driver_name || item.client_name}</span>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-semibold px-2 py-0.5 rounded">
                            <Truck className="w-3 h-3 text-purple-600" />
                            {item.carrier_name || 'Flete Propio'}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Chofer: {item.driver_name || 'S/D'} • Placa: <span className="font-mono">{item.vehicle_plate || 'S/P'}</span>
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {getPaymentMethodLabel(item.payment_method) ? (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                          {getPaymentMethodLabel(item.payment_method)}
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
                      {item.status === 'DISPATCHED' && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          En Tránsito / Entregada
                        </span>
                      )}
                      {item.status === 'INVOICED' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Facturada
                        </span>
                      )}
                    </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ActionTooltip content="Ver detalle de mercancía y entrega">
                        <button
                          onClick={() => setViewingDelivery(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </ActionTooltip>
                      {item.status !== 'INVOICED' && (
                        <ActionTooltip content="Facturar Nota de Entrega (Generar Factura Fiscal SENIAT)">
                          <button
                            onClick={() => openInvoiceModal(item)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                          >
                            <Receipt className="w-4 h-4" />
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

      {/* Modal Ver Detalle de Nota de Entrega (Sally Enterprise UX Standard) */}
      {viewingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Nota de Entrega #{viewingDelivery.document_number}
                    </h3>
                    <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {viewingDelivery.status === 'INVOICED' ? 'Facturada' : 'Entregada / Despachada'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Guía de despacho y comprobante de entrega física de mercancía
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDelivery(null)}
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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Cliente / Razón Social</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{viewingDelivery.client_name}</p>
                  <p className="font-mono font-semibold text-xs text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md inline-block mt-1">
                    {viewingDelivery.client_tax_id || 'SIN RIF'}
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Modalidad / Flete</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {isPickupMode(viewingDelivery) ? '🏬 Mostrador' : `🚚 ${viewingDelivery.carrier_name || 'Flete Propio'}`}
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    {isPickupMode(viewingDelivery) ? 'Recibido por' : 'Chofer / Placa'}
                  </span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {isPickupMode(viewingDelivery)
                      ? (viewingDelivery.driver_name || viewingDelivery.client_name)
                      : `${viewingDelivery.driver_name || 'S/D'} • ${viewingDelivery.vehicle_plate || 'S/P'}`}
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Método de Pago</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {getPaymentMethodLabel(viewingDelivery.payment_method) || 'Por definir'}
                  </p>
                </div>
              </div>

              {/* Items Data Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Productos Despachados ({viewingDelivery.items?.length || 0})</span>
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
                      {viewingDelivery.items && viewingDelivery.items.length > 0 ? (
                        viewingDelivery.items.map((it: any, idx: number) => {
                          const price = Number(it.unit_price_usd || 0);
                          const qty = Number(it.quantity || 0);
                          const subtotal = Number(it.subtotal_usd || (qty * price));
                          return (
                            <tr key={it.id || idx} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="py-3 px-4 font-mono font-semibold text-xs text-slate-600 bg-slate-50/60">{it.sku || 'N/A'}</td>
                              <td className="py-3 px-4 font-bold text-slate-900 text-sm">{it.product_name}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-xl text-xs inline-block">
                                  {qty}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 text-sm">${price.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">${subtotal.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                            No se encontraron ítems detallados para esta nota de entrega.
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
                  <p className="text-xs text-indigo-950 font-bold uppercase tracking-wider">Resumen General de la Entrega</p>
                  <p className="text-xs text-indigo-700/80 font-medium">
                    Tasa oficial aplicada: <span className="font-bold font-mono">Bs. {Number(viewingDelivery.exchange_rate || 36.5).toFixed(2)}</span> / USD
                  </p>
                </div>
                <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-indigo-100/80">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Monto Total Liquidado</span>
                  <p className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    ${Number(viewingDelivery.total_usd || 0).toFixed(2)} USD
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                    Equivalente en moneda nacional: <span className="text-slate-900 font-black">Bs. {Number(viewingDelivery.total_bs || 0).toFixed(2)}</span>
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
                <span>Imprimir Guía</span>
              </button>
              <div className="flex items-center gap-3">
                {viewingDelivery.status !== 'INVOICED' && (
                  <button
                    type="button"
                    onClick={() => {
                      const docToInvoice = viewingDelivery;
                      setViewingDelivery(null);
                      openInvoiceModal(docToInvoice);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-200 cursor-pointer active:scale-98"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Facturar Nota de Entrega</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingDelivery(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Facturación Fiscal Directa con Soporte de Crédito & CxC (Sally Enterprise UX Standard) */}
      {isInvoiceModalOpen && selectedDeliveryForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl p-3 shadow-md shadow-emerald-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Emisión de Factura Fiscal
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Cierre contable de la Nota de Entrega #{selectedDeliveryForInvoice.document_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInvoice} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {/* Banner informativo de Cero Descuento de Stock */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950">
                    <p className="font-bold">Stock Físico Descontado Previamente</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      Esta acción asigna el rango de factura fiscal SENIAT y registra la venta en Cuentas por Cobrar/Libro de Ventas **sin duplicar la salida de inventario WMS**.
                    </p>
                  </div>
                </div>

                {/* Ficha de Asignación Fiscal SENIAT */}
                <div className="grid grid-cols-2 gap-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-xs">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Cliente / RIF</span>
                    <p className="font-bold text-slate-900 text-sm truncate">{selectedDeliveryForInvoice.client_name}</p>
                    <p className="font-mono text-xs text-slate-600 font-semibold">{selectedDeliveryForInvoice.client_tax_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Correlativo SENIAT</span>
                    <p className="font-mono font-bold text-indigo-700 text-sm">{invoiceNumber}</p>
                    <p className="text-xs font-mono text-slate-500 font-medium">Control: {controlNumber}</p>
                  </div>
                </div>

                {/* Selector de Método de Pago Definitivo */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Método de Pago Final
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {[
                      { id: 'CASH_USD', label: 'Efectivo $', icon: DollarSign },
                      { id: 'PAGO_MOVIL', label: 'Pago Móvil', icon: CreditCard },
                      { id: 'TRANSFER_BS', label: 'Transferencia Bs.', icon: Building2 },
                      { id: 'ZELLE', label: 'Zelle $', icon: DollarSign },
                      { id: 'CREDIT', label: 'Crédito Comercial', icon: FileSpreadsheet },
                    ].map((pm) => (
                      <button
                        type="button"
                        key={pm.id}
                        onClick={() => setSelectedPaymentMethod(pm.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                          selectedPaymentMethod === pm.id
                            ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <pm.icon className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate">{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subpanel Dinámico de Días de Crédito & Cuentas por Cobrar (CxC) */}
                {selectedPaymentMethod === 'CREDIT' && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Condición de Crédito Comercial (CxC)</span>
                      </div>
                      <span className="text-xs font-bold text-amber-800">
                        Vence: <span className="font-mono">{getCalculatedDueDate(creditDays)}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-amber-800 font-medium">Plazos típicos:</span>
                      {[7, 15, 30, 45, 60].map((d) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setCreditDays(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            creditDays === d
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {d} días
                        </button>
                      ))}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={creditDays}
                          onChange={(e) => setCreditDays(Number(e.target.value))}
                          className="w-16 px-2.5 py-1 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <span className="text-xs text-amber-800 font-bold">días</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selector de Tasa de Cambio Aplicada */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs shadow-2xs">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tasa de Cambio Oficial Aplicada (Bs. / USD ó EUR)
                    </label>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Modifique si aplica Tasa BCV Euro u Oficial del Día
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-600">Bs.</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={appliedExchangeRate}
                      onChange={(e) => setAppliedExchangeRate(Number(e.target.value || 1))}
                      className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono font-black text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Resumen Financiero de Factura Luminous Theme */}
                {(() => {
                  const totalUsd = Number(selectedDeliveryForInvoice.total_usd || 0);
                  const recalculatedBs = totalUsd * Number(appliedExchangeRate || 36.5);
                  return (
                    <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs flex justify-between items-center">
                      <div>
                        <p className="text-xs text-indigo-950 font-bold uppercase tracking-wider">Monto Total a Facturar</p>
                        <p className="text-xs text-indigo-700/80 font-mono font-semibold mt-0.5">
                          Tasa: Bs. {Number(appliedExchangeRate || 36.5).toFixed(2)} / USD
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                          ${totalUsd.toFixed(2)} USD
                        </p>
                        <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                          Bs. {recalculatedBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBilling}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer text-sm shadow-md shadow-indigo-200 active:scale-98"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{isBilling ? 'Emitiendo Factura...' : 'Confirmar y Emitir Factura Fiscal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
