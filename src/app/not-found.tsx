'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 sm:p-12 rounded-3xl border border-slate-100 shadow-xl max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl mx-auto flex items-center justify-center shadow-xs">
          <FileQuestion className="w-10 h-10 text-indigo-600" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Error 404
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-2">
            Página No Encontrada
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            La sección o recurso al que intentas acceder no existe, ha sido movida o está en desarrollo.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
