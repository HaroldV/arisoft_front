'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import { ACCOUNT_TYPES, AccountType, ENTITY_TYPES, EntityType } from '@/constants/domain-constants';

interface AccountCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AccountType;
  newEntityType: EntityType;
  setNewEntityType: (type: EntityType) => void;
  newEntityName: string;
  setNewEntityName: (name: string) => void;
  newPreviousBalance: string;
  setNewPreviousBalance: (val: string) => void;
  newPeriodAmount: string;
  setNewPeriodAmount: (val: string) => void;
  newReferenceDate: string;
  setNewReferenceDate: (val: string) => void;
  handleCreateAccount: (e: React.FormEvent) => void;
}

export function AccountCreateModal({
  isOpen,
  onClose,
  activeTab,
  newEntityType,
  setNewEntityType,
  newEntityName,
  setNewEntityName,
  newPreviousBalance,
  setNewPreviousBalance,
  newPeriodAmount,
  setNewPeriodAmount,
  newReferenceDate,
  setNewReferenceDate,
  handleCreateAccount,
}: AccountCreateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-900">
            Registrar Nueva Cuenta ({activeTab === ACCOUNT_TYPES.PAYABLE ? 'CxP Proveedor' : 'CxC Cliente'})
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Tipo de Entidad
            </label>
            <select
              value={newEntityType}
              onChange={(e: any) => setNewEntityType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
            >
              {activeTab === ACCOUNT_TYPES.PAYABLE ? (
                <>
                  <option value={ENTITY_TYPES.PROVIDER}>Proveedor</option>
                  <option value={ENTITY_TYPES.PARTNER}>Socio / Tercero</option>
                </>
              ) : (
                <>
                  <option value={ENTITY_TYPES.CLIENT}>Cliente</option>
                  <option value={ENTITY_TYPES.PARTNER}>Aliado Comercial</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Nombre / Razón Social *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Distribuidora Nacional C.A."
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Saldo Previo ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newPreviousBalance}
                onChange={(e) => setNewPreviousBalance(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Monto Período ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newPeriodAmount}
                onChange={(e) => setNewPeriodAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Fecha de Referencia / Notas
            </label>
            <input
              type="text"
              placeholder="Ej: Factura #1042 o Saldo Inicial"
              value={newReferenceDate}
              onChange={(e) => setNewReferenceDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl text-sm cursor-pointer shadow-md shadow-indigo-200"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cuenta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
