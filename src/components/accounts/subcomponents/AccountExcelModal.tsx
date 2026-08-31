'use client';

import React from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import { ACCOUNT_TYPES, AccountType } from '@/constants/domain-constants';

interface AccountExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AccountType;
  importedRawText: string;
  setImportedRawText: (text: string) => void;
  handleProcessExcel: () => void;
}

export function AccountExcelModal({
  isOpen,
  onClose,
  activeTab,
  importedRawText,
  setImportedRawText,
  handleProcessExcel,
}: AccountExcelModalProps) {
  if (!isOpen) return null;

  const rowCount = importedRawText.split('\n').filter((l) => l.trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Asistente de Importación desde Excel ({activeTab === ACCOUNT_TYPES.PAYABLE ? 'CxP' : 'CxC'})
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Copia las filas de tu planilla Excel o pega el contenido en formato CSV/Tabulado a continuación.
            <br />
            <strong>Formato sugerido:</strong> Entidad, Fecha/Ref, Otros Meses, Facturado, Monto Pagado
          </p>

          <textarea
            rows={8}
            placeholder={`Distribuidora Full Office S.A\t25-abr-26\t444.46\t3164.32\t1844.48\nFerresoluciones C.A\t24-may-26\t286.50\t0.00\t0.00`}
            value={importedRawText}
            onChange={(e) => setImportedRawText(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-none"
          />

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">
              {rowCount} filas detectadas
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessExcel}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-sm cursor-pointer shadow-md shadow-emerald-200"
              >
                Procesar e Importar Filas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
