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
  AlertCircle,
  Warehouse,
  FileCheck,
  Eye,
  Trash2,
  Package
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { parseProductFile, ParseResult } from '@/components/inventory/services/product-file-parser';

export default function InitialInventoryPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; type?: string }[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    insertedCount?: number;
    errors?: (string | { line?: number; sku?: string; reason?: string })[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const res = await apiClient.get('/inventory/warehouse-locations');
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        setWarehouses(list);
        if (list.length > 0) {
          setSelectedWarehouseId(list[0].id);
        }
      } catch (e) {
        console.error('Error fetching warehouses for bulk upload:', e);
      }
    };
    loadWarehouses();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processSelectedFile = async (selectedFile: File, sheetToParse?: string) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadResult({
        success: false,
        message: 'Error: Formato no soportado. Únicamente se permiten archivos Excel (.xlsx, .xls) o CSV (.csv).'
      });
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setUploadResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const parsed = parseProductFile(buffer, sheetToParse, selectedFile.name);
      setParsedData(parsed);
      setSelectedSheet(parsed.sheetName);
    } catch (err: any) {
      console.error('Error parsing product file:', err);
      setUploadResult({
        success: false,
        message: err.message || 'Error al procesar el archivo. Revisa que no esté corrupto o protegido con contraseña.'
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
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleSheetChange = (newSheet: string) => {
    if (!file) return;
    setSelectedSheet(newSheet);
    processSelectedFile(file, newSheet);
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedData(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!parsedData || parsedData.products.length === 0) return;
    setIsUploading(true);
    setUploadResult(null);

    const productsPayload = parsedData.products.map(p => ({
      sku: p.sku,
      name: p.name,
      category: p.category || 'General',
      costUsd: Number(p.costUsd) || 0,
      priceUsd: Number(p.priceUsd) || 0,
      taxRate: Number(p.taxRate) || 0,
      taxType: p.taxType || (p.taxRate === 0 ? 'EXEMPT' : 'TAXABLE'),
      initialStock: Number(p.initialStock) || 0,
      unitOfMeasure: p.unitOfMeasure || 'unidades',
      warehouseLocationId: selectedWarehouseId || undefined,
      warehouseCode: p.warehouseCode || undefined
    }));

    try {
      const response = await apiClient.post('/inventory/products', productsPayload);

      const successList = response.data?.success || [];
      const errorList = response.data?.errors || [];
      const hasErrors = errorList.length > 0;
      const inserted = successList.length > 0 ? successList.length : (response.data?.insertedCount || response.data?.length || productsPayload.length);

      setUploadResult({
        success: !hasErrors,
        message: hasErrors 
          ? (inserted > 0 
              ? `Carga completada con advertencias: ${inserted} productos guardados y ${errorList.length} con incidencias.`
              : `No se pudo importar ningún producto debido a ${errorList.length} errores.`)
          : '¡Carga masiva finalizada con éxito! Los productos y su inventario inicial fueron registrados en el catálogo.',
        insertedCount: inserted,
        errors: errorList
      });
      if (!hasErrors) {
        setFile(null);
        setParsedData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Bulk product upload error:', err);
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
          message: 'Error al enviar los productos al servidor. Por favor verifica que los SKUs no estén duplicados y reintenta.'
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
          Carga Masiva (Excel / CSV)
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
                  <h3 className="text-lg font-bold text-slate-900">Carga Masiva por Excel o CSV</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Importa tu catálogo de productos masivamente. Compatible con el formato oficial de inventario Excel (Categoría, Descripción, Cantidad, Precio) o plantilla CSV.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="/plantilla_inventario_hidrozulca.xlsx"
                    download
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                    title="Descargar plantilla Excel basada en Hidrozulca"
                  >
                    <Download className="h-4 w-4 text-emerald-600" />
                    <span>Plantilla Excel (.xlsx)</span>
                  </a>
                  <a
                    href="/template_inventario.csv"
                    download
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors cursor-pointer shadow-2xs"
                    title="Descargar plantilla estándar CSV"
                  >
                    <Download className="h-4 w-4 text-primary-600" />
                    <span>Plantilla CSV</span>
                  </a>
                </div>
              </div>

              {/* Warehouse Selector for Bulk Stock Assignment */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Warehouse className="w-4 h-4 text-primary-600" />
                      <span>Almacén Destino para Stock Inicial</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Las existencias iniciales del archivo CSV se registrarán en este almacén (a menos que el CSV contenga la columna <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">warehouseCode</code>).
                    </p>
                  </div>
                  <div className="sm:w-72">
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer shadow-2xs"
                    >
                      {warehouses.length === 0 ? (
                        <option value="">Cargando almacenes...</option>
                      ) : (
                        warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} {w.type ? `(${w.type})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Area */}
              {!parsedData && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-primary-500 bg-primary-50/50' 
                      : 'border-slate-200 hover:border-primary-500 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 w-fit mx-auto">
                      {isParsing ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {isParsing ? 'Analizando archivo...' : 'Arrastra tu archivo Excel (.xlsx, .xls) o CSV (.csv) aquí'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Compatible con el formato Inventario Hidrozulca (Categoría, Descripción, Cantidad, Precio)
                    </p>
                  </div>
                </div>
              )}

              {/* Parsed File Preview and Sheet Selector */}
              {parsedData && file && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{file.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {parsedData.detectedFormat === 'HIDROZULCA_EXCEL' 
                              ? 'Formato Referencia Hidrozulca' 
                              : 'Formato Estándar'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Se identificaron <strong className="text-emerald-800">{parsedData.products.length} productos válidos</strong> listos para importar.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {parsedData.availableSheets.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-600">Hoja:</span>
                          <select
                            value={selectedSheet}
                            onChange={(e) => handleSheetChange(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                          >
                            {parsedData.availableSheets.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleResetFile}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Quitar archivo y seleccionar otro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Products Table Preview */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-primary-600" />
                        <span>Vista Previa de Productos a Registrar ({parsedData.products.length})</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Mostrando primeros {Math.min(parsedData.products.length, 10)} de {parsedData.products.length}
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase sticky top-0 backdrop-blur-xs">
                          <tr>
                            <th className="py-2.5 px-4">SKU Generado</th>
                            <th className="py-2.5 px-4">Categoría</th>
                            <th className="py-2.5 px-4">Nombre del Producto</th>
                            <th className="py-2.5 px-4 text-right">Stock Inicial</th>
                            <th className="py-2.5 px-4 text-right">Precio (USD)</th>
                            <th className="py-2.5 px-4 text-center">IVA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {parsedData.products.slice(0, 10).map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{p.sku}</td>
                              <td className="py-2.5 px-4 font-semibold text-primary-700">{p.category}</td>
                              <td className="py-2.5 px-4 font-bold text-slate-800">{p.name}</td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                                {p.initialStock} {p.unitOfMeasure}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                                ${p.priceUsd.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                                {p.taxRate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedData.products.length > 10 && (
                      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 text-center text-xs text-slate-500">
                        ... y {parsedData.products.length - 10} productos adicionales que serán creados automáticamente.
                      </div>
                    )}
                  </div>

                  {/* Submit / Confirm Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-slate-500">
                      Al confirmar, se insertarán las fichas de productos y los saldos de inventario en el almacén seleccionado.
                    </p>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin h-4.5 w-4.5" />
                          <span>Guardando {parsedData.products.length} productos...</span>
                        </>
                      ) : (
                        <>
                          <Package className="h-4.5 w-4.5" />
                          <span>Confirmar e Importar {parsedData.products.length} Productos</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
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
                          Detalle de advertencias / errores detectados ({uploadResult.errors.length}):
                        </span>
                        <ul className="list-disc pl-5 text-[11px] font-mono text-slate-600 space-y-1">
                          {uploadResult.errors.map((err, i) => {
                            if (typeof err === 'object' && err !== null) {
                              const errObj = err as { line?: number; sku?: string; reason?: string };
                              return (
                                <li key={i}>
                                  {errObj.line ? `Fila ${errObj.line}: ` : ''}
                                  {errObj.sku ? `[SKU: ${errObj.sku}] - ` : ''}
                                  <span className="text-rose-700 font-semibold">{errObj.reason || JSON.stringify(err)}</span>
                                </li>
                              );
                            }
                            return <li key={i}>{String(err)}</li>;
                          })}
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
