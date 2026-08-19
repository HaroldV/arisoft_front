'use client';

import React, { useState, useEffect } from 'react';
import { TenantCompany } from '../SuperAdminBackoffice';
import { TENANT_STATUS, SAAS_PLAN_NAMES } from '@/constants/domain-constants';
import apiClient from '@/infrastructure/api/api-client';
import { CheckCircle2, XCircle, Eye, Loader2, AlertCircle, Calendar, DollarSign, Image as ImageIcon, XSquare } from 'lucide-react';

interface BillingTabProps {
  tenants: TenantCompany[];
  masterBcvRate: number;
  onRefreshTenants?: () => Promise<void> | void;
}

export const BillingTab: React.FC<BillingTabProps> = ({ tenants, masterBcvRate, onRefreshTenants }) => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  
  // Reject Modal State
  const [rejectingReceipt, setRejectingReceipt] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setIsLoadingReceipts(true);
    try {
      const res = await apiClient.get('/admin/subscription/payments');
      if (res.data && Array.isArray(res.data)) {
        setReceipts(res.data);
      }
    } catch (err) {
      console.warn('Error fetching subscription receipts:', err);
    } finally {
      setIsLoadingReceipts(false);
    }
  };

  const handleApprove = async (receiptId: string) => {
    setIsApproving(true);
    setFeedbackMessage(null);
    try {
      await apiClient.post(`/admin/subscription/payments/${receiptId}/approve`);
      setFeedbackMessage({ type: 'success', text: '¡Pago aprobado con éxito! La suscripción ha sido activada y la licencia extendida.' });
      setSelectedReceipt(null);
      await fetchReceipts();
      if (onRefreshTenants) {
        await onRefreshTenants();
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.message || 'Error al aprobar el pago.' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenRejectModal = (receipt: any) => {
    setRejectingReceipt(receipt);
    setRejectionReason('Monto o referencia con discrepancias. Por favor contacta a soporte o envía un nuevo comprobante.');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReceipt) return;

    setIsRejecting(true);
    setFeedbackMessage(null);
    try {
      await apiClient.post(`/admin/subscription/payments/${rejectingReceipt.id}/reject`, {
        rejection_reason: rejectionReason.trim(),
      });
      setFeedbackMessage({ type: 'success', text: 'Pago rechazado con observación enviada al cliente.' });
      setRejectingReceipt(null);
      setSelectedReceipt(null);
      await fetchReceipts();
      if (onRefreshTenants) {
        await onRefreshTenants();
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.message || 'Error al rechazar el pago.' });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* SECCIÓN 1: SOLICITUDES DE PAGO RECIBIDAS (CON CAPTURE Y NUEVOS CAMPOS) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bandeja de Pagos de Suscripción</h3>
            <p className="text-xs text-slate-500 font-medium">
              Verifica los comprobantes (Transferencia, Pago Móvil, Zelle y Binance) para aprobar o rechazar con motivo
            </p>
          </div>
          <button
            onClick={fetchReceipts}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Actualizar Bandeja
          </button>
        </div>

        {isLoadingReceipts ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-semibold">Consultando recibos...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">No hay reportes de pago registrados hasta el momento.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha / ID</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Plan / Ciclo</th>
                  <th className="py-3 px-4">Detalle Emisor</th>
                  <th className="py-3 px-4 text-right">Monto USD</th>
                  <th className="py-3 px-4 text-right">Monto Bs.</th>
                  <th className="py-3 px-4 text-center">Capture</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {r.payment_date ? new Date(r.payment_date).toLocaleDateString('es-VE') : new Date(r.created_at).toLocaleDateString('es-VE')}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">Ref: {r.payment_reference || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        r.payment_method === 'BINANCE'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : r.payment_method === 'ZELLE'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {r.payment_method === 'TRANSFER'
                          ? 'Transferencia'
                          : r.payment_method === 'PAGO_MOVIL'
                          ? 'Pago Móvil'
                          : r.payment_method === 'BINANCE'
                          ? 'Binance Pay'
                          : 'Zelle'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{SAAS_PLAN_NAMES[r.plan_code] || r.plan_code}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{r.billing_cycle === 'ANNUAL' ? 'Anual' : 'Mensual'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.payment_method === 'ZELLE' ? (
                        <div>
                          <p className="font-semibold text-slate-900">{r.zelle_account_owner}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{r.zelle_email}</p>
                        </div>
                      ) : r.payment_method === 'BINANCE' ? (
                        <div>
                          <p className="font-semibold text-slate-900">ID: {r.binance_id}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{r.binance_email}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-900">{r.bank_origin || 'Banco Nacional'}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${Number(r.amount_usd || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                      {r.amount_bcv_bs > 0 ? `Bs. ${Number(r.amount_bcv_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.receipt_image_base64 ? (
                        <button
                          onClick={() => setSelectedReceipt(r)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Ver Capture"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Ver</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Sin capture</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {r.status === 'APPROVED' ? 'Aprobado' : r.status === 'REJECTED' ? 'Rechazado' : 'Pendiente'}
                        </span>
                        {r.status === 'REJECTED' && r.rejection_reason && (
                          <p className="text-[10px] text-rose-600 font-medium mt-1 truncate max-w-[150px]" title={r.rejection_reason}>
                            {r.rejection_reason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.status === 'PENDING_APPROVAL' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={isApproving}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(r)}
                            disabled={isApproving}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: ESTADO GENERAL DE COBROS Y LICENCIAS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Cobros de Suscripción y Estado de Licencias</h3>
          <p className="text-xs text-slate-500 font-medium">Monitoreo de vencimientos y recaudación mensual del software</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Vencimiento Licencia</th>
                <th className="py-3 px-4 text-center">Días Restantes</th>
                <th className="py-3 px-4 text-right">Cuota Mensual ($)</th>
                <th className="py-3 px-4 text-right">Cuota (Bs. BCV)</th>
                <th className="py-3 px-4 text-center">Estado Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => {
                const expiresAt = t.subscription_expires_at ? new Date(t.subscription_expires_at) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let daysRemaining: number | null = null;
                if (expiresAt && !isNaN(expiresAt.getTime())) {
                  const targetDate = new Date(expiresAt);
                  targetDate.setHours(0, 0, 0, 0);
                  const diffTime = targetDate.getTime() - today.getTime();
                  daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                const isExpired = daysRemaining !== null ? daysRemaining < 0 : false;
                const isPaidUp = t.status === TENANT_STATUS.ACTIVE && !isExpired;

                const formattedExpiry = expiresAt && !isNaN(expiresAt.getTime())
                  ? expiresAt.toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })
                  : t.subscription_expires_at || 'Sin fecha';

                return (
                  <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {SAAS_PLAN_NAMES[t.plan_name] || t.plan_name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {formattedExpiry}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {daysRemaining === null ? (
                        <span className="text-slate-400 font-mono text-[10px]">—</span>
                      ) : daysRemaining > 10 ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          🟢 {daysRemaining} días
                        </span>
                      ) : daysRemaining > 0 ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          🟡 {daysRemaining} días
                        </span>
                      ) : daysRemaining === 0 ? (
                        <span className="bg-orange-50 text-orange-700 border border-orange-200 font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          🟠 Vence hoy
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          🔴 Vencido ({Math.abs(daysRemaining)}d)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${Number(t.monthly_fee_usd || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                      Bs. {(Number(t.monthly_fee_usd || 0) * masterBcvRate).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        isPaidUp
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isPaidUp ? 'Al Día' : 'Pago Pendiente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SALLY ENTERPRISE: VISOR DE COMPROBANTE / CAPTURE */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-2.5">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Comprobante de Pago</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedReceipt.payment_method} - Ref: {selectedReceipt.payment_reference}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-50/40">
              {selectedReceipt.receipt_image_base64 ? (
                <img
                  src={selectedReceipt.receipt_image_base64}
                  alt="Comprobante"
                  className="max-h-[60vh] max-w-full rounded-xl border border-slate-200 shadow-sm object-contain"
                />
              ) : (
                <p className="text-xs text-slate-500">No hay imagen adjunta para este recibo.</p>
              )}
            </div>

            <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-slate-100 shrink-0">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cerrar
              </button>
              {selectedReceipt.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRejectModal(selectedReceipt)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition-all cursor-pointer"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(selectedReceipt.id)}
                    disabled={isApproving}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-100 cursor-pointer disabled:opacity-50"
                  >
                    {isApproving ? 'Aprobando...' : 'Aprobar Pago y Activar Empresa'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SALLY ENTERPRISE: RECHAZAR PAGO CON MOTIVO */}
      {rejectingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 text-rose-700 rounded-xl p-2.5">
                  <XSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Rechazar Reporte de Pago</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Ref: {rejectingReceipt.payment_reference} ({rejectingReceipt.payment_method})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectingReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Motivo de la Observación / Rechazo *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej. Monto incompleto: se reportaron $30 en lugar de $35 por comisiones no calculadas..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none font-medium"
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Este mensaje será visible directamente por el cliente con los botones para contactar a soporte y reenviar.
                </p>
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingReceipt(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || !rejectionReason.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-100 cursor-pointer disabled:opacity-50"
                >
                  {isRejecting ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
