'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Package, 
  Upload,
  DollarSign,
  Tag,
  Layers,
  Scale,
  Percent,
  X,
  MapPin,
  Calendar,
  Warehouse
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { SearchableSelect } from '@/components/SearchableSelect';

interface Provider {
  id: string;
  name: string;
  tax_id: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  is_perishable?: boolean;
  has_batch_control?: boolean;
}

interface InvoiceItem {
  productId: string;
  quantity: number;
  unitCostUsd: number;
  warehouseId: string;
  locationId: string;
  batchNumber: string;
  productionDate: string;
  expirationDate: string;
}

interface Category {
  id: string;
  name: string;
}

interface LocationNode {
  id: string;
  name: string;
  type: string;
  children?: LocationNode[];
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    { 
      productId: '', 
      quantity: 1, 
      unitCostUsd: 0.00,
      warehouseId: '',
      locationId: '',
      batchNumber: '',
      productionDate: '',
      expirationDate: ''
    }
  ]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [exchangeRateStr, setExchangeRateStr] = useState('');
  const exchangeRate = parseFloat(exchangeRateStr) || 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Inline Product Creation Modal State
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [activeItemIndexForProductCreation, setActiveItemIndexForProductCreation] = useState<number | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productModalError, setProductModalError] = useState<string | null>(null);

  // Quick Product Form Fields
  const [quickProductSku, setQuickProductSku] = useState('');
  const [quickProductName, setQuickProductName] = useState('');
  const [quickProductCost, setQuickProductCost] = useState(0);
  const [quickProductPrice, setQuickProductPrice] = useState(0);
  const [quickProductTaxRate, setQuickProductTaxRate] = useState(16.00);
  const [quickProductTaxType, setQuickProductTaxType] = useState('TAXABLE');
  const [quickProductUoM, setQuickProductUoM] = useState('unidades');
  const [quickProductCategoryId, setQuickProductCategoryId] = useState('');
  const [quickProductIsPerishable, setQuickProductIsPerishable] = useState(false);
  const [quickProductHasBatchControl, setQuickProductHasBatchControl] = useState(false);

  const buildHierarchicalOptions = (nodes: LocationNode[], level = 0): { id: string; name: string }[] => {
    let options: { id: string; name: string }[] = [];
    nodes.forEach(node => {
      const indent = '\u00A0\u00A0'.repeat(level * 2); // 2 spaces per level
      const prefix = level > 0 ? '└─ ' : '';
      const typeLabel = node.type === 'WAREHOUSE' ? 'Bodega' 
                      : node.type === 'AISLE' ? 'Pasillo' 
                      : node.type === 'SHELF' ? 'Estante' 
                      : 'Bin';
      options.push({
        id: node.id,
        name: `${indent}${prefix}${node.name} (${typeLabel})`
      });
      if (node.children && node.children.length > 0) {
        options = [...options, ...buildHierarchicalOptions(node.children, level + 1)];
      }
    });
    return options;
  };

  const loadData = async () => {
    try {
      const [providersRes, productsRes, categoriesRes, locationsRes] = await Promise.all([
        apiClient.get('/providers'),
        apiClient.get('/inventory/products'),
        apiClient.get('/inventory/categories'),
        apiClient.get('/inventory/warehouse-locations/tree')
      ]);
      setProviders(providersRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setLocations(locationsRes.data);
      if (categoriesRes.data.length > 0) {
        setQuickProductCategoryId(categoriesRes.data[0].id);
      }
    } catch (err: any) {
      setError('Error al cargar datos auxiliares (proveedores/productos/categorías/ubicaciones).');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Autofill receiving WMS default values when locations are loaded
  useEffect(() => {
    if (locations.length > 0) {
      const defaultWarehouseId = locations[0]?.id || '';
      const defaultSubLocations = locations[0]?.children || [];
      const defaultLocationId = defaultSubLocations[0]?.id || defaultWarehouseId;

      setItems(prev => {
        if (prev.length === 1 && prev[0].productId === '') {
          return [{
            ...prev[0],
            warehouseId: defaultWarehouseId,
            locationId: defaultLocationId,
          }];
        }
        return prev;
      });
    }
  }, [locations]);

  const handleAddItem = () => {
    const defaultWarehouseId = locations[0]?.id || '';
    const defaultSubLocations = locations[0]?.children || [];
    const defaultLocationId = defaultSubLocations[0]?.id || defaultWarehouseId;

    setItems(prev => [...prev, { 
      productId: '', 
      quantity: 1, 
      unitCostUsd: 0.00,
      warehouseId: defaultWarehouseId,
      locationId: defaultLocationId,
      batchNumber: '',
      productionDate: '',
      expirationDate: ''
    }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          productId,
          batchNumber: '',
          productionDate: '',
          expirationDate: ''
        };
      }
      return item;
    }));
  };

  const handleWarehouseChange = (index: number, warehouseId: string) => {
    const selWarehouse = locations.find(l => l.id === warehouseId);
    const subLocations = selWarehouse?.children || [];
    const defaultLocationId = subLocations[0]?.id || warehouseId;

    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { 
          ...item, 
          warehouseId, 
          locationId: defaultLocationId 
        };
      }
      return item;
    }));
  };

  const handleOpenQuickProductModal = (index: number) => {
    setActiveItemIndexForProductCreation(index);
    setQuickProductSku('');
    setQuickProductName('');
    setQuickProductCost(0);
    setQuickProductPrice(0);
    setQuickProductTaxRate(16.00);
    setQuickProductTaxType('TAXABLE');
    setQuickProductUoM('unidades');
    setQuickProductIsPerishable(false);
    setQuickProductHasBatchControl(false);
    setProductModalError(null);
    setIsQuickProductModalOpen(true);
  };

  const handleCloseQuickProductModal = () => {
    setIsQuickProductModalOpen(false);
    setActiveItemIndexForProductCreation(null);
  };

  const handleSubmitQuickProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    setProductModalError(null);

    const payload = {
      sku: quickProductSku.trim().toUpperCase(),
      name: quickProductName.trim(),
      costUsd: Number(quickProductCost),
      priceUsd: Number(quickProductPrice),
      taxRate: Number(quickProductTaxRate),
      taxType: quickProductTaxType,
      isPerishable: quickProductIsPerishable,
      hasBatchControl: quickProductHasBatchControl,
      unitOfMeasure: quickProductUoM.trim(),
      categoryId: quickProductCategoryId || undefined,
      initialStock: 0,
    };

    try {
      const response = await apiClient.post('/inventory/products', [payload]);
      const createdItem = response.data?.success?.[0] || (Array.isArray(response.data) ? response.data[0] : null);
      const createdProductId = createdItem?.productId || createdItem?.id;

      // Refresh product list
      const productsRes = await apiClient.get('/inventory/products');
      const updatedProducts = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.items || []);
      setProducts(updatedProducts);

      // Auto-assign created product to the active row
      if (activeItemIndexForProductCreation !== null && createdProductId) {
        handleProductSelect(activeItemIndexForProductCreation, createdProductId);
        handleItemChange(activeItemIndexForProductCreation, 'unitCostUsd', quickProductCost);
      }

      handleCloseQuickProductModal();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setProductModalError(
          Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
        );
      } else {
        setProductModalError('Ocurrió un error al registrar el producto.');
      }
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId) {
      setError('Por favor selecciona un proveedor.');
      return;
    }
    if (items.some(item => !item.productId)) {
      setError('Por favor selecciona un producto para todas las líneas.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const provider = providers.find(p => p.id === selectedProviderId)!;

    const proofFilePath = proofFile 
      ? `/uploads/purchase-proofs/${Date.now()}_${proofFile.name}` 
      : undefined;

    const payload = {
      invoiceNumber: invoiceNumber.trim(),
      supplierName: provider.name,
      providerId: provider.id,
      proofFilePath,
      discountPercentage: Number(discountPercentage),
      items: items.map(item => {
        const prodObj = products.find(p => p.id === item.productId);
        const requireBatch = prodObj?.has_batch_control || prodObj?.is_perishable;
        return {
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCostUsd: Number(item.unitCostUsd),
          locationId: item.locationId || undefined,
          batchNumber: requireBatch && item.batchNumber ? item.batchNumber.trim().toUpperCase() : undefined,
          productionDate: requireBatch && item.productionDate ? item.productionDate : undefined,
          expirationDate: requireBatch && item.expirationDate ? item.expirationDate : undefined
        };
      })
    };

    try {
      await apiClient.post('/inventory/purchases', payload);
      setSuccess(true);
      setTimeout(() => {
        router.push('/inventory/purchases');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar la factura de compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitCostUsd), 0);
  };

  const calculateDiscount = () => {
    return calculateSubtotal() * (discountPercentage / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center flex-col gap-2">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        <span className="text-sm text-slate-400 font-semibold">Cargando formulario...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/inventory/purchases')}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Registrar Factura de Compra</h1>
          <p className="text-slate-500">Carga inventario de productos y asocia la compra a un proveedor.</p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-950">¡Factura Registrada!</p>
            <p className="text-xs text-emerald-700 mt-0.5">La mercadería ha sido ingresada al inventario y el costo de los productos fue actualizado.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950">Error al guardar factura</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Invoice Header details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Proveedor</label>
            <SearchableSelect
              icon={User}
              value={selectedProviderId}
              onChange={(val) => setSelectedProviderId(val)}
              options={providers.map(p => ({
                value: p.id,
                label: p.name,
                sublabel: p.tax_id ? `RIF: ${p.tax_id}` : undefined
              }))}
              placeholder="Buscar o seleccionar proveedor..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Nro. de Factura / Control</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ej. FACT-0023"
                className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Comprobante Físico (PDF/Imagen)</label>
            <div className="relative">
              <Upload className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="file"
                accept=".pdf,image/*"
                className="block w-full pl-11 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
          </div>
        </div>

        {/* Invoice lines (products grid) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Detalle de Artículos</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Agregar Fila
            </button>
          </div>

          {products.length === 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-amber-950">Catálogo de productos vacío</p>
                <p className="leading-relaxed text-slate-600">
                  Aún no tienes productos registrados. Puedes crear tus productos directamente desde aquí haciendo clic en el botón <strong>"+"</strong> al lado del selector de productos, o registrarlos previamente en <a href="/inventory/initial" target="_blank" className="font-bold underline text-amber-700 hover:text-amber-900">Registrar Producto</a>.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/30 space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                  
                  {/* Product Select */}
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Producto *</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <SearchableSelect
                          icon={Package}
                          value={item.productId}
                          onChange={(val) => handleProductSelect(index, val)}
                          options={products.map(p => ({
                            value: p.id,
                            label: p.name,
                            sublabel: `SKU: ${p.sku}`
                          }))}
                          placeholder="Buscar o seleccionar producto..."
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickProductModal(index)}
                        title="Crear producto nuevo en catálogo"
                        className="p-2.5 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-xl bg-slate-50 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="w-full md:w-28">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cantidad *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      className="block w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-right font-medium bg-slate-50/50 focus:bg-white"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    />
                  </div>

                  {/* Unit Cost */}
                  <div className="w-full md:w-32">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Costo Unit (USD) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        placeholder="0.00"
                        className="block w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-right font-medium bg-slate-50/50 focus:bg-white"
                        value={item.unitCostUsd || ''}
                        onChange={(e) => handleItemChange(index, 'unitCostUsd', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Trash Button */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer mb-0.5"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>

                {/* Warehouse and Location Selection Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Almacén de Destino {locations.length > 0 ? '*' : '(Se auto-creará Almacén Principal)'}
                    </label>
                    <SearchableSelect
                      icon={Warehouse}
                      value={item.warehouseId}
                      onChange={(val) => handleWarehouseChange(index, val)}
                      disabled={locations.length === 0}
                      options={locations.length > 0 ? [
                        { value: '', label: '-- Seleccione Almacén --' },
                        ...locations.map(loc => ({
                          value: loc.id,
                          label: loc.name,
                        }))
                      ] : [
                        { value: '', label: 'Almacén Principal (Automático)' }
                      ]}
                      placeholder={locations.length > 0 ? "Buscar o seleccionar almacén..." : "Almacén Principal (Automático)"}
                      required={locations.length > 0}
                    />
                  </div>

                  {(() => {
                    const selWarehouse = locations.find(l => l.id === item.warehouseId);
                    const subLocations = selWarehouse?.children || [];
                    if (subLocations.length === 0) return null;

                    return (
                      <div className="animate-in fade-in duration-200">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ubicación Específica *</label>
                        <SearchableSelect
                          icon={MapPin}
                          value={item.locationId}
                          onChange={(val) => handleItemChange(index, 'locationId', val)}
                          options={buildHierarchicalOptions(subLocations).map(opt => ({
                            value: opt.id,
                            label: opt.name,
                          }))}
                          placeholder="Buscar o seleccionar pasillo, estante o bin..."
                          required
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Conditional Batch Control Fields */}
                {(() => {
                  const selectedProd = products.find(p => p.id === item.productId);
                  const showBatch = selectedProd?.has_batch_control || selectedProd?.is_perishable;
                  if (!showBatch) return null;

                  return (
                    <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-xl space-y-3 animate-in zoom-in-95 duration-200">
                      <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        Trazabilidad de Lote Requerida
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-indigo-900/60 uppercase tracking-wider mb-1">Número de Lote *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. LT-2026-07"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase font-medium"
                            value={item.batchNumber}
                            onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-indigo-900/60 uppercase tracking-wider mb-1">Fecha Elaboración</label>
                          <input
                            type="date"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={item.productionDate}
                            onChange={(e) => handleItemChange(index, 'productionDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-indigo-900/60 uppercase tracking-wider mb-1">Fecha Vencimiento {selectedProd?.is_perishable && '*'}</label>
                          <input
                            type="date"
                            required={selectedProd?.is_perishable}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={item.expirationDate}
                            onChange={(e) => handleItemChange(index, 'expirationDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Descuento Global (%)</label>
                <div className="relative w-full max-w-[150px]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full pr-8 pl-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-right font-medium text-slate-700"
                    value={discountPercentage || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0 && val <= 100) setDiscountPercentage(val);
                    }}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tasa Cambiaria (Bs./$)</label>
                <div className="relative w-full max-w-[180px]">
                  <input
                    type="text"
                    placeholder="0.00"
                    className="block w-full pr-12 pl-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-right font-medium text-slate-700 font-mono"
                    value={exchangeRateStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/,/g, '.');
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setExchangeRateStr(val);
                      }
                    }}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Bs./$</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-right text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">${calculateSubtotal().toFixed(2)} USD</span>
              </div>
              {discountPercentage > 0 && (
                <div className="flex justify-between items-center text-rose-600">
                  <span>Descuento ({discountPercentage}%):</span>
                  <span className="font-semibold">-${calculateDiscount().toFixed(2)} USD</span>
                </div>
              )}
              {exchangeRate > 0 && (
                <div className="flex justify-between items-center text-indigo-600 border-t border-dashed border-slate-100 pt-1.5 pb-1">
                  <span>Equivalente en Bolívares (Bs.):</span>
                  <span className="font-mono font-bold">Bs. {(calculateTotal() * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-slate-800 border-t border-slate-100 pt-1.5">
                <span>Total Factura:</span>
                <span className="text-lg font-black text-emerald-600">${calculateTotal().toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/inventory/purchases')}
            className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-600/10 hover:shadow-lg transition-colors cursor-pointer"
          >
            {isSubmitting && <Loader2 className="animate-spin h-4.5 w-4.5" />}
            Confirmar e Ingresar Stock
          </button>
        </div>
      </form>

      {/* Quick Inline Product Creation Modal */}
      {isQuickProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <form onSubmit={handleSubmitQuickProduct} className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Registrar Producto Nuevo en Catálogo
              </h3>
              <button 
                type="button"
                onClick={handleCloseQuickProductModal} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[70vh]">
              {productModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in duration-200">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                  <span>{productModalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">SKU (Código Único) *</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      placeholder="Ej. PAN-HAR-01"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                      value={quickProductSku}
                      onChange={(e) => setQuickProductSku(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Nombre del Producto *</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      placeholder="Ej. Harina Pan 1kg"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      value={quickProductName}
                      onChange={(e) => setQuickProductName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Categoría *</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white font-medium"
                      value={quickProductCategoryId}
                      onChange={(e) => setQuickProductCategoryId(e.target.value)}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Unidad de Medida *</label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white font-medium"
                      value={quickProductUoM}
                      onChange={(e) => setQuickProductUoM(e.target.value)}
                    >
                      <option value="unidades">Unidades (unidad)</option>
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="gramos">Gramos (g)</option>
                      <option value="litros">Litros (l)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="paquetes">Paquetes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Costo Base (USD) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input 
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-medium"
                      value={quickProductCost || ''}
                      onChange={(e) => setQuickProductCost(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Precio Venta (USD) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input 
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-medium"
                      value={quickProductPrice || ''}
                      onChange={(e) => setQuickProductPrice(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Clasificación Fiscal *</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white font-medium"
                      value={quickProductTaxType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuickProductTaxType(val);
                        if (val !== 'TAXABLE') {
                          setQuickProductTaxRate(0.00);
                        } else {
                          setQuickProductTaxRate(16.00);
                        }
                      }}
                    >
                      <option value="TAXABLE">Gravable (IVA)</option>
                      <option value="EXEMPT">Exento</option>
                      <option value="EXONERATED">Exonerado</option>
                    </select>
                  </div>
                </div>

                {quickProductTaxType === 'TAXABLE' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Tasa IVA *</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white font-medium"
                        value={quickProductTaxRate}
                        onChange={(e) => setQuickProductTaxRate(Number(e.target.value))}
                      >
                        <option value={16.00}>16% (General)</option>
                        <option value={8.00}>8% (Reducido)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={quickProductIsPerishable}
                    onChange={(e) => {
                      setQuickProductIsPerishable(e.target.checked);
                      if (e.target.checked) setQuickProductHasBatchControl(true);
                    }}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-200 focus:ring-indigo-500"
                  />
                  <span>¿Es Perecedero?</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={quickProductHasBatchControl}
                    disabled={quickProductIsPerishable}
                    onChange={(e) => setQuickProductHasBatchControl(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-200 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span>¿Maneja Lotes?</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseQuickProductModal}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingProduct}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white font-medium rounded-xl text-xs cursor-pointer"
              >
                {isSavingProduct && <Loader2 className="animate-spin h-3.5 w-3.5" />}
                Guardar Producto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
