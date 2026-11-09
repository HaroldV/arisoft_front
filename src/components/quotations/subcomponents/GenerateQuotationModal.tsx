'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X, 
  Phone, 
  Mail, 
  CreditCard, 
  FileCheck2,
  DollarSign
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { QuotationClient, QuotationCartItem } from '../types';
import { ClientAutocompleteInput } from './ClientAutocompleteInput';

interface GenerateQuotationModalProps {
  isOpen: boolean;
  cart: QuotationCartItem[];
  clients: QuotationClient[];
  exchangeRate: number;
  initialClient?: QuotationClient | null;
  onClose: () => void;
  onSuccess: (quotationNumber: string) => void;
  onClientCreated: (client: QuotationClient) => void;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const GenerateQuotationModal: React.FC<GenerateQuotationModalProps> = ({
  isOpen,
  cart,
  clients,
  exchangeRate,
  initialClient,
  onClose,
  onSuccess,
  onClientCreated,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClient?.id || '');
  const [clientName, setClientName] = useState<string>(initialClient?.name || '');
  const [clientDocType, setClientDocType] = useState<string>('V');
  const [clientDocNumber, setClientDocNumber] = useState<string>(
    initialClient?.tax_id ? initialClient.tax_id.replace(/^[VJEGP]-?/i, '') : ''
  );
  const [clientPhone, setClientPhone] = useState<string>(initialClient?.phone || '');
  const [clientEmail, setClientEmail] = useState<string>(initialClient?.email || '');

  // Quotation Specific Fields
  const [issueDate, setIssueDate] = useState<string>(getTodayDate());
  const [validUntil, setValidUntil] = useState<string>(getFutureDate(15));
  const [paymentMethod, setPaymentMethod] = useState<string>('UNSPECIFIED');
  const [notes, setNotes] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculos de totales
  const subtotalUsd = cart.reduce((acc, item) => acc + (item.product.priceUsd * item.quantity), 0);
  const taxUsd = cart.reduce((acc, item) => {
    const rate = item.product.taxRate || 0;
    return acc + (item.product.priceUsd * item.quantity * (rate / 100));
  }, 0);
  const totalUsd = Number((subtotalUsd + taxUsd).toFixed(2));
  const totalBs = Number((totalUsd * exchangeRate).toFixed(2));

  const [clientSearchText, setClientSearchText] = useState<string>(
    initialClient ? `${initialClient.name}${initialClient.tax_id ? ` (${initialClient.tax_id})` : ''}` : ''
  );

  // Manejador al seleccionar cliente existente desde el buscador/autocompletado
  const handleSelectClient = (client: QuotationClient) => {
    setSelectedClientId(client.id);
    setClientName(client.name);
    setClientPhone(client.phone || '');
    setClientEmail(client.email || '');
    setClientSearchText(`${client.name}${client.tax_id ? ` (${client.tax_id})` : ''}`);

    const rawTax = client.tax_id || '';
    const prefixMatch = rawTax.match(/^([VJEGP])-?/i);
    if (prefixMatch) {
      setClientDocType(prefixMatch[1].toUpperCase());
      setClientDocNumber(rawTax.replace(/^([VJEGP])-?/i, ''));
    } else {
      setClientDocNumber(rawTax);
    }
  };

  const parseAndApplyInput = (text: string) => {
    const raw = text.trim();
    if (!raw) return;

    // Verificar si empieza con prefijo de documento (V, J, E, G, P) o si son solo números
    const docWithPrefixMatch = raw.match(/^([VJEGP])-?([0-9A-Z]+)$/i);
    const pureNumbersMatch = raw.match(/^([0-9]{5,10})$/);

    if (docWithPrefixMatch) {
      setClientDocType(docWithPrefixMatch[1].toUpperCase());
      setClientDocNumber(docWithPrefixMatch[2]);
    } else if (pureNumbersMatch) {
      // Cédula venezolana por defecto si son números
      setClientDocType('V');
      setClientDocNumber(pureNumbersMatch[1]);
    } else {
      // Si contiene letras y espacios, es más probable que sea la Razón Social / Nombre
      if (!clientName.trim()) {
        setClientName(raw);
      }
    }
  };

  const handleSearchTextChange = (text: string) => {
    setClientSearchText(text);

    // Intentar buscar coincidencia directa por RIF o Cédula escrita
    const cleanQuery = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const directMatch = clients.find(c => {
      const cTax = (c.tax_id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return cTax && (cTax === cleanQuery || c.name.toUpperCase() === text.trim().toUpperCase());
    });

    if (directMatch) {
      handleSelectClient(directMatch);
    } else {
      // Si el usuario escribe algo que no coincide con un cliente existente:
      setSelectedClientId('');
      parseAndApplyInput(text);
    }
  };

  const handleQuickRegisterNew = (queryText: string) => {
    parseAndApplyInput(queryText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = clientName.trim();
    const cleanTaxNumber = clientDocNumber.trim().toUpperCase();
    const fullTaxId = cleanTaxNumber ? `${clientDocType}-${cleanTaxNumber}` : '';

    if (!trimmedName) {
      setError('El nombre o razón social del cliente es requerido.');
      return;
    }

    if (cart.length === 0) {
      setError('La cotización no contiene productos en el carrito.');
      return;
    }

    setIsSaving(true);

    try {
      let finalClientId = selectedClientId;

      // 1. Si no hay cliente seleccionado o es un cliente nuevo, crearlo en la BD de clientes si tiene RIF
      if (!finalClientId && cleanTaxNumber) {
        try {
          const createClientRes = await apiClient.post('/clients', {
            name: trimmedName,
            tax_id: fullTaxId,
            phone: clientPhone.trim() || undefined,
            email: clientEmail.trim() || undefined,
            address: 'Registrado desde Cotizaciones',
          });
          const createdClient = createClientRes.data;
          if (createdClient?.id) {
            finalClientId = createdClient.id;
            onClientCreated(createdClient);
          }
        } catch (clientErr: any) {
          // Si el RIF ya existe, no abortar; procedemos a emitir la cotización con los datos ingresados
          console.warn('Notice creating client:', clientErr?.response?.data?.message || clientErr.message);
        }
      }

      // 2. Crear documento comercial tipo QUOTATION
      const payload = {
        document_type: 'QUOTATION',
        client_id: finalClientId || undefined,
        client_name: trimmedName,
        client_tax_id: fullTaxId || undefined,
        issue_date: issueDate,
        valid_until: validUntil,
        payment_method: paymentMethod,
        exchange_rate: exchangeRate,
        notes: notes.trim() || undefined,
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          sku: item.product.sku,
          unit_price_usd: item.product.priceUsd,
          quantity: item.quantity,
          tax_rate: item.product.taxRate,
        })),
      };

      const res = await apiClient.post('/sales/documents', payload);
      const generatedNumber = res.data?.document_number || 'Cotización Generada';

      onSuccess(generatedNumber);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error al guardar la cotización.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Fijo Luminous Executive (Sally UX Standard) */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/40 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Generar Nueva Cotización
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Estimación de precios con validez formal para clientes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4.5 overflow-y-auto flex-1 custom-scrollbar">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Banner Resumen de Cotización */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Artículos Cotizados
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {cart.length} {cart.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Presupuesto
                </span>
                <div className="flex items-baseline sm:justify-end gap-2">
                  <span className="font-mono font-black text-xl text-indigo-700">
                    ${totalUsd.toFixed(2)}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    (Bs. {totalBs.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Cliente Registrado con Autocompletado */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Seleccionar Cliente Registrado (Opcional)</span>
                {selectedClientId ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Cliente Existente
                  </span>
                ) : clientName.trim() ? (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Plus className="w-3 h-3 text-indigo-600" />
                    Nuevo Cliente
                  </span>
                ) : null}
              </label>
              <ClientAutocompleteInput
                value={clientSearchText}
                clients={clients}
                onSelectClient={handleSelectClient}
                onChangeText={handleSearchTextChange}
                onQuickRegisterNew={handleQuickRegisterNew}
                placeholder="Escribe cédula, RIF o razón social para autocompletar..."
              />
            </div>

            {/* Cuadrícula Cliente / Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
              <div className="sm:col-span-7 space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cliente / Empresa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Inversiones El Sol C.A. o Juan Pérez"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (selectedClientId) setSelectedClientId('');
                  }}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>

              <div className="sm:col-span-5 space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  RIF o Cédula
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={clientDocType}
                    onChange={(e) => setClientDocType(e.target.value)}
                    className="w-16 h-10 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shrink-0 cursor-pointer"
                  >
                    <option value="V">V-</option>
                    <option value="J">J-</option>
                    <option value="E">E-</option>
                    <option value="G">G-</option>
                    <option value="P">P-</option>
                  </select>
                  <input
                    type="text"
                    placeholder="12345678-0"
                    value={clientDocNumber}
                    onChange={(e) => setClientDocNumber(e.target.value.replace(/[^0-9a-zA-Z-]/g, ''))}
                    className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Teléfono y Correo Electrónico Opcionales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Teléfono / WhatsApp (Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. 0414-1234567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Correo Electrónico (Opcional)</span>
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Fechas de Cotización y Validez */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Fecha Cotización <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Válida Hasta
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Forma de Pago Propuesta
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="UNSPECIFIED">Por definir</option>
                  <option value="CASH_USD">Efectivo ($ USD)</option>
                  <option value="PAGO_MOVIL">Pago Móvil (Bs.)</option>
                  <option value="TRANSFER_BS">Transferencia Bancaria (Bs.)</option>
                  <option value="TRANSFER_USD">Transferencia USD (Zelle/Panamá)</option>
                  <option value="CREDIT">Crédito Comercial</option>
                </select>
              </div>
            </div>

            {/* Notas / Observaciones */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Términos / Observaciones (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Precios sujetos a cambio sin previo aviso. Tiempo de entrega: 48 horas tras confirmar pago."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              />
            </div>

          </div>

          {/* Footer Fijo */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || cart.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-40"
            >
              {isSaving ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <FileCheck2 className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Guardando...' : 'Guardar Cotización'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
