'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse, Info, Plus, Trash2, FolderPlus, HelpCircle, Loader2, AlertCircle, CheckCircle, ChevronRight, ChevronDown } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { Modal } from '@/components/Modal';

interface WarehouseLocation {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'AISLE' | 'SHELF' | 'BIN';
  parent_id?: string;
  capacity_limit: number;
  children?: WarehouseLocation[];
}

export default function WarehousePage() {
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [flatLocations, setFlatLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'error' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'WAREHOUSE' as 'WAREHOUSE' | 'AISLE' | 'SHELF' | 'BIN',
    parent_id: '',
    capacity_limit: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Expanded tree nodes state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const fetchLocationsTree = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const treeRes = await apiClient.get('/inventory/warehouse-locations/tree');
      const flatRes = await apiClient.get('/inventory/warehouse-locations');
      setLocations(treeRes.data);
      setFlatLocations(flatRes.data);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo cargar la jerarquía de ubicaciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationsTree();
  }, []);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, nodeId: !prev[nodeId] }));
  };

  const handleSelectParent = (parentId: string, parentType: string) => {
    // Propose default child type based on parent type
    let defaultChildType = 'AISLE' as 'WAREHOUSE' | 'AISLE' | 'SHELF' | 'BIN';
    if (parentType === 'AISLE') defaultChildType = 'SHELF';
    if (parentType === 'SHELF') defaultChildType = 'BIN';
    if (parentType === 'BIN') defaultChildType = 'BIN';

    setFormData({
      name: '',
      type: defaultChildType,
      parent_id: parentId,
      capacity_limit: 0,
    });
    setFormSuccess(false);
    setFormError(null);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar la ubicación "${name}"?`,
      type: 'confirm',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/inventory/warehouse-locations/${id}`);
          fetchLocationsTree();
        } catch (err: any) {
          setConfirmModal({
            isOpen: true,
            title: 'Acción rechazada',
            message: err.response?.data?.message || 'Error al eliminar la ubicación.',
            type: 'error',
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          });
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      await apiClient.post('/inventory/warehouse-locations', {
        name: formData.name.trim(),
        type: formData.type,
        parent_id: formData.parent_id || undefined,
        capacity_limit: Number(formData.capacity_limit) || 0,
      });

      setFormSuccess(true);
      setFormData({
        name: '',
        type: 'WAREHOUSE',
        parent_id: '',
        capacity_limit: 0,
      });
      fetchLocationsTree();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar la ubicación.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case 'WAREHOUSE':
        return <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold px-2 py-0.5 rounded">Bodega</span>;
      case 'AISLE':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold px-2 py-0.5 rounded">Pasillo</span>;
      case 'SHELF':
        return <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded">Estante</span>;
      case 'BIN':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded">Gaveta/Bin</span>;
      default:
        return null;
    }
  };

  const renderTreeNode = (node: WarehouseLocation, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];

    return (
      <div key={node.id} className="space-y-1">
        <div 
          style={{ paddingLeft: `${level * 20}px` }} 
          className="group flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button 
                onClick={() => setExpandedNodes(prev => ({ ...prev, [node.id]: !prev[node.id] }))}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <div className="w-5" />
            )}
            
            <Warehouse className={`h-4 w-4 ${node.type === 'WAREHOUSE' ? 'text-blue-500' : 'text-slate-400'}`} />
            <span className="font-semibold text-slate-800 text-sm">{node.name}</span>
            {renderBadge(node.type)}
            {node.capacity_limit > 0 && (
              <span className="text-[10px] text-slate-400 font-mono">Cap: {node.capacity_limit}</span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleSelectParent(node.id, node.type)}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
              title="Añadir sub-ubicación"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(node.id, node.name)}
              className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
              title="Eliminar ubicación"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Control de Almacenes</h1>
            <p className="text-xs text-slate-500">Estructura jerárquica para la ubicación física y capacidad de tu inventario.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Tree View (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col min-h-[400px]">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Distribución Física de Ubicaciones</h3>
            <span className="text-xs text-slate-400 font-medium">Usa los botones rápidos para anidar o borrar</span>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs">Cargando mapa de almacenes...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : locations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-center space-y-2">
              <Warehouse className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No hay ubicaciones registradas</p>
              <p className="text-xs text-slate-400 max-w-sm">Crea tu primer almacén principal usando el formulario de la derecha para comenzar.</p>
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-slate-50/50">
              {locations.map(rootNode => renderTreeNode(rootNode))}
            </div>
          )}
        </div>

        {/* Right Form View (1/3 width) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Registrar Nueva Ubicación</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Agrega bodegas raíz o anida pasillos y estanterías.</p>
          </div>

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 text-xs">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>¡Ubicación registrada exitosamente!</span>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de Ubicación *</label>
              <input
                type="text"
                required
                placeholder="Ej. Almacén Central, Pasillo 3"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Nivel *</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none bg-white"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="WAREHOUSE">Bodega / Almacén Principal (WAREHOUSE)</option>
                <option value="AISLE">Pasillo (AISLE)</option>
                <option value="SHELF">Estantería / Estante (SHELF)</option>
                <option value="BIN">Gaveta / Compartimiento (BIN)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ubicación Padre (Anidar)</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none bg-white"
                value={formData.parent_id}
                onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
              >
                <option value="">Ninguna (Es una Bodega Raíz)</option>
                {flatLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Límite de Capacidad (Items)</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                value={formData.capacity_limit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity_limit: Number(e.target.value) || 0 }))}
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all cursor-pointer text-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Guardar Ubicación
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <Modal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
