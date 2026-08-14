'use client';

import React from 'react';

export const MarketBiTab: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Distribución de Planes en el Mercado</h3>
        <p className="text-xs text-slate-500 font-medium">Porcentaje de clientes según el plan contratado</p>

        <div className="space-y-3 pt-2">
          {[
            { name: 'Comercial Pro ($35/mes)', pct: 50, count: 3, color: 'bg-indigo-600' },
            { name: 'Corporativo ($75/mes)', pct: 33, count: 2, color: 'bg-purple-600' },
            { name: 'Emprendedor ($15/mes)', pct: 17, count: 1, color: 'bg-slate-400' },
          ].map((p, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{p.name}</span>
                <span className="font-mono">{p.count} empresas ({p.pct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Demanda de Módulos para Nuevos Desarrollos</h3>
        <p className="text-xs text-slate-500 font-medium">Módulos más solicitados para futuras expansiones del ERP</p>

        <div className="space-y-2.5">
          {[
            { name: 'Punto de Venta POS & Caja', demand: '100%', badge: 'Esencial' },
            { name: 'Facturación & Cuentas por Cobrar', demand: '100%', badge: 'Esencial' },
            { name: 'Business Intelligence & Excel', demand: '85%', badge: 'Alta Demanda' },
            { name: 'Nómina & Liquidación Laboral', demand: '35%', badge: 'En Crecimiento' },
          ].map((m, i) => (
            <div key={i} className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{m.name}</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                {m.demand} ({m.badge})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
