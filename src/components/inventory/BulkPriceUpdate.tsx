'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  Percent,
  RefreshCw,
  Sliders,
  Package
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { CurrencyInput } from '@/components/CurrencyInput';

interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string;
  category_id?: string;
  costUsd: number;
  priceUsd: number;
}

export function BulkPriceUpdate() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Adjustment Controls
  const [mode, setMode] = useState<'MARGIN' | 'PERCENTAGE_INCREASE' | 'FIXED_PRICE'>('MARGIN');
  const [value, setValue] = useState<number>(30); // 30% margin default
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/inventory/products');
      const data = res.data || [];
      setProducts(data);
      setSelectedProductIds(data.map((p: any) => p.id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(i => i !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const calculateProjectedPrice = (product: Product): number => {
    const cost = Number(product.costUsd || 0);
    const currentPrice = Number(product.priceUsd || 0);

    if (mode === 'MARGIN') {
      return cost * (1 + value / 100);
    } else if (mode === 'PERCENTAGE_INCREASE') {
      return currentPrice * (1 + value / 100);
    } else if (mode === 'FIXED_PRICE') {
      return value;
    }
    return currentPrice;
  };

  const handleApply = async () => {
    if (selectedProductIds.length === 0) {
      setError('Selecciona al menos un producto para actualizar');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiClient.post('/purchases/products/bulk-update-prices', {
        productIds: selectedProductIds,
        mode,
        value,
      });

      setSuccess(`¡Se actualizaron exitosamente los precios de ${res.data.updatedCount} productos!`);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar precios');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Actualización Masiva de Precios</h1>
            <p className="text-xs text-slate-500">Recálculo automático de precios de venta por % de Margen de Utilidad sobre Costo o Incremento Masivo</p>
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={isSaving || selectedProductIds.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all cursor-pointer text-sm shadow-xs disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Aplicar Precios a {selectedProductIds.length} Productos</span>
        </button>
      </div>

      {/* Control Panel Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Configuración del Ajuste de Precios</span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Modalidad de Recálculo</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              value={mode}
              onChange={(e: any) => setMode(e.target.value)}
            >
              <option value="MARGIN">📈 Margen de Ganancia sobre Costo (%)</option>
              <option value="PERCENTAGE_INCREASE">🚀 Incremento Porcentual Masivo (+%)</option>
              <option value="FIXED_PRICE">💵 Precio Fijo Único (USD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              {mode === 'MARGIN' ? 'Porcentaje de Margen (% sobre Costo)' : mode === 'PERCENTAGE_INCREASE' ? 'Porcentaje de Incremento (%)' : 'Precio Fijo USD ($)'}
            </label>
            <CurrencyInput
              value={value}
              onChange={(val) => setValue(val)}
              placeholder="0.00"
              currencyPrefix={mode === 'FIXED_PRICE' ? '$' : '%'}
              icon={mode === 'FIXED_PRICE' ? DollarSign : Percent}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Filtrar por Categoría</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Preview Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Simulador de Precios Proyectados (Live Preview)
          </span>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto o SKU..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-medium text-slate-500">Cargando simulador...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Package className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No se encontraron productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="py-4 px-4">SKU</th>
                  <th className="py-4 px-6">Producto</th>
                  <th className="py-4 px-6 text-right">Costo Actual</th>
                  <th className="py-4 px-6 text-right">Precio Actual</th>
                  <th className="py-4 px-6 text-right">Margen Actual</th>
                  <th className="py-4 px-6 text-right text-indigo-600 font-bold bg-indigo-50/30">Precio Proyectado USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const cost = Number(p.costUsd || 0);
                  const currentPrice = Number(p.priceUsd || 0);
                  const currentMargin = cost > 0 ? (((currentPrice - cost) / cost) * 100).toFixed(1) : '0';
                  const projectedPrice = calculateProjectedPrice(p);

                  return (
                    <tr key={p.id} className={isSelected ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'}>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={isSelected}
                          onChange={() => handleToggleProduct(p.id)}
                        />
                      </td>
                      <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">{p.sku}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">{p.name}</td>
                      <td className="py-4 px-6 text-right font-mono text-xs">${cost.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-mono text-xs">${currentPrice.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-mono text-xs text-slate-500">{currentMargin}%</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-indigo-700 bg-indigo-50/40 text-base">
                        ${projectedPrice.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
