'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  User,
  FileText,
  Mail,
  Phone,
  MapPin,
  Map,
  ShieldAlert,
  Truck
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { VENEZUELAN_STATES, TAXPAYER_TYPES } from '@/constants/venezuela';
import { ActionTooltip } from '@/components/ActionTooltip';
import { RifInput } from '@/components/RifInput';
import { SearchableSelect } from '@/components/SearchableSelect';

interface Provider {
  id: string;
  name: string;
  tax_id: string;
  email?: string;
  phone?: string;
  address?: string;
  delivery_address?: string;
  zone_code: string;
  taxpayer_type: string;
  is_retention_agent?: boolean;
  retention_percentage?: number;
  islr_percentage?: number;
  islr_concept_code?: string;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control
  const [isOpen, setIsOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    delivery_address: '',
    zone_code: 'DC',
    taxpayer_type: 'ORDINARY',
    is_retention_agent: false,
    retention_percentage: 75,
    islr_percentage: 2.0,
    islr_concept_code: 'SERVICES'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [errorFields, setErrorFields] = useState<{ [key: string]: boolean }>({});

  // Delete control
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cédula / RIF Split state & helpers
  const [taxPrefix, setTaxPrefix] = useState<'V' | 'J' | 'G'>('J');
  const [taxNumber, setTaxNumber] = useState('');

  const getFormattedTaxId = (pref: string, num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (pref === 'V') {
      if (cleanNum.length === 9) {
        return `V-${cleanNum.slice(0, 8)}-${cleanNum.slice(8)}`;
      }
      return `V-${cleanNum}`;
    }
    if (cleanNum.length >= 9) {
      return `${pref}-${cleanNum.slice(0, 8)}-${cleanNum.slice(8, 9)}`;
    }
    return `${pref}-${cleanNum}`;
  };

  const parseTaxId = (taxId: string) => {
    if (!taxId) return { prefix: 'J' as const, number: '' };
    const clean = taxId.toUpperCase().trim();
    const prefixChar = clean[0];
    const prefix = ['V', 'J', 'G'].includes(prefixChar) ? (prefixChar as 'V' | 'J' | 'G') : 'J';
    const number = clean.slice(1).replace(/\D/g, '');
    return { prefix, number };
  };

  const fetchProviders = async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/providers');
      const allProviders: Provider[] = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      if (query) {
        setProviders(allProviders.filter((p: Provider) => 
          (p.name || '').toLowerCase().includes(query.toLowerCase()) || 
          (p.tax_id || '').toLowerCase().includes(query.toLowerCase())
        ));
      } else {
        setProviders(allProviders);
      }
    } catch (err: any) {
      console.error('Error fetching providers:', err);
      setError(err.response?.data?.message || 'Error al obtener la lista de proveedores. Por favor reintenta.');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProviders(search);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingProvider(null);
    setTaxPrefix('J');
    setTaxNumber('');
    setFormData({
      name: '',
      tax_id: 'J-',
      email: '',
      phone: '',
      address: '',
      delivery_address: '',
      zone_code: 'DC',
      taxpayer_type: 'EXEMPT',
      is_retention_agent: false,
      retention_percentage: 75.0,
      islr_percentage: 2.0,
      islr_concept_code: 'SERVICES'
    });
    setModalError(null);
    setModalSuccess(false);
    setErrorFields({});
    setIsOpen(true);
  };

  const handleOpenEdit = (provider: Provider) => {
    const parsed = parseTaxId(provider.tax_id);
    setTaxPrefix(parsed.prefix);
    setTaxNumber(parsed.number);
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      tax_id: provider.tax_id,
      email: provider.email || '',
      phone: provider.phone || '',
      address: provider.address || '',
      delivery_address: provider.delivery_address || '',
      zone_code: provider.zone_code || 'DC',
      taxpayer_type: provider.taxpayer_type || 'EXEMPT',
      is_retention_agent: provider.is_retention_agent ?? false,
      retention_percentage: provider.retention_percentage ?? 75.0,
      islr_percentage: provider.islr_percentage ?? 2.0,
      islr_concept_code: provider.islr_concept_code || 'SERVICES'
    });
    setModalError(null);
    setModalSuccess(false);
    setErrorFields({});
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { [key: string]: boolean } = {};

    if (!formData.name.trim()) {
      errs['name'] = true;
    }
    const cleanTaxId = formData.tax_id.trim().replace(/[^VJGEP0-9]/gi, '');
    if (!cleanTaxId || cleanTaxId.length < 2) {
      errs['taxNumber'] = true;
    }

    if (Object.keys(errs).length > 0) {
      setErrorFields(errs);
      setModalError('Por favor completa todos los campos requeridos marcados en rojo.');
      return;
    }

    setErrorFields({});
    setIsSaving(true);
    setModalError(null);
    setModalSuccess(false);

    try {
      const payload = {
        name: formData.name.trim(),
        tax_id: formData.tax_id.trim().toUpperCase(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        delivery_address: formData.delivery_address.trim() || undefined,
        zone_code: formData.zone_code,
        taxpayer_type: formData.taxpayer_type,
        is_retention_agent: formData.is_retention_agent,
        retention_percentage: Number(formData.retention_percentage),
        islr_percentage: Number(formData.islr_percentage),
        islr_concept_code: formData.islr_concept_code
      };

      if (editingProvider) {
        await apiClient.put(`/providers/${editingProvider.id}`, payload);
      } else {
        await apiClient.post('/providers', payload);
      }

      setModalSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        fetchProviders(search);
      }, 1000);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setModalError(
          Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
        );
      } else {
        setModalError('Error al guardar el proveedor. Revisa los datos.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/providers/${deletingId}`);
      setProviders(prev => prev.filter(p => p.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      setError('No se pudo desactivar el proveedor.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getZoneName = (code?: string) => {
    if (!code) return 'Distrito Capital';
    return VENEZUELAN_STATES.find(s => s.code === code)?.name || code;
  };

  const getTaxpayerName = (code?: string) => {
    if (!code) return 'Ordinario';
    return TAXPAYER_TYPES.find(t => t.code === code)?.name || code;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Proveedores</h1>
          <p className="text-slate-500">Administra el catálogo de proveedores asociados a las compras de productos.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-lg cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Registrar Proveedor
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950">Acción rechazada</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nombre o RIF..."
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid or Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading && providers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Cargando proveedores...</span>
          </div>
        ) : providers.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No se encontraron proveedores</p>
            <p className="text-xs text-slate-400">Registra un proveedor usando el botón superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">RIF / Identificación</th>
                  <th className="py-4 px-6">Razón Social</th>
                  <th className="py-4 px-6">Estado / Zona</th>
                  <th className="py-4 px-6">Contribuyente</th>
                  <th className="py-4 px-6">Email / Teléfono</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">{p.tax_id}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{p.name}</td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-700" title={getZoneName(p.zone_code)}>
                        {p.zone_code}
                      </span>
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          p.taxpayer_type === 'SPECIAL' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                            : p.taxpayer_type === 'ORDINARY'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {getTaxpayerName(p.taxpayer_type)}
                        </span>
                      </div>
                      {p.is_retention_agent && (
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block">
                            Agente Retenedor IVA {p.retention_percentage || 75}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 space-y-0.5">
                      <div className="text-xs">{p.email || '-'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.phone || ''}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionTooltip content="Editar proveedor">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip content="Desactivar proveedor">
                          <button
                            onClick={() => setDeletingId(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal (Sally Enterprise UX Standard) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {editingProvider ? 'Editar Datos del Proveedor' : 'Registrar Nuevo Proveedor'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Compras y Suministros • Clasificación Fiscal SENIAT (IVA y Retenciones)
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

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4.5 overflow-y-auto flex-1 custom-scrollbar">
                {modalSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>¡Datos del proveedor guardados con éxito!</span>
                  </div>
                )}

                {modalError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-xs sm:text-sm font-semibold">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nombre / Razón Social <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Polar, C.A."
                    className={`block w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 font-medium ${
                      errorFields['name']
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
                        : 'border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 focus:bg-white'
                    }`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <RifInput
                  value={formData.tax_id}
                  required
                  label="RIF del Proveedor"
                  onChange={(formattedRif) => {
                    setFormData(prev => ({ ...prev, tax_id: formattedRif }));
                    if (errorFields['taxNumber']) setErrorFields({ ...errorFields, taxNumber: false });
                  }}
                />

                {/* Switch Agente de Retención */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Agente de Retención SENIAT</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">¿Este proveedor actúa como Agente de Retención de IVA / Contribuyente Especial?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.is_retention_agent}
                        onChange={(e) => setFormData({ ...formData, is_retention_agent: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                {formData.is_retention_agent && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">% Retención IVA Aplicable</label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={formData.retention_percentage}
                        onChange={(e) => setFormData({ ...formData, retention_percentage: Number(e.target.value) })}
                      >
                        <option value={75}>75% (Retención Estándar)</option>
                        <option value={100}>100% (Retención Total SENIAT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">% Retención ISLR Predeterminado</label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={formData.islr_percentage}
                        onChange={(e) => setFormData({ ...formData, islr_percentage: Number(e.target.value) })}
                      >
                        <option value={1.0}>1.00% (Bienes y Mercancías)</option>
                        <option value={2.0}>2.00% (Servicios Comerciales)</option>
                        <option value={3.0}>3.00% (Honorarios Profesionales Firma)</option>
                        <option value={5.0}>5.00% (Comisiones y Arrendamientos)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Dirección Fiscal</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-5 h-4.5 w-4.5 text-slate-400" />
                  <textarea
                    placeholder="Dirección fiscal tal como aparece en el RIF..."
                    rows={2}
                    className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 resize-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Dirección de Entrega (Opcional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-5 h-4.5 w-4.5 text-slate-400" />
                  <textarea
                    placeholder="Dirección de entrega o despacho física (dejar en blanco para usar la misma fiscal)..."
                    rows={2}
                    className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 resize-none"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  />
                </div>
                </div>
              </div>

              {/* Footer Fijo */}
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
                  {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                  {editingProvider ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation (Sally Enterprise UX Standard) */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-rose-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">¿Desactivar proveedor?</h3>
                  <p className="text-xs text-slate-500 font-medium">Suspensión temporal de compras</p>
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
                Esta acción desactivará al proveedor. No se podrán registrar nuevas facturas de compras asociadas a él, pero se conservará su historial para fines de balance y auditoría fiscal.
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
