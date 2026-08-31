'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  X, 
  ArrowRight,
  Trash2,
  Package,
  Eye,
  Printer,
  Calendar,
  CreditCard,
  ShoppingBag
} from 'lucide-react';

import apiClient from '@/infrastructure/api/api-client';
import ProductCombobox, { CatalogProduct } from './ProductCombobox';
import ClientCombobox, { ClientOption } from './ClientCombobox';
import { ActionTooltip } from '@/components/ActionTooltip';
import { CurrencyInput } from '@/components/CurrencyInput';

interface QuotationItem {
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

interface Quotation {
  id: string;
  document_number: string;
  client_name: string;
  client_tax_id?: string;
  status: 'SENT' | 'ACCEPTED' | 'CONVERTED' | 'DRAFT';
  issue_date?: string;
  valid_until?: string;
  payment_method?: string;
  total_usd: number | string;
  total_bs: number | string;
  exchange_rate: number | string;
  created_by_user_name?: string;
  items?: QuotationItem[];
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

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export default function QuotationsList() {
  const [items, setItems] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Catalog state for inputs
  const [availableProducts, setAvailableProducts] = useState<CatalogProduct[]>([]);
  const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Detail viewing modal state
  const [viewingDoc, setViewingDoc] = useState<Quotation | null>(null);

  // New Quotation form
  const [clientName, setClientName] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [issueDate, setIssueDate] = useState(getTodayDate());
  const [validUntil, setValidUntil] = useState(getFutureDate(15));
  const [paymentMethod, setPaymentMethod] = useState('UNSPECIFIED');
  const [creditDays, setCreditDays] = useState<number>(30);
  const [formItems, setFormItems] = useState<{ product_id?: string; sku?: string; product_name: string; quantity: number; unit_price_usd: number }[]>([
    { product_name: '', quantity: 1, unit_price_usd: 0 },
  ]);

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const resDocs = await apiClient.get('/sales/documents?type=QUOTATION');
      setItems(Array.isArray(resDocs.data) ? resDocs.data : []);
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalogIfNeeded = async () => {
    if (availableProducts.length > 0 && availableClients.length > 0) return;
    try {
      const [resProds, resClients] = await Promise.all([
        apiClient.get('/inventory/products').catch(() => ({ data: [] })),
        apiClient.get('/clients').catch(() => ({ data: [] })),
      ]);
      setAvailableProducts(Array.isArray(resProds.data) ? resProds.data : (resProds.data?.items || []));
      setAvailableClients(Array.isArray(resClients.data) ? resClients.data : []);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    }
  };

  React.useEffect(() => {
    fetchQuotations();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCreditDaysChange = (days: number, baseIssueDate?: string) => {
    setCreditDays(days);
    const baseDate = baseIssueDate ? new Date(baseIssueDate) : new Date(issueDate || getTodayDate());
    baseDate.setDate(baseDate.getDate() + Number(days || 0));
    setValidUntil(baseDate.toISOString().split('T')[0]);
  };

  const handlePaymentMethodSelect = (pm: string) => {
    setPaymentMethod(pm);
    if (pm === 'CREDIT') {
      handleCreditDaysChange(creditDays, issueDate);
    }
  };

  const filteredItems = items.filter(
    (i) =>
      (i.document_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.client_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const addFormItem = () => {
    setFormItems([...formItems, { product_name: '', quantity: 1, unit_price_usd: 0 }]);
  };

  const removeFormItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateFormItem = (index: number, field: string, value: any, prod?: CatalogProduct) => {
    const updated = [...formItems];
    if (prod) {
      updated[index] = {
        ...updated[index],
        product_id: prod.id,
        sku: prod.sku,
        product_name: prod.name,
        unit_price_usd: prod.priceUsd ?? prod.price_usd ?? updated[index].unit_price_usd ?? 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormItems(updated);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return alert('Ingrese el nombre del cliente');
    if (formItems.some((fi) => !fi.product_name.trim())) {
      return alert('Complete todos los nombres de los productos');
    }

    setIsSaving(true);
    try {
      const payload = {
        document_type: 'QUOTATION',
        client_name: clientName.trim(),
        client_tax_id: clientTaxId.trim() || 'N/A',
        issue_date: issueDate,
        valid_until: validUntil,
        payment_method: paymentMethod,
        exchange_rate: 36.5,
        items: formItems.map((fi) => ({
          product_id: fi.product_id,
          product_name: fi.product_name,
          sku: fi.sku || 'N/A',
          unit_price_usd: Number(fi.unit_price_usd || 0),
          quantity: Number(fi.quantity || 1),
        })),
      };

      const res = await apiClient.post('/sales/documents', payload);
      setItems([res.data, ...items]);
      setIsCreateModalOpen(false);
      setClientName('');
      setClientTaxId('');
      setIssueDate(getTodayDate());
      setValidUntil(getFutureDate(15));
      setPaymentMethod('UNSPECIFIED');
      setFormItems([{ product_name: '', quantity: 1, unit_price_usd: 0 }]);
      showToast(`Cotización #${res.data.document_number} creada exitosamente.`);
    } catch (err: any) {
      console.error('Error guardando cotización:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error al crear la cotización';
      alert(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToOrder = async (doc: Quotation) => {
    try {
      await apiClient.post(`/sales/documents/${doc.id}/convert`, {
        target_type: 'SALES_ORDER',
      });
      fetchQuotations();
      showToast(`✅ Cotización #${doc.document_number} convertida exitosamente a Nota de Pedido (Stock Reservado).`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al convertir la cotización a pedido');
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Cotizaciones y Presupuestos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generación de ofertas comerciales y estimaciones bimonetarias para clientes
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchCatalogIfNeeded();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-sm transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
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
                <th className="py-3.5 px-4">N° Cotización</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Fecha Cotización</th>
                <th className="py-3.5 px-4">Vigencia</th>
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
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600">{item.valid_until || '-'}</td>
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
                    {item.status === 'SENT' && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Enviada
                      </span>
                    )}
                    {item.status === 'ACCEPTED' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Aceptada
                      </span>
                    )}
                    {item.status === 'CONVERTED' && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Convertida a Pedido
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ActionTooltip content="Ver detalle de productos">
                        <button
                          onClick={() => setViewingDoc(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </ActionTooltip>
                      {item.status !== 'CONVERTED' && (
                        <ActionTooltip content="Convertir a Pedido (Reservar Stock)">
                          <button
                            onClick={() => handleConvertToOrder(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                          >
                            <ShoppingBag className="w-4 h-4" />
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

      {/* Create Modal (Sally Enterprise UX Standard) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Registrar Nueva Cotización
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Presupuesto y Estimación de Precios para Clientes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateQuotation} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Cliente / Empresa <span className="text-rose-500">*</span>
                    </label>
                    <ClientCombobox
                      required
                      value={clientName}
                      clients={availableClients}
                      onChange={(val, selectedClient) => {
                        setClientName(val);
                        if (selectedClient && selectedClient.tax_id) {
                          setClientTaxId(selectedClient.tax_id);
                        }
                      }}
                      placeholder="Buscar cliente por nombre o RIF..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      RIF / Cédula Fiscal
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. J-30948192-0"
                      value={clientTaxId}
                      onChange={(e) => setClientTaxId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Datepicker & Payment Method Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Fecha Cotización
                    </label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setIssueDate(newDate);
                        if (paymentMethod === 'CREDIT') {
                          handleCreditDaysChange(creditDays, newDate);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Válida Hasta
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Método de Pago Sugerido
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => handlePaymentMethodSelect(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                    >
                      <option value="UNSPECIFIED">Por definir</option>
                      <option value="CASH_USD">Efectivo ($ USD)</option>
                      <option value="PAGO_MOVIL">Pago Móvil (Bs.)</option>
                      <option value="TRANSFER_BS">Transferencia Bancaria (Bs.)</option>
                      <option value="TRANSFER_USD">Transferencia USD (Zelle/Banesco Panamá)</option>
                      <option value="CREDIT">Crédito Comercial (Días de plazo)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Credit Days Configuration */}
                {paymentMethod === 'CREDIT' && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Condiciones de Crédito</span>
                      </div>
                      <span className="text-xs font-bold text-amber-800">
                        Vencimiento: <span className="font-mono">{validUntil || 'Sin definir'}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-amber-800 font-medium">Plazos típicos:</span>
                      {[7, 15, 30, 45, 60].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleCreditDaysChange(d)}
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
                          onChange={(e) => handleCreditDaysChange(Number(e.target.value))}
                          className="w-16 px-2.5 py-1 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <span className="text-xs text-amber-800 font-bold">días</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ítems y Productos de la Cotización
                    </label>
                    <button
                      type="button"
                      onClick={addFormItem}
                      className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl transition-all hover:shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Ítem
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {formItems.map((fi, index) => (
                      <div key={index} className="flex items-center gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex-1">
                          <ProductCombobox
                            required
                            value={fi.product_name}
                            products={availableProducts}
                            onChange={(val, prod) => updateFormItem(index, 'product_name', val, prod)}
                            placeholder="Buscar o escribir concepto..."
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            placeholder="Cant."
                            value={fi.quantity}
                            onChange={(e) => updateFormItem(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-mono font-bold text-center"
                          />
                        </div>
                        <div className="w-32">
                          <CurrencyInput
                            value={fi.unit_price_usd}
                            onChange={(val) => updateFormItem(index, 'unit_price_usd', val)}
                            size="sm"
                            placeholder="Precio ($)"
                            currencyPrefix="$"
                            icon={null}
                            decimals={2}
                          />
                        </div>
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFormItem(index)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total calculation live preview (Luminous Executive Theme) */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-4 shadow-2xs">
                  {(() => {
                    const subtotalUsd = formItems.reduce(
                      (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unit_price_usd) || 0),
                      0
                    );
                    const taxUsd = subtotalUsd * 0.16;
                    const totalUsd = subtotalUsd + taxUsd;
                    const exchangeRate = 36.5;
                    const totalBs = totalUsd * exchangeRate;
                    return (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs text-indigo-950 font-bold uppercase tracking-wider">
                            Resumen Estimado de Cotización
                          </p>
                          <p className="text-xs text-indigo-700/80 font-medium">
                            Subtotal: ${subtotalUsd.toFixed(2)} + IVA 16%: ${taxUsd.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total:</span>
                            <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                              ${totalUsd.toFixed(2)} USD
                            </span>
                          </div>
                          <p className="text-xs font-mono font-bold text-slate-600 text-right mt-0.5">
                            Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-200 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cotización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (Sally Enterprise UX Standard) */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Cotización #{viewingDoc.document_number}
                    </h3>
                    {viewingDoc.status === 'SENT' && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Enviada
                      </span>
                    )}
                    {viewingDoc.status === 'ACCEPTED' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Aceptada
                      </span>
                    )}
                    {viewingDoc.status === 'CONVERTED' && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Convertida a Pedido
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Comprobante y detalle de productos cotizados al cliente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
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
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{viewingDoc.client_name}</p>
                  <p className="font-mono font-semibold text-xs text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md inline-block mt-1">
                    {viewingDoc.client_tax_id || 'SIN RIF'}
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Fecha Emisión</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{viewingDoc.issue_date || '-'}</p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Válida Hasta</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{viewingDoc.valid_until || '-'}</p>
                </div>
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Método de Pago</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {getPaymentMethodLabel(viewingDoc.payment_method) || 'Por definir'}
                  </p>
                </div>
              </div>

              {/* Items Data Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Productos Registrados en esta Cotización ({viewingDoc.items?.length || 0})</span>
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
                      {viewingDoc.items && viewingDoc.items.length > 0 ? (
                        viewingDoc.items.map((it: any, idx: number) => {
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
                            No se encontraron ítems detallados para este comprobante.
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
                  <p className="text-xs text-indigo-950 font-bold uppercase tracking-wider">Resumen Financiero de la Cotización</p>
                  <p className="text-xs text-indigo-700/80 font-medium">
                    Tasa oficial aplicada: <span className="font-bold font-mono">Bs. {Number(viewingDoc.exchange_rate || 36.5).toFixed(2)}</span> / USD
                  </p>
                </div>
                <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-indigo-100/80">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Monto Total Liquidado</span>
                  <p className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    ${Number(viewingDoc.total_usd || 0).toFixed(2)} USD
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                    Equivalente en moneda nacional: <span className="text-slate-900 font-black">Bs. {Number(viewingDoc.total_bs || 0).toFixed(2)}</span>
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
                <span>Imprimir Cotización</span>
              </button>
              <div className="flex items-center gap-3">
                {viewingDoc.status !== 'CONVERTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      const docToConvert = viewingDoc;
                      setViewingDoc(null);
                      handleConvertToOrder(docToConvert);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-200 cursor-pointer active:scale-98"
                  >
                    <span>Convertir a Pedido</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
