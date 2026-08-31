'use client';

import React from 'react';
import { PackageCheck, Eye, Wallet, History } from 'lucide-react';
import { ActionTooltip } from '@/components/ActionTooltip';
import { ACCOUNT_STATUS, ACCOUNT_TYPES, AccountType } from '@/constants/domain-constants';
import { AccountItem } from '../types';

interface AccountTableProps {
  items: AccountItem[];
  activeTab: AccountType;
  search: string;
  onOpenItemsModal: (item: AccountItem) => void;
  onOpenPaymentModal: (item: AccountItem) => void;
  onOpenHistoryModal: (item: AccountItem) => void;
}

export function AccountTable({
  items,
  activeTab,
  search,
  onOpenItemsModal,
  onOpenPaymentModal,
  onOpenHistoryModal,
}: AccountTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">{activeTab === ACCOUNT_TYPES.PAYABLE ? 'Entidad / Proveedor' : 'Cliente / Razón Social'}</th>
              <th className="py-3.5 px-4">Última Operación / Ref</th>
              <th className="py-3.5 px-4 text-right">Otros Meses ($)</th>
              <th className="py-3.5 px-4 text-right">Facturado ($)</th>
              <th className="py-3.5 px-4 text-right">Monto Pagado ($)</th>
              <th className="py-3.5 px-4 text-right">{activeTab === ACCOUNT_TYPES.PAYABLE ? 'Cuenta por Pagar ($)' : 'Cuenta por Cobrar ($)'}</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center bg-slate-50/40">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                      <PackageCheck className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {activeTab === ACCOUNT_TYPES.PAYABLE ? 'No hay cuentas por pagar registradas' : 'No hay cuentas por cobrar registradas'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {search ? `No hay resultados para "${search}".` : 'Las cuentas se generan automáticamente a través de Recepciones de Almacén o Facturación de Ventas.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const prev = Number(item.previous_balance || 0);
                const period = Number(item.period_amount || 0);
                const paid = Number(item.total_paid || 0);
                const debt = Number(item.balance_due || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.entity_name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{item.entity_type}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-slate-600 font-semibold bg-slate-100/90 px-2 py-0.5 rounded-md">
                        {item.reference_document_number || item.reference_date || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                      ${prev.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-800">
                      ${period.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-emerald-700">
                      ${paid.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm font-black text-slate-900">
                      ${debt.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.status === ACCOUNT_STATUS.PAID ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          Saldado
                        </span>
                      ) : item.status === ACCOUNT_STATUS.PARTIAL ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          Abono Parcial
                        </span>
                      ) : (
                        <span className="bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ActionTooltip content="Ver Detalle y Renglones de Almacén">
                          <button
                            onClick={() => onOpenItemsModal(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </ActionTooltip>

                        {debt > 0 && (
                          <ActionTooltip content="Registrar Abono / Pago">
                            <button
                              onClick={() => onOpenPaymentModal(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 cursor-pointer"
                            >
                              <Wallet className="w-4 h-4" />
                            </button>
                          </ActionTooltip>
                        )}

                        <ActionTooltip content="Historial de Abonos">
                          <button
                            onClick={() => onOpenHistoryModal(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
