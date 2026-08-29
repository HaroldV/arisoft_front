'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  PlusCircle, 
  Filter, 
  Search, 
  Calendar, 
  Package, 
  Warehouse, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ActionTooltip } from '@/components/ActionTooltip';

interface StockMove {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  cost_at_time: number;
  source_type?: string;
  source_id?: string;
  justification?: string;
  warehouse_location_id?: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface LocationNode {
  id: string;
  name: string;
  type: string;
  children?: LocationNode[];
}

export default function MovesPage() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ADJUSTMENT' | 'TRANSFER'>('ADJUSTMENT');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Form State
  const [formProductId, setFormProductId] = useState('');
  const [formQuantity, setFormQuantity] = useState<number | ''>('');
  const [formJustification, setFormJustification] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formSourceLocationId, setFormSourceLocationId] = useState('');
  const [formDestLocationId, setFormDestLocationId] = useState('');

  const fetchMoves = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProduct) params.append('product_id', selectedProduct);
      if (selectedType) params.append('type', selectedType);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get(`/inventory/moves?${params.toString()}`);
      setMoves(response.data || []);
    } catch (err) {
      console.error('Error fetching stock moves:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, selectedType, startDate, endDate]);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/inventory/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await apiClient.get('/inventory/warehouse-locations/tree');
      setLocations(res.data || []);
    } catch (err) {
      console.error('Error fetching warehouse locations:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  // Build flat hierarchical options list
  const buildHierarchicalOptions = (nodes: LocationNode[], level = 0): { id: string; name: string }[] => {
    let options: { id: string; name: string }[] = [];
    nodes.forEach(node => {
      options.push({
        id: node.id,
        name: `${'\u00A0\u00A0'.repeat(level)}${level > 0 ? '└─ ' : ''}${node.name}`,
      });
      if (node.children && node.children.length > 0) {
        options = options.concat(buildHierarchicalOptions(node.children, level + 1));
      }
    });
    return options;
  };

  const handleOpenModal = (tab: 'ADJUSTMENT' | 'TRANSFER') => {
    setActiveTab(tab);
    setFormProductId('');
    setFormQuantity('');
    setFormJustification('');
    setFormWarehouseId('');
    setFormSourceLocationId('');
    setFormDestLocationId('');
    setModalError(null);
    setModalSuccess(false);
    setIsModalOpen(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId) {
      setModalError('Seleccione un producto obligatoriamente.');
      return;
    }
    if (!formQuantity || Number(formQuantity) === 0) {
      setModalError('Ingrese una cantidad válida distinta de cero.');
      return;
    }
    if (!formJustification.trim()) {
      setModalError('Ingrese una justificación de mínimo 10 caracteres.');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      if (activeTab === 'ADJUSTMENT') {
        await apiClient.post('/inventory/moves/adjustment', {
          product_id: formProductId,
          type: 'ADJUSTMENT',
          quantity: Number(formQuantity),
          justification: formJustification,
          warehouse_location_id: formWarehouseId || undefined,
        });
      } else {
        if (!formSourceLocationId || !formDestLocationId) {
          setModalError('Seleccione la ubicación de Origen y Destino para la transferencia.');
          setIsSaving(false);
          return;
        }
        await apiClient.post('/inventory/moves/transfer', {
          product_id: formProductId,
          quantity: Math.abs(Number(formQuantity)),
          source_location_id: formSourceLocationId,
          destination_location_id: formDestLocationId,
          justification: formJustification,
        });
      }

      setModalSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        fetchMoves();
      }, 1000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Error al procesar el movimiento de inventario.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMoves = moves.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const prodName = products.find(p => p.id === m.product_id)?.name.toLowerCase() || '';
    const justification = (m.justification || '').toLowerCase();
    return prodName.includes(q) || justification.includes(q) || m.type.toLowerCase().includes(q);
  });

  // Calculate totals
  const totalEntries = filteredMoves.filter(m => m.quantity > 0).reduce((acc, m) => acc + Number(m.quantity), 0);
  const totalExits = filteredMoves.filter(m => m.quantity < 0).reduce((acc, m) => acc + Math.abs(Number(m.quantity)), 0);

  const getMoveBadge = (type: string, qty: number) => {
    switch (type) {
      case 'INITIAL_LOAD':
        return <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded">Carga Inicial</span>;
      case 'PURCHASE':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded">Compra (+)</span>;
      case 'SALE':
        return <span className="bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold px-2.5 py-0.5 rounded">Venta (-)</span>;
      case 'TRANSFER':
        return <span className="bg-violet-50 text-violet-700 border border-violet-100 text-xs font-semibold px-2.5 py-0.5 rounded">Traslado ⇄</span>;
      case 'ADJUSTMENT':
      default:
        return qty >= 0 
          ? <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded">Ajuste Entrada (+)</span>
          : <span className="bg-orange-50 text-orange-700 border border-orange-100 text-xs font-semibold px-2.5 py-0.5 rounded">Ajuste Salida (-)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Movimientos de Inventario (Kardex)</h1>
            <p className="text-xs text-slate-500">Historial continuo de auditoría WMS, mermas, traslados y ajustes de existencias</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal('ADJUSTMENT')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Ajuste de Stock
          </button>
          <button
            onClick={() => handleOpenModal('TRANSFER')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transferencia Inter-Almacén
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registros</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{filteredMoves.length}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Entradas (+)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">+{totalEntries}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Salidas (-)</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">-{totalExits}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchableSelect
            icon={Package}
            value={selectedProduct}
            onChange={(val) => setSelectedProduct(val)}
            options={[
              { value: '', label: 'Todos los productos' },
              ...products.map(p => ({ value: p.id, label: p.name, sublabel: `SKU: ${p.sku}` }))
            ]}
            placeholder="Filtrar por producto..."
          />

          <SearchableSelect
            icon={Filter}
            value={selectedType}
            onChange={(val) => setSelectedType(val)}
            options={[
              { value: '', label: 'Todos los tipos' },
              { value: 'INITIAL_LOAD', label: 'Carga Inicial' },
              { value: 'PURCHASE', label: 'Compras (+)' },
              { value: 'SALE', label: 'Ventas (-)' },
              { value: 'ADJUSTMENT', label: 'Ajustes Manuales' },
              { value: 'TRANSFER', label: 'Transferencias ⇄' },
            ]}
            placeholder="Filtrar por tipo..."
          />

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por justificación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            onClick={() => {
              setSelectedProduct('');
              setSelectedType('');
              setStartDate('');
              setEndDate('');
              setSearchQuery('');
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Main Kardex Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Cargando Kardex de movimientos...</div>
        ) : filteredMoves.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No se encontraron movimientos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Fecha / Hora</th>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Tipo Movimiento</th>
                  <th className="py-3.5 px-4 text-right">Cantidad</th>
                  <th className="py-3.5 px-4 text-right">Costo Unit. (USD)</th>
                  <th className="py-3.5 px-4">Justificación / Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMoves.map((m) => {
                  const prod = products.find(p => p.id === m.product_id);
                  const isPositive = m.quantity >= 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        {new Date(m.created_at).toLocaleString('es-VE')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{prod?.name || 'Producto Desconocido'}</div>
                        <div className="font-mono text-[10px] text-slate-400">{prod?.sku}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getMoveBadge(m.type, m.quantity)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        ${Number(m.cost_at_time || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {m.justification || 'Sin justificación'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Movement Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {activeTab === 'ADJUSTMENT' ? 'Ajuste Manual de Inventario' : 'Transferencia entre Almacenes'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Movimiento registrado exitosamente.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Producto</label>
                <SearchableSelect
                  icon={Package}
                  value={formProductId}
                  onChange={(val) => setFormProductId(val)}
                  options={products.map(p => ({
                    value: p.id,
                    label: p.name,
                    sublabel: `SKU: ${p.sku}`
                  }))}
                  placeholder="Seleccionar producto a ajustar..."
                />
              </div>

              {activeTab === 'ADJUSTMENT' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Almacén / Ubicación</label>
                    <SearchableSelect
                      icon={Warehouse}
                      value={formWarehouseId}
                      onChange={(val) => setFormWarehouseId(val)}
                      options={[
                        { value: '', label: '-- General / Sin Especificar --' },
                        ...buildHierarchicalOptions(locations).map(l => ({ value: l.id, label: l.name }))
                      ]}
                      placeholder="Seleccionar ubicación física..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Cantidad (+ para Entrada, - para Salida)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. -5 o +10"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Ubicación Origen</label>
                      <SearchableSelect
                        icon={Warehouse}
                        value={formSourceLocationId}
                        onChange={(val) => setFormSourceLocationId(val)}
                        options={buildHierarchicalOptions(locations).map(l => ({ value: l.id, label: l.name }))}
                        placeholder="Origen..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Ubicación Destino</label>
                      <SearchableSelect
                        icon={Warehouse}
                        value={formDestLocationId}
                        onChange={(val) => setFormDestLocationId(val)}
                        options={buildHierarchicalOptions(locations).map(l => ({ value: l.id, label: l.name }))}
                        placeholder="Destino..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Cantidad a Transferir</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Ej. 10"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Math.abs(Number(e.target.value)))}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Justificación de Auditoría</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escriba el motivo detallado (Ej. Merma por daño de empaque, recuento en inventario físico)..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={formJustification}
                  onChange={(e) => setFormJustification(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
