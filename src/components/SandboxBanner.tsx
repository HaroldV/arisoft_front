'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Timer, Zap } from 'lucide-react';

export default function SandboxBanner() {
  const { user } = useAuth();

  if (!user || user.trial_days_left === undefined) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-1 rounded-md">
          <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <span className="text-sm font-bold tracking-tight">MODO SANDBOX ACTIVADO</span>
          <span className="text-xs text-blue-100 hidden md:inline">|</span>
          <span className="text-xs text-blue-50 font-medium">Estás explorando todas las capacidades de ARI con un plan de prueba completo.</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10">
        <Timer className="h-3.5 w-3.5 text-blue-200" />
        <span className="text-xs font-bold tabular-nums">
          {user.trial_days_left} DÍAS RESTANTES
        </span>
      </div>
    </div>
  );
}
