'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle,
  ArrowUpRight,
  Clock,
  DollarSign,
  ShoppingCart,
  Receipt,
  FileText,
  Truck,
  PlusCircle,
  Building,
  Landmark,
  Layers,
  ArrowRight,
  ShieldCheck,
  Store,
  RefreshCw,
  Wallet,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

export default function WelcomeDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(36.50);
  const [calcUsd, setCalcUsd] = useState<string>('10');
  const [isLoading, setIsLoading] = useState(true);

  // Live ERP State
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formatted = new Date().toLocaleDateString('es-ES', options);
    setCurrentDate(formatted.charAt(0).toUpperCase() + formatted.slice(1));

    fetchLiveDashboardData();
  }, []);

  const fetchLiveDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Sales
      const salesRes = await apiClient.get('/sales/quotations').catch(() => ({ data: [] }));
      const rawSales = salesRes.data;
      const salesData = Array.isArray(rawSales) ? rawSales : (Array.isArray(rawSales?.data) ? rawSales.data : []);
      setSales(salesData);

      // Set exchange rate from latest doc if available
      if (salesData.length > 0 && salesData[0].exchange_rate) {
        setExchangeRate(Number(salesData[0].exchange_rate));
      }

      // 2. Fetch Products / Stock
      const stockRes = await apiClient.get('/inventory/stock').catch(() => ({ data: [] }));
      const rawStock = stockRes.data;
      const stockData = Array.isArray(rawStock) ? rawStock : (Array.isArray(rawStock?.data) ? rawStock.data : []);
      setProducts(stockData);

      // 3. Fetch Banks
      const banksRes = await apiClient.get('/accounts/banks').catch(() => ({ data: [] }));
      const rawBanks = banksRes.data;
      const banksData = Array.isArray(rawBanks) ? rawBanks : (Array.isArray(rawBanks?.data) ? rawBanks.data : []);
      setBankAccounts(banksData);

      // 4. Fetch Receivables
      const cxcRes = await apiClient.get('/accounts/receivables').catch(() => ({ data: [] }));
      const rawCxc = cxcRes.data;
      const cxcData = Array.isArray(rawCxc) ? rawCxc : (Array.isArray(rawCxc?.data) ? rawCxc.data : []);
      setReceivables(cxcData);

      // 5. Fetch Purchases
      const purRes = await apiClient.get('/inventory/purchases').catch(() => ({ data: [] }));
      const rawPur = purRes.data;
      const purData = Array.isArray(rawPur) ? rawPur : (Array.isArray(rawPur?.data) ? rawPur.data : []);
      setPurchases(purData);
    } catch (err) {
      console.error('Error fetching live dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculations for Today / Realtime
  const todaySales = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    return sales.filter(s => {
      const d = s.issue_date || (s.created_at ? s.created_at.split('T')[0] : '');
      return d === todayStr || sales.length <= 5; // fallback to active recent
    });
  }, [sales]);

  const todaySalesTotalUsd = useMemo(() => {
    if (!Array.isArray(todaySales)) return 0;
    return todaySales.reduce((acc, s) => acc + (Number(s.total_usd) || 0), 0);
  }, [todaySales]);

  const todaySalesTotalBs = useMemo(() => {
    return todaySalesTotalUsd * exchangeRate;
  }, [todaySalesTotalUsd, exchangeRate]);

  // Critical Low Stock Alerts (stock <= 5 or 0)
  const criticalStockItems = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => (p.current_stock || 0) <= 5).slice(0, 4);
  }, [products]);

  // Total Receivables Balance
  const totalReceivablesUsd = useMemo(() => {
    if (!Array.isArray(receivables)) return 0;
    return receivables.reduce((acc, r) => acc + (Number(r.pending_balance_usd || r.amount_usd) || 0), 0);
  }, [receivables]);

  // Total Bank Balances
  const totalLiquidityUsd = useMemo(() => {
    if (!Array.isArray(bankAccounts)) return 0;
    return bankAccounts.reduce((acc, b) => {
      const bal = Number(b.current_balance) || 0;
      return b.currency === 'USD' ? acc + bal : acc + (bal / exchangeRate);
    }, 0);
  }, [bankAccounts, exchangeRate]);

  const getFirstName = (fullName?: string) => {
    if (!fullName) return 'Usuario';
    return fullName.trim().split(/\s+/)[0];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Header Fijo / Panorama Ejecutivo de Bienvenida */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                ¡Hola de nuevo, {getFirstName(user?.full_name)}!
              </h1>
              <span className="font-mono text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg">
                {user?.role || 'OPERADOR'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Panel Operativo Diario • Resumen de caja, inventario y movimientos en tiempo real
            </p>
          </div>
        </div>

        {/* Live BCV Exchange Rate Card & Date */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50/60 border border-emerald-100/90 rounded-2xl p-3 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Tasa Oficial BCV
              </span>
              <div className="flex items-center gap-1.5 font-mono font-black text-sm text-slate-900">
                <span>Bs. {exchangeRate.toFixed(2)}</span>
                <span className="text-[10px] font-medium text-slate-400 font-sans">/ USD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-xs font-semibold text-slate-700">
            <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>{currentDate || 'Cargando fecha...'}</span>
            <button
              onClick={fetchLiveDashboardData}
              className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de 5 Accesos Rápidos Operativos (Quick Launch 1-Click) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Punto de Venta POS', desc: 'Cobrar en caja', icon: Store, path: '/pos', gradient: 'from-indigo-600 to-violet-600' },
          { label: 'Nueva Cotización', desc: 'Emitir a cliente', icon: FileText, path: '/sales/quotations', gradient: 'from-blue-600 to-cyan-600' },
          { label: 'Registrar Compra', desc: 'Factura proveedor', icon: Truck, path: '/inventory/purchases/new', gradient: 'from-amber-600 to-orange-600' },
          { label: 'Crear Producto', desc: 'Catálogo de stock', icon: PlusCircle, path: '/inventory/initial', gradient: 'from-emerald-600 to-teal-600' },
          { label: 'Cuentas Bancarias', desc: 'Bancos y cajas', icon: Landmark, path: '/accounts/banks', gradient: 'from-purple-600 to-pink-600' },
        ].map((act, i) => (
          <button
            key={i}
            onClick={() => router.push(act.path)}
            className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group cursor-pointer text-left"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${act.gradient} text-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform`}>
              <act.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors">
                {act.label}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {act.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* 3. 4 Tarjetas KPI Panorámicas en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventas Hoy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas Facturadas</span>
            <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-mono font-black text-2xl text-slate-900 tracking-tight">
              ${todaySalesTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
              <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Bs. {todaySalesTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span>• {todaySales.length} transacciones</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Liquidez en Bancos & Cajas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Saldo Disponible</span>
            <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-mono font-black text-2xl text-indigo-700 tracking-tight">
              ${totalLiquidityUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Distribuido en <span className="font-bold text-slate-800">{bankAccounts.length} cuentas activas</span>
            </p>
          </div>
        </div>

        {/* KPI 3: Alertas de Stock Crítico */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Alertas de Inventario</span>
            <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-mono font-black text-2xl text-rose-600 tracking-tight">
              {criticalStockItems.length} {criticalStockItems.length === 1 ? 'producto' : 'productos'}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Requieren <span className="font-bold text-rose-700">reposición inmediata</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Cuentas por Cobrar Pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Por Cobrar (CxC)</span>
            <div className="p-2 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-mono font-black text-2xl text-slate-900 tracking-tight">
              ${totalReceivablesUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Crédito otorgado a clientes pendientes
            </p>
          </div>
        </div>
      </div>

      {/* 4. Tablero Dual: Feed de Ventas Recientes + Alertas de Inventario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed de Ventas en Vivo (2 Columnas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                <span>Últimas Transacciones Registradas</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Movimientos recientes facturados en el sistema</p>
            </div>
            <button
              onClick={() => router.push('/sales')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Doc. #</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4 text-right">Total ($ USD)</th>
                  <th className="py-3 px-4 text-right">Total (Bs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.slice(0, 5).map((s, i) => (
                  <tr key={s.id || i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {s.document_number || `VTA-${i + 101}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {s.client_name || 'Cliente Mostrador'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {s.payment_method || 'EFECTIVO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${Number(s.total_usd || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600 text-xs">
                      Bs. {(Number(s.total_usd || 0) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No hay transacciones registradas hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Lateral: Alertas de Stock Bajo & Cuentas Bancarias (1 Columna) */}
        <div className="space-y-6">
          {/* Cuentas Bancarias / Saldo */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-600" />
                <span>Cuentas Bancarias</span>
              </h3>
              <button
                onClick={() => router.push('/accounts/banks')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Gestionar
              </button>
            </div>

            <div className="space-y-2">
              {bankAccounts.slice(0, 3).map((acc, i) => (
                <div
                  key={acc.id || i}
                  className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {acc.currency === 'USD' ? '$' : 'Bs'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{acc.bank_name || acc.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{acc.account_type || 'CORRIENTE'}</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xs text-slate-900">
                    {acc.currency === 'USD' ? `$${Number(acc.current_balance || 0).toFixed(2)}` : `Bs. ${Number(acc.current_balance || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              ))}
              {bankAccounts.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-3">No hay cuentas bancarias registradas.</p>
              )}
            </div>
          </div>

          {/* Alertas de Stock */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Stock Bajo / Reabastecer</span>
              </h3>
              <button
                onClick={() => router.push('/inventory/stock')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Inventario
              </button>
            </div>

            <div className="space-y-2">
              {criticalStockItems.map((prod, i) => (
                <div
                  key={prod.id || i}
                  className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{prod.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">SKU: {prod.sku}</p>
                  </div>
                  <span className="font-mono font-bold text-xs text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded-md">
                    {prod.current_stock || 0} un.
                  </span>
                </div>
              ))}
              {criticalStockItems.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Todos los productos con stock saludable.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
