'use client';

import React, { useState } from 'react';
import { ORDER_STATUS } from '@/constants/domain-constants';
import { 
  ClipboardList, 
  Search, 
  CheckCircle2, 
  X, 
  Truck,
  Eye,
  Printer,
  Package,
  Store,
  UserCheck,
  ShoppingCart
} from 'lucide-react';

import apiClient from '@/infrastructure/api/api-client';
import { ActionTooltip } from '@/components/ActionTooltip';

interface SalesOrderItem {
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

interface SalesOrder {
  id: string;
  document_number: string;
  client_name: string;
  client_tax_id?: string;
  status: 'APPROVED' | 'DISPATCHED' | 'CONVERTED' | 'DRAFT';
  issue_date?: string;
  valid_until?: string;
  payment_method?: string;
  total_usd: number | string;
  total_bs: number | string;
  exchange_rate: number | string;
  created_by_user_name?: string;
  items?: SalesOrderItem[];
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

export default function SalesOrdersList() {
  const [items, setItems] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delivery / Transport modal state
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'PICKUP' | 'SHIPPING'>('PICKUP');
  const [pickupPerson, setPickupPerson] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail viewing modal state
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/sales/documents?type=SALES_ORDER');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching sales orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredItems = items.filter(
    (i) =>
      (i.document_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.client_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const openTransportModal = (doc: SalesOrder) => {
    setSelectedOrder(doc);
    setDeliveryMode('PICKUP');
    setPickupPerson(doc.client_name || '');
    setCarrierName('');
    setVehiclePlate('');
    setDriverName('');
    setIsTransportModalOpen(true);
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSubmitting(true);

    let finalCarrier = 'Retiro en Tienda / Mostrador';
    let finalDriver = pickupPerson.trim() || selectedOrder.client_name || 'Cliente Directo';
    let finalPlate = 'N/A';

    if (deliveryMode === 'SHIPPING') {
      finalCarrier = carrierName.trim() || 'Flete Propio';
      finalDriver = driverName.trim() || 'Conductor Asignado';
      finalPlate = vehiclePlate.trim().toUpperCase() || 'S/P';
    }

    try {
      await apiClient.post(`/sales/documents/${selectedOrder.id}/convert`, {
        target_type: 'DELIVERY_NOTE',
        carrier_name: finalCarrier,
        vehicle_plate: finalPlate,
        driver_name: finalDriver,
      });

      setIsTransportModalOpen(false);
      fetchOrders();
      showToast(`📦 Nota de Entrega generada exitosamente para el Pedido #${selectedOrder.document_number} (Salida de Stock efectuada).`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al generar la nota de entrega');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por n° pedido o cliente..."
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
              {filteredItems.map((item) => (
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
                    {item.status !== 'CONVERTED' && item.status !== 'DISPATCHED' && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Stock Reservado
                      </span>
                    )}
                    {(item.status === 'CONVERTED' || item.status === 'DISPATCHED') && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Despachado
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ActionTooltip content="Ver detalle de productos">
                        <button
                          onClick={() => setViewingOrder(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </ActionTooltip>
                      {item.status !== 'CONVERTED' && item.status !== 'DISPATCHED' && (
                        <ActionTooltip content="Generar Nota de Entrega (Guía de Despacho)">
                          <button
                            onClick={() => openTransportModal(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                          >
                            <Package className="w-4 h-4" />
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

      {/* Detail Modal (Sally Enterprise UX Standard) */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Nota de Pedido #{viewingOrder.document_number}
                    </h3>
                    {viewingOrder.status === 'CONVERTED' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Facturada
                      </span>
                    )}
                    {viewingOrder.status === 'DISPATCHED' && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Despachada
                      </span>
                    )}
                    {(viewingOrder.status === ORDER_STATUS.APPROVED || viewingOrder.status === ORDER_STATUS.DRAFT) && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Pendiente Despacho
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Comprobante de reserva de stock y preparación de entrega
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
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
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{viewingOrder.client_name}</p>
                  <p className="font-mono font-semibold text-xs text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md inline-block mt-1">
                    {viewingOrder.client_tax_id || 'SIN RIF'}
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Fecha Emisión</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{viewingOrder.issue_date || '-'}</p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Válida Hasta</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{viewingOrder.valid_until || '-'}</p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Método de Pago</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {getPaymentMethodLabel(viewingOrder.payment_method) || 'Por definir'}
                  </p>
                </div>
              </div>

              {/* Items Data Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Productos Reservados en esta Orden ({viewingOrder.items?.length || 0})</span>
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
                      {viewingOrder.items && viewingOrder.items.length > 0 ? (
                        viewingOrder.items.map((it: any, idx: number) => {
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
                            No se encontraron ítems detallados para esta orden.
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
                  <p className="text-xs text-indigo-950 font-bold uppercase tracking-wider">Resumen Financiero del Pedido</p>
                  <p className="text-xs text-indigo-700/80 font-medium">
                    Tasa oficial aplicada: <span className="font-bold font-mono">Bs. {Number(viewingOrder.exchange_rate || 36.5).toFixed(2)}</span> / USD
                  </p>
                </div>
                <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-indigo-100/80">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Monto Total Liquidado</span>
                  <p className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    ${Number(viewingOrder.total_usd || 0).toFixed(2)} USD
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                    Equivalente en moneda nacional: <span className="text-slate-900 font-black">Bs. {Number(viewingOrder.total_bs || 0).toFixed(2)}</span>
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
                <span>Imprimir Pedido</span>
              </button>
              <div className="flex items-center gap-3">
                {viewingOrder.status !== 'CONVERTED' && viewingOrder.status !== 'DISPATCHED' && (
                  <button
                    type="button"
                    onClick={() => {
                      const docToDispatch = viewingOrder;
                      setViewingOrder(null);
                      openTransportModal(docToDispatch);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-200 cursor-pointer active:scale-98"
                  >
                    <Package className="w-4 h-4" />
                    <span>Generar Nota de Entrega</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rediseñado de Modalidad de Entrega (Sally Enterprise UX Standard) */}
      {isTransportModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Generar Nota de Entrega
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Pedido #{selectedOrder.document_number} • Modalidad y Datos del Despacho
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {/* Selector de Modalidad */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Modalidad de Entrega
                  </label>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setDeliveryMode('PICKUP')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer shadow-2xs ${
                        deliveryMode === 'PICKUP'
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Store className={`w-5 h-5 mb-1.5 ${deliveryMode === 'PICKUP' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">Retiro en Tienda / Mostrador</span>
                      <span className="text-[10px] opacity-75 font-medium mt-0.5">Entrega directa al cliente in situ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMode('SHIPPING')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer shadow-2xs ${
                        deliveryMode === 'SHIPPING'
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className={`w-5 h-5 mb-1.5 ${deliveryMode === 'SHIPPING' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">Envío por Transporte / Flete</span>
                      <span className="text-[10px] opacity-75 font-medium mt-0.5">Despacho con vehículo o carrier</span>
                    </button>
                  </div>
                </div>

                {/* Campos dinámicos según Modalidad */}
                {deliveryMode === 'PICKUP' ? (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>Datos de Quien Retira en Mostrador</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Nombre y Cédula de la persona que recibe
                      </label>
                      <input
                        type="text"
                        placeholder={`Ej: ${selectedOrder.client_name} (Cliente Directo)`}
                        value={pickupPerson}
                        onChange={(e) => setPickupPerson(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Empresa de Transporte / Flete (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: MRW / Flete Interno / Zoom / Tealca"
                        value={carrierName}
                        onChange={(e) => setCarrierName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Placa del Vehículo
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: A82-XY9"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono font-bold uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Conductor / Cédula
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Pedro Pérez V-14.891.092"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTransportModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer text-sm shadow-md shadow-emerald-200 active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Generando...' : 'Confirmar y Despachar Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
