'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  X,
  FileCheck,
  Building2,
  Users
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { parsePartyFile, PartyParseResult, ParsedPartyRow } from '../services/party-file-parser';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partyType: 'client' | 'provider';
}

export function BulkImportModal({ isOpen, onClose, onSuccess, partyType }: BulkImportModalProps) {
  const isClient = partyType === 'client';
  const entityLabel = isClient ? 'Clientes' : 'Proveedores';
  const templatePath = isClient ? '/plantilla_clientes_ari.xlsx' : '/plantilla_proveedores_ari.xlsx';
  const apiEndpoint = isClient ? '/clients/bulk' : '/providers/bulk';

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<PartyParseResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    insertedCount?: number;
    errors?: { line?: number; name?: string; tax_id?: string; reason?: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile: File, sheetToParse?: string) => {
    const valid = ['.xlsx', '.xls'].some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    if (!valid) {
      setResult({
        success: false,
        message: 'Formato inválido. Selecciona un archivo Excel (.xlsx, .xls).'
      });
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const parsed = parsePartyFile(buffer, partyType, sheetToParse, selectedFile.name);
      setParsedData(parsed);
      setSelectedSheet(parsed.sheetName);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Error al analizar el archivo.'
      });
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!parsedData || parsedData.items.length === 0) return;
    setIsUploading(true);
    setResult(null);

    try {
      const response = await apiClient.post(apiEndpoint, parsedData.items);
      const data = response.data;
      const errorList = data.errors || [];
      const hasErrors = errorList.length > 0;
      const inserted = data.insertedCount || 0;

      setResult({
        success: !hasErrors,
        message: hasErrors
          ? (inserted > 0
              ? `Carga finalizada con advertencias: ${inserted} registros importados y ${errorList.length} con incidencias.`
              : `No se importaron registros debido a ${errorList.length} errores.`)
          : `¡Carga masiva completada! Se registraron ${inserted} ${entityLabel.toLowerCase()} con éxito.`,
        insertedCount: inserted,
        errors: errorList
      });

      if (!hasErrors) {
        onSuccess();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al conectar con el servidor para la carga masiva.';
      setResult({
        success: false,
        message: Array.isArray(msg) ? msg.join(', ') : msg
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              {isClient ? <Users className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Carga Masiva de {entityLabel}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Importa tu listado desde Excel (.xlsx) con compatibilidad directa para RIF y datos fiscales.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Download Template Banner */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                Plantilla Oficial Excel (.xlsx) - Arivsoft
              </span>
              <p className="text-xs text-slate-600">
                Descarga la plantilla oficial con encabezados delineados en azul y filas de ejemplo para una carga sin errores.
              </p>
            </div>
            <a
              href={templatePath}
              download
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Descargar Plantilla (.xlsx)</span>
            </a>
          </div>

          {/* Upload Area */}
          {!parsedData && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
                {isParsing ? (
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-indigo-600" />
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 text-center mb-1">
                Haz clic para examinar o arrastra tu archivo Excel aquí
              </p>
              <p className="text-xs text-slate-500 text-center max-w-sm">
                Soporta archivos de Excel (.xlsx, .xls) según el formato oficial.
              </p>
            </div>
          )}

          {/* Preview & Confirmation */}
          {parsedData && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{file?.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {parsedData.totalRows} registros válidos identificados
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
                >
                  Cambiar Archivo
                </button>
              </div>

              {/* Data Table Preview */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50/90 sticky top-0 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Razón Social / Nombre</th>
                        <th className="py-2.5 px-3">R.I.F.</th>
                        <th className="py-2.5 px-3">Teléfono</th>
                        <th className="py-2.5 px-3">E-Mail</th>
                        <th className="py-2.5 px-3">Dirección</th>
                        <th className="py-2.5 px-3">Contribuyente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.items.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-900">{row.name}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-700 bg-slate-50/60 rounded">
                            {row.tax_id}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{row.phone || '-'}</td>
                          <td className="py-2 px-3 text-slate-600">{row.email || '-'}</td>
                          <td className="py-2 px-3 text-slate-600 truncate max-w-xs">{row.address || '-'}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {row.taxpayer_type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.items.length > 10 && (
                  <div className="bg-slate-50/80 p-2 text-center text-[11px] text-slate-500 border-t border-slate-200">
                    Mostrando los primeros 10 de {parsedData.items.length} registros cargados.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result Alert */}
          {result && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                result.success
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50/90 border-rose-200 text-rose-800'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{result.message}</p>
                {result.errors && result.errors.length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] mt-1 text-rose-700 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>
                        Línea {err.line}: {err.name ? `[${err.name}] ` : ''}{err.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-xs cursor-pointer"
          >
            {result?.success ? 'Cerrar' : 'Cancelar'}
          </button>
          {parsedData && parsedData.items.length > 0 && !result?.success && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-xs cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Importar {parsedData.items.length} {entityLabel}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
