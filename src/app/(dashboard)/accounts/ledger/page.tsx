'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  RefreshCw,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Building,
  Eye
} from 'lucide-react';
import { ActionTooltip } from '@/components/ActionTooltip';
import apiClient from '@/infrastructure/api/api-client';
import { formatPaymentMethod } from '@/constants/domain-constants';
import { SaleDetailModal } from '../banks/subcomponents/SaleDetailModal';

interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  currency: string;
  account_type: string;
  current_balance: number;
}

interface BankMovement {
  id: string;
  bank_account_id: string;
  type: string;
  amount: number;
  balance_after: number;
  reference?: string;
  description?: string;
  created_at: string;
  account?: BankAccount;
  payment_metadata?: {
    payment_method?: string;
    last_four_digits?: string;
    sender_identifier?: string;
    transaction_reference?: string;
  };
  sale?: {
    id: string;
    invoice_number?: string;
    client_name?: string;
  };
  created_by?: {
    id: string;
    name: string;
  };
}

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [movements, setMovements] = useState<BankMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [viewingSaleId, setViewingSaleId] = useState<string | null>(null);

  const fetchData = async (accId?: string) => {
    setIsLoading(true);
    try {
      const [accRes, movRes] = await Promise.all([
        apiClient.get('/bank-accounts'),
        apiClient.get(accId && accId !== 'ALL' ? `/bank-accounts/${accId}/movements` : '/bank-accounts/movements')
      ]);
      setAccounts(Array.isArray(accRes.data) ? accRes.data : []);
      setMovements(Array.isArray(movRes.data) ? movRes.data : []);
    } catch (error) {
      console.error('Error fetching ledger data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccountChange = (accId: string) => {
    setSelectedAccountId(accId);
    fetchData(accId);
  };

  // Filtered movements based on search query, type and currency
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      // Currency filter
      if (currencyFilter !== 'ALL' && mov.account?.currency !== currencyFilter) {
        return false;
      }

      // Movement type filter
      if (movementTypeFilter === 'SALES' && !mov.sale) {
        return false;
      }
      if (movementTypeFilter === 'DEPOSIT' && mov.type !== 'DEPOSIT') {
        return false;
      }
      if (movementTypeFilter === 'WITHDRAWAL' && mov.type !== 'WITHDRAWAL') {
        return false;
      }
      if (movementTypeFilter === 'TRANSFER' && mov.type !== 'TRANSFER') {
        return false;
      }

      // Search term filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const invoiceMatch = mov.sale?.invoice_number?.toLowerCase().includes(query);
        const clientMatch = mov.sale?.client_name?.toLowerCase().includes(query);
        const senderMatch = mov.payment_metadata?.sender_identifier?.toLowerCase().includes(query);
        const lastFourMatch = mov.payment_metadata?.last_four_digits?.toLowerCase().includes(query);
        const refMatch = (mov.payment_metadata?.transaction_reference || mov.reference)?.toLowerCase().includes(query);
        const cashierMatch = mov.created_by?.name?.toLowerCase().includes(query);
        const descMatch = mov.description?.toLowerCase().includes(query);
        const bankMatch = mov.account?.name?.toLowerCase().includes(query) || mov.account?.bank_name?.toLowerCase().includes(query);

        return (
          invoiceMatch ||
          clientMatch ||
          senderMatch ||
          lastFourMatch ||
          refMatch ||
          cashierMatch ||
          descMatch ||
          bankMatch
        );
      }

      return true;
    });
  }, [movements, searchTerm, movementTypeFilter, currencyFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    let totalDepositsUsd = 0;
    let totalDepositsVes = 0;
    let totalWithdrawalsUsd = 0;
    let totalWithdrawalsVes = 0;
    let salesCount = 0;

    for (const mov of movements) {
      const isPositive = Number(mov.amount) >= 0;
      const amountAbs = Math.abs(Number(mov.amount));
      const isUsd = mov.account?.currency === 'USD';

      if (isPositive) {
        if (isUsd) totalDepositsUsd += amountAbs;
        else totalDepositsVes += amountAbs;
      } else {
        if (isUsd) totalWithdrawalsUsd += amountAbs;
        else totalWithdrawalsVes += amountAbs;
      }

      if (mov.sale) {
        salesCount++;
      }
    }

    return {
      totalDepositsUsd,
      totalDepositsVes,
      totalWithdrawalsUsd,
      totalWithdrawalsVes,
      salesCount,
      totalMovements: movements.length
    };
  }, [movements]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3 shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Libro Mayor</h1>
            <p className="text-xs text-slate-500 font-medium">
              Registro cronológico, trazabilidad de cobros por punto de venta y conciliación de cuentas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => fetchData(selectedAccountId)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <Link
            href="/accounts/banks"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <Building className="h-3.5 w-3.5" />
            Cuentas Bancarias
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ingresos / Cobros USD</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-mono font-black text-xl text-slate-900">
              ${stats.totalDepositsUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Depósitos y ventas en divisas</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ingresos / Cobros VES</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-mono font-black text-xl text-slate-900">
              Bs. {stats.totalDepositsVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Pago Móvil y transferencias VES</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Egresos / Retiros</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-mono font-black text-xl text-rose-600">
              ${stats.totalWithdrawalsUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              + Bs. {stats.totalWithdrawalsVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas Conciliadas</span>
            <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-mono font-black text-xl text-indigo-700">
              {stats.salesCount} / {stats.totalMovements}
            </span>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Cobros de caja vs total asientos</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por factura, cliente, referencia, emisor (email/teléfono), 4 dígitos o cajero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Account Filter */}
          <div className="w-full md:w-auto min-w-[220px]">
            <select
              value={selectedAccountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 transition-all outline-none cursor-pointer"
            >
              <option value="ALL">Todas las Cuentas</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bank_name} - {acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Filter */}
          <div className="w-full md:w-auto">
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 transition-all outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Tipos</option>
              <option value="SALES">Solo Cobros POS / Ventas</option>
              <option value="DEPOSIT">Depósitos / Entradas</option>
              <option value="WITHDRAWAL">Retiros / Salidas</option>
              <option value="TRANSFER">Transferencias Internas</option>
            </select>
          </div>

          {/* Currency Filter */}
          <div className="w-full md:w-auto">
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 transition-all outline-none cursor-pointer"
            >
              <option value="ALL">Moneda: Todas</option>
              <option value="USD">Solo USD ($)</option>
              <option value="VES">Solo VES (Bs.)</option>
            </select>
          </div>
        </div>

        {/* Quick account pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Filtrar por Cuenta:</span>
          <button
            type="button"
            onClick={() => handleAccountChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedAccountId === 'ALL'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todas ({movements.length})
          </button>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => handleAccountChange(acc.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedAccountId === acc.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${acc.currency === 'USD' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span>{acc.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Cargando registros del Libro Mayor...</span>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No se encontraron movimientos</p>
            <p className="text-xs text-slate-400">Prueba ajustando los filtros o realiza cobros desde el Punto de Venta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Fecha / Hora</th>
                  <th className="py-3.5 px-4">Cuenta Receptora</th>
                  <th className="py-3.5 px-4">Concepto / Comprobante</th>
                  <th className="py-3.5 px-4">Detalle de Emisor & Referencia</th>
                  <th className="py-3.5 px-4">Responsable / Cliente</th>
                  <th className="py-3.5 px-4 text-right">Monto</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((mov) => {
                  const isPositive = Number(mov.amount) >= 0;
                  const isSale = !!mov.sale;

                  return (
                    <tr key={mov.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(mov.created_at).toLocaleString('es-VE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{mov.account?.name || 'Cuenta'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {mov.account?.bank_name} ({mov.account?.currency})
                        </div>
                      </td>

                      {/* Concept / Invoice */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isSale ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              Factura #{mov.sale?.invoice_number || 'S/N'}
                            </span>
                          ) : (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isPositive ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {mov.type === 'DEPOSIT' ? 'Depósito' : mov.type === 'WITHDRAWAL' ? 'Retiro' : mov.type}
                            </span>
                          )}
                          {mov.payment_metadata?.payment_method?.toUpperCase().includes('CHANGE') && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              🔄 Vuelto Regresado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate max-w-xs">{mov.description}</p>
                      </td>

                      {/* Sender metadata, 4 digits & reference */}
                      <td className="py-3.5 px-4">
                        {mov.payment_metadata ? (
                          <div className="space-y-0.5">
                            {mov.payment_metadata.payment_method && (
                              <div className="text-slate-800 font-semibold text-[11px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Método: </span>
                                <span className={mov.payment_metadata.payment_method.toUpperCase().includes('CHANGE') ? 'text-amber-700 font-bold' : 'text-indigo-700 font-bold'}>
                                  {formatPaymentMethod(mov.payment_metadata.payment_method)}
                                </span>
                              </div>
                            )}
                            {mov.payment_metadata.sender_identifier && (
                              <div className="text-slate-800 font-medium">
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Emisor: </span>
                                <span className="font-semibold text-indigo-700">{mov.payment_metadata.sender_identifier}</span>
                              </div>
                            )}
                            {mov.payment_metadata.last_four_digits && (
                              <div className="font-mono text-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Últimos 4: </span>
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">****{mov.payment_metadata.last_four_digits}</span>
                              </div>
                            )}
                            {mov.payment_metadata.transaction_reference && !mov.payment_metadata.last_four_digits && (
                              <div className="font-mono text-slate-700 text-[11px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Ref: </span>
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">{mov.payment_metadata.transaction_reference}</span>
                              </div>
                            )}
                          </div>
                        ) : mov.reference ? (
                          <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            Ref: {mov.reference}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin referencia</span>
                        )}
                      </td>

                      {/* Cashier & Client */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {mov.sale?.client_name ? (
                          <div>
                            <span className="font-semibold text-slate-800">{mov.sale.client_name}</span>
                            <div className="text-[10px] text-slate-400 font-mono">Cajero: {mov.created_by?.name || 'Sistema'}</div>
                          </div>
                        ) : (
                          <span>{mov.created_by?.name || 'Sistema'}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? '+' : ''}
                          {mov.account?.currency === 'USD' ? '$' : 'Bs. '}
                          {Math.abs(Number(mov.amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isSale && mov.sale?.id ? (
                          <ActionTooltip content="Ver Productos y Tasa Aplicada">
                            <button
                              type="button"
                              onClick={() => setViewingSaleId(mov.sale!.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </ActionTooltip>
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Detail Modal (Sally Enterprise UX Standard) */}
      {viewingSaleId && (
        <SaleDetailModal
          saleId={viewingSaleId}
          onClose={() => setViewingSaleId(null)}
        />
      )}

    </div>
  );
}
