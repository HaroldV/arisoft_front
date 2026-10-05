'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Clock } from 'lucide-react';

interface InConstructionPlaceholderProps {
  title: string;
  subtitle?: string;
  description?: string;
  badgeText?: string;
  returnHref?: string;
  returnLabel?: string;
}

export const InConstructionPlaceholder: React.FC<InConstructionPlaceholderProps> = ({
  title,
  subtitle = 'Módulo en desarrollo para el ERP ARI',
  description = 'Esta funcionalidad se encuentra en fase activa de diseño e implementación. Estará disponible en una próxima actualización de la plataforma.',
  badgeText = 'Próximamente',
  returnHref = '/',
  returnLabel = 'Volver al Inicio',
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 text-amber-600 rounded-2xl p-3.5 shadow-2xs">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {badgeText}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>

        <Link
          href={returnHref}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{returnLabel}</span>
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 via-slate-50 to-amber-50 border border-slate-200 rounded-3xl mx-auto flex items-center justify-center shadow-xs">
          <Clock className="w-8 h-8 text-indigo-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sección en Construcción</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href={returnHref}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{returnLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
