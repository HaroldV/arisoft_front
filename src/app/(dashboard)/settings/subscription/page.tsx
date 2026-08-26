'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, Check, ShieldCheck, DollarSign, Building2, Upload, AlertCircle, 
  Sparkles, CheckCircle2, Loader2, Image as ImageIcon, Trash2, Calendar, Clock, 
  MessageCircle, AlertTriangle, RefreshCw, XCircle, ArrowUpRight, Zap, Users, 
  Package, HelpCircle, Layers, Shield, FileText, ChevronRight, Info
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { APP_CONFIG, SAAS_PLAN_NAMES } from '@/constants/domain-constants';
import { VENEZUELAN_BANKS } from '@/constants/venezuela';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('COMERCIAL_PRO');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [activeRate, setActiveRate] = useState<number>(APP_CONFIG.DEFAULT_BCV_RATE);
  const [rateLabel, setRateLabel] = useState<string>('Tasa BCV');

  // Subscription Status & Payment Review State
  const [subscriptionStatus, setSubscriptionStatus] = useState<any | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingPlans(true);
    setIsLoadingStatus(true);
    try {
      // 1. Obtener Planes Vivos de la Base de Datos
      const plansRes = await apiClient.get('/subscription/plans');
      if (plansRes.data && Array.isArray(plansRes.data) && plansRes.data.length > 0) {
        const mapped = plansRes.data.map((p: any) => ({
          code: p.code,
          name: p.name,
          monthlyUSD: Number(p.monthly_fee_usd),
          annualUSD: Number(p.annual_fee_usd),
          desc: p.description || 'Plan oficial de la plataforma SaaS',
          badgeText: p.badge_text,
          features: p.features_list && p.features_list.length > 0
            ? p.features_list
            : [
                `Hasta ${p.max_users || 'Ilimitados'} usuarios concurrentes`,
                `Hasta ${p.max_products || 'Ilimitados'} productos en catálogo`,
                `Almacenes: ${p.max_warehouses || 1}`,
                `Impresión Fiscal & IGTF: ${p.has_fiscal_printing ? 'Habilitada' : 'No incluida'}`
              ],
          popular: p.is_featured || false,
        }));
        setPlans(mapped);
        setSelectedPlan(mapped.find((m: any) => m.popular)?.code || mapped[0]?.code || 'COMERCIAL_PRO');
      }

      // 2. Obtener Estado Actual del Pago de Suscripción
      try {
        const statusRes = await apiClient.get('/subscription/my-status');
        if (statusRes.data) {
          setSubscriptionStatus(statusRes.data);
        }
      } catch (statusErr) {
        console.warn('No se pudo obtener el estado de suscripción:', statusErr);
      }

      // 3. Obtener Tasa de Cambio Activa Oficial
      try {
        const rateRes = await apiClient.get('/settings/company/currency');
        if (rateRes.data && rateRes.data.success && rateRes.data.settings) {
          const settings = rateRes.data.settings;
          const currentRate = settings.currencyMode === 'MANUAL'
            ? Number(settings.manualExchangeRate || APP_CONFIG.DEFAULT_BCV_RATE)
            : settings.officialCurrency === 'EUR'
              ? Number(settings.bcvRateEur || APP_CONFIG.DEFAULT_BCV_RATE)
              : Number(settings.bcvRateUsd || APP_CONFIG.DEFAULT_BCV_RATE);

          setActiveRate(currentRate);
          setRateLabel(settings.currencyMode === 'MANUAL' ? 'Tasa Propia' : `Tasa BCV (${settings.officialCurrency || 'USD'})`);
        }
      } catch (rateErr) {
        console.warn('Usando tasa fallback:', rateErr);
      }
    } catch (err) {
      console.error('Error fetching plans from DB:', err);
      setErrorMessage('No se pudieron cargar los planes desde el servidor.');
    } finally {
      setIsLoadingPlans(false);
      setIsLoadingStatus(false);
    }
  };

  const currentPlan = plans.find(p => p.code === selectedPlan) || plans[0];
  const priceUSD = currentPlan ? (billingCycle === 'MONTHLY' ? currentPlan.monthlyUSD : currentPlan.annualUSD) : 0;
  const priceBs = priceUSD * activeRate;

  // Sincronizar montos pagados por defecto cuando cambia el plan o ciclo
  useEffect(() => {
    setPaidAmountUsd(priceUSD);
    setPaidAmountBs(priceBs);
  }, [priceUSD, priceBs]);

  const hasPendingPayment = subscriptionStatus?.has_pending_payment;
  const lastReceipt = subscriptionStatus?.last_receipt;
  const isRejected = lastReceipt?.status === 'REJECTED';

  const handleOpenPayment = (planCode: string) => {
    if (hasPendingPayment) {
      setErrorMessage('Actualmente tienes un reporte de pago en proceso de verificación por el equipo de ArivSoft. No puedes registrar un nuevo pago hasta que el anterior sea procesado.');
      return;
    }
    setSelectedPlan(planCode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setReference('');
    setBankOrigin('');
    setZelleOwner('');
    setZelleEmail('');
    setBinanceId('');
    setBinanceEmail('');
    setReceiptImage(null);
    setReceiptFileName('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

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

  const handleSubmitPayment = async (e: React.FormEvent) => {
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
    } else if (paymentMethod === 'BINANCE') {
      if (!binanceId.trim()) {
        setErrorMessage('Debes ingresar el Binance ID o Pay ID.');
        return;
      }
      if (!binanceEmail.trim() || !binanceEmail.includes('@')) {
        setErrorMessage('Debes ingresar un correo electrónico válido asociado a Binance.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.post('/subscription/payments', {
        plan_code: selectedPlan,
        billing_cycle: billingCycle,
        amount_usd: paidAmountUsd > 0 ? paidAmountUsd : priceUSD,
        amount_bcv_bs: (paymentMethod === 'TRANSFER' || paymentMethod === 'PAGO_MOVIL') ? paidAmountBs : 0,
        bcv_rate_used: activeRate,
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

      setSuccessMessage('¡Reporte de pago enviado con éxito! El equipo de ArivSoft verificará el comprobante para activar tu empresa.');
      setIsModalOpen(false);
      await fetchInitialData();
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

      {/* HERO BANNER: TU PLAN ACTUAL (Sally Modern Executive Suite) */}
      {!isLoadingStatus && subscriptionStatus?.current_plan && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
          {/* Subtle Ambient Light Orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            {/* Top Identity Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-white/10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="p-3.5 bg-gradient-to-br from-indigo-500/30 to-violet-500/20 backdrop-blur-md rounded-2xl border border-white/20 text-white shadow-inner shrink-0">
                  <Zap className="w-7 h-7 text-amber-300 fill-amber-300/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
                      Suscripción Activa
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Operativo al 100%
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                    Plan {subscriptionStatus.current_plan.name}
                  </h2>
                  <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                    Tu empresa cuenta con acceso total a los módulos y capacidades de este nivel.
                  </p>
                </div>
              </div>

              {/* Botón de Acción Principal de Suscripción */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenPayment(subscriptionStatus.current_plan.code)}
                  disabled={hasPendingPayment}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-700 active:to-teal-700 text-white font-black text-xs rounded-2xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Reportar Pago / Renovar Cuota</span>
                  <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 -translate-y-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* Medidores de Capacidad & Uso (Interactive Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tarjeta 1: Cuota Mensual */}
              <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tarifa Mensual</span>
                  <DollarSign className="w-4 h-4 opacity-70" />
                </div>
                <div className="mt-3">
                  <p className="font-mono font-black text-2xl text-white">
                    ${Number(subscriptionStatus.current_plan.monthly_fee_usd).toFixed(2)}
                    <span className="text-xs font-semibold text-indigo-200 font-sans ml-1">USD/mes</span>
                  </p>
                  <p className="text-[10px] font-medium text-indigo-300/80 mt-1">
                    Equiv. Bs. {(Number(subscriptionStatus.current_plan.monthly_fee_usd) * activeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Tarjeta 2: Usuarios y Licencias */}
              <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Usuarios & Licencias</span>
                  <Users className="w-4 h-4 opacity-70" />
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono font-black text-2xl text-white">
                      {subscriptionStatus.current_plan.user_count}
                      <span className="text-xs font-semibold text-indigo-200 font-sans ml-1">/ {subscriptionStatus.current_plan.max_users} activos</span>
                    </p>
                    <span className="text-[10px] font-bold text-indigo-300">
                      {Math.round((subscriptionStatus.current_plan.user_count / subscriptionStatus.current_plan.max_users) * 100)}%
                    </span>
                  </div>
                  {/* Mini Progress Bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (subscriptionStatus.current_plan.user_count / subscriptionStatus.current_plan.max_users) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Catálogo de Productos */}
              <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inventario & Catálogo</span>
                  <Package className="w-4 h-4 opacity-70" />
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono font-black text-2xl text-white">
                      {subscriptionStatus.current_plan.product_count}
                      <span className="text-xs font-semibold text-indigo-200 font-sans ml-1">
                        / {subscriptionStatus.current_plan.max_products >= 999999 ? 'Ilimitado' : subscriptionStatus.current_plan.max_products}
                      </span>
                    </p>
                    {subscriptionStatus.current_plan.max_products < 999999 && (
                      <span className="text-[10px] font-bold text-indigo-300">
                        {Math.round((subscriptionStatus.current_plan.product_count / subscriptionStatus.current_plan.max_products) * 100)}%
                      </span>
                    )}
                  </div>
                  {/* Mini Progress Bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{
                        width: subscriptionStatus.current_plan.max_products >= 999999
                          ? '15%'
                          : `${Math.min(100, (subscriptionStatus.current_plan.product_count / subscriptionStatus.current_plan.max_products) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 4: Próximo Vencimiento */}
              <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Próxima Renovación</span>
                  <Calendar className="w-4 h-4 opacity-70" />
                </div>
                <div className="mt-3">
                  <p className="font-mono font-bold text-lg text-emerald-300">
                    {subscriptionStatus.current_plan.subscription_expires_at || 'Al día'}
                  </p>
                  <p className="text-[10px] font-medium text-indigo-200/80 mt-1">
                    Facturación recurrente activa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BANNER 1: REPORTE EN AUDITORÍA (BLOQUEO AMIGABLE) */}
      {hasPendingPayment && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Tu Reporte de Pago está en Proceso de Verificación
                </h4>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  El equipo de administración de ArivSoft está conciliando tu comprobante. Tu servicio se mantiene activo mientras se procesa.
                </p>
              </div>
            </div>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3.5 py-1 rounded-full shrink-0">
              ⏳ En Revisión
            </span>
          </div>

          {/* Micro-tarjetas con datos del comprobante */}
          {lastReceipt && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/90 border border-amber-100 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Método</span>
                <span className="font-bold text-xs text-slate-800">{lastReceipt.payment_method}</span>
              </div>
              <div className="bg-white/90 border border-amber-100 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Referencia / ID</span>
                <span className="font-mono font-bold text-xs text-slate-800 truncate block">{lastReceipt.payment_reference}</span>
              </div>
              <div className="bg-white/90 border border-amber-100 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monto</span>
                <span className="font-mono font-bold text-xs text-emerald-700">${Number(lastReceipt.amount_usd).toFixed(2)} USD</span>
              </div>
              <div className="bg-white/90 border border-amber-100 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fecha Enviado</span>
                <span className="font-mono font-semibold text-xs text-slate-700">
                  {lastReceipt.payment_date ? new Date(lastReceipt.payment_date).toLocaleDateString('es-VE') : new Date(lastReceipt.created_at).toLocaleDateString('es-VE')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BANNER 2: REPORTE OBSERVADO / RECHAZADO */}
      {!hasPendingPayment && isRejected && (
        <div className="bg-gradient-to-r from-rose-50 via-slate-50 to-red-50/50 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-rose-100 border border-rose-200 text-rose-800 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Observación en tu Reporte de Pago Anterior
                </h4>
                <p className="text-xs text-rose-700 font-semibold mt-0.5">
                  Motivo: {lastReceipt.rejection_reason || 'Discrepancia en el comprobante bancario.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://wa.me/584120000000?text=Hola%20ArivSoft,%20tengo%20una%20duda%20sobre%20mi%20reporte%20de%20pago%20Ref:%20${lastReceipt.payment_reference}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar Soporte</span>
              </a>
              <button
                onClick={() => handleOpenPayment(selectedPlan)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                Reenviar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* CATÁLOGO DE PLANES Y UPGRADES DISPONIBLES */}
      {isLoadingPlans ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 flex flex-col items-center justify-center gap-3 shadow-sm min-h-[350px]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando planes oficiales y tarifas en vivo...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-600">No hay planes activos disponibles en este momento.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Opciones de Planes & Escalabilidad
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Puedes cambiarte a un plan superior en cualquier momento para desbloquear más usuarios y módulos.
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
              1 USD = Bs. {activeRate.toFixed(2)} ({rateLabel})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const costUSD = billingCycle === 'MONTHLY' ? p.monthlyUSD : p.annualUSD;
              const isCurrentPlan = subscriptionStatus?.current_plan?.code === p.code;

              return (
                <div
                  key={p.code}
                  className={`bg-white rounded-3xl border p-7 flex flex-col justify-between transition-all duration-300 relative group ${
                    isCurrentPlan
                      ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/25 via-white to-white'
                      : p.popular
                      ? 'border-indigo-500/80 shadow-xl ring-2 ring-indigo-500/15 hover:shadow-2xl hover:-translate-y-1'
                      : 'border-slate-200/80 shadow-sm hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Badges Flotantes */}
                  {isCurrentPlan ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Tu Plan Activo</span>
                    </div>
                  ) : p.popular ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{p.badgeText || 'Recomendado'}</span>
                    </div>
                  ) : null}

                  <div className="space-y-5">
                    {/* Header del Plan */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                        {p.code === 'CORPORATIVO' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700">
                            Enterprise
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{p.desc}</p>
                    </div>

                    {/* Precios Luminosos */}
                    <div className={`rounded-2xl p-4.5 border transition-all ${
                      isCurrentPlan 
                        ? 'bg-emerald-50/60 border-emerald-200/80'
                        : 'bg-slate-50/80 border-slate-200/80 group-hover:bg-indigo-50/40 group-hover:border-indigo-100'
                    }`}>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-500">$</span>
                        <span className={`font-mono font-black text-3xl sm:text-4xl tracking-tight ${isCurrentPlan ? 'text-emerald-950' : 'text-slate-900'}`}>
                          {costUSD}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {billingCycle === 'MONTHLY' ? ' USD / mes' : ' USD / año'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono font-semibold text-slate-500 mt-1">
                        ≈ Bs. {(costUSD * activeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Lista de Capacidades */}
                    <div className="space-y-2.5 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Beneficios & Módulos:
                      </span>
                      {p.features.map((feat: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                          <div className={`p-0.5 rounded-md mt-0.5 shrink-0 ${isCurrentPlan ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón de Acción Interactivo */}
                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenPayment(p.code)}
                      disabled={hasPendingPayment}
                      className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                        hasPendingPayment
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : isCurrentPlan
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white shadow-md shadow-emerald-200'
                          : p.popular
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white shadow-md shadow-indigo-200'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {hasPendingPayment ? (
                        <span>En Revisión por ArivSoft</span>
                      ) : isCurrentPlan ? (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Reportar Pago / Renovar</span>
                        </>
                      ) : (
                        <>
                          <span>Actualizar a Plan {p.name}</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Monto Oficial ($ USD)</span>
                    <span className="font-mono font-black text-2xl text-slate-900">${priceUSD.toFixed(2)} USD</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Equivalente BCV</span>
                    <span className="font-mono font-black text-2xl text-emerald-700">Bs. {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Método de Pago *
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
                            value={paidAmountBs}
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
                            value={paidAmountUsd}
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
                            value={paidAmountUsd}
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

                  {/* DROPZONE DE CAPTURE OBLIGATORIO (Sally UX Standard) */}
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
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
}
