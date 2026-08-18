import React, { useState, useEffect } from 'react';
import apiClient from '@/infrastructure/api/api-client';
import { Loader2, DollarSign, Euro, Sliders, CheckCircle2, AlertCircle, Info } from 'lucide-react';

/**
 * CurrencyConfig Component
 * Standard: Sally Enterprise UX Standard & Sovereign Economy (ST-2.2)
 * Permite seleccionar entre:
 * 1. Tasa Oficial BCV - Dólar (USD)
 * 2. Tasa Oficial BCV - Euro (EUR)
 * 3. Tasa Manual Propia (Personalizada para el negocio)
 */
export const CurrencyConfig: React.FC = () => {
  const [baseCurrency, setBaseCurrency] = useState<'VES' | 'USD'>('USD');
  const [rateMode, setRateMode] = useState<'BCV_USD' | 'BCV_EUR' | 'MANUAL'>('BCV_USD');
  const [manualRate, setManualRate] = useState<string>('780.00');

  const [bcvUsdRate, setBcvUsdRate] = useState<number>(772.54);
  const [bcvEurRate, setBcvEurRate] = useState<number>(894.49);
  const [bcvValueDate, setBcvValueDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigAndRates = async () => {
      setIsLoading(true);
      try {
        // 1. Obtener perfil de la empresa
        const profileRes = await apiClient.get('/tenant/profile');
        const settings = profileRes.data?.settings || {};
        
        setBaseCurrency(settings.baseCurrency || 'USD');

        // Mapear modo configurado
        if (settings.isAutomatic === false || settings.currencyMode === 'MANUAL') {
          setRateMode('MANUAL');
        } else if (settings.officialCurrency === 'EUR') {
          setRateMode('BCV_EUR');
        } else {
          setRateMode('BCV_USD');
        }

        if (settings.manualRate) {
          setManualRate(settings.manualRate.toString());
        }

        // 2. Obtener tasas maestras vigentes
        const ratesRes = await apiClient.get('/admin/bcv/rate');
        if (ratesRes.data) {
          if (ratesRes.data.USD?.rate) setBcvUsdRate(Number(ratesRes.data.USD.rate));
          else if (ratesRes.data.rate) setBcvUsdRate(Number(ratesRes.data.rate));

          if (ratesRes.data.EUR?.rate) setBcvEurRate(Number(ratesRes.data.EUR.rate));
          if (ratesRes.data.value_date) setBcvValueDate(ratesRes.data.value_date);
        }
      } catch (err: any) {
        console.error('Error fetching currency config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigAndRates();
  }, []);

  const getEffectiveRate = (): number => {
    if (rateMode === 'BCV_USD') return bcvUsdRate;
    if (rateMode === 'BCV_EUR') return bcvEurRate;
    const parsed = parseFloat(manualRate.replace(',', '.'));
    return isNaN(parsed) || parsed <= 0 ? 780.00 : parsed;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const manualVal = parseFloat(manualRate.replace(',', '.'));
    if (rateMode === 'MANUAL' && (isNaN(manualVal) || manualVal <= 0)) {
      setErrorMessage('Por favor introduce una tasa manual válida mayor a 0 (ej. 780.00).');
      setIsSaving(false);
      return;
    }

    const effectiveRate = getEffectiveRate();
    const isAuto = rateMode !== 'MANUAL';
    const officialCurrency = rateMode === 'BCV_EUR' ? 'EUR' : 'USD';

    const payload = {
      settings: {
        baseCurrency,
        isAutomatic: isAuto,
        currencyMode: rateMode,
        officialCurrency,
        manualRate: manualVal || 780.00,
        exchangeRate: effectiveRate,
      },
    };

    try {
      await apiClient.put('/tenant/profile', payload);
      setSuccessMessage('¡Configuración cambiaria actualizada y guardada con éxito!');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('exchange-rate-updated', {
            detail: {
              rate: effectiveRate,
              mode: rateMode,
              officialCurrency,
            },
          })
        );
      }

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving currency config:', err);
      setErrorMessage(err.response?.data?.message || 'Error al guardar la configuración cambiaria.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="text-xs text-slate-500 font-semibold">Cargando tasas de cambio...</span>
      </div>
    );
  }

  const effectiveRate = getEffectiveRate();

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-4 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Banner de Tasa Efectiva Activa */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
              <Info className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tasa Activa para Precios en Bolívares (Bs.)
            </span>
          </div>
          {bcvValueDate && (
            <span className="text-[11px] font-medium text-slate-400">
              Fecha Valor: {bcvValueDate}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-mono font-black text-3xl text-slate-900 tracking-tight">
            Bs. {effectiveRate.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-slate-500">
            / {rateMode === 'BCV_EUR' ? 'EUR (€)' : 'USD ($)'}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Esta tasa se aplicará automáticamente en el Punto de Venta (POS), Facturación, Cotizaciones y Catálogo de Productos:{' '}
          <strong className="text-slate-700 font-mono">Precio en Bs. = Precio USD × {effectiveRate.toFixed(2)}</strong>.
        </p>
      </div>

      {/* Selección de Modo de Tasa */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Modo de Tasa de Cambio para su Empresa *
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Opción 1: BCV Dólar */}
          <div
            onClick={() => setRateMode('BCV_USD')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              rateMode === 'BCV_USD'
                ? 'bg-indigo-50/50 border-indigo-600 shadow-xs ring-1 ring-indigo-600/20'
                : 'bg-white border-slate-200 hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Tasa Oficial USD
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                BCV Auto
              </span>
            </div>
            <div>
              <div className="font-mono font-black text-lg text-slate-900">
                Bs. {bcvUsdRate.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Sincronización diaria automática con el portal del BCV.</p>
            </div>
          </div>

          {/* Opción 2: BCV Euro */}
          <div
            onClick={() => setRateMode('BCV_EUR')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              rateMode === 'BCV_EUR'
                ? 'bg-indigo-50/50 border-indigo-600 shadow-xs ring-1 ring-indigo-600/20'
                : 'bg-white border-slate-200 hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Euro className="w-4 h-4 text-indigo-600" /> Tasa Oficial EUR
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                BCV Auto
              </span>
            </div>
            <div>
              <div className="font-mono font-black text-lg text-slate-900">
                Bs. {bcvEurRate.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Calcula precios en Bs. basados en el Euro oficial del BCV.</p>
            </div>
          </div>

          {/* Opción 3: Tasa Manual Propia */}
          <div
            onClick={() => setRateMode('MANUAL')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              rateMode === 'MANUAL'
                ? 'bg-indigo-50/50 border-indigo-600 shadow-xs ring-1 ring-indigo-600/20'
                : 'bg-white border-slate-200 hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sliders className="w-4 h-4 text-slate-600" /> Tasa Propia / Manual
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Fija
              </span>
            </div>
            <div>
              <div className="font-mono font-black text-lg text-slate-900">
                Bs. {parseFloat(manualRate) ? parseFloat(manualRate).toFixed(2) : '---'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Tasa fija definida por usted, sin cambios automáticos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Input de Tasa Manual (Visible cuando se selecciona Tasa Propia) */}
      {rateMode === 'MANUAL' && (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 animate-in fade-in duration-200">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Monto de su Tasa Personalizada (Bs. / USD) *
          </label>
          <div className="relative max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-slate-400">
              Bs.
            </span>
            <input
              type="text"
              placeholder="Ej. 780.00"
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Los precios de sus productos se calcularán con este valor fijo independientemente de las fluctuaciones del BCV.
          </p>
        </div>
      )}

      {/* Moneda Base de Reportes */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Moneda Base para Métricas y Reportes
        </label>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setBaseCurrency('USD')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              baseCurrency === 'USD'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Dólares Estadounidenses (USD)
          </button>
          <button
            type="button"
            onClick={() => setBaseCurrency('VES')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              baseCurrency === 'VES'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Bolívares Digitales (VES)
          </button>
        </div>
      </div>

      {/* Botón de Guardado */}
      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{isSaving ? 'Guardando Ajustes...' : 'GUARDAR CONFIGURACIÓN CAMBIARIA'}</span>
        </button>
      </div>
    </div>
  );
};
