'use client';

import React, { useState } from 'react';
import { 
  User, 
  X, 
  Phone, 
  Mail, 
  UserPlus, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { QuotationClient } from '../types';

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: QuotationClient) => void;
}

export const QuickClientModal: React.FC<QuickClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const [name, setName] = useState('');
  const [docType, setDocType] = useState('V');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const cleanTax = docNumber.trim();
    if (!trimmedName) {
      setError('El nombre o razón social es obligatorio.');
      return;
    }

    const fullTaxId = cleanTax ? `${docType}-${cleanTax}` : undefined;

    setIsSaving(true);
    try {
      const res = await apiClient.post('/clients', {
        name: trimmedName,
        tax_id: fullTaxId,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: 'Registrado desde Cotizaciones',
      });

      const created = res.data;
      if (created?.id) {
        onClientCreated(created);
        onClose();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al registrar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registrar Cliente Rápido</h3>
              <p className="text-[11px] text-slate-500">Agrega un nuevo cliente para cotizaciones</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Nombre / Razón Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Inversiones El Sol C.A."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              RIF / Cédula
            </label>
            <div className="flex gap-1.5">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-16 h-10 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="V">V-</option>
                <option value="J">J-</option>
                <option value="E">E-</option>
                <option value="G">G-</option>
                <option value="P">P-</option>
              </select>
              <input
                type="text"
                placeholder="12345678"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value.replace(/[^0-9a-zA-Z-]/g, ''))}
                className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Teléfono
              </label>
              <input
                type="text"
                placeholder="0414-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> Correo
              </label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Guardando...' : 'Guardar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
