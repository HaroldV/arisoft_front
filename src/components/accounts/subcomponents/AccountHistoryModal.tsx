'use client';

import React from 'react';
import { X, History, Wallet } from 'lucide-react';
import { ACCOUNT_TYPES, AccountType } from '@/constants/domain-constants';
import { AccountItem } from '../types';

interface AccountHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount: AccountItem | null;
  activeTab: AccountType;
}

export function AccountHistoryModal({
  isOpen,
  onClose,
  selectedAccount,
  activeTab,
}: AccountHistoryModalProps) {
  if (!isOpen || !selectedAccount) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Historial de Abonos / Pagos ({activeTab === ACCOUNT_TYPES.PAYABLE ? 'CxP Proveedor' : 'CxC Cliente'})
              </h3>
              <p className="text-xs text-slate-500 font-medium">{selectedAccount.entity_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {(!selectedAccount.payments || selectedAccount.payments.length === 0) ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
              <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No se registran abonos en esta cuenta</p>
              <p className="text-[11px] text-slate-400 mt-1">El saldo total adeudado permanece intacto.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Método de Pago</th>
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-right">Abono Neto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {selectedAccount.payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {p.paid_at ? new Date(p.paid_at).toLocaleString() : 'Reciente'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                        {p.reference_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {p.currency === 'USD' ? `$${Number(p.amount).toFixed(2)}` : `Bs. ${Number(p.amount).toFixed(2)}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ${Number(p.amount_usd).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
