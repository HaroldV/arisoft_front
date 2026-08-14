'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
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
import { ActionTooltip } from '@/components/ActionTooltip';
import { SearchableSelect } from '@/components/SearchableSelect';
import { RifInput } from '@/components/RifInput';

interface Client {
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    delivery_address: '',
    zone_code: 'DC',
    taxpayer_type: 'EXEMPT'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Delete control
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cédula / RIF Split state & helpers
  const [taxPrefix, setTaxPrefix] = useState<'V' | 'J' | 'G'>('V');
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
    if (!taxId) return { prefix: 'V' as const, number: '' };
    const clean = taxId.toUpperCase().trim();
    const prefixChar = clean[0];
    const prefix = ['V', 'J', 'G'].includes(prefixChar) ? (prefixChar as 'V' | 'J' | 'G') : 'V';
    const number = clean.slice(1).replace(/\D/g, '');
    return { prefix, number };
  };

  const fetchClients = async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/clients');
      const allClients = response.data;
      if (query) {
        setClients(allClients.filter((c: Client) => 
          c.name.toLowerCase().includes(query.toLowerCase()) || 
          c.tax_id.toLowerCase().includes(query.toLowerCase())
        ));
      } else {
        setClients(allClients);
      }
    } catch (err: any) {
      setError('Error al obtener la lista de clientes. Por favor reintenta.');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients(search);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);
  const [errorFields, setErrorFields] = useState<{ [key: string]: boolean }>({});

  const handleOpenAdd = () => {
    setEditingClient(null);
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
      taxpayer_type: 'EXEMPT'
    });
    setModalError(null);
    setModalSuccess(false);
    setErrorFields({});
    setIsOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    const parsed = parseTaxId(client.tax_id);
    setTaxPrefix(parsed.prefix);
    setTaxNumber(parsed.number);
    setEditingClient(client);
    setFormData({
      name: client.name,
      tax_id: client.tax_id,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      delivery_address: client.delivery_address || '',
      zone_code: client.zone_code || 'DC',
      taxpayer_type: client.taxpayer_type || 'EXEMPT'
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
    if (!taxNumber.trim()) {
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
        taxpayer_type: formData.taxpayer_type
      };

      if (editingClient) {
        await apiClient.put(`/clients/${editingClient.id}`, payload);
      } else {
        await apiClient.post('/clients', payload);
      }

      setModalSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        fetchClients(search);
      }, 1000);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setModalError(
          Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
        );
      } else {
        setModalError('Error al guardar el cliente. Revisa los datos.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/clients/${deletingId}`);
      setClients(prev => prev.filter(c => c.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      setError('No se pudo desactivar el cliente.');
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-slate-500">Administra la base de clientes de tu negocio para facturación y ventas.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-lg cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Registrar Cliente
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
            placeholder="Buscar por Nombre o Cédula/RIF..."
            className="w-full pl-11 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid or Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading && clients.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Cargando clientes...</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No se encontraron clientes</p>
            <p className="text-xs text-slate-400">Registra un cliente usando el botón superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Cédula / RIF</th>
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">Estado / Zona</th>
                  <th className="py-4 px-6">Contribuyente</th>
                  <th className="py-4 px-6">Email / Teléfono</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">{c.tax_id}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{c.name}</td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-700" title={getZoneName(c.zone_code)}>
                        {c.zone_code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        c.taxpayer_type === 'SPECIAL' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : c.taxpayer_type === 'ORDINARY'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getTaxpayerName(c.taxpayer_type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 space-y-0.5">
                      <div className="text-xs">{c.email || '-'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{c.phone || ''}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionTooltip content="Editar cliente">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip content="Desactivar cliente">
                          <button
                            onClick={() => setDeletingId(c.id)}
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

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in scale-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                {editingClient ? 'Editar Cliente' : 'Registrar Cliente'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {modalSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-sm">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>¡Datos del cliente guardados con éxito!</span>
                </div>
              )}

              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nombre / Razón Social <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    className={`block w-full pl-11 pr-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 ${
                      errorFields['name']
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
                        : 'border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errorFields['name']) setErrorFields({ ...errorFields, name: false });
                    }}
                  />
                </div>
                {errorFields['name'] && (
                  <span className="text-[11px] font-semibold text-rose-500 mt-1 block animate-in fade-in duration-150">
                    ⚠️ El Nombre o Razón Social es obligatorio.
                  </span>
                )}
              </div>

              <RifInput
                value={formData.tax_id}
                required
                label="Cédula / RIF del Cliente"
                onChange={(formattedRif) => {
                  setFormData(prev => ({ ...prev, tax_id: formattedRif }));
                  if (errorFields['taxNumber']) setErrorFields({ ...errorFields, taxNumber: false });
                }}
              />

              {/* Zone and Taxpayer Selects */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Zona / Estado</label>
                  <SearchableSelect
                    icon={Map}
                    value={formData.zone_code}
                    onChange={(val) => setFormData(prev => ({ ...prev, zone_code: val }))}
                    options={VENEZUELAN_STATES.map(s => ({
                      value: s.code,
                      label: s.name,
                      sublabel: `Código: ${s.code}`
                    }))}
                    placeholder="Buscar estado..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Tipo de Contribuyente</label>
                  <SearchableSelect
                    icon={ShieldAlert}
                    value={formData.taxpayer_type}
                    onChange={(val) => setFormData(prev => ({ ...prev, taxpayer_type: val }))}
                    options={TAXPAYER_TYPES.map(t => ({
                      value: t.code,
                      label: t.name,
                      sublabel: `Código fiscal: ${t.code}`
                    }))}
                    placeholder="Seleccionar contribuyente..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Email de Contacto</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="juan@gmail.com"
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
                      placeholder="0424-7654321"
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
                  {editingClient ? 'Guardar Cambios' : 'Registrar'}
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
                <h3 className="font-bold text-slate-900">¿Desactivar cliente?</h3>
                <p className="text-xs text-slate-500">
                  Esta acción desactivará al cliente del sistema. Se mantendrá el histórico de todas las compras que haya realizado para auditoría tributaria y análisis POS.
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
