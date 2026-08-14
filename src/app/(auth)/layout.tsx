import React from 'react';
import { Layers, TrendingUp, MessageSquareQuote } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-slate-900 overflow-x-hidden">
      {/* 🚀 BANNER IZQUIERDO: Estilo Ejecutivo Dark Navy Blue (Inspirado en Porto Academic UI) */}
      <div className="w-full lg:w-1/2 bg-[#090D16] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[480px] lg:min-h-screen shrink-0">
        
        {/* Grilla sutil de fondo (CSS Grid overlay) */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        {/* Glow Blob Superior e Inferior */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        {/* Header con Logo AriSoft */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xs">
            <img src="/logo-arisoft.png" alt="AriSoft Logo" className="h-8 w-auto object-contain brightness-0 invert" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300 border-l border-white/20 pl-3">ERP ARI</span>
          </div>
        </div>

        {/* Hero Text Contextual ERP */}
        <div className="relative z-10 my-auto py-10 max-w-xl">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 block mb-3">
            SISTEMA ERP & ADMINISTRACIÓN VENEZUELA
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            La gestión de hoy, <br />
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-sky-300 bg-clip-text text-transparent">
              organizada para crecer
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed font-normal">
            AriSoft ERP conecta inventario, facturación fiscal SENIAT, cuentas por cobrar, cuentas por pagar y caja en una sola plataforma centralizada.
          </p>

          {/* 3 Bloques Informativos de Propuesta de Valor */}
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 backdrop-blur-xs hover:bg-white/[0.07] transition-all">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 border border-indigo-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Todo tu negocio en un solo lugar</h4>
                <p className="text-xs text-slate-400 mt-0.5">Ventas POS, inventario multialmacén y facturación adaptada al SENIAT.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 backdrop-blur-xs hover:bg-white/[0.07] transition-all">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 border border-blue-500/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Control financiero en tiempo real</h4>
                <p className="text-xs text-slate-400 mt-0.5">Balances en $/Bs, conciliación de pago móvil y reportes gerenciales inmediatos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 backdrop-blur-xs hover:bg-white/[0.07] transition-all">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/30">
                <MessageSquareQuote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Cumplimiento y soporte continuo</h4>
                <p className="text-xs text-slate-400 mt-0.5">Soporte técnico, retenciones de IVA/ISLR y auditoría libre de fricción.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Banner Izquierdo */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
          <span>Sistema de gestión empresarial multi-empresa</span>
          <span>v2.5</span>
        </div>
      </div>

      {/* 📄 SECCIÓN DERECHA: Formulario Auténtico Fondo Blanco Limpio */}
      <div className="w-full lg:w-1/2 bg-white p-6 sm:p-12 lg:p-20 flex items-center justify-center min-h-[500px]">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
