'use client';

import React from 'react';
import { Building2, X, AlertCircle, RefreshCw, Check, ChevronDown } from 'lucide-react';
import { TenantCompany, SaasPlan } from '../SuperAdminBackoffice';
import { RifValidator } from '@/utils/rif-validator';

interface ModuleSubmodule {
  key: string;
  label: string;
  desc: string;
}

interface ModuleGroup {
  key: string;
  label: string;
  color: string;
  submodules: ModuleSubmodule[];
}

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTenant: TenantCompany | null;
  onSave: (e: React.FormEvent) => void;
  modalError: string | null;
  isSaving: boolean;
  name: string;
  setName: (v: string) => void;
  taxId: string;
  setTaxId: (v: string) => void;
  subdomain: string;
  setSubdomain: (v: string) => void;
  plan: string;
  onSelectPlan: (v: string) => void;
  status: 'ACTIVE' | 'SUSPENDED';
  setStatus: (v: 'ACTIVE' | 'SUSPENDED') => void;
  maxUsers: number;
  setMaxUsers: (v: number) => void;
  maxProducts: number;
  setMaxProducts: (v: number) => void;
  monthlyFee: number;
  setMonthlyFee: (v: number) => void;
  ownerName: string;
  setOwnerName: (v: string) => void;
  ownerEmail: string;
  setOwnerEmail: (v: string) => void;
  saasPlans: SaasPlan[];
  formModules: string[];
  formPermissions: string[];
  expandedModuleGroups: string[];
  allModuleGroups: ModuleGroup[];
  onToggleModule: (key: string) => void;
  onToggleModuleGroup: (key: string) => void;
  onToggleSubmodule: (groupKey: string, subKey: string) => void;
}

export const TenantModal: React.FC<TenantModalProps> = ({
  isOpen,
  onClose,
  editingTenant,
  onSave,
  modalError,
  isSaving,
  name,
  setName,
  taxId,
  setTaxId,
  subdomain,
  setSubdomain,
  plan,
  onSelectPlan,
  status,
  setStatus,
  maxUsers,
  setMaxUsers,
  maxProducts,
  setMaxProducts,
  monthlyFee,
  setMonthlyFee,
  ownerName,
  setOwnerName,
  ownerEmail,
  setOwnerEmail,
  saasPlans,
  formModules,
  formPermissions,
  expandedModuleGroups,
  allModuleGroups,
  onToggleModule,
  onToggleModuleGroup,
  onToggleSubmodule,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Capa 1: Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {editingTenant ? 'Editar Empresa & Límites SaaS' : 'Registrar Nueva Empresa (Onboarding)'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Asignación de RIF, subdominio, plan de suscripción y límites operativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capa 2: Cuerpo Scrollable */}
        <form onSubmit={onSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {modalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Fiscal Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                1. Datos Fiscales y Subdominio
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Razón Social / Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora JP"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      RIF Fiscal (J/V/G/E) *
                    </label>
                    {taxId && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        RifValidator.validate(taxId).isValid 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {RifValidator.validate(taxId).isValid ? '✓ SENIAT Válido' : '✗ RIF Invalido'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="J-12345678-9"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Subdominio de Acceso
                  </label>
                  <input
                    type="text"
                    placeholder="nuestrosaman"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none lowercase"
                  />
                </div>
              </div>
            </div>

            {/* Subscription & Limits */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                2. Plan SaaS, Estado y Límites Contratados
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Plan de Suscripción
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => onSelectPlan(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    {saasPlans.length > 0 ? (
                      saasPlans.map(p => (
                        <option key={p.id} value={p.code}>
                          {p.name} (${Number(p.monthly_fee_usd || 0).toFixed(2)}/mes - {p.max_users} Usuarios)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="EMPRENDEDOR">Emprendedor ($15.00/mes)</option>
                        <option value="COMERCIAL_PRO">Comercial Pro ($35.00/mes)</option>
                        <option value="CORPORATIVO">Corporativo ($60.00/mes)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="ACTIVE">Activa</option>
                    <option value="SUSPENDED">Inactiva (Suspendida)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Máximo de Usuarios
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Máximo de Productos
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={maxProducts}
                    onChange={(e) => setMaxProducts(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Cuota Mensual (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(Number(e.target.value))}
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                3. Contacto del Propietario / Gerente
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nombre del Propietario
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Correo de Acceso Principal *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@empresa.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Enabled Modules Matrix */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  4. Módulos y Permisos Habilitados
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">
                  {formModules.length} módulo{formModules.length !== 1 ? 's' : ''} · {formPermissions.length} permiso{formPermissions.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2">
                {allModuleGroups.map((group) => {
                  const moduleEnabled = formModules.includes(group.key);
                  const isExpanded = expandedModuleGroups.includes(group.key);
                  const enabledSubCount = group.submodules.filter(s => formPermissions.includes(s.key)).length;
                  const colorMap: Record<string, { header: string; active: string; badge: string; check: string; subRow: string }> = {
                    indigo: { header: 'bg-indigo-50 border-indigo-200', active: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', check: 'bg-indigo-600', subRow: 'hover:bg-indigo-50/50' },
                    emerald: { header: 'bg-emerald-50 border-emerald-200', active: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', check: 'bg-emerald-600', subRow: 'hover:bg-emerald-50/50' },
                    teal: { header: 'bg-teal-50 border-teal-200', active: 'text-teal-700', badge: 'bg-teal-100 text-teal-700', check: 'bg-teal-600', subRow: 'hover:bg-teal-50/50' },
                    blue: { header: 'bg-blue-50 border-blue-200', active: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', check: 'bg-blue-600', subRow: 'hover:bg-blue-50/50' },
                    purple: { header: 'bg-purple-50 border-purple-200', active: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', check: 'bg-purple-600', subRow: 'hover:bg-purple-50/50' },
                    amber: { header: 'bg-amber-50 border-amber-200', active: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', check: 'bg-amber-600', subRow: 'hover:bg-amber-50/50' },
                  };
                  const c = colorMap[group.color] || colorMap.indigo;

                  return (
                    <div key={group.key} className={`rounded-xl border overflow-hidden transition-all ${moduleEnabled ? c.header : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3 px-3.5 py-2.5">
                        <button
                          type="button"
                          onClick={() => onToggleModule(group.key)}
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            moduleEnabled ? `${c.check} border-transparent` : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {moduleEnabled && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleModuleGroup(group.key)}
                          className="flex-1 flex items-center justify-between cursor-pointer text-left"
                        >
                          <span className={`text-xs font-bold ${moduleEnabled ? c.active : 'text-slate-500'}`}>
                            {group.label}
                          </span>
                          <div className="flex items-center gap-2">
                            {moduleEnabled && enabledSubCount > 0 && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${c.badge}`}>
                                {enabledSubCount}/{group.submodules.length}
                              </span>
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-200/60 bg-white/80">
                          {group.submodules.map((sub, si) => {
                            const subEnabled = formPermissions.includes(sub.key);
                            return (
                              <button
                                key={sub.key}
                                type="button"
                                onClick={() => onToggleSubmodule(group.key, sub.key)}
                                className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-all cursor-pointer ${
                                  si < group.submodules.length - 1 ? 'border-b border-slate-100' : ''
                                } ${subEnabled ? c.subRow : 'hover:bg-slate-50'}`}
                              >
                                <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                  subEnabled ? `${c.check} border-transparent` : 'border-slate-300 bg-white'
                                }`}>
                                  {subEnabled && <Check className="w-2.5 h-2.5 text-white" />}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold leading-tight ${subEnabled ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {sub.label}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">
                                    {sub.desc}
                                  </p>
                                </div>
                                <code className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 self-center">
                                  {sub.key}
                                </code>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Capa 3: Footer Fijo */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-200 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Guardando...' : editingTenant ? 'Guardar Cambios' : 'Registrar Empresa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
