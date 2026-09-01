'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { PurchaseOrder } from '../types';

interface PurchaseOrderCancelModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string, reason: string) => Promise<void>;
}

export function PurchaseOrderCancelModal({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}: PurchaseOrderCancelModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('El motivo de anulación es obligatorio (mínimo 5 caracteres).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmCancel(order.id, reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al anular la orden de compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Anular Orden {order.order_number}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Esta acción es irreversible y quedará registrada en auditoría
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Proveedor:</span>
              <strong className="text-slate-900">{order.supplier_name}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Monto Total:</span>
              <strong className="font-mono text-slate-900">${Number(order.total_usd || 0).toFixed(2)} USD</strong>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Motivo o Justificación de la Anulación *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describa la razón comercial o error por el cual se anula la orden (mínimo 5 caracteres)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 text-slate-900 transition-all text-xs"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 5}
              className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-xl transition-all shadow-md shadow-rose-200 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Anulando...</span>
                </>
              ) : (
                <span>Confirmar Anulación</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
