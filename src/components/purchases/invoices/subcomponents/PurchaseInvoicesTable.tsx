'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, FilePlus, Download, ExternalLink, CreditCard } from 'lucide-react';
import { PurchaseInvoice } from '../types';
import { ActionTooltip } from '@/components/ActionTooltip';

interface PurchaseInvoicesTableProps {
  purchases: PurchaseInvoice[];
  onViewDetails: (id: string) => void;
  onEmitFiscalNote: (id: string) => void;
  onNoteClick: (noteId: string) => void;
}

export const PurchaseInvoicesTable: React.FC<PurchaseInvoicesTableProps> = ({
  purchases,
  onViewDetails,
  onEmitFiscalNote,
  onNoteClick,
}) => {
  const router = useRouter();

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ANULADA':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            Anulada
          </span>
        );
      case 'AJUSTADA':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            Ajustada
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            Registrada
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (paymentStatus?: string, balanceDue?: number, payableId?: string | null) => {
    switch (paymentStatus) {
      case 'PAID':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            Saldada
          </span>
        );
      case 'PARTIAL':
        return (
          <button
            type="button"
            onClick={() => payableId && router.push(`/accounts?type=PAYABLE&highlight=${payableId}`)}
            className={`bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
              payableId ? 'cursor-pointer hover:bg-amber-100 transition-colors' : ''
            }`}
            title={payableId ? 'Ir a Cuentas por Pagar para abonar o saldar' : undefined}
          >
            Abono Parcial (${(balanceDue ?? 0).toFixed(2)})
          </button>
        );
      case 'PENDING':
      default:
        return (
          <button
            type="button"
            onClick={() => payableId && router.push(`/accounts?type=PAYABLE&highlight=${payableId}`)}
            className={`bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
              payableId ? 'cursor-pointer hover:bg-rose-100 transition-colors' : ''
            }`}
            title={payableId ? 'Ir a Cuentas por Pagar para saldar factura' : undefined}
          >
            Por Pagar (${(balanceDue ?? 0).toFixed(2)})
          </button>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-4 px-5">Fecha</th>
              <th className="py-4 px-5">N° Factura</th>
              <th className="py-4 px-5">Proveedor</th>
              <th className="py-4 px-5">Registrado Por</th>
              <th className="py-4 px-5 text-right">Total ($)</th>
              <th className="py-4 px-5 text-center">Estado Pago (CXP)</th>
              <th className="py-4 px-5 text-center">Notas Fiscales</th>
              <th className="py-4 px-5 text-center">Comprobante</th>
              <th className="py-4 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-400 font-medium">
                  No se encontraron facturas de compra.
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => {
                const creditNotesList = purchase.credit_notes
                  ? purchase.credit_notes.split(',').map((item) => {
                      const [docNum, id] = item.split(':');
                      return { docNum, id };
                    })
                  : [];
                const debitNotesList = purchase.debit_notes
                  ? purchase.debit_notes.split(',').map((item) => {
                      const [docNum, id] = item.split(':');
                      return { docNum, id };
                    })
                  : [];

                return (
                  <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 text-slate-600 font-medium">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">
                      {purchase.invoice_number}
                    </td>
                    <td className="py-3 px-5 font-bold text-slate-900">
                      {purchase.supplier_name}
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {purchase.created_by?.full_name || purchase.creator_name || 'N/A'}
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-slate-900 text-right">
                      ${Number(purchase.total_amount_usd).toFixed(2)}
                    </td>
                    <td className="py-3 px-5 text-center">
                      {getPaymentStatusBadge(purchase.payment_status, purchase.balance_due_usd, purchase.payable_id)}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {creditNotesList.map((cn) => (
                          <button
                            key={cn.id}
                            onClick={() => onNoteClick(cn.id)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            NC: {cn.docNum}
                          </button>
                        ))}
                        {debitNotesList.map((dn) => (
                          <button
                            key={dn.id}
                            onClick={() => onNoteClick(dn.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            ND: {dn.docNum}
                          </button>
                        ))}
                        {creditNotesList.length === 0 && debitNotesList.length === 0 && (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-center">
                      {purchase.proof_file_path ? (
                        <a
                          href={purchase.proof_file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">Sin archivo</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {purchase.payable_id && purchase.payment_status !== 'PAID' && (
                          <ActionTooltip content="Abonar / Saldar en CXP">
                            <button
                              onClick={() => router.push(`/accounts?type=PAYABLE&highlight=${purchase.payable_id}`)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 cursor-pointer"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          </ActionTooltip>
                        )}
                        {purchase.payable_id && (
                          <ActionTooltip content="Ver en Cuentas por Pagar (CXP)">
                            <button
                              onClick={() => router.push(`/accounts?type=PAYABLE&highlight=${purchase.payable_id}`)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </ActionTooltip>
                        )}
                        <ActionTooltip content="Emitir Nota Fiscal (NC/ND)">
                          <button
                            onClick={() => onEmitFiscalNote(purchase.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <FilePlus className="w-4 h-4" />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip content="Ver Detalle de Ítems">
                          <button
                            onClick={() => onViewDetails(purchase.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
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
};
