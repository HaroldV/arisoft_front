import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-900 via-slate-950 to-primary-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Ari Soft
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Administración Resiliente e Inteligente
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-black/40 sm:rounded-2xl sm:px-10 border border-slate-100/5">
          {children}
        </div>
      </div>
    </div>
  );
}
