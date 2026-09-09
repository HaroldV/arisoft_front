'use client';

import React from 'react';
import { Sparkles, Check, ArrowUpRight } from 'lucide-react';

export interface PlanItem {
  code: string;
  name: string;
  desc: string;
  badgeText?: string;
  features: string[];
  popular?: boolean;
}

interface PlanCardProps {
  plan: PlanItem;
  hasPendingPayment: boolean;
  onSelectPlan: (planCode: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  hasPendingPayment,
  onSelectPlan,
}) => {
  return (
    <div
      className={`bg-white rounded-3xl border p-7 flex flex-col justify-between transition-all duration-300 relative group ${
        plan.popular
          ? 'border-indigo-500/80 shadow-xl ring-2 ring-indigo-500/15 hover:shadow-2xl hover:-translate-y-1'
          : 'border-slate-200/80 shadow-sm hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Badges Flotantes */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{plan.badgeText || 'Recomendado'}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Header del Plan */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            {plan.code === 'CORPORATIVO' && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-700 uppercase tracking-wide">
                Enterprise
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            {plan.desc}
          </p>
        </div>

        {/* Lista de Capacidades */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Beneficios & Módulos Incluidos:
          </span>
          {plan.features.map((feat: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
              <div className="p-0.5 rounded-md mt-0.5 shrink-0 bg-indigo-50 text-indigo-600">
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
          onClick={() => onSelectPlan(plan.code)}
          disabled={hasPendingPayment}
          className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
            hasPendingPayment
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : plan.popular
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white shadow-md shadow-indigo-200'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {hasPendingPayment ? (
            <span>En Revisión por ArivSoft</span>
          ) : (
            <>
              <span>Actualizar a Plan {plan.name}</span>
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
