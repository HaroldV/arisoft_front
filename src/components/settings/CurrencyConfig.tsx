import React, { useState, useEffect } from 'react';
import apiClient from '@/infrastructure/api/api-client';
import { Loader2 } from 'lucide-react';

/**
 * CurrencyConfig Component
 * Purpose: Manage base currency and exchange rate mode.
 * Standard: Sovereign Economy (ST-2.2)
 */
export const CurrencyConfig: React.FC = () => {
  const [baseCurrency, setBaseCurrency] = useState<'VES' | 'USD'>('USD');
  const [isAutomatic, setIsAutomatic] = useState(true);
  const [manualRate, setManualRate] = useState('36.50');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/tenant/profile');
        const settings = res.data?.settings || {};
        setBaseCurrency(settings.baseCurrency || 'USD');
        setIsAutomatic(settings.isAutomatic !== false);
        setManualRate(settings.manualRate?.toString() || '36.50');
      } catch (err: any) {
        console.error('Error fetching currency config:', err);
        setErrorMessage('Error al cargar la configuración cambaria.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const rateVal = parseFloat(manualRate);
    if (!isAutomatic && (isNaN(rateVal) || rateVal <= 0)) {
      setErrorMessage('Por favor introduce una tasa manual válida mayor a 0.');
      setIsSaving(false);
      return;
    }

    const calculatedRate = isAutomatic ? 36.52 : rateVal;

    const payload = {
      settings: {
        baseCurrency,
        isAutomatic,
        manualRate: rateVal || 36.50,
        exchangeRate: calculatedRate,
      }
    };

    try {
      await apiClient.put('/tenant/profile', payload);
      setSuccessMessage('Configuración cambiaria guardada exitosamente.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('exchange-rate-updated', {
          detail: { rate: calculatedRate }
        }));
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving currency config:', err);
      setErrorMessage(err.response?.data?.message || 'Error al guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Ajustes de Moneda y Tasa de Cambio</h3>
      
      {successMessage && (
        <div className="p-3.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-100 rounded-xl">
          {errorMessage}
        </div>
      )}

      <div className="space-y-5">
        {/* Base Currency Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Moneda Base de Reportes</label>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setBaseCurrency('VES')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                baseCurrency === 'VES' 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Bolívares (VES)
            </button>
            <button
              type="button"
              onClick={() => setBaseCurrency('USD')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                baseCurrency === 'USD' 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Dólares (USD)
            </button>
          </div>
        </div>

        {/* Exchange Rate Mode */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">Usar tasa oficial BCV</p>
            <p className="text-xs text-slate-400">Se actualiza automáticamente cada día con el valor oficial (Bs. 36.52).</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAutomatic(!isAutomatic)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
              isAutomatic ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-xs ${
              isAutomatic ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Manual Rate Input */}
        {!isAutomatic && (
          <div className="pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Tasa Manual (1 USD = X VES) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Ej: 36.50"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold"
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{isSaving ? 'Guardando...' : 'GUARDAR CONFIGURACIÓN'}</span>
        </button>
      </div>
    </div>
  );
};
