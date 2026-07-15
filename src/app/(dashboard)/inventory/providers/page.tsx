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
  ShieldAlert
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { VENEZUELAN_STATES, TAXPAYER_TYPES } from '@/constants/venezuela';

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
    taxpayer_type: 'ORDINARY'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

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
      const allProviders = response.data;
      if (query) {
        setProviders(allProviders.filter((p: Provider) => 
          p.name.toLowerCase().includes(query.toLowerCase()) || 
          p.tax_id.toLowerCase().includes(query.toLowerCase())
        ));
      } else {
        setProviders(allProviders);
      }
    } catch (err: any) {
      setError('Error al obtener la lista de proveedores. Por favor reintenta.');
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
    setTaxPrefix('J');
    setTaxNumber('');
    setEditingProvider(null);
    setFormData({
      name: '',
      tax_id: '',
      email: '',
      phone: '',
      address: '',
      delivery_address: '',
      zone_code: 'DC',
      taxpayer_type: 'ORDINARY'
    });
    setModalError(null);
    setModalSuccess(false);
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
      taxpayer_type: provider.taxpayer_type || 'ORDINARY'
    });
    setModalError(null);
    setModalSuccess(false);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
        taxpayer_type: formData.taxpayer_type
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

  const getZoneName = (code: string) => {
    return VENEZUELAN_STATES.find(s => s.code === code)?.name || code;
  };

  const getTaxpayerName = (code: string) => {
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
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        p.taxpayer_type === 'SPECIAL' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : p.taxpayer_type === 'ORDINARY'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getTaxpayerName(p.taxpayer_type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 space-y-0.5">
                      <div className="text-xs">{p.email || '-'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.phone || ''}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(p.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Desactivar"
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

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in scale-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                {editingProvider ? 'Editar Proveedor' : 'Registrar Proveedor'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {modalSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-sm">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>¡Datos del proveedor guardados con éxito!</span>
                </div>
              )}

              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Nombre / Razón Social</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Polar, C.A."
                    className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">RIF de la Empresa</label>
                <div className="flex gap-2">
                  <div className="relative shrink-0 w-24">
                    <select
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white focus:ring-2 focus:ring-primary-500/20 font-semibold text-slate-700"
                      value={taxPrefix}
                      onChange={(e) => {
                        const pref = e.target.value as 'V' | 'J' | 'G';
                        setTaxPrefix(pref);
                        setFormData(prev => ({ ...prev, tax_id: getFormattedTaxId(pref, taxNumber) }));
                      }}
                    >
                      <option value="J">J-</option>
                      <option value="G">G-</option>
                      <option value="V">V-</option>
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder={taxPrefix === 'V' ? 'Ej. 12345678' : 'Ej. 123456789'}
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 font-mono"
                      value={taxNumber}
                      onChange={(e) => {
                        const num = e.target.value.replace(/\D/g, '');
                        if (num.length <= 9) {
                          setTaxNumber(num);
                          setFormData(prev => ({ ...prev, tax_id: getFormattedTaxId(taxPrefix, num) }));
                        }
                      }}
                    />
                  </div>
                </div>
                {taxNumber && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                    <span>Identificador final:</span>
                    <span className="font-mono text-sm font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg">
                      {getFormattedTaxId(taxPrefix, taxNumber)}
                    </span>
                  </p>
                )}
              </div>

              {/* Zone and Taxpayer Selects */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Zona / Estado</label>
                  <div className="relative">
                    <Map className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <select
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white focus:ring-2 focus:ring-primary-500/20"
                      value={formData.zone_code}
                      onChange={(e) => setFormData({ ...formData, zone_code: e.target.value })}
                    >
                      {VENEZUELAN_STATES.map(s => (
                        <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Tipo de Contribuyente</label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <select
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white focus:ring-2 focus:ring-primary-500/20"
                      value={formData.taxpayer_type}
                      onChange={(e) => setFormData({ ...formData, taxpayer_type: e.target.value })}
                    >
                      {TAXPAYER_TYPES.map(t => (
                        <option key={t.code} value={t.code}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Email de Contacto</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="ventas@polar.com"
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="0412-1234567"
                      className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-75 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
                >
                  {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                  {editingProvider ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 mt-0.5 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">¿Desactivar proveedor?</h3>
                <p className="text-xs text-slate-500">
                  Esta acción desactivará al proveedor. No se podrán registrar nuevas facturas de compras asociadas a él, pero se conservará su historial para fines contables.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors"
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
