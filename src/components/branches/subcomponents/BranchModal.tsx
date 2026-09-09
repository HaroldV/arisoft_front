'use client';

import React, { useState, useEffect } from 'react';
import { Building2, X, Warehouse, Loader2, AlertCircle } from 'lucide-react';
import { BranchItem, BranchFormData, WarehouseOption } from '../types';
import apiClient from '@/infrastructure/api/api-client';

interface BranchModalProps {
  isOpen: boolean;
  branchToEdit: BranchItem | null;
  warehouses: WarehouseOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  branchToEdit,
  warehouses,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    defaultWarehouseId: '',
    isActive: true,
    isMain: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (branchToEdit) {
      setFormData({
        name: branchToEdit.name || '',
        code: branchToEdit.code || '',
        address: branchToEdit.address || '',
        phone: branchToEdit.phone || '',
        defaultWarehouseId: branchToEdit.default_warehouse_id || '',
        isActive: branchToEdit.is_active ?? true,
        isMain: branchToEdit.is_main ?? false,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        defaultWarehouseId: warehouses.length > 0 ? (warehouses[0].id || '') : '',
        isActive: true,
        isMain: false,
      });
    }
    setError(null);
  }, [branchToEdit, warehouses, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('El nombre y el código de la sucursal son obligatorios.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        defaultWarehouseId: formData.defaultWarehouseId || undefined,
        isActive: formData.isActive,
        isMain: formData.isMain,
      };

      if (branchToEdit) {
        await apiClient.put(`/settings/branches/${branchToEdit.id}`, payload);
      } else {
        await apiClient.post('/settings/branches', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Ocurrió un error al guardar la sucursal.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {branchToEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Configuración del punto físico y asignación de almacén
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-3 text-rose-800 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Nombre de la Sucursal *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Sucursal Las Mercedes"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Código de Sucursal *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. SUC-01"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Almacén de Despacho Asignado (Exclusivo OWNER) *
            </label>
            <div className="relative">
              <Warehouse className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <select
                value={formData.defaultWarehouseId}
                onChange={(e) => setFormData((prev) => ({ ...prev, defaultWarehouseId: e.target.value }))}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none cursor-pointer"
              >
                <option value="">-- Sin Almacén Asignado --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.type ? `(${w.type})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              El Punto de Venta (POS) en esta sucursal venderá exclusivamente existencias de este almacén.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej. +58 412 1234567"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Dirección / Ubicación
              </label>
              <input
                type="text"
                placeholder="Ej. Av. Principal, Local 4"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-800">Sucursal Activa</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isMain}
                onChange={(e) => setFormData((prev) => ({ ...prev, isMain: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-800">Marcar como Sucursal Principal (Sede)</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{branchToEdit ? 'Actualizar Sucursal' : 'Crear Sucursal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
