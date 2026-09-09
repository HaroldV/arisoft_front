'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Loader2, AlertCircle, Warehouse, Sparkles } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { BranchItem, WarehouseOption } from './types';
import { BranchesTable } from './subcomponents/BranchesTable';
import { BranchModal } from './subcomponents/BranchModal';

export function BranchesManagement() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [branchesRes, warehousesRes] = await Promise.all([
        apiClient.get('/settings/branches').catch(() => ({ data: [] })),
        apiClient.get('/inventory/warehouse-locations').catch(() => ({ data: [] })),
      ]);
      setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
      const whList: WarehouseOption[] = Array.isArray(warehousesRes.data)
        ? warehousesRes.data
        : (warehousesRes.data?.items || []);
      setWarehouses(whList);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al cargar sucursales o almacenes.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setBranchToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: BranchItem) => {
    setBranchToEdit(branch);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return;
    try {
      await apiClient.delete(`/settings/branches/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar la sucursal.');
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3 shadow-2xs">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Gestión de Sucursales y Tiendas
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Administra tus sedes físicas y asigna de forma exclusiva el almacén de despacho para el Punto de Venta (POS).
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Sucursal</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            <strong>Control de Inventario por Sucursal:</strong> Cada vendedor solo verá en el POS los productos con stock en el almacén de la sucursal asignada. Solo el <strong>OWNER</strong> puede vincular almacenes.
          </span>
        </div>
        <div className="text-xs font-bold text-slate-700 font-mono shrink-0">
          Sucursales: {branches.length}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o dirección de sucursal..."
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Error View */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Cargando sucursales...</span>
        </div>
      ) : (
        <BranchesTable
          branches={filteredBranches}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      <BranchModal
        isOpen={isModalOpen}
        branchToEdit={branchToEdit}
        warehouses={warehouses}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
