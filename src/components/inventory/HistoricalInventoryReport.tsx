'use client';

import React, { useState } from 'react';
import { 
  PackageSearch, 
  Search, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  Calculator,
  ArrowRightLeft,
  Layers,
  Percent
} from 'lucide-react';

interface SnapshotItem {
  id: string;
  snapshot_date: string;
  product_name: string;
  sku: string;
  category_name: string;
  quantity_on_hand: number;
  unit_cost_usd: number;
  unit_price_usd: number;
  exchange_rate: number;
  total_cost_usd: number;
  total_cost_bs: number;
  total_price_usd: number;
  total_price_bs: number;
  created_by_user_name?: string;
}

// Initial Mock Seed Data matching realistic client inventory
const MOCK_SNAPSHOTS: SnapshotItem[] = [
  { id: '1', snapshot_date: '2026-06-30', product_name: 'Papel Fotocopia Carta (Resma)', sku: 'PAP-RES-01', category_name: 'Papelería', quantity_on_hand: 450, unit_cost_usd: 3.50, unit_price_usd: 5.20, exchange_rate: 36.50, total_cost_usd: 1575.00, total_cost_bs: 57487.50, total_price_usd: 2340.00, total_price_bs: 85410.00, created_by_user_name: 'Juana Pérez' },
  { id: '2', snapshot_date: '2026-06-30', product_name: 'Tinta HP GT53 Negra 90ml', sku: 'TNT-HP-01', category_name: 'Insumos', quantity_on_hand: 120, unit_cost_usd: 8.20, unit_price_usd: 12.50, exchange_rate: 36.50, total_cost_usd: 984.00, total_cost_bs: 35916.00, total_price_usd: 1500.00, total_price_bs: 54750.00, created_by_user_name: 'Juana Pérez' },
  { id: '3', snapshot_date: '2026-06-30', product_name: 'Archivador Palanca Ancha', sku: 'ARC-PAL-02', category_name: 'Oficina', quantity_on_hand: 280, unit_cost_usd: 2.10, unit_price_usd: 3.80, exchange_rate: 36.50, total_cost_usd: 588.00, total_cost_bs: 21462.00, total_price_usd: 1064.00, total_price_bs: 38836.00, created_by_user_name: 'Administrador' },
  { id: '4', snapshot_date: '2026-06-30', product_name: 'Bolígrafo Solita Azul (Caja 12u)', sku: 'SOL-BLU-12', category_name: 'Escolar', quantity_on_hand: 600, unit_cost_usd: 1.80, unit_price_usd: 3.00, exchange_rate: 36.50, total_cost_usd: 1080.00, total_cost_bs: 39420.00, total_price_usd: 1800.00, total_price_bs: 65700.00, created_by_user_name: 'Juana Pérez' },
  { id: '5', snapshot_date: '2026-06-30', product_name: 'Cinta Embalaje Transparente 48mm', sku: 'CNT-EMB-48', category_name: 'Empaque', quantity_on_hand: 320, unit_cost_usd: 0.95, unit_price_usd: 1.75, exchange_rate: 36.50, total_cost_usd: 304.00, total_cost_bs: 11096.00, total_price_usd: 560.00, total_price_bs: 20440.00, created_by_user_name: 'Administrador' },
  { id: '6', snapshot_date: '2026-06-30', product_name: 'Marcador Permanente Negro (Caja)', sku: 'MRC-PER-01', category_name: 'Escolar', quantity_on_hand: 190, unit_cost_usd: 4.00, unit_price_usd: 6.50, exchange_rate: 36.50, total_cost_usd: 760.00, total_cost_bs: 27740.00, total_price_usd: 1235.00, total_price_bs: 45077.50, created_by_user_name: 'Juana Pérez' },
];

export default function HistoricalInventoryReport() {
  const [items, setItems] = useState<SnapshotItem[]>(MOCK_SNAPSHOTS);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [exchangeRate, setExchangeRate] = useState<string>('36.50');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const rateNum = parseFloat(exchangeRate) || 36.50;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredItems = items.filter(
    (i) =>
      i.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase().includes(search.toLowerCase())) ||
      (i.category_name && i.category_name.toLowerCase().includes(search.toLowerCase()))
  );

  // Recalculate totals dynamically based on current filter & user-defined exchange rate
  const totalUnits = filteredItems.reduce((acc, i) => acc + Number(i.quantity_on_hand), 0);
  const totalCostUsd = filteredItems.reduce((acc, i) => acc + Number(i.total_cost_usd), 0);
  const totalCostBs = totalCostUsd * rateNum;
  const totalPriceUsd = filteredItems.reduce((acc, i) => acc + Number(i.total_price_usd), 0);
  const totalPriceBs = totalPriceUsd * rateNum;
  const projectedProfitUsd = totalPriceUsd - totalCostUsd;
  const profitMarginPercent = totalCostUsd > 0 ? ((projectedProfitUsd / totalCostUsd) * 100) : 0;

  const handleTriggerSnapshot = () => {
    showToast(`✅ Foto de inventario actualizada para la fecha de hoy con tasa de ${rateNum} Bs/USD.`);
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU', 'Producto', 'Categoría', 'Existencia', 'Costo Unit USD', 'Precio Venta Unit USD',
      'Total Costo USD', 'Total Venta USD', 'Tasa Referencial', 'Total Costo Bs', 'Total Venta Bs'
    ].join(',');

    const rows = filteredItems.map((i) => [
      i.sku || '',
      `"${i.product_name}"`,
      `"${i.category_name}"`,
      i.quantity_on_hand,
      i.unit_cost_usd.toFixed(2),
      i.unit_price_usd.toFixed(2),
      i.total_cost_usd.toFixed(2),
      i.total_price_usd.toFixed(2),
      rateNum.toFixed(2),
      (i.total_cost_usd * rateNum).toFixed(2),
      (i.total_price_usd * rateNum).toFixed(2)
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Valuacion_Inventario_${startDate}_al_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Archivo CSV exportado exitosamente.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Header Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <PackageSearch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Valuación de Inventario
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría histórica de existencias, valuación a costo y precio de venta en USD y Bolívares
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleTriggerSnapshot}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Actualizar Foto de Hoy
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-sm transition-all text-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel (.csv)
          </button>
        </div>
      </div>

      {/* Filter Bar: Date Range Picker & Exchange Rate Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
            />
          </div>

          {/* REFERENTIAL EXCHANGE RATE INPUT WITH REAL-TIME RECALCULATION */}
          <div className="flex items-center gap-2 bg-indigo-50/80 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-900">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <span>Tasa Referencial ($/Bs.):</span>
            <input
              type="number"
              step="0.01"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className="w-20 bg-white px-2 py-1 border border-indigo-200 rounded-lg font-mono font-bold text-xs text-indigo-900 focus:outline-none text-right"
            />
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU, producto o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Summary KPI Cards Grid (Financial Audit View) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Unidades en Stock</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalUnits.toLocaleString()} unds.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valuación a Costo</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">${totalCostUsd.toFixed(2)} USD</p>
            <p className="text-[11px] font-mono text-slate-500">Bs. {totalCostBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valuación a Precio Venta (PVP)</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">${totalPriceUsd.toFixed(2)} USD</p>
            <p className="text-[11px] font-mono text-slate-500">Bs. {totalPriceBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Margen Comercial Proyectado</p>
            <p className="text-lg font-bold text-purple-600 mt-0.5">+${projectedProfitUsd.toFixed(2)} USD</p>
            <p className="text-[11px] font-semibold text-purple-500">+{profitMarginPercent.toFixed(1)}% de margen</p>
          </div>
        </div>
      </div>

      {/* Main Audit Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">SKU / Producto</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-center">Existencia</th>
                <th className="py-3.5 px-4 text-right">Costo Unit. ($)</th>
                <th className="py-3.5 px-4 text-right">PVP Unit. ($)</th>
                <th className="py-3.5 px-4 text-right">Total Costo ($)</th>
                <th className="py-3.5 px-4 text-right">Total Venta ($)</th>
                <th className="py-3.5 px-4 text-right">Total Costo (Bs.)</th>
                <th className="py-3.5 px-4 text-right">Total Venta (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map((item) => {
                const costBs = item.total_cost_usd * rateNum;
                const priceBs = item.total_price_usd * rateNum;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <p className="font-mono text-xs text-slate-400">{item.sku || 'SIN-SKU'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        {item.category_name || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {item.quantity_on_hand}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 text-xs">
                      ${Number(item.unit_cost_usd).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-semibold text-xs">
                      ${Number(item.unit_price_usd).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                      ${Number(item.total_cost_usd).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      ${Number(item.total_price_usd).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 text-xs">
                      Bs. {costBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700 text-xs">
                      Bs. {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals Summary Footer */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs uppercase">
                <td colSpan={2} className="py-4 px-4 text-slate-300">
                  Totales Valuación de Inventario:
                </td>
                <td className="py-4 px-4 text-center font-mono text-indigo-300 text-sm">
                  {totalUnits.toLocaleString()}
                </td>
                <td colSpan={2}></td>
                <td className="py-4 px-4 text-right font-mono text-amber-300">
                  ${totalCostUsd.toFixed(2)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-emerald-300 text-sm">
                  ${totalPriceUsd.toFixed(2)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-amber-200 text-xs">
                  Bs. {totalCostBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 text-right font-mono text-emerald-200 text-xs">
                  Bs. {totalPriceBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
