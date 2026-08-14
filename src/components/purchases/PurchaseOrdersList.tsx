'use client';

import React, { useState, useEffect } from 'react';
import { ORDER_STATUS } from '@/constants/domain-constants';
import {
  ShoppingBag,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  X,
  CreditCard,
  Building,
  DollarSign,
  Percent,
  Trash2,
  Tag,
  ArrowRight,
  Building2,
  CalendarDays,
  Package
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { SearchableSelect } from '@/components/SearchableSelect';

interface OrderItem {
  id?: string;
  item_number?: number;
  productId: string;
  sku?: string;
  model?: string;
  warehouseId?: string;
  quantityOrdered: number;
  unitCostUsd: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxType?: string;
  taxRate?: number;
  additionalTaxAmount?: number;
  lineComment?: string;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_name: string;
  supplier_rif?: string;
  payment_term?: string;
  currency?: string;
  exchange_rate?: number;
  is_national?: boolean;
  status: string;
  expected_date?: string;
  subtotal_usd: number;
  global_discount_amount?: number;
  global_surcharge_amount?: number;
  tax_usd: number;
  total_usd: number;
  created_by_user_name?: string;
  created_at: string;
  items?: any[];
}

export function PurchaseOrdersList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aux Data
  const [providers, setProviders] = useState<{ id: string; name: string; rif?: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; costUsd: number }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  // Form Header State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formSupplierRif, setFormSupplierRif] = useState('');
  const [formPaymentTerm, setFormPaymentTerm] = useState('CONTADO');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formExchangeRate, setFormExchangeRate] = useState<number>(36.50);
  const [formIsNational, setFormIsNational] = useState<boolean>(true);
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Global Totals State
  const [globalDiscountPct, setGlobalDiscountPct] = useState<number>(0);
  const [globalSurchargePct, setGlobalSurchargePct] = useState<number>(0);

  // Form Items State
  const [formItems, setFormItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchAuxData();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/purchases/orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [provRes, prodRes, whRes] = await Promise.all([
        apiClient.get('/providers'),
        apiClient.get('/inventory/products'),
        apiClient.get('/inventory/warehouse-locations').catch(() => ({ data: [] })),
      ]);
      const rawProviders = provRes.data || [];
      setProviders(rawProviders.map((p: any) => ({
        id: p.id,
        name: p.name,
        rif: p.tax_id || p.rif || ''
      })));
      const rawProducts = prodRes.data || [];
      setProducts(rawProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        costUsd: Number(p.cost_usd || p.costUsd || 0),
      })));
      setWarehouses(whRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const first = products[0];
    setFormItems([
      ...formItems,
      {
        item_number: formItems.length + 1,
        productId: first.id,
        model: '',
        warehouseId: warehouses[0]?.id || undefined,
        quantityOrdered: 1,
        unitCostUsd: first.costUsd || 0,
        discountPercentage: 0,
        discountAmount: 0,
        taxType: 'TAXABLE',
        taxRate: 16.00,
        additionalTaxAmount: 0,
        lineComment: '',
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const filtered = formItems.filter((_, i) => i !== index);
    setFormItems(filtered.map((item, i) => ({ ...item, item_number: i + 1 })));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formItems];
    const target = updated[index];
    if (field === 'productId') {
      const selectedProd = products.find(p => p.id === value);
      target.productId = value;
      if (selectedProd) {
        target.unitCostUsd = selectedProd.costUsd || 0;
        target.sku = selectedProd.sku || '';
      }
    } else if (field === 'sku') {
      target.sku = value;
    } else if (field === 'quantityOrdered') {
      target.quantityOrdered = Number(value);
    } else if (field === 'unitCostUsd') {
      target.unitCostUsd = Number(value);
    } else if (field === 'discountPercentage') {
      target.discountPercentage = Number(value);
      target.discountAmount = (target.quantityOrdered * target.unitCostUsd * Number(value)) / 100;
    } else if (field === 'taxRate') {
      target.taxRate = Number(value);
    } else if (field === 'model') {
      target.model = value;
    } else if (field === 'lineComment') {
      target.lineComment = value;
    }
    setFormItems(updated);
  };

  // Live Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    formItems.forEach(item => {
      const gross = item.quantityOrdered * item.unitCostUsd;
      const disc = (gross * (item.discountPercentage || 0)) / 100;
      const net = gross - disc;
      const tax = (net * (item.taxRate || 16)) / 100;
      subtotal += net;
      totalTax += tax + (item.additionalTaxAmount || 0);
    });

    const globalDisc = (subtotal * globalDiscountPct) / 100;
    const globalSurch = (subtotal * globalSurchargePct) / 100;
    const total = subtotal - globalDisc + totalTax + globalSurch;

    return { subtotal, globalDisc, globalSurch, totalTax, total };
  };

  const totals = calculateTotals();

  const [errorFields, setErrorFields] = useState<{ [key: string]: boolean }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorsMap: { [key: string]: boolean } = {};

    if (!formSupplierName.trim()) {
      errorsMap['formSupplierName'] = true;
      setErrorFields(errorsMap);
      setError('La Razón Social / Nombre del Proveedor es obligatoria.');
      return;
    }
    if (!formSupplierRif.trim()) {
      errorsMap['formSupplierRif'] = true;
      setErrorFields(errorsMap);
      setError('El RIF / Identificador Fiscal del Proveedor es obligatorio.');
      return;
    }
    if (formItems.length === 0) {
      setError('Debes agregar al menos un artículo a la Orden de Compra.');
      return;
    }

    // Validate items quantities and unit costs
    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      if (!item.quantityOrdered || item.quantityOrdered <= 0) {
        setError(`El artículo en el renglón #${i + 1} debe tener una cantidad mayor a 0.`);
        return;
      }
      if (item.unitCostUsd === undefined || item.unitCostUsd < 0) {
        setError(`El artículo en el renglón #${i + 1} debe tener un costo unitario válido.`);
        return;
      }
      const isExistingProd = products.some(p => p.id === item.productId);
      if (!isExistingProd && (!item.sku || !item.sku.trim())) {
        errorsMap[`item_sku_${i}`] = true;
        setErrorFields(errorsMap);
        setError(`El artículo en el renglón #${i + 1} es nuevo. Por favor ingrese su código SKU.`);
        return;
      }
    }

    setErrorFields({});
    setIsSaving(true);
    setError(null);

    try {
      let finalSupplierId = selectedSupplierId;

      // Check if RIF already exists in provider catalog if custom provider
      if (!finalSupplierId) {
        const existingRifProvider = providers.find(
          p => p.rif && p.rif.toUpperCase() === formSupplierRif.trim().toUpperCase()
        );
        if (existingRifProvider) {
          setErrorFields({ formSupplierRif: true });
          setError(`El RIF '${formSupplierRif.trim().toUpperCase()}' ya se encuentra registrado por el proveedor '${existingRifProvider.name}'. No se puede duplicar.`);
          setIsSaving(false);
          return;
        }
      }

      // Prepare items payload (delegating product auto-creation transaccionally to backend)
      const processedItems = formItems.map(item => ({
        productId: item.productId,
        model: item.model || undefined,
        warehouseId: item.warehouseId || undefined,
        quantityOrdered: Number(item.quantityOrdered),
        unitCostUsd: Number(item.unitCostUsd),
        discountPercentage: Number(item.discountPercentage || 0),
        taxType: item.taxType || 'TAXABLE',
        taxRate: Number(item.taxRate || 16),
        additionalTaxAmount: Number(item.additionalTaxAmount || 0),
        lineComment: item.lineComment || undefined,
      }));

      // Submit Purchase Order (delegating transactional provider creation to backend)
      await apiClient.post('/purchases/orders', {
        supplierId: finalSupplierId || undefined,
        supplierName: formSupplierName.trim(),
        supplierRif: formSupplierRif.trim().toUpperCase(),
        paymentTerm: formPaymentTerm,
        currency: formCurrency,
        isNational: formIsNational,
        expectedDate: formExpectedDate || undefined,
        notes: formNotes || undefined,
        globalDiscountPercentage: Number(globalDiscountPct || 0),
        globalSurchargePercentage: Number(globalSurchargePct || 0),
        items: processedItems,
      });

      setShowModal(false);
      resetForm();
      fetchOrders();
      fetchAuxData();
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const formattedMsg = Array.isArray(serverMsg) ? serverMsg.join(', ') : (serverMsg || err.message);
      setError(formattedMsg || 'Error al emitir la Orden de Compra');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedSupplierId('');
    setFormSupplierName('');
    setFormSupplierRif('');
    setFormPaymentTerm('CONTADO');
    setFormCurrency('USD');
    setFormExpectedDate('');
    setFormNotes('');
    setGlobalDiscountPct(0);
    setGlobalSurchargePct(0);
    setFormItems([]);
  };

  const filteredOrders = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
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
          onClick={() => {
            setShowModal(true);
            if (formItems.length === 0) handleAddItem();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all cursor-pointer text-sm shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Emitir Orden de Compra</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° Orden de Compra o Proveedor..."
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-medium text-slate-500">Cargando órdenes de compra...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <FileText className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No hay órdenes de compra emitidas</p>
            <p className="text-xs text-slate-400">Genera una nueva orden de compra para acordar precios con tus proveedores.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">N° Orden</th>
                  <th className="py-4 px-6">Proveedor</th>
                  <th className="py-4 px-6">Cond. Pago</th>
                  <th className="py-4 px-6">Moneda</th>
                  <th className="py-4 px-6">Fecha Emisión</th>
                  <th className="py-4 px-6 text-right">Total USD</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 font-mono text-xs">{o.order_number}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{o.supplier_name}</div>
                      {o.supplier_rif && <div className="text-xs text-slate-400 font-mono">RIF: {o.supplier_rif}</div>}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-semibold">{o.payment_term || 'CONTADO'}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">{o.currency || 'USD'} ({o.is_national ? 'Nacional' : 'Importación'})</td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-indigo-600 text-base">${Number(o.total_usd).toFixed(2)}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${o.status === ORDER_STATUS.COMPLETED ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        o.status === ORDER_STATUS.SENT ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                        {o.status === ORDER_STATUS.SENT ? 'Sin Procesar' : o.status === ORDER_STATUS.COMPLETED ? 'Procesado' : o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Modal (Legacy Form Alignment) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header Bar */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Emisión de Orden de Compra</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Seleccionar o Escribir Proveedor Nuevo</label>
                  <SearchableSelect
                    icon={Building2}
                    value={selectedSupplierId}
                    onChange={(val, opt) => {
                      const p = providers.find(prov => prov.id === val);
                      if (p) {
                        setSelectedSupplierId(p.id);
                        setFormSupplierName(p.name);
                        setFormSupplierRif(p.rif || '');
                      } else {
                        setSelectedSupplierId('');
                        setFormSupplierName(val);
                        setFormSupplierRif('');
                      }
                      if (errorFields['formSupplierName'] || errorFields['formSupplierRif']) {
                        setErrorFields(prev => ({ ...prev, formSupplierName: false, formSupplierRif: false }));
                      }
                    }}
                    options={providers.map(p => ({
                      value: p.id,
                      label: p.name,
                      sublabel: p.rif ? `RIF: ${p.rif}` : undefined,
                    }))}
                    placeholder="Buscar o redactar nuevo proveedor..."
                    allowCustomInput={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Razón Social / Nombre Proveedor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!selectedSupplierId}
                    placeholder="Nombre o Razón Social..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition-all ${selectedSupplierId
                      ? 'bg-slate-100/80 border border-slate-200 text-slate-600 cursor-not-allowed'
                      : errorFields['formSupplierName']
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 bg-white'
                        : 'border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white'
                      }`}
                    value={formSupplierName}
                    onChange={(e) => {
                      setFormSupplierName(e.target.value);
                      if (errorFields['formSupplierName']) setErrorFields({ ...errorFields, formSupplierName: false });
                    }}
                  />
                  {errorFields['formSupplierName'] && (
                    <span className="text-[11px] font-semibold text-rose-500 mt-1 block animate-in fade-in duration-150">
                      ⚠️ Este campo es obligatorio.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    RIF / Identificador Fiscal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!!selectedSupplierId}
                    placeholder="Ej. J-12345678-9"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono outline-none transition-all ${selectedSupplierId
                      ? 'bg-slate-100/80 border border-slate-200 text-slate-600 cursor-not-allowed'
                      : errorFields['formSupplierRif']
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 bg-white'
                        : 'border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white'
                      }`}
                    value={formSupplierRif}
                    onChange={(e) => {
                      setFormSupplierRif(e.target.value);
                      if (errorFields['formSupplierRif']) setErrorFields({ ...errorFields, formSupplierRif: false });
                    }}
                  />
                  {errorFields['formSupplierRif'] && (
                    <span className="text-[11px] font-semibold text-rose-500 mt-1 block animate-in fade-in duration-150">
                      ⚠️ El RIF o Identificador Fiscal es obligatorio.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Condición de Pago</label>
                  <SearchableSelect
                    icon={CreditCard}
                    value={formPaymentTerm}
                    onChange={(val) => setFormPaymentTerm(val)}
                    options={[
                      { value: 'CONTADO', label: 'Pago de Contado' },
                      { value: 'CREDITO_7', label: 'Crédito 7 Días' },
                      { value: 'CREDITO_15', label: 'Crédito 15 Días' },
                      { value: 'CREDITO_30', label: 'Crédito 30 Días' },
                    ]}
                    placeholder="Seleccionar condición..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Moneda del Comprobante</label>
                  <SearchableSelect
                    icon={DollarSign}
                    value={formCurrency}
                    onChange={(val) => setFormCurrency(val)}
                    options={[
                      { value: 'USD', label: 'USD - Dólares ($)' },
                      { value: 'VES', label: 'VES - Bolívares (Bs)' },
                    ]}
                    placeholder="Moneda..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Fecha Entrega Esperada</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    value={formExpectedDate}
                    onChange={(e) => setFormExpectedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 2. Items Table Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detalle de Renglones</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Renglón
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                        <th className="py-2.5 px-3 w-10 text-center">Reng</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Artículo / Producto</th>
                        <th className="py-2.5 px-3 w-28">Código SKU</th>
                        <th className="py-2.5 px-3 w-24">Modelo</th>
                        <th className="py-2.5 px-3 w-24 text-right">Cant</th>
                        <th className="py-2.5 px-3 w-28 text-right">Costo U. ($)</th>
                        <th className="py-2.5 px-3 w-20 text-right">% Desc</th>
                        <th className="py-2.5 px-3 w-20 text-right">IVA %</th>
                        <th className="py-2.5 px-3 w-32 text-right">Neto ($)</th>
                        <th className="py-2.5 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((item, idx) => {
                        const gross = item.quantityOrdered * item.unitCostUsd;
                        const disc = (gross * (item.discountPercentage || 0)) / 100;
                        const net = gross - disc;

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
                                placeholder="Buscar o escribir producto..."
                                allowCustomInput={true}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="SKU..."
                                className={`w-full px-2 py-1.5 bg-white rounded-lg text-xs font-mono outline-none transition-all ${errorFields[`item_sku_${idx}`]
                                  ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
                                  : 'border border-slate-200 focus:border-indigo-500'
                                  }`}
                                value={item.sku || ''}
                                onChange={(e) => {
                                  handleItemChange(idx, 'sku', e.target.value);
                                  if (errorFields[`item_sku_${idx}`]) {
                                    setErrorFields({ ...errorFields, [`item_sku_${idx}`]: false });
                                  }
                                }}
                              />
                              {errorFields[`item_sku_${idx}`] && (
                                <span className="text-[10px] font-semibold text-rose-500 mt-0.5 block animate-in fade-in duration-150">
                                  ⚠️ Requerido
                                </span>
                              )}
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
                                value={item.quantityOrdered}
                                onChange={(e) => handleItemChange(idx, 'quantityOrdered', e.target.value)}
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
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.1"
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                                value={item.discountPercentage || 0}
                                onChange={(e) => handleItemChange(idx, 'discountPercentage', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.1"
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                                value={item.taxRate || 16}
                                onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ${net.toFixed(2)}
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

              {/* 3. Global Discounts & Footer Totals Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Notas / Observaciones</label>
                    <textarea
                      rows={2}
                      placeholder="Observaciones de la orden de compra..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Descuento Global (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        value={globalDiscountPct}
                        onChange={(e) => setGlobalDiscountPct(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Recargo / Flete Global (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        value={globalSurchargePct}
                        onChange={(e) => setGlobalSurchargePct(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Renglones:</span>
                    <span className="font-mono font-semibold">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.globalDisc > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuento Global:</span>
                      <span className="font-mono font-semibold">-${totals.globalDisc.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.globalSurch > 0 && (
                    <div className="flex justify-between text-indigo-600">
                      <span>Recargo / Flete:</span>
                      <span className="font-mono font-semibold">+${totals.globalSurch.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>I.V.A. Acumulado:</span>
                    <span className="font-mono font-semibold">${totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>TOTAL GENERAL USD:</span>
                    <span className="font-mono text-indigo-700">${totals.total.toFixed(2)}</span>
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
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer text-sm shadow-xs"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Emitir Orden de Compra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
