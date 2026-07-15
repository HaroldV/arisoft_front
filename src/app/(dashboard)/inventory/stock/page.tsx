'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Tag,
  DollarSign,
  Percent,
  Layers,
  Scale,
  Calendar,
  MapPin,
  Shield,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

interface Product {
  id: string;
  sku: string;
  name: string;
  costUsd: number;
  priceUsd: number;
  taxRate: number;
  tax_type?: string;
  is_perishable?: boolean;
  has_batch_control?: boolean;
  current_stock: number;
  unit_of_measure?: string;
  category?: string;
  category_id?: string | null;
  variations?: any[];
  advanced_fields?: any;
}

interface Variation {
  name: string;
  quantity: number;
  sku?: string;
  unit_cost?: number;
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    costUsd: 0,
    priceUsd: 0,
    taxRate: 16.00,
    category: 'General',
    categoryId: '',
    unitOfMeasure: 'unidades',
  });

  // Categories list and selection
  const [categories, setCategories] = useState<{ id: string; name: string; tenant_id: string | null; code: string | null }[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<{ id: string; name: string; tenant_id: string | null; code: string | null }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCategoriesList = async () => {
    try {
      const response = await apiClient.get('/inventory/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategoriesList();
  }, []);

  // Close dropdown on outside click
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

  const handleSelectCategory = (cat: { id: string; name: string }) => {
    setEditForm(prev => ({ ...prev, category: cat.name, categoryId: cat.id }));
    setShowDropdown(false);
  };
  
  // Variations & Advanced in Edit Modal
  const [editVariations, setEditVariations] = useState<Variation[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [advancedFields, setAdvancedFields] = useState({
    expiration_date: '',
    location: '',
    security_stock: 0,
    description: '',
  });

  const [varForm, setVarForm] = useState({
    name: '',
    quantity: 0,
    sku: '',
    unit_cost: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/inventory/products', {
        params: query ? { name: query } : {}
      });
      setProducts(response.data);
    } catch (err: any) {
      setError('Error al cargar la lista de stock. Por favor reintenta.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(search);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      costUsd: product.costUsd || 0,
      priceUsd: product.priceUsd || 0,
      taxRate: product.taxRate || 16.00,
      category: product.category || 'General',
      categoryId: product.category_id || '',
      unitOfMeasure: product.unit_of_measure || 'unidades',
    });
    setEditVariations(product.variations || []);
    setAdvancedFields({
      expiration_date: product.advanced_fields?.expiration_date || '',
      location: product.advanced_fields?.location || '',
      security_stock: product.advanced_fields?.security_stock || 0,
      description: product.advanced_fields?.description || '',
    });
    setShowAdvanced(false);
    setShowVariations(false);
    setEditError(null);
    setEditSuccess(false);
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
    if (!editingProduct) return;
    setIsSaving(true);
    setEditError(null);
    setEditSuccess(false);

    try {
      const advanced = {
        expiration_date: advancedFields.expiration_date || undefined,
        location: advancedFields.location.trim() || undefined,
        security_stock: Number(advancedFields.security_stock) || undefined,
        description: advancedFields.description.trim() || undefined,
      };

      await apiClient.patch(`/inventory/products/${editingProduct.id}`, {
        name: editForm.name.trim(),
        costUsd: Number(editForm.costUsd),
        priceUsd: Number(editForm.priceUsd),
        taxRate: Number(editForm.taxRate),
        category: editForm.categoryId ? undefined : editForm.category.trim(),
        categoryId: editForm.categoryId || undefined,
        unitOfMeasure: editForm.unitOfMeasure.trim(),
        variations: editVariations,
        advancedFields: Object.values(advanced).some(v => v !== undefined) ? advanced : null,
      });

      setEditSuccess(true);
      setTimeout(() => {
        setEditingProduct(null);
        fetchProducts(search);
      }, 1000);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setEditError(
          Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
        );
      } else {
        setEditError('Error al actualizar el producto.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/inventory/products/${deletingId}`);
      setProducts(prev => prev.filter(p => p.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('No se pudo desactivar el producto. Es posible que tenga transacciones vigentes en el POS.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock > 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {stock} un
        </span>
      );
    }
    if (stock > 0 && stock <= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          {stock} un (Crítico)
        </span>
      );
    }
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
          <XCircle className="h-3.5 w-3.5 text-rose-500" />
          Sin Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-100">
        {stock} un
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Listado de Productos</h1>
          <p className="text-slate-500">Listado de todos los productos creados con sus niveles de stock y valoración en tiempo real.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950">Acción rechazada</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU o Nombre..."
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading && products.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Cargando inventario...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Package className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No se encontraron productos</p>
            <p className="text-xs text-slate-400">Intenta buscando por otro término o registra nuevos productos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">SKU</th>
                  <th className="py-4 px-6">Nombre</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6">Medida</th>
                  <th className="py-4 px-6">Costo (USD)</th>
                  <th className="py-4 px-6">Precio (USD)</th>
                  <th className="py-4 px-6">IVA</th>
                  <th className="py-4 px-6">Stock Disponible</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">{product.sku}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{product.name}</td>
                    <td className="py-4 px-6 text-slate-500">{product.category || 'General'}</td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">{product.unit_of_measure || 'unidades'}</td>
                    <td className="py-4 px-6 font-medium">${Number(product.costUsd || 0).toFixed(2)}</td>
                    <td className="py-4 px-6 font-semibold text-primary-600">${Number(product.priceUsd || 0).toFixed(2)}</td>
                    <td className="py-4 px-6">
                      {product.tax_type === 'EXEMPT' ? (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded">Exento</span>
                      ) : product.tax_type === 'EXONERATED' ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-semibold px-2 py-0.5 rounded">Exonerado</span>
                      ) : (
                        <span className="text-slate-700 font-mono text-xs">{product.taxRate || 16}%</span>
                      )}
                    </td>
                    <td className="py-4 px-6">{getStockBadge(product.current_stock || 0)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar Metadatos"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Desactivar Producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl border border-slate-100 my-8 animate-in scale-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900">Editar Producto ({editingProduct.sku})</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {editSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-sm">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>¡Datos del producto actualizados!</span>
                </div>
              )}

              {editError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Nombre del Producto</label>
                  <div className="relative">
                    <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Categoría</label>
                  <div className="relative">
                    <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      className="block w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      value={editForm.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      onFocus={() => {
                        setFilteredCategories(editForm.category.trim() ? categories.filter(c => c.name.toLowerCase().includes(editForm.category.toLowerCase())) : categories);
                        setShowDropdown(true);
                      }}
                    />
                    {editForm.categoryId && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-medium">
                        Vínculo
                      </span>
                    )}
                  </div>
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {filteredCategories.length === 0 ? (
                        <div 
                          className="px-4 py-3 text-xs text-slate-500 cursor-pointer hover:bg-slate-50"
                          onClick={() => setShowDropdown(false)}
                        >
                          No se encontraron coincidencias. Se creará <span className="font-semibold text-slate-700">"{editForm.category}"</span> al guardar.
                        </div>
                      ) : (
                        filteredCategories.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCategory(c)}
                            className="flex justify-between items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">{c.name}</span>
                              {c.code && (
                                <span className="text-[10px] font-mono text-slate-400">CAEV: {c.code}</span>
                              )}
                            </div>
                            {c.tenant_id === null ? (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                                Global
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">
                                Propia
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Unidad de Medida</label>
                  <div className="relative">
                    <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <select
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none bg-white"
                      value={editForm.unitOfMeasure}
                      onChange={(e) => setEditForm({ ...editForm, unitOfMeasure: e.target.value })}
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

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Tasa IVA (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <select
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none bg-white"
                      value={editForm.taxRate}
                      onChange={(e) => setEditForm({ ...editForm, taxRate: Number(e.target.value) })}
                    >
                      <option value={16.00}>16% (General)</option>
                      <option value={8.00}>8% (Reducido)</option>
                      <option value={0.00}>0% (Exento)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Costo Base (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      value={editForm.costUsd}
                      onChange={(e) => setEditForm({ ...editForm, costUsd: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Precio de Venta (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      value={editForm.priceUsd}
                      onChange={(e) => setEditForm({ ...editForm, priceUsd: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Collapsible Variations Subform */}
              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVariations(!showVariations)}
                  className="flex items-center justify-between w-full py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-slate-900 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span>Variaciones de Producto (Opcional)</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      editVariations.length > 0
                        ? 'bg-primary-50 text-primary-700 border border-primary-100'
                        : 'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}>
                      {editVariations.length === 1 ? '1 variación' : `${editVariations.length} variaciones`}
                    </span>
                  </div>
                  {showVariations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showVariations && (
                  <div className="space-y-3 mt-2 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          placeholder="Variación"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                          value={varForm.name}
                          onChange={(e) => setVarForm({ ...varForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Stock"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-right"
                          value={varForm.quantity || ''}
                          onChange={(e) => setVarForm({ ...varForm, quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Costo"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-right"
                          value={varForm.unit_cost || ''}
                          onChange={(e) => setVarForm({ ...varForm, unit_cost: Number(e.target.value) })}
                        />
                      </div>
                      <div className="md:col-span-4 flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="SKU específico (opcional)"
                          className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-white"
                          value={varForm.sku}
                          onChange={(e) => setVarForm({ ...varForm, sku: e.target.value.toUpperCase() })}
                        />
                        <button
                          type="button"
                          onClick={handleAddVariation}
                          disabled={!varForm.name.trim()}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>

                    {editVariations.length > 0 && (
                      <div className="border border-slate-200 bg-white rounded-xl overflow-hidden text-xs max-h-36 overflow-y-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                            <tr>
                              <th className="py-2 px-3">Variación</th>
                              <th className="py-2 px-3">SKU</th>
                              <th className="py-2 px-3 text-right">Stock</th>
                              <th className="py-2 px-3 text-right">Costo</th>
                              <th className="py-2 px-3 text-right"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {editVariations.map((v, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-bold">{v.name}</td>
                                <td className="py-2 px-3 font-mono text-slate-500">{v.sku || '-'}</td>
                                <td className="py-2 px-3 text-right">{v.quantity}</td>
                                <td className="py-2 px-3 text-right">{v.unit_cost ? `$${Number(v.unit_cost).toFixed(2)}` : '-'}</td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariation(idx)}
                                    className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Collapsible Advanced Info */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full py-2 text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-slate-900 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span>Información Avanzada / Lote (Opcional)</span>
                    {Object.values(advancedFields).some(v => v !== '' && v !== 0) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Configurado
                      </span>
                    )}
                  </div>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-slate-50 border border-slate-100 rounded-xl animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha de Expiración</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                          value={advancedFields.expiration_date ? advancedFields.expiration_date.substring(0, 10) : ''}
                          onChange={(e) => setAdvancedFields({ ...advancedFields, expiration_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ubicación física</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                          value={advancedFields.location}
                          onChange={(e) => setAdvancedFields({ ...advancedFields, location: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stock de Seguridad</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-right"
                          value={advancedFields.security_stock || ''}
                          onChange={(e) => setAdvancedFields({ ...advancedFields, security_stock: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notas del Producto</label>
                      <textarea
                        rows={2}
                        className="block w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white resize-none"
                        value={advancedFields.description}
                        onChange={(e) => setAdvancedFields({ ...advancedFields, description: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-75 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all cursor-pointer"
                >
                  {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 mt-0.5 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">¿Desactivar producto?</h3>
                <p className="text-xs text-slate-500">
                  Esta acción realizará un borrado lógico (soft delete). El producto no estará disponible para ventas en el POS. Solo se permite si el producto no tiene historial de movimientos activos.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {isDeleting && <Loader2 className="animate-spin h-4 w-4" />}
                Confirmar Desactivación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
