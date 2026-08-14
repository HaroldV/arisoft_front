'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Check, ShieldCheck, DollarSign, Building2, Upload, AlertCircle, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { APP_CONFIG, SAAS_PLAN_NAMES } from '@/constants/domain-constants';
import { VENEZUELAN_BANKS } from '@/constants/venezuela';

export default function SubscriptionPage() {
  const DEFAULT_PLANS = [
    {
      code: 'EMPRENDEDOR',
      name: 'Emprendedor',
      monthlyUSD: 15,
      annualUSD: 150,
      desc: 'Ideal para pequeños negocios y comercios en crecimiento.',
      features: ['1 Caja / Punto de Venta', 'Hasta 500 Productos', '3 Usuarios Operativos', 'Reportes Básicos', 'Soporte vía Ticket'],
      popular: false,
    },
    {
      code: 'COMERCIAL_PRO',
      name: 'Comercial Pro',
      monthlyUSD: 35,
      annualUSD: 350,
      desc: 'La solución completa para empresas medianas en expansión.',
      features: ['Puntos de Venta Ilimitados', 'Hasta 2,500 Productos', '10 Usuarios Simultáneos', 'Inventario Multialmacén', 'Facturación Fiscal & Arqueos', 'Soporte Prioritario'],
      popular: true,
    },
    {
      code: 'CORPORATIVO',
      name: 'Corporativo',
      monthlyUSD: 75,
      annualUSD: 750,
      desc: 'Máxima potencia para grandes distribuidores e industrias.',
      features: ['Acceso Ilimitado Total', 'Productos & Usuarios Ilimitados', 'Módulo de Nómina Completo', 'Auditoría Fiscal Avanzada', 'Gerente de Cuenta Dedicado'],
      popular: false,
    },
  ];

  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('COMERCIAL_PRO');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'PAGO_MOVIL' | 'ZELLE'>('TRANSFER');
  const [reference, setReference] = useState('');
  const [bankOrigin, setBankOrigin] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bcvRate = APP_CONFIG.DEFAULT_BCV_RATE;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await apiClient.get('/subscription/plans');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((p: any) => ({
          code: p.code,
          name: p.name,
          monthlyUSD: Number(p.monthly_fee_usd),
          annualUSD: Number(p.annual_fee_usd),
          desc: p.description || 'Plan dinámico de la plataforma SaaS',
          features: p.features_list || [
            `Hasta ${p.max_users || 'Ilimitados'} usuarios`,
            `Hasta ${p.max_products || 'Ilimitados'} productos`,
            `Impresión Fiscal: ${p.has_fiscal_printing ? 'Habilitada' : 'No'}`
          ],
          popular: p.is_featured || false,
        }));
        setPlans(mapped);
        setSelectedPlan(mapped[0].code);
      }
    } catch (err) {
      console.error('Error fetching plans from DB:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const currentPlan = plans.find(p => p.code === selectedPlan) || plans[0] || DEFAULT_PLANS[0];
  const priceUSD = currentPlan ? (billingCycle === 'MONTHLY' ? currentPlan.monthlyUSD : currentPlan.annualUSD) : 0;
  const priceBs = priceUSD * bcvRate;

  const handleOpenPayment = (planCode: string) => {
    setSelectedPlan(planCode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setErrorMessage('Debes ingresar la referencia del pago.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.post('/subscription/payments', {
        plan_code: selectedPlan,
        billing_cycle: billingCycle,
        amount_usd: priceUSD,
        amount_bcv_bs: priceBs,
        bcv_rate_used: bcvRate,
        payment_method: paymentMethod,
        payment_reference: reference.trim(),
        bank_origin: bankOrigin.trim() || 'Banco Nacional',
        notes: notes.trim(),
      });

      setSuccessMessage('¡Reporte de pago enviado con éxito! El Super Admin validará la transferencia para activar tu cuenta.');
      setIsModalOpen(false);
      setReference('');
      setBankOrigin('');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error al enviar el reporte de pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header Sally UX Standard */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Planes y Suscripción SaaS</h1>
            <p className="text-xs text-slate-500 font-medium">
              Selecciona el plan que mejor se adapte a tu empresa y registra tu pago para activación instantánea
            </p>
          </div>
        </div>

        {/* Toggle mensual/anual */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'MONTHLY' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Facturación Mensual
          </button>
          <button
            onClick={() => setBillingCycle('ANNUAL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              billingCycle === 'ANNUAL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Anual</span>
            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black">Ahorra 15%</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid de Tarjetas de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const costUSD = billingCycle === 'MONTHLY' ? p.monthlyUSD : p.annualUSD;
          const isSelected = selectedPlan === p.code;

          return (
            <div
              key={p.code}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                p.popular
                  ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-500/20'
                  : 'border-slate-100 shadow-sm hover:border-slate-200'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Más Popular</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{p.desc}</p>
                </div>

                {/* Banner Cifra Numérica Sally Standard */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-4 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-500 font-bold">$</span>
                    <span className="font-mono font-black text-3xl text-slate-900 tracking-tight">{costUSD}</span>
                    <span className="text-xs text-slate-400 font-medium">{billingCycle === 'MONTHLY' ? ' / mes' : ' / año'}</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 font-semibold">
                    Eqv. Bs. {(costUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} (Tasa BCV {bcvRate})
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Incluye:</span>
                  {p.features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleOpenPayment(p.code)}
                className={`w-full mt-6 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  p.popular
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                Adquirir {p.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Sally Enterprise Standard de Registro de Pago */}
      {isModalOpen && (
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
                    Plan seleccionado: <strong className="text-indigo-600">{SAAS_PLAN_NAMES[selectedPlan] || selectedPlan}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitPayment} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {errorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Resumen Financiero Sally Standard */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Monto en Divisa</span>
                    <span className="font-mono font-black text-2xl text-slate-900">${priceUSD.toFixed(2)} USD</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Monto a Transferir (BCV)</span>
                    <span className="font-mono font-black text-2xl text-emerald-700">Bs. {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Método de Pago *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['TRANSFER', 'PAGO_MOVIL', 'ZELLE'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                            paymentMethod === method
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {method === 'TRANSFER' ? 'Transferencia' : method === 'PAGO_MOVIL' ? 'Pago Móvil' : 'Zelle'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Número de Referencia / Comprobante *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 00129845"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Banco de Origen *
                      </label>
                      <select
                        value={bankOrigin}
                        onChange={(e) => setBankOrigin(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                      >
                        <option value="">Selecciona un Banco...</option>
                        {VENEZUELAN_BANKS.map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.code} - {b.name}
                          </option>
                        ))}
                        <option value="OTRO_BANCO_INTERNACIONAL">Otro / Banco Internacional (Zelle/Otros)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Notas Adicionales (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Información extra sobre el pago..."
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Enviando Reporte...' : 'Enviar Reporte de Pago'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
