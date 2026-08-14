'use client';

import React from 'react';
import { CreditCard, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscriptionBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSection?: string;
}

export const SubscriptionBlockedModal: React.FC<SubscriptionBlockedModalProps> = ({
  isOpen,
  onClose,
  targetSection = 'esta sección',
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToPlans = () => {
    onClose();
    router.push('/settings/subscription');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Fijo Luminoso (Sally Standard) */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/80 via-white to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-700 rounded-xl p-2.5 border border-amber-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Suscripción Activa Requerida
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Acceso restringido por estado de licencia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Para poder acceder a <strong className="text-indigo-600">{targetSection}</strong> y operar en el sistema, tu empresa primero debe adquirir un plan de suscripción activo.
            </p>
            <p className="text-xs text-slate-500">
              Actualmente tu cuenta se encuentra en período de onboarding o estado suspendido. Selecciona un plan comercial para activar el acceso total.
            </p>
          </div>
        </div>

        {/* Footer de Acciones (Sally Standard) */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
          >
            Entendido, Entrar Luego
          </button>
          <button
            onClick={handleGoToPlans}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-200 cursor-pointer"
          >
            <span>Ver Planes y Suscribirme</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
