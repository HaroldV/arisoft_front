'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { SAAS_PLAN_CODES, SAAS_PLAN_TIER_ORDER } from '@/constants/domain-constants';
import { SubscriptionHeroBanner } from './subcomponents/SubscriptionHeroBanner';
import { PlanCard, type PlanItem } from './subcomponents/PlanCard';
import { PaymentAuditBanner } from './subcomponents/PaymentAuditBanner';
import { PaymentReportModal } from './subcomponents/PaymentReportModal';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>(SAAS_PLAN_CODES.COMERCIAL_PRO);

  // Subscription Status & Payment Review State
  const [subscriptionStatus, setSubscriptionStatus] = useState<any | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        const mapped: PlanItem[] = plansRes.data.map((p: any) => ({
          code: p.code,
          name: p.name,
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
    } catch (err) {
      console.error('Error fetching plans from DB:', err);
      setErrorMessage('No se pudieron cargar los planes desde el servidor.');
    } finally {
      setIsLoadingPlans(false);
      setIsLoadingStatus(false);
    }
  };

  const hasPendingPayment = Boolean(subscriptionStatus?.has_pending_payment);
  const lastReceipt = subscriptionStatus?.last_receipt;
  const isRejected = lastReceipt?.status === 'REJECTED';

  const currentPlanCode = subscriptionStatus?.current_plan?.code;
  const currentTier = currentPlanCode ? (SAAS_PLAN_TIER_ORDER[currentPlanCode] || 0) : 0;

  // Filtrar exclusivamente los planes superiores al actual (jerarquía ascendente)
  const availableUpgradePlans = plans.filter((p) => {
    const planTier = SAAS_PLAN_TIER_ORDER[p.code] || 0;
    return planTier > currentTier;
  });

  const handleOpenPayment = (planCode: string) => {
    if (hasPendingPayment) {
      setErrorMessage('Actualmente tienes un reporte de pago en proceso de verificación por el equipo de ArivSoft.');
      return;
    }
    setSelectedPlan(planCode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setSuccessMessage('¡Reporte de pago enviado con éxito! El equipo de ArivSoft verificará el comprobante para activar tu empresa.');
    await fetchInitialData();
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
              Gestiona tu suscripción activa y escala a planes superiores según las necesidades de tu empresa
            </p>
          </div>
        </div>
      </div>

      {/* HERO BANNER: TU PLAN ACTUAL */}
      {!isLoadingStatus && subscriptionStatus?.current_plan && (
        <SubscriptionHeroBanner
          currentPlan={subscriptionStatus.current_plan}
          hasPendingPayment={hasPendingPayment}
          onOpenPayment={handleOpenPayment}
        />
      )}

      {/* BANNERS DE AUDITORÍA Y OBSERVACIONES */}
      <PaymentAuditBanner
        hasPendingPayment={hasPendingPayment}
        isRejected={isRejected}
        lastReceipt={lastReceipt}
        onRetryPayment={() => handleOpenPayment(selectedPlan)}
      />

      {/* Mensajes de Éxito / Error */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CATÁLOGO DE PLANES Y UPGRADES DISPONIBLES */}
      {isLoadingPlans ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 flex flex-col items-center justify-center gap-3 shadow-sm min-h-[300px]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando opciones de planes y beneficios...</p>
        </div>
      ) : availableUpgradePlans.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentPlanCode ? 'Opciones de Escalabilidad y Planes Superiores' : 'Planes Disponibles'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Sube de nivel para habilitar más módulos, almacenes y usuarios concurrentes para tu organización.
              </p>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${availableUpgradePlans.length === 1 ? 'max-w-md mx-auto' : availableUpgradePlans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'} gap-6`}>
            {availableUpgradePlans.map((p) => (
              <PlanCard
                key={p.code}
                plan={p}
                hasPendingPayment={hasPendingPayment}
                onSelectPlan={handleOpenPayment}
              />
            ))}
          </div>
        </div>
      ) : subscriptionStatus?.current_plan ? (
        /* Máximo Plan Alcanzado */
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 rounded-3xl border border-indigo-100 p-8 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            ¡Tu empresa cuenta con el Plan Corporativo Enterprise!
          </h3>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Actualmente dispones del nivel máximo de la plataforma. Tienes acceso completo a todos los módulos y la mayor capacidad de usuarios e inventario.
          </p>
        </div>
      ) : null}

      {/* Modal de Registro de Pago */}
      <PaymentReportModal
        isOpen={isModalOpen}
        selectedPlan={selectedPlan}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
