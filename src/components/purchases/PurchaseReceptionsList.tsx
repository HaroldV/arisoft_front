'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Loader2, 
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Warehouse,
  Calendar,
  X,
  PackageCheck,
  TrendingUp,
  Trash2,
  Barcode,
  Layers,
  DollarSign,
  Download,
  Eye,
  FileText,
  Building2,
  Package
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { SearchableSelect } from '@/components/SearchableSelect';

interface ReceptionItem {
  id?: string;
  itemNumber?: number;
  productId: string;
  model?: string;
  warehouseId?: string;
  quantityReceived: number;
  quantityPending?: number;
  quantityReturned?: number;
  unitCostUsd: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  additionalTaxAmount?: number;
  lineComment?: string;
  batchNumber?: string;
  expirationDate?: string;
  serials?: string[];
}

interface ReceptionNote {
  id: string;
  reception_number: string;
  order_id?: string;
  supplier_name: string;
  supplier_rif?: string;
  ndr_number?: string;
  warehouse_name: string;
  payment_term?: string;
  currency?: string;
  exchange_rate?: number;
  status: string;
  created_by_user_name?: string;
  created_at: string;
  items?: any[];
}

export function PurchaseReceptionsList() {
  const [receptions, setReceptions] = useState<ReceptionNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aux Data
  const [providers, setProviders] = useState<{ id: string; name: string; rif?: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; costUsd: number }[]>([]);
  const [orders, setOrders] = useState<{ id: string; order_number: string; supplier_name: string; total_usd?: number; items?: any[] }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  // Form State
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formSupplierRif, setFormSupplierRif] = useState('');
  const [formNdrNumber, setFormNdrNumber] = useState('');
  const [formWarehouseName, setFormWarehouseName] = useState('Almacén Principal');
  const [formPaymentTerm, setFormPaymentTerm] = useState('CONTADO');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formExchangeRate, setFormExchangeRate] = useState<number>(36.50);
  const [formIsNational, setFormIsNational] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState('');

  // Items State
  const [formItems, setFormItems] = useState<ReceptionItem[]>([]);

  // Discrepancy State
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState<string | null>(null);
  const [isReplacingOrder, setIsReplacingOrder] = useState(false);
  const [successModalInfo, setSuccessModalInfo] = useState<{
    title: string;
    message: string;
    oldOrderNumber?: string;
    newOrderNumber?: string;
  } | null>(null);

  // Active Modals for Item Details
  const [activeSerialIndex, setActiveSerialIndex] = useState<number | null>(null);
  const [activeBatchIndex, setActiveBatchIndex] = useState<number | null>(null);
  const [showLandedCostModal, setShowLandedCostModal] = useState<boolean>(false);
  const [landedFreightCost, setLandedFreightCost] = useState<number>(0);

  useEffect(() => {
    fetchReceptions();
    fetchAuxData();
  }, []);

  // Real-time Discrepancy Detection
  useEffect(() => {
    if (!selectedOrderId) {
      setHasDiscrepancy(false);
      setDiscrepancyReason(null);
      return;
    }

    const selected = orders.find(o => o.id === selectedOrderId);
    if (!selected || !selected.items || selected.items.length === 0) {
      setHasDiscrepancy(false);
      setDiscrepancyReason(null);
      return;
    }

    let mismatchFound = false;
    let reason = '';

    for (const item of formItems) {
      const ordItem = selected.items.find((oi: any) => oi.product_id === item.productId);
      if (!ordItem) {
        mismatchFound = true;
        reason = `El producto ingresado no pertenecía a la Orden de Compra originaria (${selected.order_number || ''}).`;
        break;
      }

      if (Number(item.quantityReceived || 0) > Number(ordItem.quantity_ordered || 0)) {
        mismatchFound = true;
        reason = `La cantidad ingresada (${item.quantityReceived}) supera la cantidad pedida (${ordItem.quantity_ordered}) en la Orden ${selected.order_number || ''}.`;
        break;
      }
    }

    setHasDiscrepancy(mismatchFound);
    setDiscrepancyReason(mismatchFound ? reason : null);
  }, [formItems, selectedOrderId, orders]);

  const handleCancelAndReplaceOrder = async () => {
    if (!selectedOrderId) return;
    setIsReplacingOrder(true);
    setError(null);

    try {
      const selected = orders.find(o => o.id === selectedOrderId);
      const res = await apiClient.post(`/purchases/orders/${selectedOrderId}/cancel-and-replace`, {
        cancellationReason: `Anulada por discrepancia detectada durante recepción en almacén. ${discrepancyReason || ''}`,
        items: formItems.map(i => ({
          productId: i.productId,
          model: i.model,
          warehouseId: i.warehouseId,
          quantityOrdered: i.quantityReceived,
          unitCostUsd: i.unitCostUsd,
          discountPercentage: i.discountPercentage,
          discountAmount: i.discountAmount,
          taxRate: i.taxRate,
          additionalTaxAmount: i.additionalTaxAmount,
          lineComment: i.lineComment,
        })),
      });

      const newOrder = res.data;
      await fetchAuxData();
      setSelectedOrderId(newOrder.id);
      setHasDiscrepancy(false);
      setDiscrepancyReason(null);
      setSuccessModalInfo({
        title: 'Orden de Compra Sustituida',
        message: 'La Orden de Compra anterior fue anulada fiscalmente por discrepancia. Se ha generado exitosamente la nueva Orden de Compra ajustada a las cantidades reales recibidas en almacén.',
        oldOrderNumber: selected?.order_number,
        newOrderNumber: newOrder.order_number,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al anular y sustituir la Orden de Compra');
    } finally {
      setIsReplacingOrder(false);
    }
  };

  const fetchReceptions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/purchases/receptions');
      setReceptions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [provRes, prodRes, ordRes, whRes] = await Promise.all([
        apiClient.get('/providers'),
        apiClient.get('/inventory/products'),
        apiClient.get('/purchases/orders'),
        apiClient.get('/inventory/warehouse-locations').catch(() => ({ data: [] })),
      ]);
      setProviders(provRes.data || []);
      setProducts(prodRes.data || []);
      setOrders((ordRes.data || []).filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'));
      setWarehouses(whRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportOrder = (orderId: string) => {
    const selected = orders.find(o => o.id === orderId);
    if (!selected) return;

    setFormSupplierName(selected.supplier_name);
    setSelectedSupplierId((selected as any).supplier_id || (selected as any).supplierId || '');
    setFormSupplierRif((selected as any).supplier_rif || (selected as any).supplierRif || '');
    setFormPaymentTerm((selected as any).payment_term || (selected as any).paymentTerm || 'CONTADO');
    setFormCurrency((selected as any).currency || 'USD');
    setSelectedOrderId(selected.id);

    if (selected.items && selected.items.length > 0) {
      const imported: ReceptionItem[] = selected.items.map((item: any, idx: number) => {
        const remaining = Math.max(0, Number(item.quantity_ordered || 0) - Number(item.quantity_received || 0));
        return {
          itemNumber: idx + 1,
          productId: item.product_id,
          model: item.model || '',
          warehouseId: item.warehouse_id || undefined,
          quantityReceived: remaining,
          quantityPending: remaining,
          unitCostUsd: Number(item.unit_cost_usd || 0),
          discountPercentage: Number(item.discount_percentage || 0),
          discountAmount: Number(item.discount_amount || 0),
          taxRate: Number(item.tax_rate || 16),
          additionalTaxAmount: Number(item.additional_tax_amount || 0),
          lineComment: item.line_comment || '',
          serials: [],
        };
      });
      setFormItems(imported);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const first = products[0];
    setFormItems([
      ...formItems,
      {
        itemNumber: formItems.length + 1,
        productId: first.id,
        model: '',
        warehouseId: warehouses[0]?.id || undefined,
        quantityReceived: 1,
        quantityPending: 0,
        quantityReturned: 0,
        unitCostUsd: first.costUsd || 0,
        discountPercentage: 0,
        discountAmount: 0,
        taxRate: 16.00,
        additionalTaxAmount: 0,
        lineComment: '',
        serials: [],
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const filtered = formItems.filter((_, i) => i !== index);
    setFormItems(filtered.map((item, i) => ({ ...item, itemNumber: i + 1 })));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formItems];
    const target = updated[index];
    if (field === 'productId') {
      const selectedProd = products.find(p => p.id === value);
      target.productId = value;
      if (selectedProd) target.unitCostUsd = selectedProd.costUsd || 0;
    } else if (field === 'quantityReceived') {
      target.quantityReceived = Number(value);
    } else if (field === 'unitCostUsd') {
      target.unitCostUsd = Number(value);
    } else if (field === 'discountPercentage') {
      target.discountPercentage = Number(value);
    } else if (field === 'model') {
      target.model = value;
    } else if (field === 'batchNumber') {
      target.batchNumber = value;
    } else if (field === 'expirationDate') {
      target.expirationDate = value;
    }
    setFormItems(updated);
  };

  // Landed Cost Proration Algorithm
  const applyLandedCostProration = () => {
    if (landedFreightCost <= 0 || formItems.length === 0) return;

    let totalValueOfItems = 0;
    formItems.forEach(i => {
      totalValueOfItems += i.quantityReceived * i.unitCostUsd;
    });

    if (totalValueOfItems <= 0) return;

    const prorated = formItems.map(item => {
      const itemValue = item.quantityReceived * item.unitCostUsd;
      const proportion = itemValue / totalValueOfItems;
      const allocatedFreight = landedFreightCost * proportion;
      const extraPerUnit = item.quantityReceived > 0 ? allocatedFreight / item.quantityReceived : 0;
      
      return {
        ...item,
        unitCostUsd: Number((item.unitCostUsd + extraPerUnit).toFixed(4)),
      };
    });

    setFormItems(prorated);
    setShowLandedCostModal(false);
    setLandedFreightCost(0);
  };
  const [errorFields, setErrorFields] = useState<{ [key: string]: boolean }>({});

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    formItems.forEach(item => {
      const gross = item.quantityReceived * item.unitCostUsd;
      const disc = (gross * (item.discountPercentage || 0)) / 100;
      const net = gross - disc;
      const tax = (net * (item.taxRate || 16)) / 100;
      subtotal += net;
      totalTax += tax;
    });
    return { subtotal, totalTax, total: subtotal + totalTax };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { [key: string]: boolean } = {};

    if (!selectedOrderId) {
      errs['selectedOrderId'] = true;
      setErrorFields(errs);
      setError('Debes seleccionar una Orden de Compra previa obligatoriamente.');
      return;
    }
    if (!formSupplierName.trim()) {
      errs['formSupplierName'] = true;
      setErrorFields(errs);
      setError('El Nombre / Razón Social del Proveedor es obligatorio.');
      return;
    }
    if (formItems.length === 0) {
      setError('Agrega al menos un producto recibido a la nota de recepción.');
      return;
    }

    setErrorFields({});
    setIsSaving(true);
    setError(null);

    try {
      await apiClient.post('/purchases/receptions', {
        orderId: selectedOrderId || undefined,
        supplierId: selectedSupplierId || undefined,
        supplierName: formSupplierName.trim(),
        supplierRif: formSupplierRif || undefined,
        ndrNumber: formNdrNumber || undefined,
        warehouseName: formWarehouseName,
        paymentTerm: formPaymentTerm,
        currency: formCurrency,
        isNational: formIsNational,
        notes: formNotes || undefined,
        items: formItems,
      });

      setShowModal(false);
      resetForm();
      fetchReceptions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar la recepción de mercancía');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedOrderId('');
    setSelectedSupplierId('');
    setFormSupplierName('');
    setFormSupplierRif('');
    setFormNdrNumber('');
    setFormWarehouseName('Almacén Principal');
    setFormPaymentTerm('CONTADO');
    setFormCurrency('USD');
    setFormNotes('');
    setFormItems([]);
    setErrorFields({});
  };

  const filteredReceptions = receptions.filter(r => 
    r.reception_number.toLowerCase().includes(search.toLowerCase()) ||
    r.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.ndr_number && r.ndr_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Notas de Recepción de Almacén</h1>
            <p className="text-xs text-slate-500">Recepción física de mercancías a bodega (requiere una Orden de Compra previa como origen).</p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
            if (formItems.length === 0) handleAddItem();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl transition-all cursor-pointer text-sm shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Recepción de Mercancía</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° Recepción, Guía/NDR o Proveedor..."
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-slate-800 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Receptions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <span className="text-sm font-medium text-slate-500">Cargando recepciones de almacén...</span>
          </div>
        ) : filteredReceptions.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <PackageCheck className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No hay recepciones registradas</p>
            <p className="text-xs text-slate-400">Registra una entrada de mercancía directa o procesa un despacho desde una Orden de Compra.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">N° Recepción</th>
                  <th className="py-4 px-6">N° NDR / Guía</th>
                  <th className="py-4 px-6">Proveedor</th>
                  <th className="py-4 px-6">Almacén Destino</th>
                  <th className="py-4 px-6">Fecha Recepción</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredReceptions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 font-mono text-xs">{r.reception_number}</td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-emerald-600">{r.ndr_number || 'N/A'}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{r.supplier_name}</td>
                    <td className="py-4 px-6 text-slate-600 text-xs flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.warehouse_name}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Procesado (Stock + CPP)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Reception Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Nota de Recepción de Almacén</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Header Fields Grid */}
              <div className="space-y-4 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Orden de Compra Origen</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    icon={FileText}
                    value={selectedOrderId}
                    onChange={(val) => {
                      handleImportOrder(val);
                      if (errorFields['selectedOrderId']) setErrorFields({ ...errorFields, selectedOrderId: false });
                    }}
                    options={orders.map(o => ({
                      value: o.id,
                      label: `${o.order_number} - ${o.supplier_name}`,
                      sublabel: `Total: $${Number(o.total_usd || 0).toFixed(2)}`
                    }))}
                    placeholder="Seleccionar Orden de Compra obligatoria..."
                    error={errorFields['selectedOrderId']}
                  />
                  {errorFields['selectedOrderId'] && (
                    <span className="text-[11px] font-semibold text-rose-500 mt-1 block animate-in fade-in duration-150">
                      ⚠️ Seleccionar una Orden de Compra preaprobada es obligatorio.
                    </span>
                  )}
                </div>

                {/* Inherited Read-Only Supplier Summary Badge */}
                {selectedOrderId && formSupplierName ? (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedor (Heredado OC)</span>
                        <span className="text-sm font-bold text-slate-900">{formSupplierName}</span>
                        {formSupplierRif && <span className="block text-xs font-mono text-slate-500">RIF: {formSupplierRif}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Condición & Moneda</span>
                        <span className="text-sm font-bold text-slate-800">{formPaymentTerm} ({formCurrency})</span>
                        <span className="block text-xs text-emerald-600 font-semibold">Vinculado a OC</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado Orden</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          Aprobada para Recepción
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-center gap-3 text-amber-800 text-xs">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
                    <span>Selecciona una Orden de Compra preaprobada arriba para autocompletar el proveedor y la lista de artículos a recibir en almacén.</span>
                  </div>
                )}

                {/* Real-Time Discrepancy Warning Banner */}
                {hasDiscrepancy && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          Discrepancia Detectada con la Orden de Compra Original
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          {discrepancyReason || 'Los productos o cantidades en este despacho difieren de la Orden de Compra seleccionada.'} Para mantener la integridad fiscal e inventario, te sugerimos anular la orden actual y sustituirla por una nueva ajustada al despacho real.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
                      <button
                        type="button"
                        disabled={isReplacingOrder}
                        onClick={handleCancelAndReplaceOrder}
                        className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isReplacingOrder ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Procesando Sustitución...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Anular OC Actual y Crear Nueva Ajustada</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Operational Reception Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">N° NDR (Guía / Despacho del Proveedor)</label>
                    <input
                      type="text"
                      placeholder="Ej. NDR-009812 / Guía 44512"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={formNdrNumber}
                      onChange={(e) => setFormNdrNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Almacén Destino de Entrada</label>
                    <SearchableSelect
                      icon={Warehouse}
                      value={formWarehouseName}
                      onChange={(val) => setFormWarehouseName(val)}
                      options={Array.from(new Set(['Almacén Principal', ...warehouses.map(w => w.name)])).map(name => ({
                        value: name,
                        label: name
                      }))}
                      placeholder="Seleccionar Almacén..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Observaciones y Novedades de Recepción</label>
                    <textarea
                      rows={2}
                      placeholder="Registra incidencias del flete, estado del empaque, cajas faltantes o detalles del chofer/transportista..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Items Table Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Productos Físicamente Recibidos</span>
                  {selectedOrderId && formItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowLandedCostModal(true)}
                      className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Prorratear Flete (Landed Cost)
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                        <th className="py-2.5 px-3 w-10 text-center">Reng</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Artículo / Producto</th>
                        <th className="py-2.5 px-3 w-24">Modelo</th>
                        <th className="py-2.5 px-3 w-24 text-right">Cant Recibida</th>
                        <th className="py-2.5 px-3 w-28 text-right">Costo U. ($)</th>
                        <th className="py-2.5 px-3 w-20 text-right">Pendiente</th>
                        <th className="py-2.5 px-3 w-32 text-right">Neto ($)</th>
                        <th className="py-2.5 px-3 w-28 text-center">Trazabilidad</th>
                        <th className="py-2.5 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((item, idx) => {
                        const net = item.quantityReceived * item.unitCostUsd;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <SearchableSelect
                                icon={Package}
                                value={item.productId}
                                onChange={(val, opt) => {
                                  handleItemChange(idx, 'productId', val);
                                  if (opt && opt.label) {
                                    handleItemChange(idx, 'lineComment', opt.label);
                                  }
                                }}
                                options={products.map(p => ({
                                  value: p.id,
                                  label: p.name,
                                  sublabel: `SKU: ${p.sku}`,
                                }))}
                                placeholder="Buscar producto..."
                                allowCustomInput={true}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="Modelo..."
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                value={item.model || ''}
                                onChange={(e) => handleItemChange(idx, 'model', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="1"
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                                value={item.quantityReceived}
                                onChange={(e) => handleItemChange(idx, 'quantityReceived', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.0001"
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                                value={item.unitCostUsd}
                                onChange={(e) => handleItemChange(idx, 'unitCostUsd', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500">
                              {item.quantityPending || 0}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ${net.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveSerialIndex(idx)}
                                  className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer ${
                                    item.serials && item.serials.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                  }`}
                                  title="Capturar Seriales"
                                >
                                  <Barcode className="w-3 h-3" />
                                  <span>{item.serials?.length || 0}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveBatchIndex(idx)}
                                  className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer ${
                                    item.batchNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                  }`}
                                  title="Capturar Lote y Expiración"
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>Lote</span>
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Footer Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  <span>Al procesar la nota, se actualizará el stock de forma atómica y se calculará el Costo Promedio Ponderado (CPP).</span>
                </div>

                <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200/80 flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block">Subtotal:</span>
                    <span className="font-bold text-slate-800">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">IVA Acumulado:</span>
                    <span className="font-bold text-slate-800">${totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="text-base font-bold text-emerald-700 border-l border-slate-200 pl-6">
                    <span className="text-xs text-slate-500 block">TOTAL RECEPCIÓN:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || hasDiscrepancy}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer text-sm shadow-xs"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Procesar Recepción y CPP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Serial Capture Modal */}
      {activeSerialIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-indigo-600" /> Captura de Seriales (Renglón {activeSerialIndex + 1})
              </h4>
              <button onClick={() => setActiveSerialIndex(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">Ingresa un número de serial por línea para las {formItems[activeSerialIndex]?.quantityReceived} unidades recibidas:</p>

            <textarea
              rows={5}
              placeholder="SN-100001&#10;SN-100002&#10;SN-100003..."
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-mono"
              value={(formItems[activeSerialIndex]?.serials || []).join('\n')}
              onChange={(e) => {
                const lines = e.target.value.split('\n');
                const updated = [...formItems];
                updated[activeSerialIndex].serials = lines;
                setFormItems(updated);
              }}
            />

            <button
              onClick={() => setActiveSerialIndex(null)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl cursor-pointer"
            >
              Guardar Seriales
            </button>
          </div>
        </div>
      )}

      {/* Batch Capture Modal */}
      {activeBatchIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" /> Lote y Vencimiento (Renglón {activeBatchIndex + 1})
              </h4>
              <button onClick={() => setActiveBatchIndex(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">Número de Lote</label>
                <input
                  type="text"
                  placeholder="LOT-2024-001"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                  value={formItems[activeBatchIndex]?.batchNumber || ''}
                  onChange={(e) => handleItemChange(activeBatchIndex, 'batchNumber', e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">Fecha de Expiración</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  value={formItems[activeBatchIndex]?.expirationDate || ''}
                  onChange={(e) => handleItemChange(activeBatchIndex, 'expirationDate', e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={() => setActiveBatchIndex(null)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl cursor-pointer"
            >
              Guardar Lote
            </button>
          </div>
        </div>
      )}

      {/* Landed Cost Proration Modal */}
      {showLandedCostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" /> Calculadora de Prorrateo de Flete / Costos
              </h4>
              <button onClick={() => setShowLandedCostModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">Ingresa el costo total del flete o gastos de importación en USD para prorratearlo proporcionalmente entre todos los renglones recibidos:</p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Monto Total Flete ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono font-bold"
                value={landedFreightCost}
                onChange={(e) => setLandedFreightCost(Number(e.target.value))}
              />
            </div>

            <button
              onClick={applyLandedCostProration}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-xl cursor-pointer"
            >
              Aplicar Prorrateo a Costo Unitario
            </button>
          </div>
        </div>
      )}

      {/* Informative Modal for Successful Cancellation & Replacement */}
      {successModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{successModalInfo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSuccessModalInfo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {successModalInfo.message}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold mb-0.5">OC Anulada:</span>
                  <span className="font-bold text-rose-600 line-through">{successModalInfo.oldOrderNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold mb-0.5">Nueva OC Activa:</span>
                  <span className="font-bold text-emerald-600">{successModalInfo.newOrderNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSuccessModalInfo(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl transition-all cursor-pointer text-xs shadow-xs"
              >
                Entendido, Continuar Recepción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
