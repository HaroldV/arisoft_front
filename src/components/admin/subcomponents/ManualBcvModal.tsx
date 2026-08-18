import React, { useState } from 'react';
import { Globe, X, RefreshCw, AlertCircle, Calendar, ArrowRight, DollarSign, Euro } from 'lucide-react';

interface ManualBcvModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsdRate: number;
  currentEurRate: number;
  lastUpdated: string;
  onSaveManualRates: (rates: { usdRate?: number; eurRate?: number }, valueDate?: string, note?: string) => Promise<void>;
  onTriggerScrape: () => Promise<void>;
  isSyncing: boolean;
}

export const ManualBcvModal: React.FC<ManualBcvModalProps> = ({
  isOpen,
  onClose,
  currentUsdRate,
  currentEurRate,
  lastUpdated,
  onSaveManualRates,
  onTriggerScrape,
  isSyncing,
}) => {
  const [usdInput, setUsdInput] = useState<string>(currentUsdRate > 0 ? currentUsdRate.toString() : '772.54');
  const [eurInput, setEurInput] = useState<string>(currentEurRate > 0 ? currentEurRate.toString() : '894.49');
  const [valueDate, setValueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('Ajuste oficial según portal www.bcv.org.ve');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedUsd = parseFloat(usdInput.replace(',', '.'));
    const parsedEur = parseFloat(eurInput.replace(',', '.'));

    if (isNaN(parsedUsd) || parsedUsd <= 0) {
      setErrorMessage('Por favor ingresa un valor numérico mayor a cero para la tasa USD ($).');
      return;
    }
    if (isNaN(parsedEur) || parsedEur <= 0) {
      setErrorMessage('Por favor ingresa un valor numérico mayor a cero para la tasa EUR (€).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveManualRates({ usdRate: parsedUsd, eurRate: parsedEur }, valueDate, note);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar las tasas maestras');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header fijo */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Tasas Maestras Globales BCV (USD / EUR)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Ajuste y sincronización dual para toda la plataforma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Banner actual */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Tasas Vigentes en Plataforma
              </span>
              <span className="text-[11px] font-medium text-slate-400">{lastUpdated}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Tarjeta USD */}
              <div className="p-3 bg-white/95 border border-slate-200/80 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Dólar Oficial
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">USD</span>
                </div>
                <div className="font-mono font-black text-xl text-slate-900">
                  Bs. {currentUsdRate.toFixed(2)}
                </div>
              </div>

              {/* Tarjeta EUR */}
              <div className="p-3 bg-white/95 border border-slate-200/80 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Euro className="w-3.5 h-3.5 text-indigo-600" /> Euro Oficial
                  </span>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">EUR</span>
                </div>
                <div className="font-mono font-black text-xl text-slate-900">
                  Bs. {currentEurRate.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">¿Deseas consultar la web oficial en vivo?</span>
              <button
                type="button"
                onClick={onTriggerScrape}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                <span>{isSyncing ? 'Consultando...' : 'Scraping bcv.org.ve'}</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-800 text-xs font-bold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario manual */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Registro / Ajuste Manual de Tasas Oficiales
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Input USD */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tasa Oficial Dólar ($ / USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-slate-400">
                    Bs.
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 772.54"
                    value={usdInput}
                    onChange={(e) => setUsdInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Input EUR */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tasa Oficial Euro (€ / EUR) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-slate-400">
                    Bs.
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 894.49"
                    value={eurInput}
                    onChange={(e) => setEurInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Fecha Valor */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Fecha Valor BCV
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={valueDate}
                  onChange={(e) => setValueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Justificación / Nota */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Nota de Referencia / Justificación
              </label>
              <input
                type="text"
                placeholder="Ej. Actualización según cierre de mesas de cambio BCV"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </form>

        {/* Footer fijo */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando Tasas...</span>
              </>
            ) : (
              <>
                <span>Guardar y Propagar Tasas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
