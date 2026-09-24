'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Receipt, 
  Package, 
  CreditCard, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { formatPaymentMethod } from '@/constants/domain-constants';

interface SaleDetailModalProps {
  saleId: string;
  onClose: () => void;
}

interface SaleDetailData {
  sale: {
    id: string;
    invoice_number?: string;
    control_number?: string;
    total_amount_usd: number;
    total_amount_ves: number;
    exchange_rate_applied: number;
    status: string;
    created_at: string;
    payment_method?: string;
  };
  client?: {
    id: string;
    name: string;
    tax_id: string;
    phone?: string;
    email?: string;
    taxpayer_type?: string;
  } | null;
  cashier?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price_usd: number;
    price_ves: number;
    subtotal_usd: number;
    subtotal_ves: number;
    product: {
      id: string;
      name: string;
      sku: string;
      unit_of_measure: string;
    };
  }>;
  payments: Array<{
    id: string;
    payment_method: string;
    currency: string;
    amount_original: number;
    amount_usd: number;
    exchange_rate_applied: number;
    last_four_digits?: string;
    sender_identifier?: string;
    transaction_reference?: string;
    bank_account?: {
      id: string;
      name: string;
      bank_name: string;
      currency: string;
      account_type: string;
    } | null;
  }>;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ saleId, onClose }) => {
  const [data, setData] = useState<SaleDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.get(`/bank-accounts/sales/${saleId}`);
        setData(res.data);
      } catch (err: any) {
        console.error('Error fetching sale details:', err);
        setError(err.response?.data?.message || 'No se pudo cargar el detalle de la venta.');
      } finally {
        setIsLoading(false);
      }
    };

    if (saleId) {
      fetchDetail();
    }
  }, [saleId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/40 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Detalle de Venta y Renglones
                </h3>
                {data?.sale?.invoice_number && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono text-xs font-bold px-2 py-0.5 rounded-md">
                    Factura #{data.sale.invoice_number}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Auditoría financiera, productos despachados y tasa de cambio aplicada.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Center Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-400">Cargando desglose de la venta...</span>
            </div>
          ) : error ? (
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Luminous Financial Balance Banner */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total USD */}
                  <div className="bg-white/95 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Total Facturado (USD)
                    </span>
                    <span className="font-mono font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                      ${data.sale.total_amount_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Total VES */}
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                      Total Facturado (VES)
                    </span>
                    <span className="font-mono font-black text-xl sm:text-2xl text-emerald-800 tracking-tight">
                      Bs. {data.sale.total_amount_ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Applied Rate */}
                  <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-4 shadow-2xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                      Tasa BCV Aplicada
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono font-black text-xl sm:text-2xl text-indigo-900 tracking-tight">
                        Bs. {data.sale.exchange_rate_applied.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600">/ USD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Cliente / Receptor
                  </span>
                  <p className="font-bold text-slate-900 text-xs truncate">
                    {data.client?.name || 'Venta a Mostrador'}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {data.client?.tax_id || 'Sin documento'}
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Cajero / Responsable
                  </span>
                  <p className="font-bold text-slate-900 text-xs truncate">
                    {data.cashier?.full_name || 'Sistema'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {data.cashier?.role || 'POS'}
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Fecha de Emisión
                  </span>
                  <p className="font-mono font-bold text-slate-900 text-xs">
                    {new Date(data.sale.created_at).toLocaleDateString('es-VE', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {new Date(data.sale.created_at).toLocaleTimeString('es-VE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Nro. de Control
                  </span>
                  <p className="font-mono font-bold text-slate-900 text-xs">
                    {data.sale.control_number || 'S/N'}
                  </p>
                  <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {data.sale.status === 'PAID' ? 'PAGADA / LIQUIDADA' : data.sale.status}
                  </span>
                </div>
              </div>

              {/* Products Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Productos Vendidos ({data.items.length})
                    </h4>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Producto / SKU</th>
                        <th className="py-2.5 px-4 text-center">Cant.</th>
                        <th className="py-2.5 px-4 text-right">Precio Unit. ($)</th>
                        <th className="py-2.5 px-4 text-right">Precio Unit. (Bs.)</th>
                        <th className="py-2.5 px-4 text-right">Subtotal ($)</th>
                        <th className="py-2.5 px-4 text-right">Subtotal (Bs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items.map((item) => (
                        <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.product.name}</div>
                            <div className="font-mono text-[10px] text-slate-500">
                              SKU: <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold">{item.product.sku}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg text-xs">
                              {item.quantity} {item.product.unit_of_measure}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                            ${item.price_usd.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            Bs. {item.price_ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ${item.subtotal_usd.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                            Bs. {item.subtotal_ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 text-slate-900 text-xs font-bold">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-4 text-right uppercase text-[10px] tracking-wider text-slate-500">
                          Total General:
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                          ${data.sale.total_amount_usd.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-indigo-700">
                          Bs. {data.sale.total_amount_ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Desglose de Métodos de Pago ({data.payments.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.payments.map((payment) => {
                    const isChange = payment.payment_method?.toUpperCase().includes('CHANGE');
                    return (
                      <div 
                        key={payment.id} 
                        className={`p-3.5 border rounded-xl shadow-2xs space-y-2 ${
                          isChange ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              {payment.bank_account?.name || formatPaymentMethod(payment.payment_method)}
                            </span>
                            {isChange && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                                Vuelto Entregado
                              </span>
                            )}
                          </div>
                          <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg border ${
                            isChange 
                              ? 'text-amber-800 bg-amber-100/70 border-amber-200' 
                              : 'text-indigo-700 bg-indigo-50 border-indigo-100'
                          }`}>
                            {isChange ? '-' : ''}{payment.currency === 'USD' ? '$' : 'Bs. '}
                            {Math.abs(payment.amount_original).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {payment.bank_account && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                            <span>Banco: {payment.bank_account.bank_name}</span>
                            <span>•</span>
                            <span className="font-mono">{payment.bank_account.account_type}</span>
                          </div>
                        )}

                        {(payment.last_four_digits || payment.sender_identifier || payment.transaction_reference) && (
                          <div className="pt-2 border-t border-slate-100 text-[10px] space-y-0.5">
                            {payment.sender_identifier && (
                              <div className="text-slate-700">
                                <span className="font-bold text-slate-400 uppercase">Emisor: </span>
                                <span className="font-semibold text-indigo-600">{payment.sender_identifier}</span>
                              </div>
                            )}
                            {payment.last_four_digits && (
                              <div className="font-mono text-slate-700">
                                <span className="font-bold text-slate-400 uppercase font-sans">Últimos 4: </span>
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">****{payment.last_four_digits}</span>
                              </div>
                            )}
                            {payment.transaction_reference && !payment.last_four_digits && (
                              <div className="font-mono text-slate-700">
                                <span className="font-bold text-slate-400 uppercase font-sans">Ref: </span>
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">{payment.transaction_reference}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Fijo */}
        <div className="flex justify-end items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
