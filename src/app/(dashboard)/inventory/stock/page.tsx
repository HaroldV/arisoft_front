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
  ChevronUp,
  Upload,
  User,
  Clock
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { ActionTooltip } from '@/components/ActionTooltip';

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
  image_url?: string;
  imageUrl?: string;
  created_by_user_name?: string;
  updated_by_user_name?: string;
  created_at?: string;
  updated_at?: string;
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
    imageUrl: '',
    costUsd: 0,
    priceUsd: 0,
    taxRate: 16.00,
    category: 'General',
    categoryId: '',
    unitOfMeasure: 'unidades',
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const compressAndGetBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxWidth = 800;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB (Estándar óptimo para catálogo ERP/Web)
    if (file.size > MAX_SIZE_BYTES) {
      setImageError(`⚠️ El archivo seleccionado (${(file.size / (1024 * 1024)).toFixed(1)} MB) supera el tamaño óptimo permitido de 2 MB.`);
      return;
    }

    setImageError(null);
    setIsUploadingImage(true);
    try {
      const base64 = await compressAndGetBase64(file);
      const res = await apiClient.post('/inventory/products/upload-image', {
        image_base64: base64,
        filename: file.name,
        category_name: editForm.category || 'General',
      });
      if (res.data?.url) {
        setEditForm((prev) => ({ ...prev, imageUrl: res.data.url }));
      }
    } catch (err: any) {
      setImageError('Error al procesar la imagen.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Categories list and selection
  const [categories, setCategories] = useState<{ id: string; name: string; tenant_id: string | null; code: string | null }[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<{ id: string; name: string; tenant_id: string | null; code: string | null }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCategoriesList = async () => {
    try {
      const response = await apiClient.get('/inventory/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
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
      const productList: Product[] = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      setProducts(productList);
    } catch (err: any) {
      console.error('Error fetching stock products:', err);
      setError(err.response?.data?.message || 'Error al cargar la lista de stock. Por favor reintenta.');
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
      imageUrl: product.image_url || product.imageUrl || '',
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
        imageUrl: editForm.imageUrl.trim() || undefined,
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
                {products.map((product) => {
                  const rawUrl = product.image_url || product.imageUrl;
                  const resolvedUrl = rawUrl
                    ? (rawUrl.startsWith('http') || rawUrl.startsWith('data:') ? rawUrl : `http://localhost:4000${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`)
                    : null;

                  const n = (product.name || '').toLowerCase();
                  const sampleImg = n.includes('papel') || n.includes('resma') ? 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop'
                    : n.includes('tinta') || n.includes('cartucho') || n.includes('hp') ? 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&auto=format&fit=crop'
                    : n.includes('boligrafo') || n.includes('marcador') || n.includes('solita') ? 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop'
                    : n.includes('harina') || n.includes('pan') ? 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop'
                    : n.includes('cafe') || n.includes('bebida') ? 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop'
                    : n.includes('rif') || n.includes('documento') ? 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&auto=format&fit=crop'
                    : 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop';

                  const imgUrl = resolvedUrl || sampleImg;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">{product.sku}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-xs"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          {product.created_by_user_name && (
                            <p className="text-[10px] text-slate-400 font-normal">
                              Reg: {product.created_by_user_name}
                            </p>
                          )}
                        </div>
                      </td>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionTooltip content="Editar producto">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip content="Desactivar producto">
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal (Sally Enterprise UX Standard) */}
      {editingProduct && (
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
                      {editingProduct.sku}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Catálogo de Inventario • Parámetros de Precio, Costo y Variantes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
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

                  {/* Image Uploader & Preview */}
                  <div className="md:col-span-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Imagen y Miniatura del Producto
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">JPG, PNG, WebP (Máx 2 MB)</span>
                    </div>

                    {imageError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between text-rose-700 text-xs animate-in fade-in duration-200">
                        <span>{imageError}</span>
                        <button type="button" onClick={() => setImageError(null)} className="text-rose-400 hover:text-rose-600 font-bold">
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3 items-center">
                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 shadow-2xs hover:shadow-xs">
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span>{isUploadingImage ? 'Subiendo...' : 'Subir desde PC'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingImage}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="O pega URL de imagen (https://...)"
                        className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        value={editForm.imageUrl}
                        onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                      />
                      {editForm.imageUrl && (
                        <div className="w-11 h-11 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-white flex items-center justify-center shadow-2xs">
                          <img
                            src={editForm.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Values Grid (Cost and Price) */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/50 border border-indigo-100/80 rounded-2xl shadow-2xs space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Costo Unitario ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="block w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm sm:text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={editForm.costUsd}
                        onChange={(e) => setEditForm({ ...editForm, costUsd: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/50 border border-emerald-100/80 rounded-2xl shadow-2xs space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Precio de Venta Sugerido ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-emerald-600" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="block w-full pl-11 pr-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl font-mono text-sm sm:text-base font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        editVariations.length > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {editVariations.length === 1 ? '1 variación' : `${editVariations.length} variaciones`}
                      </span>
                    </div>
                    {showVariations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showVariations && (
                    <div className="space-y-3 mt-2 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Nombre de la variación (ej. Talla L / Color Azul)"
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-medium"
                            value={varForm.name}
                            onChange={(e) => setVarForm({ ...varForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Stock"
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono font-bold text-right"
                            value={varForm.quantity || ''}
                            onChange={(e) => setVarForm({ ...varForm, quantity: Number(e.target.value) })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Costo $"
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono font-bold text-right"
                            value={varForm.unit_cost || ''}
                            onChange={(e) => setVarForm({ ...varForm, unit_cost: Number(e.target.value) })}
                          />
                        </div>
                        <div className="md:col-span-4 flex items-center justify-between gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="SKU específico de la variante (opcional)"
                            className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono font-semibold"
                            value={varForm.sku}
                            onChange={(e) => setVarForm({ ...varForm, sku: e.target.value.toUpperCase() })}
                          />
                          <button
                            type="button"
                            onClick={handleAddVariation}
                            disabled={!varForm.name.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                          >
                            Agregar Variante
                          </button>
                        </div>
                      </div>

                      {editVariations.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {editVariations.map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl text-xs shadow-2xs">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900">{v.name}</span>
                                <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{v.sku || 'SKU Auto'}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs">
                                  {v.quantity} unids
                                </span>
                                <span className="font-mono font-bold text-slate-800">${Number(v.unit_cost).toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariation(i)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Configurado
                        </span>
                      )}
                    </div>
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl animate-in fade-in duration-200 shadow-2xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha de Expiración</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="date"
                            className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            value={advancedFields.expiration_date ? advancedFields.expiration_date.substring(0, 10) : ''}
                            onChange={(e) => setAdvancedFields({ ...advancedFields, expiration_date: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ubicación física en Almacén</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Ej. Pasillo 3, Estante B"
                            className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                            value={advancedFields.location}
                            onChange={(e) => setAdvancedFields({ ...advancedFields, location: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stock de Seguridad Mínimo</label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="number"
                            min="0"
                            className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-right"
                            value={advancedFields.security_stock || ''}
                            onChange={(e) => setAdvancedFields({ ...advancedFields, security_stock: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notas del Producto</label>
                        <textarea
                          rows={2}
                          className="block w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs resize-none font-medium"
                          value={advancedFields.description}
                          onChange={(e) => setAdvancedFields({ ...advancedFields, description: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit Trail Info Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-600 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span><strong>Registrado por:</strong> {editingProduct.created_by_user_name || 'Sistema / Carga Masiva'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Última modificación por:</strong> {editingProduct.updated_by_user_name || 'Sin modificaciones'}</span>
                  </div>
                </div>
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Sally Enterprise UX Standard) */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-rose-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">¿Desactivar producto?</h3>
                  <p className="text-xs text-slate-500 font-medium">Borrado lógico y exclusión de catálogo POS</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta acción realizará un borrado lógico (soft delete). El producto no estará disponible para ventas en el POS ni para pedidos de compra. Solo se permite si el producto no tiene historial de movimientos activos pendientes.
              </p>
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-rose-200 cursor-pointer disabled:opacity-50"
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
