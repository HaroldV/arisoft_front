'use client';

import React from 'react';
import { Clock, AlertTriangle, MessageCircle } from 'lucide-react';

interface PaymentReceipt {
  status: string;
  payment_method: string;
  payment_reference: string;
  amount_usd?: number;
  payment_date?: string;
  created_at: string;
  rejection_reason?: string;
}

interface PaymentAuditBannerProps {
  hasPendingPayment: boolean;
  isRejected: boolean;
  lastReceipt?: PaymentReceipt | null;
  onRetryPayment: () => void;
}

export const PaymentAuditBanner: React.FC<PaymentAuditBannerProps> = ({
  hasPendingPayment,
  isRejected,
  lastReceipt,
  onRetryPayment,
}) => {
  if (hasPendingPayment) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Tu Reporte de Pago está en Proceso de Verificación
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                El equipo de administración de ArivSoft está conciliando tu comprobante. Tu servicio se mantiene activo mientras se procesa.
              </p>
            </div>
          </div>
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3.5 py-1 rounded-full shrink-0">
            ⏳ En Revisión
          </span>
        </div>

        {/* Micro-tarjetas con datos del comprobante */}
        {lastReceipt && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/90 border border-amber-100 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Método</span>
              <span className="font-bold text-xs text-slate-800">{lastReceipt.payment_method}</span>
            </div>
            <div className="bg-white/90 border border-amber-100 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Referencia / ID</span>
              <span className="font-mono font-bold text-xs text-slate-800 truncate block">{lastReceipt.payment_reference}</span>
            </div>
            <div className="bg-white/90 border border-amber-100 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fecha Enviado</span>
              <span className="font-mono font-semibold text-xs text-slate-700">
                {lastReceipt.payment_date 
                  ? new Date(lastReceipt.payment_date).toLocaleDateString('es-VE') 
                  : new Date(lastReceipt.created_at).toLocaleDateString('es-VE')}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isRejected && lastReceipt) {
    return (
      <div className="bg-gradient-to-r from-rose-50 via-slate-50 to-red-50/50 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-rose-100 border border-rose-200 text-rose-800 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Observación en tu Reporte de Pago Anterior
              </h4>
              <p className="text-xs text-rose-700 font-semibold mt-0.5">
                Motivo: {lastReceipt.rejection_reason || 'Discrepancia en el comprobante bancario.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://wa.me/584120000000?text=Hola%20ArivSoft,%20tengo%20una%20duda%20sobre%20mi%20reporte%20de%20pago%20Ref:%20${lastReceipt.payment_reference}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar Soporte</span>
            </a>
            <button
              onClick={onRetryPayment}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              Reenviar Comprobante
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
