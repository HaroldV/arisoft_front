import React, { useState } from 'react';
import { ShoppingBag, X, AlertCircle, Plus, Trash2, Loader2, Building2, CreditCard, DollarSign, Package, Mail, Phone } from 'lucide-react';
import { PAYMENT_TERMS, CURRENCIES, PRODUCT_TAX_TYPES } from '@/constants/domain-constants';
import { VENEZUELAN_STATES } from '@/constants/venezuela';
import { CurrencyInput } from '@/components/CurrencyInput';
import { SearchableSelect } from '@/components/SearchableSelect';
import apiClient from '@/infrastructure/api/api-client';
import { OrderItem, ProviderOption, ProductOption, WarehouseOption } from '../types';

interface PurchaseOrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ProviderOption[];
  products: ProductOption[];
  warehouses: WarehouseOption[];
  onSubmit: (payload: any) => Promise<void>;
  onProviderCreated?: (newProvider: ProviderOption) => void;
}

export function PurchaseOrderCreateModal({
  isOpen,
  onClose,
  providers,
  products,
  warehouses,
  onSubmit,
  onProviderCreated,
}: PurchaseOrderCreateModalProps) {
  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formSupplierRif, setFormSupplierRif] = useState('');
  const [formPaymentTerm, setFormPaymentTerm] = useState(PAYMENT_TERMS.CONTADO);
  const [formCurrency, setFormCurrency] = useState(CURRENCIES.USD);
  const [formIsNational, setFormIsNational] = useState(true);
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [globalDiscountPct, setGlobalDiscountPct] = useState(0);
  const [globalSurchargePct, setGlobalSurchargePct] = useState(0);
  const [formItems, setFormItems] = useState<OrderItem[]>([]);
  const [errorFields, setErrorFields] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Inline Provider Creation Modal State
  const [isQuickProviderModalOpen, setIsQuickProviderModalOpen] = useState(false);
  const [isSavingProvider, setIsSavingProvider] = useState(false);
  const [providerModalError, setProviderModalError] = useState<string | null>(null);
  const [quickProviderName, setQuickProviderName] = useState('');
  const [quickProviderTaxPrefix, setQuickProviderTaxPrefix] = useState<'V' | 'J' | 'G' | 'E'>('J');
  const [quickProviderTaxNumber, setQuickProviderTaxNumber] = useState('');
  const [quickProviderEmail, setQuickProviderEmail] = useState('');
  const [quickProviderPhone, setQuickProviderPhone] = useState('');
  const [quickProviderAddress, setQuickProviderAddress] = useState('');
  const [quickProviderDeliveryAddress, setQuickProviderDeliveryAddress] = useState('');
  const [quickProviderZoneCode, setQuickProviderZoneCode] = useState('DC');
  const [quickProviderTaxpayerType, setQuickProviderTaxpayerType] = useState('ORDINARY');

  const handleOpenQuickProviderModal = (initialName = '') => {
    setQuickProviderName(initialName);
    setQuickProviderTaxPrefix('J');
    setQuickProviderTaxNumber('');
    setQuickProviderEmail('');
    setQuickProviderPhone('');
    setQuickProviderAddress('');
    setQuickProviderDeliveryAddress('');
    setQuickProviderZoneCode('DC');
    setQuickProviderTaxpayerType('ORDINARY');
    setProviderModalError(null);
    setIsQuickProviderModalOpen(true);
  };

  const handleCloseQuickProviderModal = () => {
    setIsQuickProviderModalOpen(false);
  };

  const handleSubmitQuickProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProvider(true);
    setProviderModalError(null);

    const cleanTaxNumber = quickProviderTaxNumber.replace(/\D/g, '');
    const formattedTaxId = cleanTaxNumber ? `${quickProviderTaxPrefix}-${cleanTaxNumber}` : '';

    if (!quickProviderName.trim()) {
      setProviderModalError('El Nombre o Razón Social es obligatorio.');
      setIsSavingProvider(false);
      return;
    }

    if (!cleanTaxNumber) {
      setProviderModalError('El número de Cédula o RIF es obligatorio.');
      setIsSavingProvider(false);
      return;
    }

    const payload = {
      name: quickProviderName.trim(),
      tax_id: formattedTaxId,
      email: quickProviderEmail.trim() || undefined,
      phone: quickProviderPhone.trim() || undefined,
      address: quickProviderAddress.trim() || undefined,
      delivery_address: quickProviderDeliveryAddress.trim() || undefined,
      zone_code: quickProviderZoneCode,
      taxpayer_type: quickProviderTaxpayerType,
      is_retention_agent: false,
      retention_percentage: 75,
      islr_percentage: 2.0,
      islr_concept_code: 'SERVICES',
    };

    try {
      const res = await apiClient.post('/providers', payload);
      const createdProvider = res.data;

      const newProvOpt: ProviderOption = {
        id: createdProvider.id,
        name: createdProvider.name,
        rif: createdProvider.tax_id || createdProvider.rif || formattedTaxId,
      };

      if (onProviderCreated) {
        onProviderCreated(newProvOpt);
      }

      // Automatically select in this modal
      setSelectedSupplierId(createdProvider.id);
      setFormSupplierName(createdProvider.name);
      setFormSupplierRif(newProvOpt.rif || '');

      handleCloseQuickProviderModal();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setProviderModalError(
          Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
        );
      } else {
        setProviderModalError('Ocurrió un error al registrar el proveedor.');
      }
    } finally {
      setIsSavingProvider(false);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (products.length === 0) return;
    const first = products[0];
    setFormItems(prev => [
      ...prev,
      {
        item_number: prev.length + 1,
        productId: first.id,
        model: '',
        warehouseId: warehouses[0]?.id || undefined,
        quantityOrdered: 1,
        unitCostUsd: first.costUsd || 0,
        discountPercentage: 0,
        discountAmount: 0,
        taxType: PRODUCT_TAX_TYPES.TAXABLE,
        taxRate: 16.0,
        additionalTaxAmount: 0,
        lineComment: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, item_number: i + 1 })));
  };

  const handleUpdateItem = (index: number, patch: Partial<OrderItem>) => {
    setFormItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...patch };
        if (patch.discountPercentage !== undefined || patch.quantityOrdered !== undefined || patch.unitCostUsd !== undefined) {
          const qty = updated.quantityOrdered || 0;
          const cost = updated.unitCostUsd || 0;
          const disc = updated.discountPercentage || 0;
          updated.discountAmount = (qty * cost * disc) / 100;
        }
        return updated;
      })
    );
  };

  const handleSelectProduct = (index: number, productId: string, productName?: string) => {
    const selectedProd = products.find(p => p.id === productId);
    handleUpdateItem(index, {
      productId,
      unitCostUsd: selectedProd?.costUsd ?? 0,
      sku: selectedProd?.sku ?? '',
      lineComment: productName ?? selectedProd?.name ?? '',
    });
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorsMap: Record<string, boolean> = {};

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
      if (!selectedSupplierId) {
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

      const processedItems = formItems.map(item => ({
        productId: item.productId,
        model: item.model || undefined,
        warehouseId: item.warehouseId || undefined,
        quantityOrdered: Number(item.quantityOrdered),
        unitCostUsd: Number(item.unitCostUsd),
        discountPercentage: Number(item.discountPercentage || 0),
        taxType: item.taxType || PRODUCT_TAX_TYPES.TAXABLE,
        taxRate: Number(item.taxRate || 16),
        additionalTaxAmount: Number(item.additionalTaxAmount || 0),
        lineComment: item.lineComment || undefined,
      }));

      await onSubmit({
        supplierId: selectedSupplierId || undefined,
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

      onClose();
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const formattedMsg = Array.isArray(serverMsg) ? serverMsg.join(', ') : (serverMsg || err.message);
      setError(formattedMsg || 'Error al emitir la Orden de Compra');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header Bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Emisión de Orden de Compra</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Proveedor <span className="text-rose-500">*</span></label>
                <button
                  type="button"
                  onClick={() => handleOpenQuickProviderModal()}
                  className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nuevo Proveedor</span>
                </button>
              </div>
              <SearchableSelect
                icon={Building2}
                value={selectedSupplierId}
                onChange={(val) => {
                  const p = providers.find(prov => prov.id === val);
                  if (p) {
                    setSelectedSupplierId(p.id);
                    setFormSupplierName(p.name);
                    setFormSupplierRif(p.rif || '');
                  } else if (val) {
                    handleOpenQuickProviderModal(val);
                  } else {
                    setSelectedSupplierId('');
                    setFormSupplierName('');
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
                placeholder="Seleccionar o Escribir Proveedor Nuevo..."
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
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition-all ${
                  selectedSupplierId
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
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono outline-none transition-all ${
                  selectedSupplierId
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
                onChange={(val) => setFormPaymentTerm(val as any)}
                options={[
                  { value: PAYMENT_TERMS.CONTADO, label: 'Pago de Contado' },
                  { value: PAYMENT_TERMS.CREDITO_7, label: 'Crédito 7 Días' },
                  { value: PAYMENT_TERMS.CREDITO_15, label: 'Crédito 15 Días' },
                  { value: PAYMENT_TERMS.CREDITO_30, label: 'Crédito 30 Días' },
                ]}
                placeholder="Seleccionar condición..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Moneda del Comprobante</label>
              <SearchableSelect
                icon={DollarSign}
                value={formCurrency}
                onChange={(val) => setFormCurrency(val as any)}
                options={[
                  { value: CURRENCIES.USD, label: 'USD - Dólares ($)' },
                  { value: CURRENCIES.VES, label: 'VES - Bolívares (Bs)' },
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
                              handleSelectProduct(idx, val, opt?.label);
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
                            className={`w-full px-2 py-1.5 bg-white rounded-lg text-xs font-mono outline-none transition-all ${
                              errorFields[`item_sku_${idx}`]
                                ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
                                : 'border border-slate-200 focus:border-indigo-500'
                            }`}
                            value={item.sku || ''}
                            onChange={(e) => {
                              handleUpdateItem(idx, { sku: e.target.value });
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
                            onChange={(e) => handleUpdateItem(idx, { model: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                            value={item.quantityOrdered}
                            onChange={(e) => handleUpdateItem(idx, { quantityOrdered: Number(e.target.value) })}
                          />
                        </td>
                        <td className="py-2 px-3 text-right w-28">
                          <CurrencyInput
                            value={item.unitCostUsd}
                            onChange={(val) => handleUpdateItem(idx, { unitCostUsd: Number(val) || 0 })}
                            size="sm"
                            placeholder="0.00"
                            currencyPrefix="$"
                            icon={null}
                            decimals={4}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                            value={item.discountPercentage || 0}
                            onChange={(e) => handleUpdateItem(idx, { discountPercentage: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                            value={item.taxRate || 16}
                            onChange={(e) => handleUpdateItem(idx, { taxRate: Number(e.target.value) || 0 })}
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
                  <CurrencyInput
                    value={globalDiscountPct}
                    onChange={(val) => setGlobalDiscountPct(Number(val) || 0)}
                    size="sm"
                    placeholder="0.00"
                    currencyPrefix="%"
                    icon={null}
                    decimals={2}
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Recargo / Flete Global (%)</label>
                  <CurrencyInput
                    value={globalSurchargePct}
                    onChange={(val) => setGlobalSurchargePct(Number(val) || 0)}
                    size="sm"
                    placeholder="0.00"
                    currencyPrefix="%"
                    icon={null}
                    decimals={2}
                    min={0}
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
              onClick={onClose}
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

      {/* Quick Express Provider Modal */}
      {isQuickProviderModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registrar Nuevo Proveedor</h3>
                  <p className="text-xs text-slate-500">Se guardará en el catálogo y se asociará a esta orden de compra</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseQuickProviderModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuickProvider} className="p-6 space-y-4 overflow-y-auto flex-1">
              {providerModalError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{providerModalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nombre o Razón Social <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Polar C.A."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    value={quickProviderName}
                    onChange={(e) => setQuickProviderName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Cédula / RIF <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={quickProviderTaxPrefix}
                      onChange={(e) => setQuickProviderTaxPrefix(e.target.value as any)}
                    >
                      <option value="J">J-</option>
                      <option value="V">V-</option>
                      <option value="G">G-</option>
                      <option value="E">E-</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="123456789"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={quickProviderTaxNumber}
                      onChange={(e) => setQuickProviderTaxNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tipo de Contribuyente
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    value={quickProviderTaxpayerType}
                    onChange={(e) => setQuickProviderTaxpayerType(e.target.value)}
                  >
                    <option value="ORDINARY">Ordinario</option>
                    <option value="SPECIAL">Especial</option>
                    <option value="FORMAL">Formal</option>
                    <option value="EXEMPT">Exento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="0414-1234567"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      value={quickProviderPhone}
                      onChange={(e) => setQuickProviderPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="contacto@proveedor.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      value={quickProviderEmail}
                      onChange={(e) => setQuickProviderEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Estado / Región
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    value={quickProviderZoneCode}
                    onChange={(e) => setQuickProviderZoneCode(e.target.value)}
                  >
                    {VENEZUELAN_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    placeholder="Av., Calle, Edificio..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    value={quickProviderAddress}
                    onChange={(e) => setQuickProviderAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 flex justify-end gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseQuickProviderModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProvider}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingProvider && <Loader2 className="animate-spin h-3.5 w-3.5" />}
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
