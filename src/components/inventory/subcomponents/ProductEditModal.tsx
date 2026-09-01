'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  X, 
  Layers, 
  DollarSign, 
  Percent, 
  Scale, 
  Calendar, 
  MapPin, 
  Shield, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { InventoryProduct, ProductCategoryOption, ProductVariation, AdvancedProductFields } from '../types/stock.types';

interface ProductEditModalProps {
  product: InventoryProduct;
  categories: ProductCategoryOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  categories,
  onClose,
  onSuccess,
}) => {
  const [editForm, setEditForm] = useState({
    name: product.name,
    imageUrl: product.image_url || product.imageUrl || '',
    costUsd: product.costUsd ?? 0,
    priceUsd: product.priceUsd ?? 0,
    taxRate: product.taxRate ?? 16.00,
    category: product.category ?? 'General',
    categoryId: product.category_id ?? '',
    unitOfMeasure: product.unit_of_measure ?? 'unidades',
  });

  const [editVariations, setEditVariations] = useState<ProductVariation[]>(product.variations ?? []);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVariations, setShowVariations] = useState(true);
  const [advancedFields, setAdvancedFields] = useState<AdvancedProductFields>({
    expiration_date: product.advanced_fields?.expiration_date ?? '',
    location: product.advanced_fields?.location ?? '',
    security_stock: product.advanced_fields?.security_stock ?? 0,
    description: product.advanced_fields?.description ?? '',
  });

  const [varForm, setVarForm] = useState({
    name: '',
    quantity: 0,
    sku: '',
    unit_cost: 0,
  });

  const [filteredCategories, setFilteredCategories] = useState<ProductCategoryOption[]>(categories);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCategoryChange = (val: string) => {
    setEditForm(prev => ({ ...prev, category: val, categoryId: '' }));
    if (val.trim()) {
      const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(val.toLowerCase()) ||
        (c.code && c.code.toLowerCase().includes(val.toLowerCase()))
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
    setShowDropdown(true);
  };

  const handleAddVariation = () => {
    if (!varForm.name.trim()) return;
    setEditVariations([
      ...editVariations,
      {
        name: varForm.name.trim(),
        quantity: Number(varForm.quantity) || 0,
        sku: varForm.sku.trim() || undefined,
        unit_cost: varForm.unit_cost ? Number(varForm.unit_cost) : undefined,
      }
    ]);
    setVarForm({ name: '', quantity: 0, sku: '', unit_cost: 0 });
  };

  const handleRemoveVariation = (idx: number) => {
    setEditVariations(editVariations.filter((_, i) => i !== idx));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setEditError(null);
    setEditSuccess(false);

    try {
      await apiClient.put(`/inventory/products/${product.id}`, {
        name: editForm.name,
        imageUrl: editForm.imageUrl || undefined,
        costUsd: Number(editForm.costUsd),
        priceUsd: Number(editForm.priceUsd),
        taxRate: Number(editForm.taxRate),
        categoryId: editForm.categoryId || undefined,
        unitOfMeasure: editForm.unitOfMeasure,
        variations: editVariations,
        advancedFields: advancedFields,
      });

      setEditSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Ficha y Edición de Producto
                </h3>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg">
                  {product.sku}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Catálogo de Inventario • Parámetros de Precio, Costo y Variantes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {editSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <span>¡Datos del producto actualizados exitosamente!</span>
              </div>
            )}

            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-xs sm:text-sm font-semibold">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            {/* Primary Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nombre Comercial del Producto <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="block w-full pl-11 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Categoría Asignada
                </label>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    className="block w-full pl-11 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={editForm.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    onFocus={() => {
                      setFilteredCategories(editForm.category.trim() ? categories.filter(c => c.name.toLowerCase().includes(editForm.category.toLowerCase())) : categories);
                      setShowDropdown(true);
                    }}
                  />
                  {editForm.categoryId && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] bg-indigo-50 border border-indigo-200/80 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                      Vinculada
                    </span>
                  )}
                </div>
                {showDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar p-1.5">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 rounded-xl text-xs font-semibold text-slate-800 transition-all flex items-center justify-between"
                          onClick={() => {
                            setEditForm({ ...editForm, category: c.name, categoryId: c.id });
                            setShowDropdown(false);
                          }}
                        >
                          <span>{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.code || 'CAEV'}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-400 text-center">No hay categorías que coincidan</div>
                    )}
                  </div>
                )}
              </div>

              {/* Cost, Price, VAT */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Costo Unitario (USD) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="block w-full pl-11 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
                    value={editForm.costUsd}
                    onChange={(e) => setEditForm({ ...editForm, costUsd: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Precio de Venta (USD) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-indigo-600" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="block w-full pl-11 pr-3.5 py-2.5 bg-indigo-50/40 focus:bg-white border border-indigo-200 rounded-xl text-sm font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
                    value={editForm.priceUsd}
                    onChange={(e) => setEditForm({ ...editForm, priceUsd: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tasa IVA (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <select
                    className="block w-full pl-11 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    value={editForm.taxRate}
                    onChange={(e) => setEditForm({ ...editForm, taxRate: parseFloat(e.target.value) })}
                  >
                    <option value={16.00}>16.00% (General)</option>
                    <option value={8.00}>8.00% (Reducido)</option>
                    <option value={0.00}>0.00% (Exento)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Unidad de Medida
                </label>
                <div className="relative">
                  <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    className="block w-full pl-11 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={editForm.unitOfMeasure}
                    onChange={(e) => setEditForm({ ...editForm, unitOfMeasure: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Collapsible Variations Section */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowVariations(!showVariations)}
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Variaciones y Presentaciones ({editVariations.length})</span>
                </div>
                {showVariations ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {showVariations && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Nombre variación (ej. 500g, Azul)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        value={varForm.name}
                        onChange={(e) => setVarForm({ ...varForm, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddVariation();
                          }
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        placeholder="Stock"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        value={varForm.quantity || ''}
                        onChange={(e) => setVarForm({ ...varForm, quantity: parseInt(e.target.value) || 0 })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddVariation();
                          }
                        }}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Costo ($)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                        value={varForm.unit_cost || ''}
                        onChange={(e) => setVarForm({ ...varForm, unit_cost: parseFloat(e.target.value) || 0 })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddVariation();
                          }
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddVariation}
                        disabled={!varForm.name.trim()}
                        className="w-full h-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>

                  {editVariations.length > 0 && (
                    <div className="space-y-1.5">
                      {editVariations.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{v.name}</span>
                            <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{v.quantity} un.</span>
                            {v.unit_cost !== undefined && v.unit_cost !== null && (
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded text-[11px]">
                                Costo: ${Number(v.unit_cost).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveVariation(i)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar variación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible Advanced Fields */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Configuraciones Avanzadas y Ubicación</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ubicación</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      value={advancedFields.location || ''}
                      onChange={(e) => setAdvancedFields({ ...advancedFields, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Stock de Seguridad</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      value={advancedFields.security_stock || 0}
                      onChange={(e) => setAdvancedFields({ ...advancedFields, security_stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Fijo */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
