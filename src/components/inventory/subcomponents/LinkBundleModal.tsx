'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Layers, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Scissors,
  Sparkles,
  Barcode
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { InventoryProduct } from '../types/stock.types';

interface LinkBundleModalProps {
  isOpen: boolean;
  products: InventoryProduct[];
  onClose: () => void;
  onSuccess: () => void;
}

export const LinkBundleModal: React.FC<LinkBundleModalProps> = ({
  isOpen,
  products,
  onClose,
  onSuccess,
}) => {
  // Modal Mode: 'BUNDLE' (bulto) o 'COMBO' (combo variado)
  const [creationMode, setCreationMode] = useState<'BUNDLE' | 'COMBO'>('BUNDLE');

  // Estado para MODO BULTO
  const [childProductId, setChildProductId] = useState('');
  const [unitsPerBundle, setUnitsPerBundle] = useState<number>(20);
  const [bundleName, setBundleName] = useState('');
  const [bundleSku, setBundleSku] = useState('');
  const [bundlePriceUsd, setBundlePriceUsd] = useState<number>(0);
  const [bundleInitialStock, setBundleInitialStock] = useState<number>(0);
  const [searchChild, setSearchChild] = useState('');

  // Estado para MODO COMBO
  const [comboName, setComboName] = useState('');
  const [comboSku, setComboSku] = useState('');
  const [comboPriceUsd, setComboPriceUsd] = useState<number>(0);
  const [comboInitialStock, setComboInitialStock] = useState<number>(0);
  const [comboItems, setComboItems] = useState<{ childProductId: string; quantity: number; childName: string; childSku: string; costUsd: number }[]>([]);
  const [searchComboProduct, setSearchComboProduct] = useState('');
  const [selectedComboItemChildId, setSelectedComboItemChildId] = useState('');
  const [comboItemQty, setComboItemQty] = useState<number>(1);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCreationMode('BUNDLE');
      setChildProductId('');
      setUnitsPerBundle(20);
      setBundleName('');
      setBundleSku('');
      setBundlePriceUsd(0);
      setBundleInitialStock(0);
      setSearchChild('');
      setComboName('');
      setComboSku('');
      setComboPriceUsd(0);
      setComboInitialStock(0);
      setComboItems([]);
      setSearchComboProduct('');
      setSelectedComboItemChildId('');
      setComboItemQty(1);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedChild = products.find(p => p.id === childProductId);

  // Manejador al seleccionar producto unitario para Bulto
  const handleSelectChildForBundle = (child: InventoryProduct) => {
    setChildProductId(child.id);
    setSearchChild(child.name);

    // Sugerir nombre descriptivo
    const suggestedName = `Bulto ${child.name} (${unitsPerBundle} un)`;
    setBundleName(suggestedName);

    // Sugerir SKU con prefijo BUL-
    const cleanSku = child.sku.replace(/^BUL-|^CMB-/, '').trim();
    setBundleSku(`BUL-${cleanSku}-${unitsPerBundle}`);

    // Sugerir precio al mayor con 10% de descuento sobre el precio unitario x cantidad
    const unitPrice = Number(child.priceUsd || 0);
    const suggestedPrice = Number((unitPrice * unitsPerBundle * 0.95).toFixed(2));
    setBundlePriceUsd(suggestedPrice);
  };

  const handleUnitsChange = (newUnits: number) => {
    const val = Math.max(0.001, newUnits);
    setUnitsPerBundle(val);
    if (selectedChild) {
      setBundleName(`Bulto ${selectedChild.name} (${val} un)`);
      const cleanSku = selectedChild.sku.replace(/^BUL-|^CMB-/, '').trim();
      setBundleSku(`BUL-${cleanSku}-${val}`);
      const unitPrice = Number(selectedChild.priceUsd || 0);
      setBundlePriceUsd(Number((unitPrice * val * 0.95).toFixed(2)));
    }
  };

  // Manejadores para COMBO
  const handleAddComboItem = () => {
    if (!selectedComboItemChildId) return;
    const child = products.find(p => p.id === selectedComboItemChildId);
    if (!child) return;

    if (comboItems.some(i => i.childProductId === child.id)) {
      setError('Este producto ya está agregado al combo.');
      return;
    }

    setComboItems(prev => [
      ...prev,
      {
        childProductId: child.id,
        quantity: comboItemQty > 0 ? comboItemQty : 1,
        childName: child.name,
        childSku: child.sku,
        costUsd: Number(child.costUsd || 0),
      }
    ]);

    setSelectedComboItemChildId('');
    setSearchComboProduct('');
    setComboItemQty(1);
    setError(null);
  };

  const handleRemoveComboItem = (childId: string) => {
    setComboItems(prev => prev.filter(i => i.childProductId !== childId));
  };

  // Cálculos de costo
  const calculatedBundleCost = selectedChild ? Number(selectedChild.costUsd || 0) * unitsPerBundle : 0;
  const calculatedComboCost = comboItems.reduce((sum, item) => sum + (item.costUsd * item.quantity), 0);

  // Guardar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (creationMode === 'BUNDLE') {
        if (!selectedChild) {
          throw new Error('Debes seleccionar el producto unitario.');
        }
        if (!bundleName.trim()) {
          throw new Error('El nombre del bulto es requerido.');
        }
        if (!bundleSku.trim()) {
          throw new Error('El código SKU del bulto es requerido.');
        }

        // Asegurar prefijo BUL-
        const finalSku = bundleSku.toUpperCase().startsWith('BUL-')
          ? bundleSku.toUpperCase().trim()
          : `BUL-${bundleSku.toUpperCase().trim()}`;

        // 1. Crear el producto Bulto en el catálogo
        const createRes = await apiClient.post('/inventory/products', [
          {
            sku: finalSku,
            name: bundleName.trim(),
            costUsd: calculatedBundleCost,
            priceUsd: bundlePriceUsd > 0 ? bundlePriceUsd : calculatedBundleCost * 1.3,
            taxRate: Number(selectedChild.taxRate || 16),
            taxType: selectedChild.tax_type || 'TAXABLE',
            initialStock: bundleInitialStock,
            unitOfMeasure: 'bultos',
            category: selectedChild.category || 'General',
            categoryId: selectedChild.category_id || undefined,
            productType: 'COMPOUND',
            description: `Bulto al mayor equivalente a ${unitsPerBundle} ${selectedChild.unit_of_measure || 'unidades'} de ${selectedChild.name}`,
          }
        ]);

        const responseData = createRes.data?.data || createRes.data;
        const successList = responseData?.success || (Array.isArray(responseData) ? responseData : []);
        const errorList = responseData?.errors || [];

        if (errorList.length > 0) {
          throw new Error(errorList[0].reason || 'Error al registrar el producto');
        }

        const newBundleId = successList[0]?.productId || successList[0]?.id;

        if (!newBundleId) {
          throw new Error('No se pudo obtener el ID del bulto creado.');
        }

        // 2. Vincular los componentes de desarmado
        await apiClient.post(`/inventory/products/${newBundleId}/components`, {
          components: [
            {
              childProductId: selectedChild.id,
              quantity: unitsPerBundle,
              unitCostAtDefinition: Number(selectedChild.costUsd || 0),
            }
          ]
        });

      } else {
        // MODO COMBO
        if (!comboName.trim()) {
          throw new Error('El nombre del combo es requerido.');
        }
        if (!comboSku.trim()) {
          throw new Error('El código SKU del combo es requerido.');
        }
        if (comboItems.length === 0) {
          throw new Error('Debes agregar al menos un producto al combo.');
        }

        // Asegurar prefijo CMB-
        const finalSku = comboSku.toUpperCase().startsWith('CMB-')
          ? comboSku.toUpperCase().trim()
          : `CMB-${comboSku.toUpperCase().trim()}`;

        // 1. Crear el producto Combo en el catálogo
        const createRes = await apiClient.post('/inventory/products', [
          {
            sku: finalSku,
            name: comboName.trim(),
            costUsd: calculatedComboCost,
            priceUsd: comboPriceUsd > 0 ? comboPriceUsd : calculatedComboCost * 1.3,
            taxRate: 16.0,
            taxType: 'TAXABLE',
            initialStock: comboInitialStock,
            unitOfMeasure: 'combos',
            category: 'Combos y Promociones',
            productType: 'COMPOUND',
            description: `Combo promocional compuesto por ${comboItems.length} artículos`,
          }
        ]);

        const responseData = createRes.data?.data || createRes.data;
        const successList = responseData?.success || (Array.isArray(responseData) ? responseData : []);
        const errorList = responseData?.errors || [];

        if (errorList.length > 0) {
          throw new Error(errorList[0].reason || 'Error al registrar el combo');
        }

        const newComboId = successList[0]?.productId || successList[0]?.id;

        if (!newComboId) {
          throw new Error('No se pudo obtener el ID del combo creado.');
        }

        // 2. Guardar los componentes
        await apiClient.post(`/inventory/products/${newComboId}/components`, {
          components: comboItems.map(i => ({
            childProductId: i.childProductId,
            quantity: i.quantity,
            unitCostAtDefinition: i.costUsd,
          }))
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al crear y registrar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredChildren = products.filter(p =>
    p.name.toLowerCase().includes(searchChild.toLowerCase()) || p.sku.toLowerCase().includes(searchChild.toLowerCase())
  );

  const filteredComboProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchComboProduct.toLowerCase()) || p.sku.toLowerCase().includes(searchComboProduct.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/40 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-2.5 shadow-md shadow-indigo-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Crear Bulto al Mayor o Combo Promocional
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Genera el producto, asigna su SKU y habilita su venta y desarmado en POS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Modo: Bulto o Combo */}
        <div className="px-6 pt-5 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setCreationMode('BUNDLE')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                creationMode === 'BUNDLE'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 text-indigo-600" />
              <span>📦 Bulto al Mayor (BUL-)</span>
            </button>

            <button
              type="button"
              onClick={() => setCreationMode('COMBO')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                creationMode === 'COMBO'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>🍱 Combo Promocional (CMB-)</span>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Producto creado y vinculado exitosamente! Ya está listo en el POS.</span>
            </div>
          )}

          {/* ============================== MODO BULTO ============================== */}
          {creationMode === 'BUNDLE' && (
            <div className="space-y-5">
              {/* Paso 1: Seleccionar Producto Unitario */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Producto Base del Bulto <span className="text-rose-500">*</span>
                  </label>
                  {selectedChild && (
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      Producto Seleccionado
                    </span>
                  )}
                </div>

                {!selectedChild ? (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o SKU (ej. Harina, Arroz, Café)..."
                      className="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                      value={searchChild}
                      onChange={(e) => setSearchChild(e.target.value)}
                    />
                    {searchChild && (
                      <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1">
                        {filteredChildren.slice(0, 6).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectChildForBundle(p)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-indigo-50 flex justify-between items-center transition-all cursor-pointer group"
                          >
                            <span className="font-semibold text-slate-800 group-hover:text-indigo-900 truncate">{p.name}</span>
                            <span className="font-mono text-slate-400 text-[11px] ml-2 shrink-0">{p.sku} • ${Number(p.priceUsd || 0).toFixed(2)}</span>
                          </button>
                        ))}
                        {filteredChildren.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400 font-medium">No se encontraron productos coincidentes</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="truncate pr-3">
                      <span className="font-bold text-slate-900 text-sm block truncate">{selectedChild.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          SKU: {selectedChild.sku}
                        </span>
                        <span className="font-mono text-[11px] text-slate-600">
                          Costo: <strong>${Number(selectedChild.costUsd || 0).toFixed(2)}</strong>
                        </span>
                        <span className="font-mono text-[11px] text-slate-600">
                          Precio Unitario: <strong>${Number(selectedChild.priceUsd || 0).toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setChildProductId('');
                        setSearchChild('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Cambiar producto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Paso 2: Configuración del Bulto */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  2. Datos del Nuevo Bulto / Empaque al Mayor
                </label>

                {/* Fila 1: Nombre y SKU en proporción 7 / 5 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  <div className="md:col-span-7 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Nombre Comercial del Bulto <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Bulto Harina PAN 1kg (20 un)"
                      value={bundleName}
                      onChange={(e) => setBundleName(e.target.value)}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div className="md:col-span-5 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Código SKU en POS <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="BUL-HAR-20"
                        value={bundleSku}
                        onChange={(e) => setBundleSku(e.target.value.toUpperCase())}
                        className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Fila 2: Unidades, Precio Mayorista y Stock Inicial en columnas balanceadas de 4/4/4 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 truncate">
                      Cant. por Bulto (Un / Kg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      required
                      value={unitsPerBundle}
                      onChange={(e) => handleUnitsChange(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 truncate">
                      Precio Mayorista ($) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={bundlePriceUsd}
                      onChange={(e) => setBundlePriceUsd(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 truncate">
                      Stock Inicial (Bultos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={bundleInitialStock}
                      onChange={(e) => setBundleInitialStock(parseInt(e.target.value, 10) || 0)}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Tarjeta de Resumen en Vivo */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/40 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                <div>
                  <span className="font-bold text-indigo-950 block text-xs">Costo Base del Bulto Calculado:</span>
                  <span className="text-slate-500 text-[11px] font-mono mt-0.5 block">
                    {unitsPerBundle} x ${Number(selectedChild?.costUsd || 0).toFixed(2)} = <strong className="text-slate-800">${calculatedBundleCost.toFixed(2)} USD</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700 block text-xs">Identificador en POS:</span>
                  <span className="font-mono font-bold text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md inline-block mt-0.5">
                    {bundleSku || 'BUL-...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================== MODO COMBO ============================== */}
          {creationMode === 'COMBO' && (
            <div className="space-y-5">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  1. Identificación del Combo Promocional
                </label>

                {/* Fila 1: Nombre y SKU */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  <div className="md:col-span-7 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Nombre del Combo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Combo Desayuno Criollo"
                      value={comboName}
                      onChange={(e) => {
                        setComboName(e.target.value);
                        if (!comboSku) {
                          const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 12).toUpperCase();
                          setComboSku(`CMB-${clean}`);
                        }
                      }}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div className="md:col-span-5 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Código SKU (Prefijo CMB-) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="CMB-DESAYUNO"
                        value={comboSku}
                        onChange={(e) => setComboSku(e.target.value.toUpperCase())}
                        className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Fila 2: Precio Combo y Stock Inicial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Precio de Venta del Combo ($) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={comboPriceUsd}
                      onChange={(e) => setComboPriceUsd(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Stock Inicial de Combos
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={comboInitialStock}
                      onChange={(e) => setComboInitialStock(parseInt(e.target.value, 10) || 0)}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Agregar Artículos al Combo */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Artículos que Integran el Combo
                </label>
                
                {/* Selector alineado en altura h-10 */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Buscar Producto a Integrar</label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                        value={searchComboProduct}
                        onChange={(e) => setSearchComboProduct(e.target.value)}
                      />
                      {searchComboProduct && (
                        <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1">
                          {filteredComboProducts.slice(0, 5).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedComboItemChildId(p.id);
                                setSearchComboProduct(`${p.name} (${p.sku})`);
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-emerald-50 flex justify-between items-center transition-all cursor-pointer group"
                            >
                              <span className="font-semibold text-slate-800 group-hover:text-emerald-900 truncate">{p.name}</span>
                              <span className="font-mono text-slate-400 text-[11px] ml-2 shrink-0">{p.sku} • Costo: ${Number(p.costUsd || 0).toFixed(2)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 text-center">Cantidad</label>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={comboItemQty}
                      onChange={(e) => setComboItemQty(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddComboItem}
                      disabled={!selectedComboItemChildId}
                      className="w-full h-10 flex items-center justify-center gap-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-all disabled:opacity-40 cursor-pointer active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>

                {/* Lista de productos agregados al combo */}
                {comboItems.length > 0 && (
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white mt-3 shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-3.5 py-2.5">Artículo</th>
                          <th className="px-3.5 py-2.5 text-center">Cant.</th>
                          <th className="px-3.5 py-2.5 text-right">Costo Subtotal</th>
                          <th className="px-3.5 py-2.5 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {comboItems.map(item => (
                          <tr key={item.childProductId} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5">
                              <span className="font-bold text-slate-900 block">{item.childName}</span>
                              <span className="font-mono text-[11px] text-slate-400">{item.childSku}</span>
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-mono font-bold text-emerald-700">
                              {item.quantity} un.
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-700">
                              ${(item.costUsd * item.quantity).toFixed(2)}
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveComboItem(item.childProductId)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Resumen de Costo del Combo */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                <span className="font-bold text-emerald-950">Costo Total de los Componentes:</span>
                <span className="font-mono font-black text-sm text-emerald-900">${calculatedComboCost.toFixed(2)} USD</span>
              </div>
            </div>
          )}

          {/* Footer Fijo */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-40"
            >
              {isSaving && <Loader2 className="animate-spin w-4 h-4" />}
              <span>{isSaving ? 'Guardando...' : creationMode === 'BUNDLE' ? 'Crear y Registrar Bulto' : 'Crear y Registrar Combo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
