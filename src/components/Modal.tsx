'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  type = 'confirm',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'confirm':
        return (
          <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        );
      case 'error':
        return (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        );
      case 'success':
        return (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        );
      case 'alert':
      default:
        return (
          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl">
            <Info className="h-6 w-6" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <span className="text-sm font-bold text-slate-900">{title}</span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {getIcon()}
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {type === 'confirm' && onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl transition-all cursor-pointer text-xs"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 font-medium rounded-xl transition-all cursor-pointer text-xs text-white ${
              type === 'error'
                ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
                : type === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
