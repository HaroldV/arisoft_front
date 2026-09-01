'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, ShoppingBag, Truck, Calendar, User, FileText } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

interface AuditRecord {
  id: string;
  document_type: 'PURCHASE_ORDER' | 'PURCHASE_RECEPTION';
  document_number: string;
  supplier_name: string;
  total_amount_usd: number;
  action_type: 'CANCELLED' | 'REVERSED';
  action_reason: string;
  action_date: string;
  performed_by_name: string;
}

export function PurchasesAuditTab() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PURCHASE_ORDER' | 'PURCHASE_RECEPTION'>('ALL');

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, recsRes] = await Promise.all([
        apiClient.get('/purchases/orders').catch(() => ({ data: [] })),
        apiClient.get('/purchases/receptions').catch(() => ({ data: [] })),
      ]);

      const auditList: AuditRecord[] = [];

      // Cancelled Orders
      const rawOrders = ordersRes.data || [];
      for (const o of rawOrders) {
        if (o.status === 'CANCELLED') {
          auditList.push({
            id: o.id,
            document_type: 'PURCHASE_ORDER',
            document_number: o.order_number,
            supplier_name: o.supplier_name,
            total_amount_usd: Number(o.total_usd || 0),
            action_type: 'CANCELLED',
            action_reason: o.cancellation_reason || 'Anulada por operador',
            action_date: o.cancelled_at || o.created_at,
            performed_by_name: o.created_by_user_name || 'Operador',
          });
        }
      }

      // Reversed Receptions
      const rawRecs = recsRes.data || [];
      for (const r of rawRecs) {
        if (r.status === 'REVERSED') {
          const totalAmt = r.items?.reduce((sum: number, i: any) => sum + Number(i.net_total || (Number(i.quantity_received || 0) * Number(i.unit_cost_usd || 0))), 0) || 0;
          auditList.push({
            id: r.id,
            document_type: 'PURCHASE_RECEPTION',
            document_number: r.reception_number,
            supplier_name: r.supplier_name,
            total_amount_usd: totalAmt,
            action_type: 'REVERSED',
            action_reason: r.reversal_reason || 'Reversión / Devolución a proveedor',
            action_date: r.reversed_at || r.created_at,
            performed_by_name: r.created_by_user_name || 'Operador',
          });
        }
      }

      auditList.sort((a, b) => new Date(b.action_date).getTime() - new Date(a.action_date).getTime());
      setRecords(auditList);
    } catch (err) {
      console.error('Error fetching audit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.document_number.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
      r.action_reason.toLowerCase().includes(search.toLowerCase()) ||
      r.performed_by_name.toLowerCase().includes(search.toLowerCase());

    const matchType = typeFilter === 'ALL' || r.document_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° Documento, proveedor, motivo o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Todos los Documentos</option>
            <option value="PURCHASE_ORDER">Órdenes de Compra Anuladas</option>
            <option value="PURCHASE_RECEPTION">Recepciones Revertidas</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-medium text-slate-500">Cargando registros de auditoría...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Sin cancelaciones ni reversiones registradas</p>
            <p className="text-xs text-slate-400">Todas las órdenes y recepciones se mantienen activas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 uppercase text-[10px] font-bold tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Tipo Documento</th>
                  <th className="py-3.5 px-5">N° Documento</th>
                  <th className="py-3.5 px-5">Proveedor</th>
                  <th className="py-3.5 px-5 text-right">Monto ($)</th>
                  <th className="py-3.5 px-5">Motivo / Justificación</th>
                  <th className="py-3.5 px-5">Usuario Auditor</th>
                  <th className="py-3.5 px-5">Fecha Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => (
                  <tr key={`${rec.document_type}-${rec.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-semibold">
                      {rec.document_type === 'PURCHASE_ORDER' ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-bold text-[10px]">
                          <ShoppingBag className="w-3 h-3" /> Orden Anulada
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-bold text-[10px]">
                          <Truck className="w-3 h-3" /> Recepción Revertida
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">{rec.document_number}</td>
                    <td className="py-3 px-5 font-medium text-slate-800">{rec.supplier_name}</td>
                    <td className="py-3 px-5 text-right font-mono font-bold text-slate-900">
                      ${rec.total_amount_usd.toFixed(2)}
                    </td>
                    <td className="py-3 px-5 text-slate-600 max-w-xs truncate" title={rec.action_reason}>
                      {rec.action_reason}
                    </td>
                    <td className="py-3 px-5 text-slate-700 font-medium">{rec.performed_by_name}</td>
                    <td className="py-3 px-5 text-slate-500 font-mono">
                      {new Date(rec.action_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
