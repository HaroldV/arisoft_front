'use client';

import React from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Edit2,
  LogIn,
  Lock,
  Unlock,
  Building2
} from 'lucide-react';
import { TenantCompany } from '../SuperAdminBackoffice';
import { ActionTooltip } from '@/components/ActionTooltip';
import { TENANT_STATUS, SAAS_PLAN_NAMES, APP_CONFIG } from '@/constants/domain-constants';

interface TenantsTableProps {
  tenants: TenantCompany[];
  isLoading: boolean;
  viewMode: 'CARDS' | 'TABLE';
  setViewMode: (mode: 'CARDS' | 'TABLE') => void;
  onOpenModal: (tenant?: TenantCompany) => void;
  onImpersonate: (tenant: TenantCompany) => void;
  onReactivateOwner: (tenant: TenantCompany) => void;
  onToggleStatusRequest: (tenant: TenantCompany) => void;
  getInitials: (name: string) => string;
}

export const TenantsTable: React.FC<TenantsTableProps> = ({
  tenants,
  isLoading,
  viewMode,
  setViewMode,
  onOpenModal,
  onImpersonate,
  onReactivateOwner,
  onToggleStatusRequest,
  getInitials,
}) => {
  return (
    <div className="space-y-4">
      {/* Search & View Mode Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <ActionTooltip content="Vista de lista detallada">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white shadow-sm text-indigo-600 border border-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista en tabla"
              >
                <List className="w-4 h-4" />
              </button>
            </ActionTooltip>
            <ActionTooltip content="Vista de tarjetas">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white shadow-sm text-indigo-600 border border-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista en tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </ActionTooltip>
          </div>
        </div>

        <button
          onClick={() => onOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Empresa</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mb-3 text-indigo-400" />
          <p className="text-sm font-semibold">Cargando organizaciones...</p>
        </div>
      )}

      {/* VISTA 1: CUADRÍCULA DE TARJETAS EJECUTIVAS */}
      {!isLoading && viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${t.logo_color || 'bg-blue-600'} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm shadow-blue-200`}>
                      {getInitials(t.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors" title={t.name}>
                        {t.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                          {t.subdomain}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {t.tax_id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border shrink-0 ${
                    t.status === TENANT_STATUS.ACTIVE
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {t.status === TENANT_STATUS.ACTIVE ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="bg-slate-50/80 border border-slate-100/90 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="font-mono font-black text-slate-900 text-base">{t.user_count}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                      Usuarios ({t.max_users})
                    </p>
                  </div>
                  <div className="border-x border-slate-200/70">
                    <p className="font-mono font-black text-slate-900 text-base">{t.product_count}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                      Catálogo
                    </p>
                  </div>
                  <div>
                    <p className="font-mono font-black text-indigo-700 text-base">${t.monthly_fee_usd}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                      Plan / Mes
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                  <span>Creada el {t.created_at || '28/7/2026'}</span>
                  <span className="font-bold text-slate-700 uppercase text-[10px]">
                    Plan {SAAS_PLAN_NAMES[t.plan_name] || t.plan_name}
                  </span>
                </div>
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => onImpersonate(t)}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all text-center cursor-pointer shadow-2xs"
                >
                  Gestionar
                </button>
                <button
                  onClick={() => onImpersonate(t)}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-all text-center cursor-pointer shadow-2xs"
                  title="Iniciar sesión en esta cuenta"
                >
                  Impersonar
                </button>
                <button
                  onClick={() => onOpenModal(t)}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-all text-center cursor-pointer shadow-2xs"
                >
                  Editar
                </button>
                {t.owner_is_active === false && (
                  <button
                    onClick={() => onReactivateOwner(t)}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 transition-all text-center cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    title="Reactivar cuenta de usuario inactiva o bloqueada"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reactivar</span>
                  </button>
                )}
                <button
                  onClick={() => onToggleStatusRequest(t)}
                  className={`flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold transition-all text-center cursor-pointer shadow-2xs ${
                    t.status === TENANT_STATUS.ACTIVE ? 'text-rose-600 hover:bg-rose-50 hover:border-rose-200' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                >
                  {t.status === TENANT_STATUS.ACTIVE ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VISTA 2: DATA TABLE CLÁSICA */}
      {!isLoading && viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Empresa / Razón Social</th>
                <th className="py-3 px-4">RIF Fiscal</th>
                <th className="py-3 px-4">Plan SaaS</th>
                <th className="py-3 px-4 text-center">Usuarios</th>
                <th className="py-3 px-4 text-center">Catálogo</th>
                <th className="py-3 px-4 text-right">Mensualidad ($)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${t.logo_color || 'bg-blue-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                        {getInitials(t.name)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {t.subdomain}.{APP_CONFIG.SAAS_DOMAIN}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{t.tax_id}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      t.plan_name === 'CORPORATIVO'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : t.plan_name === 'COMERCIAL_PRO'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {SAAS_PLAN_NAMES[t.plan_name] || t.plan_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                    {t.user_count} / {t.max_users}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                    {t.product_count} / {t.max_products}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-900 text-sm">
                        ${Number(t.monthly_fee_usd || 0).toFixed(2)}
                      </span>
                      {t.has_custom_pricing && (
                        <span className="text-[9px] font-sans font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded mt-0.5" title={t.pricing_notes || 'Tarifa especial negociada'}>
                          Especial
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      t.status === TENANT_STATUS.ACTIVE
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {t.status === TENANT_STATUS.ACTIVE ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ActionTooltip content="Impersonar / Gestionar">
                        <button
                          onClick={() => onImpersonate(t)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>
                      <ActionTooltip content="Editar empresa">
                        <button
                          onClick={() => onOpenModal(t)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>
                      {t.owner_is_active === false && (
                        <ActionTooltip content="Reactivar cuenta de propietario inactiva o bloqueada">
                          <button
                            onClick={() => onReactivateOwner(t)}
                            className="px-2 py-1 bg-amber-100 hover:bg-emerald-100 text-amber-800 hover:text-emerald-800 border border-amber-200 hover:border-emerald-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reactivar Usuario</span>
                          </button>
                        </ActionTooltip>
                      )}
                      <ActionTooltip content={t.status === 'ACTIVE' ? 'Suspender' : 'Activar'}>
                        <button
                          onClick={() => onToggleStatusRequest(t)}
                          className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                            t.status === 'ACTIVE' ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {t.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </ActionTooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <Building2 className="w-8 h-8 mb-3 text-slate-300" />
              <p className="text-sm font-semibold">No se encontraron empresas</p>
              <p className="text-xs mt-1">Ajusta los filtros o registra una nueva empresa</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
