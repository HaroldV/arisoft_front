'use client';

import React from 'react';
import {
  Building2,
  Users,
  Crown,
  Layers,
  DollarSign,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  Store,
  Zap,
  Globe,
  BarChart3,
  Lock,
  Unlock,
  LogIn,
  Copy,
} from 'lucide-react';
import { PlanModal } from './subcomponents/PlanModal';
import { TenantsTable } from './subcomponents/TenantsTable';
import { BillingTab } from './subcomponents/BillingTab';
import { MarketBiTab } from './subcomponents/MarketBiTab';
import { TenantModal } from './subcomponents/TenantModal';
import { TenantConfirmModal } from './subcomponents/TenantConfirmModal';
import { ManualBcvModal } from './subcomponents/ManualBcvModal';
import { useSuperAdminData, ALL_MODULE_GROUPS } from './hooks/useSuperAdminData';

export interface SaasPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  monthly_fee_usd: number;
  annual_fee_usd: number;
  max_users: number;
  max_products: number;
  max_warehouses: number;
  has_fiscal_printing: boolean;
  enabled_modules: string[];
  enabled_permissions: string[];
  features_list: string[];
  badge_text?: string;
  is_featured?: boolean;
  is_active: boolean;
}

export interface TenantCompany {
  id: string;
  name: string;
  tax_id: string;
  subdomain: string;
  plan_name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  user_count: number;
  inactive_user_count?: number;
  max_users: number;
  product_count: number;
  max_products: number;
  monthly_fee_usd: number;
  subscription_expires_at: string;
  created_at: string;
  enabled_modules: string[];
  enabled_permissions?: string[];
  owner_email: string;
  owner_name: string;
  owner_is_active?: boolean;
  owner_failed_attempts?: number;
  logo_color?: string;
}

export default function SuperAdminBackoffice() {
  const {
    activeTab, setActiveTab,
    viewMode, setViewMode,
    tenants,
    search, setSearch,
    statusFilter, setStatusFilter,
    isLoading,
    fetchError,
    masterBcvRate,
    masterEurRate,
    isSyncingBcv,
    bcvLastUpdated,
    isManualBcvModalOpen,
    setIsManualBcvModalOpen,
    handleSaveManualBcvRate,
    syncSuccess,
    syncError,
    isModalOpen, setIsModalOpen,
    editingTenant,
    formName, setFormName,
    formTaxId, setFormTaxId,
    formSubdomain, setFormSubdomain,
    saasPlans,
    billingCycle, setBillingCycle,
    isPlanModalOpen, setIsPlanModalOpen,
    editingPlan,
    planFormName, setPlanFormName,
    planFormCode, setPlanFormCode,
    planFormDesc, setPlanFormDesc,
    planFormMonthly, setPlanFormMonthly,
    planFormAnnual, setPlanFormAnnual,
    planFormUsers, setPlanFormUsers,
    planFormProducts, setPlanFormProducts,
    planFormWarehouses, setPlanFormWarehouses,
    planFormFiscalPrinting, setPlanFormFiscalPrinting,
    planFormBadge, setPlanFormBadge,
    planFormFeatured, setPlanFormFeatured,
    planFormFeaturesText, setPlanFormFeaturesText,
    isSavingPlan,
    planModalError,
    formPlan,
    formStatus, setFormStatus,
    formMaxUsers, setFormMaxUsers,
    formMaxProducts, setFormMaxProducts,
    formMonthlyFee, setFormMonthlyFee,
    formOwnerEmail, setFormOwnerEmail,
    formOwnerName, setFormOwnerName,
    formModules,
    formPermissions,
    expandedModuleGroups,
    isSaving,
    modalError,
    tenantToToggle,
    isConfirmModalOpen, setIsConfirmModalOpen,
    impersonatingTenant,
    newTenantPassword, setNewTenantPassword,
    passwordCopied,
    handleSelectPlanInForm,
    handleOpenPlanModal,
    handleSavePlan,
    handleTogglePlanStatus,
    handleTriggerBcvCron,
    handleOpenModal,
    handleToggleModule,
    handleToggleSubmodule,
    handleToggleModuleGroup,
    handleSaveTenant,
    handleToggleStatusRequest,
    executeToggleStatus,
    handleReactivateOwner,
    handleImpersonate,
    handleCopyPassword,
    totalMRR,
    activeTenantsCount,
    inactiveTenantsCount,
    filteredTenants,
    getInitials,
    fetchTenants,
  } = useSuperAdminData();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Header Fijo / Panorama Ejecutivo de Backoffice */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Super Admin & Backoffice SaaS
              </h1>
              <span className="font-mono text-[10px] font-bold uppercase text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-lg">
                MASTER PLATFORM
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Gestiona las organizaciones, licencias y empresas clientes de la plataforma
            </p>
          </div>
        </div>

        {/* Global Master BCV Service Card */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                  Tasa Maestra Global BCV
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{bcvLastUpdated}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500">USD:</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    Bs. {masterBcvRate.toFixed(2)}
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-200"></div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500">EUR:</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    Bs. {masterEurRate.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={handleTriggerBcvCron}
                    disabled={isSyncingBcv}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 active:bg-slate-100 border border-indigo-200 rounded-lg text-indigo-700 font-bold text-[11px] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                    title="Sincronizar tasas oficiales en vivo (USD y EUR) desde www.bcv.org.ve"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingBcv ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>{isSyncingBcv ? 'Sincronizando...' : 'Ejecutar Cronjob'}</span>
                  </button>

                  <button
                    onClick={() => setIsManualBcvModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200/80 rounded-lg text-indigo-800 font-bold text-[11px] transition-all shadow-2xs cursor-pointer"
                    title="Registrar o corregir tasas manualmente"
                  >
                    <Edit2 className="w-3 h-3 text-indigo-600" />
                    <span>Ajustar Manual</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notificaciones globales */}
      {syncSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {syncError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {fetchError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3 text-amber-800 text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Toast de nueva empresa con contraseña temporal */}
      {newTenantPassword && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50 border border-indigo-200 shadow-md animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">¡Empresa registrada exitosamente!</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Se creó el usuario propietario con la siguiente contraseña temporal. Compártela de forma segura.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Contraseña inicial:</span>
                  <code className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                    {newTenantPassword}
                  </code>
                  <button
                    onClick={handleCopyPassword}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-indigo-600 cursor-pointer"
                    title="Copiar contraseña"
                  >
                    {passwordCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setNewTenantPassword(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {impersonatingTenant && (
        <div className="p-4 rounded-2xl bg-indigo-900 text-white flex items-center justify-between shadow-xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <LogIn className="w-5 h-5 text-indigo-300 animate-pulse" />
            <div>
              <p className="font-bold text-sm">Impersonando a: {impersonatingTenant.name}</p>
              <p className="text-xs text-indigo-200">Iniciando sesión segura con permisos de administrador...</p>
            </div>
          </div>
          <span className="text-xs bg-indigo-800 border border-indigo-700 px-3 py-1 rounded-xl font-mono">
            {impersonatingTenant.subdomain}.erparisoft.com
          </span>
        </div>
      )}

      {/* 2. 4 Tarjetas KPI Panorámicas del SaaS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Organizaciones / Tenants</span>
            <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-mono font-black text-2xl text-slate-900 tracking-tight">
              {isLoading ? '—' : tenants.length} <span className="text-xs font-medium text-slate-500 font-sans">Empresas</span>
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {activeTenantsCount} Activas
              </span>
              <span>• {inactiveTenantsCount} Inactivas</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Facturación SaaS (MRR)</span>
            <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-mono font-black text-2xl text-emerald-700 tracking-tight">
              ${totalMRR.toFixed(2)} <span className="text-xs font-medium text-slate-500 font-sans">USD/mes</span>
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Bs. {(totalMRR * masterBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} proyectados
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Módulo Líder SaaS</span>
            <div className="p-2 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-bold text-xl text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-4 h-4 text-purple-600" />
              <span>POS & Inventario</span>
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Habilitado en el <strong className="text-slate-800">100% de las empresas</strong>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Usuarios Totales</span>
            <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-mono font-black text-2xl text-slate-900 tracking-tight">
              {tenants.reduce((acc, t) => acc + t.user_count, 0)} <span className="text-xs font-medium text-slate-500 font-sans">operadores</span>
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Capacidad contratada: <strong className="text-slate-800">{tenants.reduce((acc, t) => acc + t.max_users, 0)} licencias</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Sub-Pestañas de Navegación de Backoffice */}
      <div className="border-b border-slate-200/80 flex items-center justify-between overflow-x-auto custom-scrollbar pb-px">
        <div className="flex items-center gap-2">
          {[
            { id: 'TENANTS', label: 'Empresas & Organizaciones', icon: Building2 },
            { id: 'PLANS', label: 'Planes y Límites del SaaS', icon: Layers },
            { id: 'BILLING', label: 'Facturación & Suscripciones', icon: DollarSign },
            { id: 'MARKET_BI', label: 'Estudio de Mercado & Métricas', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. CONTENIDO DE PESTAÑAS */}

      {/* PESTAÑA 1: GESTIÓN DE EMPRESAS Y TENANTS (Desacoplado) */}
      {activeTab === 'TENANTS' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar empresa por Razón Social, RIF o subdominio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">Activas</option>
                <option value="SUSPENDED">Inactivas / Suspendidas</option>
              </select>
            </div>
          </div>

          <TenantsTable
            tenants={filteredTenants}
            isLoading={isLoading}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenModal={handleOpenModal}
            onImpersonate={handleImpersonate}
            onReactivateOwner={handleReactivateOwner}
            onToggleStatusRequest={handleToggleStatusRequest}
            getInitials={getInitials}
          />
        </div>
      )}

      {/* PESTAÑA 2: PLANES Y LÍMITES DEL SAAS DINÁMICOS */}
      {activeTab === 'PLANS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Estructura Comercial & Matriz de Planes</h3>
              <p className="text-xs text-slate-500 font-medium">Ajuste dinámico de tarifas, licencias y paquetes de prestaciones del SaaS</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    billingCycle === 'MONTHLY' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Facturación Mensual
                </button>
                <button
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === 'ANNUAL' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Facturación Anual</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold">
                    -15% (2 Meses Gratis)
                  </span>
                </button>
              </div>

              <button
                onClick={() => handleOpenPlanModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-200 cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Plan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {saasPlans.map((plan) => {
              const rawFee = billingCycle === 'MONTHLY' ? plan.monthly_fee_usd : plan.annual_fee_usd;
              const feeUSD = Number(rawFee || 0);
              const isFeatured = plan.is_featured;

              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-2xl space-y-4 relative flex flex-col justify-between transition-all ${
                    isFeatured
                      ? 'bg-gradient-to-b from-indigo-50/60 to-white border-2 border-indigo-500 shadow-md'
                      : 'bg-white border border-slate-100 shadow-sm'
                  }`}
                >
                  {plan.badge_text && (
                    <div className={`absolute -top-3 right-6 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs ${
                      isFeatured ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-slate-800'
                    }`}>
                      {plan.badge_text}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        isFeatured ? 'text-indigo-700 bg-indigo-100' : 'text-slate-500 bg-slate-100'
                      }`}>
                        Plan {plan.code}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-2">{plan.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{plan.description}</p>
                    </div>

                    <div className={`py-3 border-y ${isFeatured ? 'border-indigo-100' : 'border-slate-100'}`}>
                      <span className={`font-mono font-black text-3xl ${isFeatured ? 'text-indigo-700' : 'text-slate-900'}`}>
                        ${feeUSD.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {billingCycle === 'MONTHLY' ? ' / mes' : ' / año'}
                      </span>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        Equivalente a Bs. {(feeUSD * masterBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-700">
                      <li className="flex items-center gap-2">
                        <Check className={`w-4 h-4 shrink-0 ${isFeatured ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        <span>Hasta <strong>{plan.max_users} usuarios</strong> concurrentes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`w-4 h-4 shrink-0 ${isFeatured ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        <span>Hasta <strong>{plan.max_products.toLocaleString()} productos</strong> en catálogo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`w-4 h-4 shrink-0 ${isFeatured ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        <span>Hasta <strong>{plan.max_warehouses} Almacenes / Depósitos</strong></span>
                      </li>
                      {plan.has_fiscal_printing && (
                        <li className="flex items-center gap-2">
                          <Check className={`w-4 h-4 shrink-0 ${isFeatured ? 'text-indigo-600' : 'text-emerald-600'}`} />
                          <span>Soporte Impresora Fiscal & IGTF</span>
                        </li>
                      )}
                      {plan.features_list && plan.features_list.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className={`w-4 h-4 shrink-0 ${isFeatured ? 'text-indigo-600' : 'text-emerald-600'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      plan.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {plan.is_active ? 'Comercialmente Activo' : 'Inactivo'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPlanModal(plan)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Editar plan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleTogglePlanStatus(plan)}
                        className={`p-1.5 border rounded-lg transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                          plan.is_active
                            ? 'text-rose-600 hover:bg-rose-50 border-slate-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                        }`}
                        title={plan.is_active ? 'Desactivar plan' : 'Activar plan'}
                      >
                        {plan.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{plan.is_active ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: FACTURACIÓN Y SUSCRIPCIONES (Desacoplado) */}
      {activeTab === 'BILLING' && (
        <BillingTab
          tenants={tenants}
          masterBcvRate={masterBcvRate}
          onRefreshTenants={fetchTenants}
        />
      )}

      {/* PESTAÑA 4: ESTUDIO DE MERCADO Y MÉTRICAS GLOBALES (Desacoplado) */}
      {activeTab === 'MARKET_BI' && <MarketBiTab />}

      {/* MODAL 1: REGISTRAR / EDITAR EMPRESA (Desacoplado) */}
      <TenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTenant={editingTenant}
        onSave={handleSaveTenant}
        modalError={modalError}
        isSaving={isSaving}
        name={formName}
        setName={setFormName}
        taxId={formTaxId}
        setTaxId={setFormTaxId}
        subdomain={formSubdomain}
        setSubdomain={setFormSubdomain}
        plan={formPlan}
        onSelectPlan={handleSelectPlanInForm}
        status={formStatus}
        setStatus={setFormStatus}
        maxUsers={formMaxUsers}
        setMaxUsers={setFormMaxUsers}
        maxProducts={formMaxProducts}
        setMaxProducts={setFormMaxProducts}
        monthlyFee={formMonthlyFee}
        setMonthlyFee={setFormMonthlyFee}
        ownerName={formOwnerName}
        setOwnerName={setFormOwnerName}
        ownerEmail={formOwnerEmail}
        setOwnerEmail={setFormOwnerEmail}
        saasPlans={saasPlans}
        formModules={formModules}
        formPermissions={formPermissions}
        expandedModuleGroups={expandedModuleGroups}
        allModuleGroups={ALL_MODULE_GROUPS}
        onToggleModule={handleToggleModule}
        onToggleModuleGroup={handleToggleModuleGroup}
        onToggleSubmodule={handleToggleSubmodule}
      />

      {/* MODAL 2: ALERTA Y CONFIRMACIÓN DE SUSPENSIÓN (Desacoplado) */}
      <TenantConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        tenantToToggle={tenantToToggle}
        onConfirm={executeToggleStatus}
      />

      {/* MODAL 3: CREAR / EDITAR PLAN SAAS (Desacoplado) */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        editingPlan={editingPlan}
        onSave={handleSavePlan}
        modalError={planModalError}
        isSaving={isSavingPlan}
        name={planFormName}
        setName={setPlanFormName}
        code={planFormCode}
        setCode={setPlanFormCode}
        desc={planFormDesc}
        setDesc={setPlanFormDesc}
        monthlyFee={planFormMonthly}
        setMonthlyFee={setPlanFormMonthly}
        annualFee={planFormAnnual}
        setAnnualFee={setPlanFormAnnual}
        users={planFormUsers}
        setUsers={setPlanFormUsers}
        products={planFormProducts}
        setProducts={setPlanFormProducts}
        warehouses={planFormWarehouses}
        setWarehouses={setPlanFormWarehouses}
        fiscalPrinting={planFormFiscalPrinting}
        setFiscalPrinting={setPlanFormFiscalPrinting}
        badge={planFormBadge}
        setBadge={setPlanFormBadge}
        featured={planFormFeatured}
        setFeatured={setPlanFormFeatured}
        featuresText={planFormFeaturesText}
        setFeaturesText={setPlanFormFeaturesText}
      />

      {/* MODAL 4: REGISTRO / AJUSTE MANUAL DE TASAS MAESTRAS GLOBALES BCV */}
      <ManualBcvModal
        isOpen={isManualBcvModalOpen}
        onClose={() => setIsManualBcvModalOpen(false)}
        currentUsdRate={masterBcvRate}
        currentEurRate={masterEurRate}
        lastUpdated={bcvLastUpdated}
        onSaveManualRates={handleSaveManualBcvRate}
        onTriggerScrape={handleTriggerBcvCron}
        isSyncing={isSyncingBcv}
      />
    </div>
  );
}
