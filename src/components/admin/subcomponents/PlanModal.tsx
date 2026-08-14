'use client';

import React from 'react';
import { CreditCard, X, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { SaasPlan } from '../SuperAdminBackoffice';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan: SaasPlan | null;
  onSave: (e: React.FormEvent) => void;
  modalError: string | null;
  isSaving: boolean;
  name: string;
  setName: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  monthlyFee: number;
  setMonthlyFee: (v: number) => void;
  annualFee: number;
  setAnnualFee: (v: number) => void;
  users: number;
  setUsers: (v: number) => void;
  products: number;
  setProducts: (v: number) => void;
  warehouses: number;
  setWarehouses: (v: number) => void;
  fiscalPrinting: boolean;
  setFiscalPrinting: (v: boolean) => void;
  badge: string;
  setBadge: (v: string) => void;
  featured: boolean;
  setFeatured: (v: boolean) => void;
  featuresText: string;
  setFeaturesText: (v: string) => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  editingPlan,
  onSave,
  modalError,
  isSaving,
  name,
  setName,
  code,
  setCode,
  desc,
  setDesc,
  monthlyFee,
  setMonthlyFee,
  annualFee,
  setAnnualFee,
  users,
  setUsers,
  products,
  setProducts,
  warehouses,
  setWarehouses,
  fiscalPrinting,
  setFiscalPrinting,
  badge,
  setBadge,
  featured,
  setFeatured,
  featuresText,
  setFeaturesText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Capa 1: Header Fijo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {editingPlan ? `Editar Plan SaaS "${editingPlan.name}"` : 'Crear Nuevo Plan de Suscripción'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configuración de tarifas, cuotas de licencias y prestaciones de negocio
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

            {/* 1. Nombre & Identificación */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                1. Identificación del Plan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nombre Comercial del Plan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Plan Pyme Plus"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Código Único (UPPERCASE) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlan}
                    placeholder="PYME_PLUS"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none uppercase disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Descripción Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="Ideal para distribuidoras medianas y comercios en crecimiento"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Tarifas USD */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                2. Estructura de Precios ($ USD)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Cuota Mensual ($ USD/mes) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-mono text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={monthlyFee}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setMonthlyFee(val);
                        setAnnualFee(val * 10);
                      }}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Cuota Anual ($ USD/año) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-mono text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={annualFee}
                      onChange={(e) => setAnnualFee(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-700 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Límites Operativos & Prestaciones */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                3. Capacidad & Límites Operativos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Usuarios Máx.
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={users}
                    onChange={(e) => setUsers(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs font-bold focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Catálogo Máx.
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={products}
                    onChange={(e) => setProducts(parseInt(e.target.value) || 100)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs font-bold focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Almacenes Máx.
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={warehouses}
                    onChange={(e) => setWarehouses(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs font-bold focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Etiqueta de Destaque (Badge)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Recomendado / Más Vendido"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fiscalPrinting}
                      onChange={(e) => setFiscalPrinting(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Impresión Fiscal & IGTF</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Destacar Tarjeta</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 4. Lista de Beneficios para Tarjetas */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                4. Viñetas de Beneficios Comerciales (Una por línea)
              </label>
              <textarea
                rows={4}
                placeholder="Ej. Soporte prioritario 24/7 (escribe un beneficio por línea)"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none custom-scrollbar"
              />
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
              <span>{isSaving ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan SaaS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
