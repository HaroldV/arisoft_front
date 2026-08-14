'use client';

import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Plus, 
  ArrowLeftRight, 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  CreditCard,
  Building,
  DollarSign,
  Smartphone,
  ChevronRight,
  Edit2,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import { ActionTooltip } from '@/components/ActionTooltip';
import { SearchableSelect } from '@/components/SearchableSelect';
import { RifInput } from '@/components/RifInput';
import apiClient from '@/infrastructure/api/api-client';
import { VENEZUELAN_BANKS } from '@/constants/venezuela';

interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number?: string;
  account_type: 'CORRIENTE' | 'AHORRO' | 'EFECTIVO';
  currency: 'USD' | 'VES';
  current_balance: number;
  p2p_phone?: string;
  p2p_tax_id?: string;
  p2p_bank_code?: string;
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(36.50);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals Control
  const [activeModal, setActiveModal] = useState<'create' | 'adjust' | 'transfer' | null>(null);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  
  // Forms State
  const [accountForm, setAccountForm] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    account_type: 'CORRIENTE',
    currency: 'USD',
    initial_balance: 0,
    p2p_phone: '',
    p2p_tax_id: '',
    p2p_bank_code: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    accountId: '',
    type: 'DEPOSIT', // 'DEPOSIT' or 'WITHDRAWAL'
    amount: '',
    reference: '',
    description: ''
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    reference: '',
    description: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/bank-accounts');
      setAccounts(response.data);
    } catch (err: any) {
      setError('Error al obtener la lista de cuentas bancarias.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setAccountForm({
      name: '',
      bank_name: '',
      account_number: '',
      account_type: 'CORRIENTE',
      currency: 'USD',
      initial_balance: 0,
      p2p_phone: '',
      p2p_tax_id: '',
      p2p_bank_code: ''
    });
    setModalError(null);
    setModalSuccess(false);
    setActiveModal('create');
  };

  const handleOpenEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setAccountForm({
      name: acc.name,
      bank_name: acc.bank_name,
      account_number: acc.account_number || '',
      account_type: acc.account_type,
      currency: acc.currency,
      initial_balance: Number(acc.current_balance),
      p2p_phone: acc.p2p_phone || '',
      p2p_tax_id: acc.p2p_tax_id || '',
      p2p_bank_code: acc.p2p_bank_code || ''
    });
    setModalError(null);
    setModalSuccess(false);
    setActiveModal('create');
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);

    // Mismatch prevention check for VES accounts
    if (accountForm.currency === 'VES' && accountForm.account_number) {
      const cleanedAcc = accountForm.account_number.replace(/\D/g, '');
      if (cleanedAcc.length > 0 && accountForm.p2p_bank_code) {
        const firstFour = cleanedAcc.substring(0, 4);
        if (firstFour !== accountForm.p2p_bank_code) {
          setModalError(`Advertencia: El número de cuenta ingresado inicia con el código ${firstFour}, pero has seleccionado un banco con código ${accountForm.p2p_bank_code}. Por favor verifica.`);
          setIsSaving(false);
          return;
        }
      }
    }

    try {
      const payload = {
        name: accountForm.name.trim(),
        bank_name: accountForm.bank_name.trim(),
        account_number: accountForm.account_number.trim() || undefined,
        account_type: accountForm.account_type,
        currency: accountForm.currency,
        initial_balance: Number(accountForm.initial_balance) || 0,
        p2p_phone: accountForm.p2p_phone.trim() || undefined,
        p2p_tax_id: accountForm.p2p_tax_id.trim().toUpperCase() || undefined,
        p2p_bank_code: accountForm.p2p_bank_code.trim() || undefined
      };

      if (editingAccount) {
        await apiClient.put(`/bank-accounts/${editingAccount.id}`, payload);
      } else {
        await apiClient.post('/bank-accounts', payload);
      }

      setModalSuccess(true);
      setTimeout(() => {
        setActiveModal(null);
        fetchAccounts();
      }, 1000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Error al guardar la cuenta bancaria.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.accountId) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await apiClient.post(`/bank-accounts/${adjustForm.accountId}/adjust`, {
        type: adjustForm.type,
        amount: Number(adjustForm.amount),
        reference: adjustForm.reference.trim() || undefined,
        description: adjustForm.description.trim() || undefined
      });

      setModalSuccess(true);
      setTimeout(() => {
        setActiveModal(null);
        setAdjustForm({ accountId: '', type: 'DEPOSIT', amount: '', reference: '', description: '' });
        fetchAccounts();
      }, 1000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Error al ajustar el saldo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      await apiClient.post('/bank-accounts/transfer', {
        fromAccountId: transferForm.fromAccountId,
        toAccountId: transferForm.toAccountId,
        amount: Number(transferForm.amount),
        reference: transferForm.reference.trim() || undefined,
        description: transferForm.description.trim() || undefined
      });

      setModalSuccess(true);
      setTimeout(() => {
        setActiveModal(null);
        setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', reference: '', description: '' });
        fetchAccounts();
      }, 1000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Error al procesar la transferencia.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await apiClient.delete(`/bank-accounts/${deletingId}`);
      setAccounts(prev => prev.filter(a => a.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      setError('No se pudo desactivar la cuenta.');
    }
  };

  const handleBankDropdownChange = (bankCode: string) => {
    const selectedBank = VENEZUELAN_BANKS.find(b => b.code === bankCode);
    if (selectedBank) {
      setAccountForm({
        ...accountForm,
        bank_name: selectedBank.name,
        p2p_bank_code: selectedBank.code
      });
    } else {
      setAccountForm({
        ...accountForm,
        bank_name: '',
        p2p_bank_code: ''
      });
    }
  };

  // Metrics calculation
  const totalUsdInCuentas = accounts.reduce((sum, acc) => {
    if (acc.currency === 'USD') return sum + Number(acc.current_balance);
    return sum + (Number(acc.current_balance) / exchangeRate);
  }, 0);

  const totalVesInCuentas = totalUsdInCuentas * exchangeRate;

  const totalDivisasUsd = accounts.filter(a => a.currency === 'USD').reduce((sum, a) => sum + Number(a.current_balance), 0);
  const totalMonedaVES = accounts.filter(a => a.currency === 'VES').reduce((sum, a) => sum + Number(a.current_balance), 0);

  // Check if there is an account number starting with a code that doesn't match selected bank
  const getAccountNumberMismatchWarning = () => {
    if (accountForm.currency !== 'VES' || !accountForm.account_number || !accountForm.p2p_bank_code) return null;
    const cleaned = accountForm.account_number.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      const firstFour = cleaned.substring(0, 4);
      if (firstFour !== accountForm.p2p_bank_code) {
        return `⚠️ Mismatch: Los primeros 4 dígitos (${firstFour}) no coinciden con el código oficial del banco seleccionado (${accountForm.p2p_bank_code}).`;
      }
    }
    return null;
  };

  const warningMsg = getAccountNumberMismatchWarning();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cuentas Bancarias</h1>
          <p className="text-slate-500">Monitorea y administra la tesorería, cajas de efectivo y conciliaciones.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => { setTransferForm(prev => ({ ...prev, fromAccountId: '', toAccountId: '', amount: '' })); setModalSuccess(false); setModalError(null); setActiveModal('transfer'); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer bg-white"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Transferencia
          </button>
          <button
            onClick={() => { setAdjustForm(prev => ({ ...prev, accountId: '', type: 'DEPOSIT', amount: '' })); setModalSuccess(false); setModalError(null); setActiveModal('adjust'); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer bg-white"
          >
            <TrendingUp className="h-4 w-4" />
            Ajustar Saldo
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-lg cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Crear Cuenta
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950">Error detectado</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Modern KPI dashboard summary panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="space-y-1.5 border-r border-slate-100 pr-5 last:border-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Consolidado USD</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">${totalUsdInCuentas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs font-semibold text-slate-400">USD</span>
          </div>
        </div>

        <div className="space-y-1.5 border-r border-slate-100 pr-5 last:border-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Consolidado VES</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary-600">{totalVesInCuentas.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs font-semibold text-primary-400">Bs.</span>
          </div>
        </div>

        <div className="space-y-1.5 border-r border-slate-100 pr-5 last:border-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo en Divisas</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-800">${totalDivisasUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs font-semibold text-slate-400">USD</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasa Cambiaria (VES/USD)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              className="w-20 text-sm font-bold text-slate-700 border border-slate-200 rounded px-1.5 py-0.5"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
            />
            <span className="text-[10px] text-slate-400 font-semibold font-mono">Tasa global</span>
          </div>
        </div>
      </div>

      {/* Grid of Bank Cards */}
      {isLoading && accounts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white border border-slate-100 rounded-2xl shadow-xs">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Cargando tesorería...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="py-20 text-center space-y-2 bg-white border border-slate-100 rounded-2xl shadow-xs">
          <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-600">No hay cuentas bancarias creadas</p>
          <p className="text-xs text-slate-400">Registra tus cuentas bancarias o cajas de efectivo para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const isVes = acc.currency === 'VES';
            const balanceNum = Number(acc.current_balance);
            
            // Equivalency calculation
            const equivBalance = isVes ? (balanceNum / exchangeRate) : (balanceNum * exchangeRate);
            const equivCurrency = isVes ? 'USD' : 'VES';

            // Custom gradient styles based on bank/currency
            const gradientClass = isVes 
              ? 'from-blue-600 to-indigo-700 text-white shadow-blue-600/10' 
              : acc.account_type === 'EFECTIVO'
              ? 'from-emerald-600 to-teal-700 text-white shadow-emerald-600/10'
              : 'from-purple-600 to-primary-700 text-white shadow-purple-600/10';

            return (
              <div 
                key={acc.id} 
                className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-6 shadow-lg border border-white/10 flex flex-col relative overflow-hidden h-52 group transition-all hover:-translate-y-1 hover:shadow-xl`}
              >
                {/* Background decorative patterns */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none -mr-4 -mb-4">
                  <Landmark className="h-44 w-44" />
                </div>

                <div className="flex justify-between items-start z-10">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">{acc.bank_name}</span>
                    <h3 className="font-extrabold text-base truncate max-w-44">{acc.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-bold font-mono tracking-wider">
                    {acc.currency}
                  </span>
                </div>

                {/* Account Number */}
                {acc.account_number && (
                  <p className="text-xs font-mono tracking-wider opacity-75 mt-3 z-10">
                    **** **** **** {acc.account_number.slice(-4)}
                  </p>
                )}

                {/* Main balance display */}
                <div className="mt-auto z-10">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black">
                      {isVes ? '' : '$'}
                      {balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {isVes ? ' Bs.' : ''}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold opacity-60 mt-0.5">
                    Equivalente: {equivCurrency === 'USD' ? '$' : ''}
                    {equivBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {equivCurrency === 'VES' ? ' Bs.' : ''}
                  </p>
                </div>

                {/* Floating controls inside card */}
                <div className="absolute right-4 top-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-all cursor-pointer"
                    title="Editar cuenta"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setDeletingId(acc.id)}
                    className="p-1.5 hover:bg-white/20 rounded-lg text-rose-200 hover:text-rose-100 transition-all cursor-pointer"
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal (Sally Enterprise UX Standard) */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {editingAccount ? 'Editar Cuenta Bancaria' : 'Registrar Cuenta Bancaria'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Tesorería & Conciliación • Paridad Multimoneda (USD / VES)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4.5 overflow-y-auto flex-1 custom-scrollbar">
                {modalSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>¡Datos bancarios guardados con éxito!</span>
                  </div>
                )}

                {modalError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold">
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nombre Alias de la Cuenta</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Banesco Operativo Principal"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Banco / Entidad Financiera</label>
                    {accountForm.currency === 'VES' ? (
                      <select
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                        value={VENEZUELAN_BANKS.find(b => b.name === accountForm.bank_name)?.code || ''}
                        onChange={(e) => handleBankDropdownChange(e.target.value)}
                      >
                        <option value="">Selecciona Banco Nacional...</option>
                        {VENEZUELAN_BANKS.map(b => (
                          <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Ej. Chase Bank, Wells Fargo, Banesco Panamá"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                        value={accountForm.bank_name}
                        onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Moneda</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                      value={accountForm.currency}
                      disabled={!!editingAccount}
                      onChange={(e) => {
                        const newCur = e.target.value;
                        setAccountForm({ 
                          ...accountForm, 
                          currency: newCur,
                          bank_name: newCur === 'VES' ? VENEZUELAN_BANKS[0].name : '',
                          p2p_bank_code: newCur === 'VES' ? VENEZUELAN_BANKS[0].code : ''
                        });
                      }}
                    >
                      <option value="USD">USD ($ - Dólar)</option>
                      <option value="VES">VES (Bs. - Bolívares)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tipo de Cuenta</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                      value={accountForm.account_type}
                      onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                    >
                      <option value="CORRIENTE">Corriente</option>
                      <option value="AHORRO">Ahorro</option>
                      <option value="EFECTIVO">Caja de Efectivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Saldo Inicial</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      disabled={!!editingAccount}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono font-bold text-right"
                      value={accountForm.initial_balance}
                      onChange={(e) => setAccountForm({ ...accountForm, initial_balance: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Número de Cuenta (20 dígitos)</label>
                  <input
                    type="text"
                    placeholder="0102-0000-00-0000000000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm font-semibold"
                    value={accountForm.account_number}
                    onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                  />
                  {warningMsg && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-pulse">
                      {warningMsg}
                    </p>
                  )}
                </div>

                {/* Pago Móvil section */}
                {accountForm.currency === 'VES' && (
                  <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">Metadatos de Pago Móvil Interbancario (P2P)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Teléfono</label>
                        <input
                          type="text"
                          placeholder="04121234567"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                          value={accountForm.p2p_phone}
                          onChange={(e) => setAccountForm({ ...accountForm, p2p_phone: e.target.value })}
                        />
                      </div>
                      <RifInput
                        value={accountForm.p2p_tax_id || ''}
                        label="RIF / Cédula Pago Móvil"
                        onChange={(formattedRif) => setAccountForm(prev => ({ ...prev, p2p_tax_id: formattedRif }))}
                      />
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Código Banco</label>
                        <input
                          type="text"
                          disabled
                          placeholder="0102"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-100 text-slate-600 font-bold"
                          value={accountForm.p2p_bank_code}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                  {editingAccount ? 'Guardar Cambios' : 'Registrar Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal (Sally Enterprise UX Standard) */}
      {activeModal === 'adjust' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Ajuste Manual de Saldo
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Calibración de saldo en libros por auditoría
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalance} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {modalSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>Ajuste registrado con éxito.</span>
                  </div>
                )}

                {modalError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold">
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Cuenta Bancaria Destino</label>
                  <select
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                    value={adjustForm.accountId}
                    onChange={(e) => setAdjustForm({ ...adjustForm, accountId: e.target.value })}
                  >
                    <option value="">Selecciona una cuenta...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (${Number(a.current_balance).toFixed(2)} {a.currency})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tipo de Ajuste</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold"
                      value={adjustForm.type}
                      onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                    >
                      <option value="DEPOSIT">Depósito / Ingreso (+)</option>
                      <option value="WITHDRAWAL">Retiro / Egreso (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Monto de Ajuste</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono font-black text-right"
                      value={adjustForm.amount}
                      onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nro. de Referencia (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Referencia de transferencia, voucher o nota contable..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono"
                    value={adjustForm.reference}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reference: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Descripción / Justificación</label>
                  <input
                    type="text"
                    placeholder="Ej. Inyección de capital, Pago de arriendo, Comisión..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    value={adjustForm.description}
                    onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !adjustForm.accountId}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal (Sally Enterprise UX Standard) */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Transferencia entre Cuentas
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Movimiento de fondos interno en la misma moneda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {modalSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>Transferencia completada con éxito.</span>
                  </div>
                )}

                {modalError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm font-semibold">
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Cuenta de Origen (Débito)</label>
                    <select
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                      value={transferForm.fromAccountId}
                      onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                    >
                      <option value="">Selecciona cuenta de origen...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (${Number(a.current_balance).toFixed(2)} {a.currency})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Cuenta de Destino (Crédito)</label>
                    <select
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                      value={transferForm.toAccountId}
                      onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                    >
                      <option value="">Selecciona cuenta de destino...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (${Number(a.current_balance).toFixed(2)} {a.currency})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Monto a Transferir</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono font-black text-right"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Descripción / Concepto</label>
                    <input
                      type="text"
                      placeholder="Ej. Transferencia interna de caja a banco operativo..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      value={transferForm.description}
                      onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !transferForm.fromAccountId || !transferForm.toAccountId}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                  Transferir Fondos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 mt-0.5 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">¿Desactivar cuenta bancaria?</h3>
                <p className="text-xs text-slate-500">
                  Esta acción desactivará la cuenta en el sistema. Los saldos no se eliminarán pero la cuenta no aparecerá activa para futuros cobros o depósitos del Punto de Venta.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors animate-in"
              >
                Desactivar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
