'use client';

import React, { useState, useRef } from 'react';
import { CreditCard, AlertCircle, Upload, Trash2, Loader2, X, ShieldCheck } from 'lucide-react';
import { SAAS_PLAN_NAMES } from '@/constants/domain-constants';
import { VENEZUELAN_BANKS } from '@/constants/venezuela';
import apiClient from '@/infrastructure/api/api-client';

interface PaymentReportModalProps {
  isOpen: boolean;
  selectedPlan: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentReportModal: React.FC<PaymentReportModalProps> = ({
  isOpen,
  selectedPlan,
  onClose,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'PAGO_MOVIL' | 'ZELLE' | 'BINANCE'>('TRANSFER');
  const [reference, setReference] = useState('');
  const [bankOrigin, setBankOrigin] = useState('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paidAmountBs, setPaidAmountBs] = useState<number>(0);
  const [paidAmountUsd, setPaidAmountUsd] = useState<number>(0);

  // Zelle fields
  const [zelleOwner, setZelleOwner] = useState('');
  const [zelleEmail, setZelleEmail] = useState('');

  // Binance fields
  const [binanceId, setBinanceId] = useState('');
  const [binanceEmail, setBinanceEmail] = useState('');

  // Capture Base64
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La imagen del comprobante no debe superar los 5MB.');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiptImage) {
      setErrorMessage('El capture o comprobante del pago es estrictamente obligatorio.');
      return;
    }

    if (paymentMethod === 'TRANSFER' || paymentMethod === 'PAGO_MOVIL') {
      if (!reference.trim()) {
        setErrorMessage('Debes ingresar el número de referencia del pago.');
        return;
      }
      if (!bankOrigin.trim()) {
        setErrorMessage('Debes seleccionar el banco de origen.');
        return;
      }
      if (paidAmountBs <= 0) {
        setErrorMessage('El monto pagado en Bolívares debe ser mayor a cero.');
        return;
      }
    } else if (paymentMethod === 'ZELLE') {
      if (!zelleOwner.trim()) {
        setErrorMessage('Debes ingresar el nombre del titular de la cuenta Zelle.');
        return;
      }
      if (!zelleEmail.trim() || !zelleEmail.includes('@')) {
        setErrorMessage('Debes ingresar un correo electrónico válido de Zelle.');
        return;
      }
      if (paidAmountUsd <= 0) {
        setErrorMessage('El monto pagado en USD debe ser mayor a cero.');
        return;
      }
    } else if (paymentMethod === 'BINANCE') {
      if (!binanceId.trim()) {
        setErrorMessage('Debes ingresar el Binance ID o Pay ID.');
        return;
      }
      if (!binanceEmail.trim() || !binanceEmail.includes('@')) {
        setErrorMessage('Debes ingresar un correo electrónico válido asociado a Binance.');
        return;
      }
      if (paidAmountUsd <= 0) {
        setErrorMessage('El monto transferido en USDT debe ser mayor a cero.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.post('/subscription/payments', {
        plan_code: selectedPlan,
        billing_cycle: 'MONTHLY',
        amount_usd: paidAmountUsd > 0 ? paidAmountUsd : 0,
        amount_bcv_bs: (paymentMethod === 'TRANSFER' || paymentMethod === 'PAGO_MOVIL') ? paidAmountBs : 0,
        bcv_rate_used: 1,
        payment_method: paymentMethod,
        payment_reference: reference.trim() || `${paymentMethod}-${Date.now()}`,
        payment_date: paymentDate,
        bank_origin: (paymentMethod === 'TRANSFER' || paymentMethod === 'PAGO_MOVIL') ? bankOrigin.trim() : paymentMethod,
        zelle_account_owner: paymentMethod === 'ZELLE' ? zelleOwner.trim() : undefined,
        zelle_email: paymentMethod === 'ZELLE' ? zelleEmail.trim().toLowerCase() : undefined,
        binance_id: paymentMethod === 'BINANCE' ? binanceId.trim() : undefined,
        binance_email: paymentMethod === 'BINANCE' ? binanceEmail.trim().toLowerCase() : undefined,
        receipt_image_base64: receiptImage,
        notes: notes.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error al enviar el reporte de pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Registrar Pago de Suscripción
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Plan a procesar: <strong className="text-indigo-600 font-bold">{SAAS_PLAN_NAMES[selectedPlan] || selectedPlan}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Banner Informativo del Plan */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Plan de Destino
                </span>
                <span className="font-bold text-base text-slate-900">
                  Plan {SAAS_PLAN_NAMES[selectedPlan] || selectedPlan}
                </span>
              </div>
              <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-xl">
                Activación Instantánea
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Método de Pago Utilizado *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'TRANSFER', label: 'Transferencia', icon: '🏦' },
                    { id: 'PAGO_MOVIL', label: 'Pago Móvil', icon: '📱' },
                    { id: 'ZELLE', label: 'Zelle', icon: '⚡' },
                    { id: 'BINANCE', label: 'Binance Pay', icon: '🟡' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMethod === method.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{method.icon}</span>
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs específicos para Transferencia o Pago Móvil */}
              {(paymentMethod === 'TRANSFER' || paymentMethod === 'PAGO_MOVIL') && (
                <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Número de Referencia *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 00874623"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Banco de Origen *
                      </label>
                      <select
                        required
                        value={bankOrigin}
                        onChange={(e) => setBankOrigin(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                      >
                        <option value="">Selecciona el banco...</option>
                        {VENEZUELAN_BANKS.map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.code} - {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Monto Pagado en Bs. *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={paidAmountBs || ''}
                        onChange={(e) => setPaidAmountBs(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Fecha de la Operación *
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inputs específicos para Zelle */}
              {paymentMethod === 'ZELLE' && (
                <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Nombre del Titular de la Cuenta Zelle *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={zelleOwner}
                        onChange={(e) => setZelleOwner(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Correo Electrónico de la Cuenta Zelle *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="juan@ejemplo.com"
                        value={zelleEmail}
                        onChange={(e) => setZelleEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Monto Pagado ($ USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={paidAmountUsd || ''}
                        onChange={(e) => setPaidAmountUsd(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Fecha de Envío *
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inputs específicos para Binance */}
              {paymentMethod === 'BINANCE' && (
                <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Binance ID / Pay ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 88392019"
                        value={binanceId}
                        onChange={(e) => setBinanceId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Correo Electrónico de Binance *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="usuario@binance.com"
                        value={binanceEmail}
                        onChange={(e) => setBinanceEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Monto Transferido ($ USDT) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={paidAmountUsd || ''}
                        onChange={(e) => setPaidAmountUsd(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Fecha de Transacción *
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DROPZONE DE CAPTURE OBLIGATORIO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Capture o Comprobante de Pago * (Obligatorio)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                {receiptImage ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={receiptImage}
                        alt="Capture Preview"
                        className="w-14 h-14 object-cover rounded-xl border border-emerald-300 shadow-2xs shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-900 truncate">{receiptFileName || 'Comprobante adjuntado'}</p>
                        <p className="text-[10px] text-emerald-700 font-medium">✓ Imagen cargada correctamente</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptImage(null);
                          setReceiptFileName('');
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                        title="Eliminar capture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="p-2.5 bg-white group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-all shadow-2xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Haz clic para adjuntar el comprobante / capture
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Formatos soportados: PNG, JPG o WEBP (Máx. 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Información extra sobre el pago o titular..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Fijo */}
          <div className="flex justify-end items-center gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !receiptImage}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Reporte...</span>
                </>
              ) : (
                <span>Enviar Reporte de Pago</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
