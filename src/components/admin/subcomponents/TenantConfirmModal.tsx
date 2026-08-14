'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { TenantCompany } from '../SuperAdminBackoffice';

interface TenantConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantToToggle: TenantCompany | null;
  onConfirm: (tenant: TenantCompany) => void;
}

export const TenantConfirmModal: React.FC<TenantConfirmModalProps> = ({
  isOpen,
  onClose,
  tenantToToggle,
  onConfirm,
}) => {
  if (!isOpen || !tenantToToggle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Confirmar Suspensión de Empresa</h3>
              <p className="text-xs text-rose-600 font-medium">Esta acción inhabilitará el acceso de forma inmediata.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Central */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            ¿Estás seguro de que deseas desactivar / suspender la empresa <strong className="text-slate-900">{tenantToToggle.name}</strong>?
          </p>

          <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-800 uppercase">Propietario Afectado:</span>
              <span className="font-bold font-mono text-rose-900">{tenantToToggle.owner_name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-800 uppercase">Correo Principal:</span>
              <span className="font-mono text-rose-900">{tenantToToggle.owner_email}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-snug">
              Al confirmar, la columna <code className="font-mono font-bold bg-amber-100 px-1 rounded">is_active</code> en la base de datos se establecerá en <strong>false</strong> para el propietario. Si el usuario intenta iniciar sesión, el sistema detendrá el acceso y le notificará comunicarse con Soporte.
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(tenantToToggle)}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-rose-200 cursor-pointer active:scale-98"
          >
            Confirmar y Suspender
          </button>
        </div>
      </div>
    </div>
  );
};
