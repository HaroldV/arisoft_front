'use client';

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Box, 
  AlertCircle,
  ArrowUpRight,
  Clock
} from 'lucide-react';

export default function WelcomeDashboard() {
  const stats = [
    { label: 'Ingresos Mensuales', value: '$45,231.89', change: '+20.1%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Usuarios Activos', value: '+2350', change: '+180.1%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Productos en Stock', value: '12,234', change: '+19%', icon: Box, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Alertas de Inventario', value: '7', change: '-2', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido, Harold</h1>
          <p className="text-slate-500">Aquí tienes un resumen de lo que está pasando en tu ERP hoy.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <Clock className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-medium text-slate-600">Miércoles, 13 de Mayo 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Actividad de Inventario</h3>
            <button className="text-primary-600 text-sm font-semibold flex items-center hover:text-primary-700">
              Ver reporte completo <ArrowUpRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <span className="text-slate-400 text-sm font-medium italic">[Gráfico de Actividad de Stock]</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Acciones Rápidas</h3>
          <div className="space-y-4">
            {[
              { label: 'Nuevo Producto', color: 'bg-blue-500' },
              { label: 'Registrar Movimiento', color: 'bg-slate-800' },
              { label: 'Generar Reporte PDF', color: 'bg-primary-600' },
              { label: 'Ajustes de Perfil', color: 'bg-slate-200 text-slate-700' },
            ].map((action) => (
              <button key={action.label} className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] shadow-sm ${action.color}`}>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
