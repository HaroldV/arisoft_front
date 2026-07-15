import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Settings2, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X,
  FileText,
  Percent,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

interface FiscalRange {
  id?: string;
  type: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  start_number: number;
  end_number: number;
  current_number: number;
  authorization_number: string;
  created_at?: string;
}

export const FiscalConfig: React.FC = () => {
  const [ranges, setRanges] = useState<FiscalRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formType, setFormType] = useState<'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'>('INVOICE');
  const [formStart, setFormStart] = useState<number>(1);
  const [formEnd, setFormEnd] = useState<number>(999999);
  const [formCurrent, setFormCurrent] = useState<number>(0);
  const [formAuth, setFormAuth] = useState<string>('');

  const fetchRanges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/tenant/fiscal-ranges');
      setRanges(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener los rangos fiscales.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRanges();
  }, []);

  const handleOpenModal = (range?: FiscalRange) => {
    if (range) {
      setFormType(range.type);
      setFormStart(range.start_number);
      setFormEnd(range.end_number);
      setFormCurrent(range.current_number);
      setFormAuth(range.authorization_number);
    } else {
      setFormType('INVOICE');
      setFormStart(1);
      setFormEnd(999999);
      setFormCurrent(0);
      setFormAuth('');
    }
    setModalError(null);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSaving(true);

    if (formStart >= formEnd) {
      setModalError('El número inicial debe ser estrictamente menor que el número final.');
      setIsSaving(false);
      return;
    }

    if (formCurrent < 0 || formCurrent < formStart - 1) {
      setModalError(`El número actual no puede ser menor al inicio del rango menos uno (${formStart - 1}).`);
      setIsSaving(false);
      return;
    }

    const payload = {
      type: formType,
      startNumber: Number(formStart),
      endNumber: Number(formEnd),
      currentNumber: Number(formCurrent),
      authorizationNumber: formAuth.trim(),
    };

    try {
      await apiClient.post('/tenant/fiscal-ranges', payload);
      setSuccess('Rango fiscal guardado correctamente.');
      handleCloseModal();
      fetchRanges();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Ocurrió un error al guardar el rango fiscal.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRangeDetails = (type: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE') => {
    return ranges.find(r => r.type === type);
  };

  const renderRangeCard = (type: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE', title: string, subtitle: string) => {
    const range = getRangeDetails(type);
    
    // Calculate progress percentage
    let percentUsed = 0;
    let available = 0;
    if (range) {
      const total = range.end_number - range.start_number + 1;
      const consumed = range.current_number - range.start_number + 1;
      percentUsed = Math.min(100, Math.max(0, (consumed / total) * 100));
      available = Math.max(0, range.end_number - range.current_number);
    }

    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
              <FileText className="h-5 w-5" />
            </div>
            {range ? (
              <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Configurado
              </span>
            ) : (
              <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                No Configurado
              </span>
            )}
          </div>

          <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
          <p className="text-xs text-slate-500 mb-4">{subtitle}</p>

          {range ? (
            <div className="space-y-4">
              {/* Range numbers grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 font-medium block">Rango Autorizado:</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {String(range.start_number).padStart(8, '0')} a {String(range.end_number).padStart(8, '0')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Consumido Actual:</span>
                  <span className="text-slate-800 font-bold font-mono">
                    #{String(range.current_number).padStart(8, '0')}
                  </span>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 pt-2">
                  <span className="text-slate-400 font-medium block">Autorización SENIAT:</span>
                  <span className="text-slate-800 font-semibold font-mono truncate block" title={range.authorization_number}>
                    {range.authorization_number}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                  <span>Porcentaje Consumido:</span>
                  <span className="font-bold text-slate-700">{percentUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${percentUsed > 90 ? 'bg-rose-500' : percentUsed > 75 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Quedan {available.toLocaleString()} números</span>
                  {percentUsed > 90 && <span className="text-rose-500 font-bold">¡Por agotar!</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <AlertCircle className="h-6 w-6 text-slate-300 mb-1.5" />
              <p className="text-xs text-slate-400 px-4">Debe registrar un rango fiscal activo para poder operar e imprimir este tipo de documentos fiscales.</p>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-50">
          <button
            onClick={() => handleOpenModal(range || { type } as any)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Settings2 className="h-4 w-4" />
            {range ? 'Editar Configuración' : 'Registrar Rango'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header card styled per AGENTS.md */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Control de Rangos Fiscales</h1>
            <p className="text-xs text-slate-500">Configure los rangos de numeración del SENIAT para Facturación y Notas de Ajuste.</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-950">¡Guardado con Éxito!</p>
            <p className="text-xs text-emerald-700 mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-950">Error de Conexión</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center flex-col gap-2">
          <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Cargando rangos fiscales...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderRangeCard(
            'INVOICE', 
            'Facturas de Venta', 
            'Establece el rango de numeración fiscal y providencia para facturas POS y crédito.'
          )}
          {renderRangeCard(
            'CREDIT_NOTE', 
            'Notas de Crédito', 
            'Establece el rango de folios para emitir notas de crédito por devoluciones.'
          )}
          {renderRangeCard(
            'DEBIT_NOTE', 
            'Notas de Débito', 
            'Establece el rango de folios para emitir notas de débito por recargos.'
          )}
        </div>
      )}

      {/* Modal matching AGENTS.md requirements */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                Configurar Rango Fiscal: {
                  formType === 'INVOICE' 
                    ? 'Facturas' 
                    : formType === 'CREDIT_NOTE' 
                      ? 'Notas de Crédito' 
                      : 'Notas de Débito'
                }
              </h3>
              <button 
                type="button"
                onClick={handleCloseModal} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in duration-200">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tipo de Documento</label>
                <select
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 focus:outline-none"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                >
                  <option value="INVOICE">Factura de Venta</option>
                  <option value="CREDIT_NOTE">Nota de Crédito</option>
                  <option value="DEBIT_NOTE">Nota de Débito</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Número de Providencia / Autorización *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. SENIAT-2026-0001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
                  value={formAuth}
                  onChange={(e) => setFormAuth(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Folio Inicial *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-right"
                    value={formStart}
                    onChange={(e) => setFormStart(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Folio Final *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-right"
                    value={formEnd}
                    onChange={(e) => setFormEnd(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Número Actual Consumido *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-right"
                  value={formCurrent}
                  onChange={(e) => setFormCurrent(Number(e.target.value))}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Establece cuál es el último folio que fue emitido. Las nuevas emisiones empezarán a partir de #{formCurrent + 1}.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl text-xs transition-all cursor-pointer"
              >
                {isSaving && <Loader2 className="animate-spin h-3.5 w-3.5" />}
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
