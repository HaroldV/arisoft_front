'use client';

import React, { useState, useRef } from 'react';
import { ProductForm } from '@/components/inventory/ProductForm';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

export default function InitialInventoryPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    insertedCount?: number;
    errors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        setUploadResult({
          success: false,
          message: 'Error: Únicamente se permiten archivos con extensión .csv'
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        setUploadResult({
          success: false,
          message: 'Error: Únicamente se permiten archivos con extensión .csv'
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/inventory/products/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult({
        success: true,
        message: 'Carga masiva finalizada con éxito.',
        insertedCount: response.data.insertedCount || response.data.total,
        errors: response.data.errors || []
      });
      setFile(null);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setUploadResult({
          success: false,
          message: Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
        });
      } else {
        setUploadResult({
          success: false,
          message: 'Error al enviar el archivo al servidor. Por favor reintenta.'
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Crear Productos</h1>
        <p className="text-slate-500">Registra y administra las fichas de los productos en tu catálogo general.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => { setActiveTab('manual'); setUploadResult(null); }}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Registro Manual
        </button>
        <button
          onClick={() => { setActiveTab('bulk'); setUploadResult(null); }}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'bulk'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Carga Masiva (CSV)
        </button>
      </div>

      {/* Tabs Content */}
      <div className="mt-6">
        {activeTab === 'manual' ? (
          <ProductForm />
        ) : (
          <div className="w-full space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Carga por Lote (Archivo CSV)</h3>
                  <p className="text-xs text-slate-500">Importa múltiples productos al catálogo. Las existencias iniciales se registrarán en cero y deben ser valorizadas mediante facturas de compras.</p>
                </div>
                <a
                  href="/template_inventario.csv"
                  download
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Descargar Plantilla CSV
                </a>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-primary-500 bg-primary-50/50' 
                    : file 
                      ? 'border-emerald-500 bg-emerald-50/10' 
                      : 'border-slate-200 hover:border-primary-500 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 w-fit mx-auto">
                      <FileSpreadsheet className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400 w-fit mx-auto">
                      <Upload className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Arrastra tu archivo CSV aquí</p>
                    <p className="text-xs text-slate-400">O haz clic para seleccionar desde tu computadora</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {file && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center py-3 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-700 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-primary-600/10 hover:shadow-lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4.5 w-4.5" />
                      Procesando archivo...
                    </>
                  ) : (
                    'Iniciar Carga Masiva'
                  )}
                </button>
              )}
            </div>

            {/* Results Report Banner */}
            {uploadResult && (
              <div className={`p-6 rounded-2xl border ${
                uploadResult.success 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                  : 'bg-rose-50 border-rose-100 text-rose-900'
              } animate-in fade-in duration-200`}>
                <div className="flex items-start gap-3">
                  {uploadResult.success ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <p className="font-bold text-sm">{uploadResult.message}</p>
                    {uploadResult.insertedCount !== undefined && (
                      <p className="text-xs font-medium">
                        Se cargaron con éxito <span className="font-bold">{uploadResult.insertedCount}</span> productos.
                      </p>
                    )}
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-xs font-semibold flex items-center gap-1 text-amber-800">
                          <AlertCircle className="h-4 w-4" />
                          Detalle de advertencias / errores detectados:
                        </span>
                        <ul className="list-disc pl-5 text-[11px] font-mono text-slate-600 space-y-0.5">
                          {uploadResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
