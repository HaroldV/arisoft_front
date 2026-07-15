'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  Tag, 
  DollarSign, 
  Percent, 
  BarChart,
  Layers,
  Scale,
  Calendar,
  MapPin,
  Shield,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

interface Variation {
  name: string;
  quantity: number;
  sku?: string;
  unit_cost?: number;
}

export const ProductForm: React.FC = () => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    costUsd: 0,
    priceUsd: 0,
    taxRate: 16.00,
    initialStock: 0,
    unitOfMeasure: 'unidades',
    category: 'General',
    categoryId: '',
  });

  const [taxType, setTaxType] = useState('TAXABLE');
  const [isPerishable, setIsPerishable] = useState(false);
  const [hasBatchControl, setHasBatchControl] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedSubLocationId, setSelectedSubLocationId] = useState('');

  interface LocationNode {
    id: string;
    name: string;
    type: string;
    children?: LocationNode[];
  }
  const [locations, setLocations] = useState<LocationNode[]>([]);

  // Helper to build a flat list with indentation from hierarchical tree
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

  const fetchLocationsList = async () => {
    try {
      const response = await apiClient.get('/inventory/warehouse-locations/tree');
      setLocations(response.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  useEffect(() => {
    fetchCategoriesList();
    fetchLocationsList();
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
    setFormData(prev => ({ ...prev, category: val, categoryId: '' }));
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
    setFormData(prev => ({ ...prev, category: cat.name, categoryId: cat.id }));
    setShowDropdown(false);
  };

  // Advanced fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFields, setAdvancedFields] = useState({
    expiration_date: '',
    location: '',
    security_stock: 0,
    description: '',
  });

  // Variations list
  const [showVariations, setShowVariations] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [varForm, setVarForm] = useState({
    name: '',
    quantity: 0,
    sku: '',
    unit_cost: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddVariation = () => {
    if (!varForm.name.trim()) return;
    setVariations([
      ...variations,
      {
        name: varForm.name.trim(),
        quantity: Number(varForm.quantity) || 0,
        sku: varForm.sku.trim() || undefined,
        unit_cost: varForm.unit_cost ? Number(varForm.unit_cost) : undefined,
      }
    ]);
    setVarForm({
      name: '',
      quantity: 0,
      sku: '',
      unit_cost: 0,
    });
  };

  const handleRemoveVariation = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const advanced = {
        expiration_date: advancedFields.expiration_date || undefined,
        location: advancedFields.location.trim() || undefined,
        security_stock: Number(advancedFields.security_stock) || undefined,
        description: advancedFields.description.trim() || undefined,
      };

      await apiClient.post('/inventory/products', [{
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        costUsd: Number(formData.costUsd),
        priceUsd: Number(formData.priceUsd),
        taxRate: Number(formData.taxRate),
        taxType: taxType,
        isPerishable: isPerishable,
        hasBatchControl: hasBatchControl,
        batchNumber: undefined,
        productionDate: undefined,
        expirationDate: undefined,
        locationId: undefined,
        initialStock: 0,
        unitOfMeasure: formData.unitOfMeasure.trim(),
        category: formData.categoryId ? undefined : formData.category.trim(),
        categoryId: formData.categoryId || undefined,
        variations: variations.length > 0 ? variations : undefined,
        advancedFields: Object.values(advanced).some(v => v !== undefined) ? advanced : undefined,
      }]);

      setSuccess(true);
      setFormData({
        sku: '',
        name: '',
        costUsd: 0,
        priceUsd: 0,
        taxRate: 16.00,
        initialStock: 0,
        unitOfMeasure: 'unidades',
        category: 'General',
        categoryId: '',
      });
      setTaxType('TAXABLE');
      setIsPerishable(false);
      setHasBatchControl(false);
      setBatchNumber('');
      setProductionDate('');
      setExpirationDate('');
      setSelectedWarehouseId('');
      setSelectedSubLocationId('');
      fetchCategoriesList();
      fetchLocationsList();
      setVariations([]);
      setAdvancedFields({
        expiration_date: '',
        location: '',
        security_stock: 0,
        description: '',
      });
      setShowAdvanced(false);
      setShowVariations(false);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(
          Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
        );
      } else {
        setError('Ocurrió un error al registrar el producto. Verifica tu conexión.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary-50 rounded-xl">
          <Package className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Registrar Producto Individual</h3>
          <p className="text-xs text-slate-500">Carga un nuevo artículo al catálogo con su stock inicial.</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-950">¡Producto Registrado!</p>
            <p className="text-xs text-emerald-700 mt-0.5">El producto y su movimiento de stock de apertura fueron guardados con éxito.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-950">Error al guardar</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">SKU (Código Único)</label>
          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Ej. HAR-PAN-01"
              className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Nombre del Producto</label>
          <div className="relative">
            <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Ej. Harina Pan 1kg"
              className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Categoría</label>
          <div className="relative">
            <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Ej. Alimentos, Bebidas..."
              className="block w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              onFocus={() => {
                setFilteredCategories(formData.category.trim() ? categories.filter(c => c.name.toLowerCase().includes(formData.category.toLowerCase())) : categories);
                setShowDropdown(true);
              }}
            />
            {formData.categoryId && (
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
                  No se encontraron coincidencias. Se creará <span className="font-semibold text-slate-700">"{formData.category}"</span> al guardar.
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
              value={formData.unitOfMeasure}
              onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Costo Base (USD)</label>
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              min="0"
              className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              value={formData.costUsd || ''}
              onChange={(e) => setFormData({ ...formData, costUsd: Number(e.target.value) })}
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
              placeholder="0.00"
              min="0"
              className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              value={formData.priceUsd || ''}
              onChange={(e) => setFormData({ ...formData, priceUsd: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Clasificación Fiscal</label>
          <div className="relative">
            <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <select
              className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none bg-white font-medium"
              value={taxType}
              onChange={(e) => {
                const val = e.target.value;
                setTaxType(val);
                if (val !== 'TAXABLE') {
                  setFormData(prev => ({ ...prev, taxRate: 0.00 }));
                } else {
                  setFormData(prev => ({ ...prev, taxRate: 16.00 }));
                }
              }}
            >
              <option value="TAXABLE">Gravable (General/Reducido)</option>
              <option value="EXEMPT">Exento (De Ley)</option>
              <option value="EXONERATED">Exonerado (Especial)</option>
            </select>
          </div>
        </div>

        {taxType === 'TAXABLE' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Tasa IVA (%)</label>
            <div className="relative">
              <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <select
                className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none bg-white"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
              >
                <option value={16.00}>16% (General)</option>
                <option value={8.00}>8% (Reducido)</option>
              </select>
            </div>
          </div>
        )}

        <div className="md:col-span-2 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 text-indigo-800 text-xs my-1">
          <AlertCircle className="h-5 w-5 shrink-0 text-indigo-500 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold text-indigo-950">Cumplimiento de Auditoría WMS</p>
            <p className="leading-relaxed">
              El stock inicial del producto se registrará en cero (0) de manera predeterminada. Para valorizar existencias e ingresar stock físico a las ubicaciones del almacén, asocie este producto a un registro de compra oficial en la sección de <a href="/inventory/purchases/new" className="font-bold underline text-indigo-700 hover:text-indigo-900">Registrar Compra</a>.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPerishable"
              checked={isPerishable}
              onChange={(e) => {
                setIsPerishable(e.target.checked);
                if (e.target.checked) setHasBatchControl(true);
              }}
              className="w-4 h-4 rounded text-primary-600 bg-slate-50 border-slate-200 focus:ring-primary-500 cursor-pointer"
            />
            <label htmlFor="isPerishable" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
              ¿Es Producto Perecedero?
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasBatchControl"
              checked={hasBatchControl}
              onChange={(e) => {
                if (!isPerishable) setHasBatchControl(e.target.checked);
              }}
              disabled={isPerishable}
              className="w-4 h-4 rounded text-primary-600 bg-slate-50 border-slate-200 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
            />
            <label htmlFor="hasBatchControl" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
              ¿Maneja Control de Lotes?
            </label>
          </div>
        </div>



        {/* Section: Collapsible Variations */}
        <div className="md:col-span-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowVariations(!showVariations)}
            className="flex items-center justify-between w-full py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span>Variaciones del Producto (Opcional)</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                variations.length > 0
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                {variations.length === 1 ? '1 variación' : `${variations.length} variaciones`}
              </span>
            </div>
            {showVariations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showVariations && (
            <div className="space-y-4 mt-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl animate-in fade-in duration-200">
              <p className="text-[11px] text-slate-400">Agrega atributos que comparten el mismo precio de venta pero tienen existencias y costos propios.</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Variación (ej: Color Azul, Talla M)</label>
                  <input
                    type="text"
                    placeholder="Nombre de la variación"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    value={varForm.name}
                    onChange={(e) => setVarForm({ ...varForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-right"
                    value={varForm.quantity || ''}
                    onChange={(e) => setVarForm({ ...varForm, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Costo Unit. (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-right"
                    value={varForm.unit_cost || ''}
                    onChange={(e) => setVarForm({ ...varForm, unit_cost: Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-4 flex justify-between items-center gap-3">
                  <input
                    type="text"
                    placeholder="SKU específico de la variación (opcional)"
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    value={varForm.sku}
                    onChange={(e) => setVarForm({ ...varForm, sku: e.target.value.toUpperCase() })}
                  />
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    disabled={!varForm.name.trim()}
                    className="flex items-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar Variación
                  </button>
                </div>
              </div>

              {/* Variations Table List */}
              {variations.length > 0 && (
                <div className="border border-slate-200 bg-white rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                        <th className="py-2.5 px-4">Variación</th>
                        <th className="py-2.5 px-4">SKU</th>
                        <th className="py-2.5 px-4 text-right">Stock</th>
                        <th className="py-2.5 px-4 text-right">Costo</th>
                        <th className="py-2.5 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {variations.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold">{v.name}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{v.sku || '-'}</td>
                          <td className="py-2.5 px-4 text-right">{v.quantity}</td>
                          <td className="py-2.5 px-4 text-right">{v.unit_cost ? `$${Number(v.unit_cost).toFixed(2)}` : '-'}</td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariation(i)}
                              className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        {/* Section: Collapsible Advanced Fields */}
        <div className="md:col-span-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span>Información Avanzada / Lotes (Opcional)</span>
              {Object.values(advancedFields).some(v => v !== '' && v !== 0) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Configurado
                </span>
              )}
            </div>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Fecha de Expiración</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                    value={advancedFields.expiration_date}
                    onChange={(e) => setAdvancedFields({ ...advancedFields, expiration_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Ubicación en Bodega</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ej. Pasillo A, Estante 3"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                    value={advancedFields.location}
                    onChange={(e) => setAdvancedFields({ ...advancedFields, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Stock de Seguridad (Mínimo)</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-right"
                    value={advancedFields.security_stock || ''}
                    onChange={(e) => setAdvancedFields({ ...advancedFields, security_stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Notas / Descripción Avanzada</label>
                <textarea
                  rows={2}
                  placeholder="Información adicional relevante del producto..."
                  className="block w-full p-3 border border-slate-200 rounded-xl text-xs bg-white resize-none"
                  value={advancedFields.description}
                  onChange={(e) => setAdvancedFields({ ...advancedFields, description: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3.5 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-700 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-primary-600/10 hover:shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4.5 w-4.5" />
                Registrando...
              </>
            ) : (
              'Guardar e Inicializar Stock'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
