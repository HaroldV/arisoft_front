'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  Edit2,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Shield,
  HelpCircle
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { Modal } from '@/components/Modal';
import { ActionTooltip } from '@/components/ActionTooltip';

interface Category {
  id: string;
  tenant_id: string | null;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal controls
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Reusable modal alert/confirm state
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

  // Delete control
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/inventory/categories?all=true');
      setCategories(response.data);
    } catch (err: any) {
      setError('Error al obtener la lista de categorías. Por favor reintenta.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      is_active: true
    });
    setModalError(null);
    setModalSuccess(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code || '',
      is_active: category.is_active
    });
    setModalError(null);
    setModalSuccess(false);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('El nombre de la categoría es obligatorio.');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      if (editingCategory) {
        await apiClient.put(`/inventory/categories/${editingCategory.id}`, {
          name: editingCategory.tenant_id === null ? undefined : formData.name.trim(),
          code: formData.code.trim() || undefined,
          is_active: formData.is_active
        });
      } else {
        await apiClient.post('/inventory/categories', {
          name: formData.name.trim(),
          code: formData.code.trim() || undefined
        });
      }
      setModalSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        fetchCategories();
      }, 1000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Error al guardar la categoría.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`,
      type: 'confirm',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setDeletingId(id);
        setIsDeleting(true);
        try {
          await apiClient.delete(`/inventory/categories/${id}`);
          fetchCategories();
        } catch (err: any) {
          setConfirmModal({
            isOpen: true,
            title: 'Acción rechazada',
            message: err.response?.data?.message || 'Error al eliminar/desactivar la categoría.',
            type: 'error',
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          });
        } finally {
          setDeletingId(null);
          setIsDeleting(false);
        }
      }
    });
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Módulo de Categorías</h1>
            <p className="text-xs text-slate-500">Administra las actividades económicas y categorías de tus productos</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all hover:-translate-y-0.5 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>

      {/* Global Warnings / Explanatory Alert */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-800 text-xs">
        <HelpCircle className="w-5 h-5 flex-shrink-0 text-indigo-500" />
        <div>
          <span className="font-bold text-indigo-900">Información del Sistema:</span> Las categorías marcadas como <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Global</span> son provistas por defecto según la clasificación CAEV venezolana. Puedes editar su código o desactivarlas y los cambios se guardarán solo para tu comercio, sin afectar a otros tenants.
        </div>
      </div>

      {/* Actions bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar categoría por nombre o código CAEV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Cargando categorías...</span>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950">Acción rechazada</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <Tag className="h-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-600">No se encontraron categorías</p>
          <p className="text-xs text-slate-400">Crea una categoría propia usando el botón superior.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Nombre</th>
                  <th className="py-4 px-6">Código Actividad (CAEV)</th>
                  <th className="py-4 px-6">Origen</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{c.name}</td>
                    <td className="py-4 px-6">
                      {c.code ? (
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700">
                          {c.code}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans italic text-xs">No asignado</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {c.tenant_id === null ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold rounded">
                          <Shield className="w-3 h-3" />
                          Global
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold rounded">
                          Personalizada
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {c.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium rounded-full">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionTooltip content="Editar categoría">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </ActionTooltip>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          title={c.tenant_id === null ? "Desactivar localmente" : "Eliminar"}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal (Sally Enterprise UX Standard) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {editingCategory ? 'Editar Categoría de Producto' : 'Registrar Nueva Categoría'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Clasificación y Códigos de Actividad CAEV
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form & Body */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4.5 overflow-y-auto flex-1 custom-scrollbar">
                {modalError && (
                  <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs sm:text-sm font-semibold">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-950">Error al guardar</p>
                      <p className="text-xs text-rose-700 mt-0.5">{modalError}</p>
                    </div>
                  </div>
                )}

                {modalSuccess && (
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs sm:text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-emerald-950">¡Éxito!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">La categoría se guardó correctamente.</p>
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    disabled={editingCategory?.tenant_id === null}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Artículos del Hogar, Víveres Finos, Bebidas"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  />
                  {editingCategory?.tenant_id === null && (
                    <span className="text-xs font-medium text-indigo-600 block mt-1">
                      🔒 Las categorías globales del sistema no permiten alterar su nombre descriptivo.
                    </span>
                  )}
                </div>

                {/* CAEV Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Código de Actividad Económica CAEV (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ej. 47111"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono font-semibold"
                  />
                </div>

                {/* Active Checkbox */}
                {editingCategory && (
                  <div className="flex items-center gap-3 pt-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-200 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_active" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                      Categoría Activa en el Comercio y Catálogo
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Alert/Confirm Modal */}
      <Modal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
