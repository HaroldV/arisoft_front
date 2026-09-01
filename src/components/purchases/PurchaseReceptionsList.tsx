'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
  DollarSign,
  Download,
  Eye,
  FileText,
  Building2,
  Package
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { SearchableSelect } from '@/components/SearchableSelect';
import { CurrencyInput } from '@/components/CurrencyInput';

interface ReceptionItem {
  id?: string;
  itemNumber?: number;
  productId: string;
  model?: string;
  warehouseId?: string;
  quantityReceived: number;
  quantityPending?: number;
  quantityReturned?: number;
  unitCostUsd: number; // Costo Factura Proveedor
  landedFreightUnit?: number; // Flete prorrateado unitario
  landedCostUsd?: number; // Costo Total / CPP (unitCostUsd + landedFreightUnit)
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
  is_national?: boolean;
  status: string;
  notes?: string;
  created_by_user_name?: string;
  created_at: string;
  items?: any[];
}

export function PurchaseReceptionsList() {
  const [receptions, setReceptions] = useState<ReceptionNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState<ReceptionNote | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Aux Data
  const [providers, setProviders] = useState<{ id: string; name: string; tax_id: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; costUsd: number }[]>([]);
  const [orders, setOrders] = useState<{ id: string; order_number: string; supplier_name: string; total_usd?: number; items?: any[] }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  // Form State
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formSupplierRif, setFormSupplierRif] = useState('');
  const [hasNdrNumber, setHasNdrNumber] = useState<boolean>(false);
  const [formNdrNumber, setFormNdrNumber] = useState('');
  const [formWarehouseName, setFormWarehouseName] = useState('Almacén Principal');
  const [formPaymentTerm, setFormPaymentTerm] = useState('CONTADO');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formExchangeRate, setFormExchangeRate] = useState<number>(36.50);
  const [formIsNational, setFormIsNational] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState('');

  // Items State
  const [formItems, setFormItems] = useState<ReceptionItem[]>([]);

  // Discrepancy & Rejection State
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState<string | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [successCancelledInfo, setSuccessCancelledInfo] = useState<{
    orderNumber: string;
    reason: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId');
  const isAutoNew = searchParams.get('new') === 'true';
  const autoImportedRef = useRef(false);

  useEffect(() => {
    fetchReceptions();
    fetchAuxData();
  }, []);

  // Handle query parameter auto-importing
  useEffect(() => {
    if (orders.length > 0 && preselectedOrderId && !autoImportedRef.current) {
      autoImportedRef.current = true;
      handleImportOrder(preselectedOrderId);
      setShowModal(true);
    } else if (isAutoNew && !autoImportedRef.current) {
      autoImportedRef.current = true;
      setShowModal(true);
    }
  }, [orders, preselectedOrderId, isAutoNew]);

  // Real-time Discrepancy Detection against Source Purchase Order
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
        reason = `El producto no corresponde a la Orden de Compra pactada (${selected.order_number || ''}).`;
        break;
      }

      if (Number(item.quantityReceived || 0) !== Number(ordItem.quantity_ordered || 0)) {
        mismatchFound = true;
        reason = `La cantidad recibida (${item.quantityReceived}) difiere de la cantidad pactada (${ordItem.quantity_ordered}) en la Orden ${selected.order_number || ''}.`;
        break;
      }
    }

    setHasDiscrepancy(mismatchFound);
    setDiscrepancyReason(mismatchFound ? reason : null);
  }, [formItems, selectedOrderId, orders]);

  const handleOpenRejectModal = () => {
    const defaultReason = discrepancyReason 
      ? `Rechazado en almacén: ${discrepancyReason}` 
      : 'Rechazado en almacén por inconsistencias físicas con la Orden de Compra.';
    setRejectionReasonInput(defaultReason);
    setShowRejectModal(true);
  };

  const handleConfirmRejectAndCancelOrder = async () => {
    if (!selectedOrderId || !rejectionReasonInput.trim()) return;
    setIsCancellingOrder(true);
    setError(null);

    try {
      const selected = orders.find(o => o.id === selectedOrderId);
      await apiClient.post(`/purchases/orders/${selectedOrderId}/cancel`, {
        reason: rejectionReasonInput.trim(),
      });

      setShowRejectModal(false);
      setShowModal(false);
      resetForm();
      await fetchAuxData();
      await fetchReceptions();

      setSuccessCancelledInfo({
        orderNumber: selected?.order_number || 'N/A',
        reason: rejectionReasonInput.trim(),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al anular la Orden de Compra');
    } finally {
      setIsCancellingOrder(false);
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

  const handleUpdateItem = (index: number, patch: Partial<ReceptionItem>) => {
    setFormItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, ...patch };
    }));
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const selectedProd = products.find(p => p.id === productId);
    handleUpdateItem(index, {
      productId,
      unitCostUsd: selectedProd?.costUsd ?? 0,
    });
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
    return { 
      subtotal, 
      totalTax, 
      total: subtotal + totalTax 
    };
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
                  <th className="py-4 px-6 text-center">Acciones</th>
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
                      {r.status === 'REVERSED' ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-500" /> Revertida
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> Procesado (Stock + CPP)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => setViewDetailModal(r)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center gap-1 text-xs font-bold"
                        title="Ver detalle de la recepción"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver</span>
                      </button>
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
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                          Incongruencia Detectada con la Orden de Compra Origen
                        </h4>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          {discrepancyReason || 'Las cantidades recibidas no coinciden exactamente con la Orden de Compra pactada.'} Almacén no debe alterar costos ni fletes negociados. Debes rechazar el despacho para anular la orden de compra y notificar al equipo de compras para su corrección.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/60">
                      <button
                        type="button"
                        onClick={handleOpenRejectModal}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Rechazar Despacho y Anular Orden de Compra</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Operational Reception Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        N° NDR (Guía / Despacho) <span className="text-[10px] lowercase font-normal text-slate-400">(Opcional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !hasNdrNumber;
                          setHasNdrNumber(next);
                          if (!next) setFormNdrNumber('');
                        }}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          hasNdrNumber 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                        }`}
                      >
                        {hasNdrNumber ? '✓ Con Guía' : '+ Agregar N° Guía'}
                      </button>
                    </div>

                    {hasNdrNumber ? (
                      <input
                        type="text"
                        placeholder="Ej. NDR-009812 / Guía 44512"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all animate-in fade-in duration-150"
                        value={formNdrNumber}
                        onChange={(e) => setFormNdrNumber(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => setHasNdrNumber(true)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-dashed border-slate-200 hover:border-emerald-300 rounded-xl text-xs text-slate-400 hover:text-emerald-600 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>Sin guía física adjunta (Opcional)</span>
                        <span className="text-[10px] font-semibold text-emerald-600 underline">Activar</span>
                      </div>
                    )}
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
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verificación Física de Artículos Recibidos</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                        <th className="py-2.5 px-3 w-10 text-center">Reng</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Artículo / Producto</th>
                        <th className="py-2.5 px-3 w-28 text-right">Cant. Recibida</th>
                        <th className="py-2.5 px-3 w-28 text-right">Costo Pactado OC ($)</th>
                        <th className="py-2.5 px-3 w-32 text-right">Total Renglón ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((item, idx) => {
                        const net = item.quantityReceived * item.unitCostUsd;
                        const prodObj = products.find(p => p.id === item.productId);
                        const prodName = prodObj?.name || item.lineComment || `Producto #${idx + 1}`;
                        const prodSku = prodObj?.sku;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block font-bold text-slate-900 truncate">{prodName}</span>
                                  {prodSku && <span className="block text-[11px] font-mono text-slate-500">SKU: {prodSku}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono font-bold"
                                value={item.quantityReceived}
                                onChange={(e) => handleUpdateItem(idx, { quantityReceived: Number(e.target.value) })}
                              />
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                              ${Number(item.unitCostUsd || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              ${net.toFixed(2)}
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
                  <span>Al procesar la nota, se dará entrada física al stock heredando los costos y flete pactados en la Orden de Compra.</span>
                </div>

                <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200/80 flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block">Subtotal:</span>
                    <span className="font-bold text-slate-800">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">IVA:</span>
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

      {/* Rejection & Cancellation Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rechazar Despacho en Almacén</h3>
                  <p className="text-xs text-slate-500">Se anulará la Orden de Compra originaria</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50/70 border border-rose-200/70 rounded-xl text-xs text-rose-800 space-y-1">
                <span className="font-bold block">⚠️ Almacén no altera condiciones de compra:</span>
                <p>
                  Al rechazar el despacho, la Orden de Compra quedará en estado <strong>Anulada</strong> con esta justificación, y el equipo de compras será notificado para emitir la corrección.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Motivo o Incongruencia de Rechazo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Detalla las razones del rechazo (ej: llegaron 80 unidades de 100 pactadas, mercancía averiada, etc.)..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCancellingOrder || !rejectionReasonInput.trim()}
                onClick={handleConfirmRejectAndCancelOrder}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-xl transition-all cursor-pointer text-xs shadow-xs disabled:opacity-50"
              >
                {isCancellingOrder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Rechazo y Anulación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal for Rejection & Cancellation */}
      {successCancelledInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Despacho Rechazado & OC Anulada</h3>
              </div>
              <button
                type="button"
                onClick={() => setSuccessCancelledInfo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                La Orden de Compra <strong className="font-mono text-slate-900">{successCancelledInfo.orderNumber}</strong> ha sido marcada como <strong>ANULADA</strong> en el sistema con el registro de auditoría correspondiente.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Motivo registrado:</span>
                <p className="text-slate-800 italic">&ldquo;{successCancelledInfo.reason}&rdquo;</p>
              </div>

              <p className="text-slate-500">
                El equipo de Compras puede consultar el motivo en el módulo de Órdenes de Compra para proceder a emitir la orden ajustada.
              </p>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSuccessCancelledInfo(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all cursor-pointer text-xs shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Reception Detail Modal (Sally Enterprise UX Standard) */}
      {viewDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Nota de Recepción {viewDetailModal.reception_number}</h3>
                  <p className="text-xs text-slate-500 font-medium">Entrada física a almacén y costo promedio ponderado (CPP)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Proveedor</span>
                  <span className="font-bold text-slate-900 text-sm block truncate">{viewDetailModal.supplier_name}</span>
                  {viewDetailModal.supplier_rif && <span className="font-mono text-xs text-slate-500">RIF: {viewDetailModal.supplier_rif}</span>}
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">N° Guía / NDR</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm block">{viewDetailModal.ndr_number || 'Sin N° Guía'}</span>
                  <span className="text-xs text-slate-500">Almacén: {viewDetailModal.warehouse_name}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Fecha de Recepción</span>
                  <span className="font-bold text-slate-900 text-sm block">{new Date(viewDetailModal.created_at).toLocaleDateString()}</span>
                  <span className="text-xs text-slate-500">Hora: {new Date(viewDetailModal.created_at).toLocaleTimeString()}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Estado de Inventario</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Stock y CPP Actualizado
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/70 text-slate-700 font-bold text-xs uppercase tracking-wider flex justify-between items-center">
                  <span>Productos Físicamente Recibidos</span>
                  <span className="text-[11px] font-mono text-slate-500">Total ítems: {viewDetailModal.items?.length || 0}</span>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-10 text-center">#</th>
                      <th className="py-2.5 px-4 min-w-[200px]">Artículo / Producto</th>
                      <th className="py-2.5 px-4 text-right w-24">Cant. Recibida</th>
                      <th className="py-2.5 px-4 text-right w-28">Costo Factura ($)</th>
                      <th className="py-2.5 px-4 text-right w-24">Pendiente</th>
                      <th className="py-2.5 px-4 text-right w-32">Neto Factura ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewDetailModal.items && viewDetailModal.items.length > 0) ? (
                      viewDetailModal.items.map((item: any, idx: number) => {
                        const qty = Number(item.quantity_received || item.quantityReceived || 0);
                        const cost = Number(item.unit_cost_usd || item.unitCostUsd || 0);
                        const net = Number(item.net_total || (qty * cost) || 0);
                        const pending = Number(item.quantity_pending || item.quantityPending || 0);
                        const prodObj = products.find(p => p.id === (item.product_id || item.productId));
                        const name = prodObj?.name || item.line_comment || item.lineComment || `Producto #${idx + 1}`;
                        const sku = prodObj?.sku || item.sku;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{name}</span>
                                  {sku && <span className="text-[11px] font-mono text-slate-500">SKU: {sku}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{qty}</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-900">${cost.toFixed(4)}</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">{pending}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${net.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No hay renglones detallados registrados para esta recepción.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Luminous Financial Summary */}
              <div className="p-5 bg-gradient-to-br from-emerald-50/90 via-slate-50 to-teal-50/60 border border-emerald-100/90 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-slate-500">
                  <span>Recepción registrada por: <strong className="text-slate-700">{viewDetailModal.created_by_user_name || 'Operador'}</strong></span>
                </div>
                <div className="flex items-center gap-6 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block">Condición de Pago:</span>
                    <span className="font-bold text-slate-900">{viewDetailModal.payment_term || 'CONTADO'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Moneda:</span>
                    <span className="font-bold text-slate-900">{viewDetailModal.currency || 'USD'}</span>
                  </div>
                  <div className="border-l border-emerald-200 pl-6 text-base font-bold text-emerald-700">
                    <span className="text-xs text-slate-500 block">TOTAL RECEPCIÓN:</span>
                    <span>
                      ${(
                        viewDetailModal.items?.reduce(
                          (acc: number, item: any) =>
                            acc + Number(item.net_total || (Number(item.quantity_received || 0) * Number(item.unit_cost_usd || 0))),
                          0
                        ) || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setViewDetailModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
