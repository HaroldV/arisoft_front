'use client';

import React, { useState } from 'react';
import { Layers, Sparkles, Check, Edit3, Save, RotateCcw } from 'lucide-react';
import { ALL_MODULE_GROUPS } from '../hooks/useSuperAdminData';
import { SAAS_SUBMODULE_PRICING, SAAS_ADDON_PRICING } from '@/constants/domain-constants';
import { CurrencyInput } from '@/components/CurrencyInput';

interface AddonPricingTableProps {
  masterBcvRate: number;
}

export const AddonPricingTable: React.FC<AddonPricingTableProps> = ({ masterBcvRate }) => {
  const [submoduleRates, setSubmoduleRates] = useState<Record<string, number>>(SAAS_SUBMODULE_PRICING);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleRateChange = (permKey: string, value: number) => {
    setSubmoduleRates(prev => ({
      ...prev,
      [permKey]: Math.max(0, value)
    }));
  };

  const handleResetDefaults = () => {
    setSubmoduleRates(SAAS_SUBMODULE_PRICING);
    setIsEditing(false);
    setSaveSuccess('Tarifas restablecidas a valores base del sistema.');
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const handleSaveRates = () => {
    setIsEditing(false);
    setSaveSuccess('¡Tarifas de submódulos y add-ons actualizadas correctamente!');
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-indigo-600 rounded-xl p-3 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Tarifario de Submódulos & Add-ons a la Carta
              </h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Cotizador Dinámico
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Valores mensuales sugeridos que el sistema aplica al cotizar funciones adicionales fuera del plan base.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer
              </button>
              <button
                type="button"
                onClick={handleSaveRates}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar Cambios
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Modificar Tarifas
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Tabla Desglosada por Módulos y Submódulos */}
      <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
              <th className="py-3 px-4">Módulo / Submódulo Específico</th>
              <th className="py-3 px-4">Clave del Permiso</th>
              <th className="py-3 px-4 text-center">Tipo de Add-on</th>
              <th className="py-3 px-4 text-right">Tarifa Mensual (USD)</th>
              <th className="py-3 px-4 text-right">Equivalente BCV (Bs.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ALL_MODULE_GROUPS.map((group) => {
              const fullModulePrice = SAAS_ADDON_PRICING[group.key] || 10.00;
              return (
                <React.Fragment key={group.key}>
                  {/* Fila Cabecera del Módulo Padre */}
                  <tr className="bg-slate-50/70 font-bold text-slate-800">
                    <td colSpan={2} className="py-2.5 px-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>Módulo Completo: {group.label}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                        Módulo Paquete
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-indigo-900 font-bold">
                      ${fullModulePrice.toFixed(2)}/mes
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500 text-[11px]">
                      Bs. {(fullModulePrice * masterBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Filas de Submódulos Específicos */}
                  {group.submodules.map((sub) => {
                    const currentRate = submoduleRates[sub.key] ?? 3.00;
                    return (
                      <tr key={sub.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 pl-8">
                          <p className="font-semibold text-slate-900 text-xs">{sub.label}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{sub.desc}</p>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 font-semibold">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {sub.key}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                            A la Carta
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {isEditing ? (
                            <div className="w-24 ml-auto">
                              <CurrencyInput
                                value={currentRate}
                                onChange={(val) => handleRateChange(sub.key, val)}
                                size="sm"
                                placeholder="0.00"
                                currencyPrefix="$"
                                icon={null}
                                decimals={2}
                              />
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 text-xs">
                              +${currentRate.toFixed(2)}/mes
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500 text-[11px]">
                          Bs. {(currentRate * masterBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
