'use client';

import React, { useState } from 'react';
import apiClient from '@/infrastructure/api/api-client';
import { ActionTooltip } from '@/components/ActionTooltip';
import { ACCOUNT_STATUS } from '@/constants/domain-constants';
import { 
  Landmark, 
  Plus, 
  FileSpreadsheet, 
  Search, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X, 
  Clock,
  History,
  Receipt,
  Eye,
  PackageCheck,
  Lock,
  Paperclip,
  Upload,
  FileText,
  Image as ImageIcon,
  UserCheck,
  Calculator,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Check
} from 'lucide-react';
import { CurrencyInput } from '@/components/CurrencyInput';

interface PaymentLog {
  id: string;
  payment_method: 'CASH_BS' | 'DEBIT_BS' | 'CASH_USD' | 'TRANSFER_USD';
  currency: string;
  amount: number;
  exchange_rate: number;
  amount_usd: number;
  reference_number?: string;
  created_by_user_name?: string;
  paid_at?: string;
}

interface AccountItem {
  id: string;
  type: 'PAYABLE' | 'RECEIVABLE';
  entity_type: 'PROVIDER' | 'CLIENT' | 'PARTNER';
  entity_name: string;
  reference_date?: string;
  reference_document_id?: string;
  reference_document_number?: string;
  supplier_invoice_number?: string;
  voucher_attachment_url?: string;
  invoice_registered_by_user_name?: string;
  invoice_registered_at?: string;
  notes?: string;
  previous_balance: number;
  period_amount: number;
  total_paid: number;
  balance_due: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  created_by_user_name?: string;
  payments?: PaymentLog[];
}

interface SummaryKPIs {
  total_previous_balance: number;
  total_period_amount: number;
  total_paid: number;
  total_balance_due: number;
}

// Initial Mock Seed Data matching the user's Excel screenshot (Junio 2026) with Payment Logs
const MOCK_ITEMS: AccountItem[] = [
  { id: '1', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Color Insumo', reference_date: '2026-06-01', previous_balance: 0, period_amount: 508.00, total_paid: 0, balance_due: 508.00, status: 'PENDING', created_by_user_name: 'Administrador', payments: [] },
  { 
    id: '2', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Distribuidora Full Office S.A', reference_date: '25-abr-26', previous_balance: 444.46, period_amount: 3164.32, total_paid: 1844.48, balance_due: 1764.31, status: 'PARTIAL', created_by_user_name: 'Juana Pérez',
    payments: [
      { id: 'p1', payment_method: 'DEBIT_BS', currency: 'BS', amount: 1365.00, exchange_rate: 36.50, amount_usd: 37.3973, reference_number: 'REF-88401', created_by_user_name: 'Juana Pérez', paid_at: '2026-06-15 10:30' },
      { id: 'p2', payment_method: 'CASH_USD', currency: 'USD', amount: 479.48, exchange_rate: 1.00, amount_usd: 479.48, reference_number: 'EF-USD-01', created_by_user_name: 'Juana Pérez', paid_at: '2026-06-18 14:15' },
      { id: 'p3', payment_method: 'TRANSFER_USD', currency: 'USD', amount: 1327.60, exchange_rate: 1.00, amount_usd: 1327.60, reference_number: 'ZELLE-994', created_by_user_name: 'Carlos Alberto', paid_at: '2026-06-20 11:00' },
    ]
  },
  { 
    id: '3', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Distribuidora J&J 2025 C.A', reference_date: 'Pointer', previous_balance: 99.80, period_amount: 0, total_paid: 150.00, balance_due: -50.20, status: 'PAID', created_by_user_name: 'Carlos Alberto',
    payments: [
      { id: 'p4', payment_method: 'DEBIT_BS', currency: 'BS', amount: 150.00, exchange_rate: 1.00, amount_usd: 150.00, reference_number: 'DEB-114', created_by_user_name: 'Carlos Alberto', paid_at: '2026-06-10 09:12' }
    ]
  },
  { id: '4', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Ferresoluciones C.A', reference_date: '24-may-26', previous_balance: 286.50, period_amount: 0, total_paid: 0, balance_due: 286.50, status: 'PENDING', created_by_user_name: 'Juana Pérez', payments: [] },
  { id: '5', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Inversiones Offigla C.A', reference_date: '30-Jul-25', previous_balance: 71.48, period_amount: 0, total_paid: 0, balance_due: 71.48, status: 'PENDING', created_by_user_name: 'Administrador', payments: [] },
  { 
    id: '6', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Ofica Representaciones S.A', reference_date: 'Solita', previous_balance: 0, period_amount: 344.98, total_paid: 290.26, balance_due: 54.71, status: 'PARTIAL', created_by_user_name: 'Juana Pérez',
    payments: [
      { id: 'p5', payment_method: 'DEBIT_BS', currency: 'BS', amount: 290.26, exchange_rate: 1.00, amount_usd: 290.26, reference_number: 'DEB-992', created_by_user_name: 'Juana Pérez', paid_at: '2026-06-22 16:45' }
    ]
  },
  { id: '7', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Quimicas Orocolor C.A', reference_date: '2026-06-10', previous_balance: 0, period_amount: 459.82, total_paid: 0, balance_due: 459.82, status: 'PENDING', created_by_user_name: 'Administrador', payments: [] },
  { 
    id: '8', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Quincalla', reference_date: 'Panque y Globos', previous_balance: 8.00, period_amount: 809.65, total_paid: 790.65, balance_due: 27.00, status: 'PARTIAL', created_by_user_name: 'Juana Pérez',
    payments: [
      { id: 'p6', payment_method: 'DEBIT_BS', currency: 'BS', amount: 144.65, exchange_rate: 1.00, amount_usd: 144.65, reference_number: 'DEB-771', created_by_user_name: 'Juana Pérez', paid_at: '2026-06-14 11:20' },
      { id: 'p7', payment_method: 'CASH_USD', currency: 'USD', amount: 646.00, exchange_rate: 1.00, amount_usd: 646.00, reference_number: 'EF-USD-88', created_by_user_name: 'Administrador', paid_at: '2026-06-25 15:00' }
    ]
  },
  { id: '9', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Xiografi Litografia C.A', reference_date: '31-may-26', previous_balance: 430.46, period_amount: 274.57, total_paid: 0, balance_due: 705.03, status: 'PENDING', created_by_user_name: 'Administrador', payments: [] },
  { 
    id: '10', type: 'PAYABLE', entity_type: 'PROVIDER', entity_name: 'Paper Supplies Pr C.A', reference_date: 'Rollos', previous_balance: 0, period_amount: 71.00, total_paid: 142.00, balance_due: -71.00, status: 'PAID', created_by_user_name: 'Juana Pérez',
    payments: [
      { id: 'p8', payment_method: 'CASH_USD', currency: 'USD', amount: 142.00, exchange_rate: 1.00, amount_usd: 142.00, reference_number: 'EF-142', created_by_user_name: 'Juana Pérez', paid_at: '2026-06-05 10:00' }
    ]
  },
  { id: '11', type: 'PAYABLE', entity_type: 'PARTNER', entity_name: 'Cuentas por Pagar Socio Gihan Bahsas', reference_date: 'Junio 2026', previous_balance: 1393.85, period_amount: 2361.79, total_paid: 0, balance_due: 3755.64, status: 'PENDING', created_by_user_name: 'Administrador', payments: [] },
];

interface ReceivablesPayablesProps {
  forcedTab?: 'PAYABLE' | 'RECEIVABLE';
}

export default function ReceivablesPayables({ forcedTab }: ReceivablesPayablesProps = {}) {
  const [activeTab, setActiveTab] = useState<'PAYABLE' | 'RECEIVABLE'>(forcedTab || 'RECEIVABLE');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AccountItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);

  // New account form state
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<'PROVIDER' | 'CLIENT' | 'PARTNER'>('PROVIDER');
  const [newReferenceDate, setNewReferenceDate] = useState('');
  const [newPreviousBalance, setNewPreviousBalance] = useState('');
  const [newPeriodAmount, setNewPeriodAmount] = useState('');

  // Payment form state
  const [payMethod, setPayMethod] = useState<'CASH_BS' | 'DEBIT_BS' | 'CASH_USD' | 'TRANSFER_USD'>('CASH_USD');
  const [payAmount, setPayAmount] = useState('');
  const [payExchangeRate, setPayExchangeRate] = useState('36.50');
  const [payReference, setPayReference] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [receptionDetailItems, setReceptionDetailItems] = useState<any[]>([]);
  const [selectedReceptionMeta, setSelectedReceptionMeta] = useState<any>(null);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState<boolean>(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [productsMap, setProductsMap] = useState<Record<string, { name: string; sku: string; description?: string }>>({});

  // Voucher attachment state
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setAttachedFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setAttachedFilePreview(null);
      }
    }
  };

  // Excel Wizard state
  const [importedRawText, setImportedRawText] = useState('');

  const currentUser = 'Juana Pérez';

  React.useEffect(() => {
    if (selectedAccount) {
      if (selectedAccount.supplier_invoice_number) {
        setSupplierInvoiceNumber(selectedAccount.supplier_invoice_number);
        setAttachedFileName(selectedAccount.voucher_attachment_url || 'comprobante_fiscal.pdf');
      } else {
        setSupplierInvoiceNumber('');
        setAttachedFileName('');
        setAttachedFilePreview(null);
      }
    }
  }, [selectedAccount, isPaymentModalOpen]);

  React.useEffect(() => {
    apiClient.get('/inventory/products')
      .then((res) => {
        const list = res.data || [];
        const map: Record<string, { name: string; sku: string; description?: string }> = {};
        list.forEach((p: any) => {
          if (p.id) {
            map[p.id] = { name: p.name || p.description || 'Producto', sku: p.sku || '', description: p.description };
          }
        });
        setProductsMap(map);
      })
      .catch((err) => console.error('Error fetching products for name mapping:', err));
  }, []);

  const getProductName = (item: any) => {
    if (item.product_name) return item.product_name;
    if (item.product && typeof item.product === 'object' && item.product.name) return item.product.name;
    if (item.product_id && productsMap[item.product_id]) return productsMap[item.product_id].name;
    if (item.description) return item.description;
    if (item.name) return item.name;
    if (item.product_id && !item.product_id.includes('-')) return item.product_id;
    return 'Producto General';
  };

  const getProductSku = (item: any) => {
    if (item.sku) return item.sku;
    if (item.product && typeof item.product === 'object' && item.product.sku) return item.product.sku;
    if (item.product_id && productsMap[item.product_id]) return productsMap[item.product_id].sku;
    return '';
  };

  React.useEffect(() => {
    if ((isPaymentModalOpen || isItemsModalOpen) && selectedAccount) {
      setIsLoadingItems(true);
      apiClient.get('/purchases/receptions')
        .then(res => {
          const recs = res.data || [];
          const matched = recs.find((r: any) => 
            (selectedAccount.reference_document_id && r.id === selectedAccount.reference_document_id) || 
            (selectedAccount.reference_document_number && r.reception_number === selectedAccount.reference_document_number) ||
            (r.provider_name && r.provider_name === selectedAccount.entity_name)
          );
          if (matched) {
            setSelectedReceptionMeta(matched);
            if (matched.items && matched.items.length > 0) {
              setReceptionDetailItems(matched.items);
              return;
            }
          }
          apiClient.get('/purchases/orders')
            .then(poRes => {
              const pos = poRes.data || [];
              const matchedPo = pos.find((p: any) => 
                (selectedAccount.reference_document_number && p.order_number === selectedAccount.reference_document_number) ||
                (p.supplier_name && p.supplier_name === selectedAccount.entity_name)
              );
              if (matchedPo) {
                setSelectedReceptionMeta((prev: any) => prev || matchedPo);
                if (matchedPo.items) {
                  setReceptionDetailItems(matchedPo.items.map((it: any) => ({
                    product_id: it.product_id || it.description || 'Producto',
                    product_name: it.product_name || (it.product_id && productsMap[it.product_id]?.name) || it.description || 'Producto',
                    sku: it.sku || (it.product_id && productsMap[it.product_id]?.sku) || '',
                    quantity_received: it.quantity || it.quantity_ordered || 0,
                    unit_cost_usd: it.unit_cost_usd || it.unit_price || 0,
                    net_total: it.net_total || ((it.quantity || it.quantity_ordered || 0) * (it.unit_cost_usd || it.unit_price || 0))
                  })));
                  return;
                }
              }
              setReceptionDetailItems([]);
            })
            .catch(() => setReceptionDetailItems([]));
        })
        .catch(() => setReceptionDetailItems([]))
        .finally(() => setIsLoadingItems(false));
    } else {
      setReceptionDetailItems([]);
      setSelectedReceptionMeta(null);
    }
  }, [isPaymentModalOpen, isItemsModalOpen, selectedAccount, productsMap]);

  const fetchAccounts = async () => {
    try {
      const endpoint = activeTab === 'RECEIVABLE' ? '/accounts/receivables' : '/accounts/payables';
      const res = await apiClient.get(endpoint);
      let fetchedItems: any[] = [];
      if (Array.isArray(res.data)) {
        fetchedItems = res.data;
      } else if (res.data?.items && Array.isArray(res.data.items)) {
        fetchedItems = res.data.items;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        fetchedItems = res.data.data;
      }

      if (fetchedItems.length > 0) {
        const normalized = fetchedItems.map((item: any) => ({
          ...item,
          type: item.type || activeTab,
          entity_name: item.entity_name || item.provider_name || item.client_name || 'Proveedor General',
          previous_balance: Number(item.previous_balance || 0),
          period_amount: Number(item.period_amount || 0),
          total_paid: Number(item.total_paid || 0),
          balance_due: Number(item.balance_due !== undefined ? item.balance_due : (Number(item.previous_balance || 0) + Number(item.period_amount || 0) - Number(item.total_paid || 0))),
          status: item.status || (Number(item.balance_due || 0) <= 0 ? 'PAID' : Number(item.total_paid || 0) > 0 ? 'PARTIAL' : 'PENDING'),
          payments: item.payments || [],
        }));
        setItems(normalized);
      } else {
        const tabMocks = MOCK_ITEMS.filter((i) => i.type === activeTab);
        setItems(tabMocks);
      }
    } catch (err) {
      console.error('Error fetching accounts from backend:', err);
      const tabMocks = MOCK_ITEMS.filter((i) => i.type === activeTab);
      setItems(tabMocks);
    }
  };

  React.useEffect(() => {
    fetchAccounts();
  }, [activeTab]);

  const filteredItems = items.filter(
    (item) =>
      (item.type === activeTab || !item.type) &&
      (item.entity_name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const kpis: SummaryKPIs = {
    total_previous_balance: filteredItems.reduce((acc, i) => acc + Number(i.previous_balance || 0), 0),
    total_period_amount: filteredItems.reduce((acc, i) => acc + Number(i.period_amount || 0), 0),
    total_paid: filteredItems.reduce((acc, i) => acc + Number(i.total_paid || 0), 0),
    total_balance_due: filteredItems.reduce((acc, i) => acc + Number(i.balance_due || 0), 0),
  };

  // Exact 4-decimal precision calculations without arbitrary rounding errors
  const rawPayAmountNum = parseFloat(payAmount) || 0;
  const rawExchangeRateNum = parseFloat(payExchangeRate) || 1;
  const calculatedDeductionUsd = payMethod.includes('BS')
    ? (rawPayAmountNum / (rawExchangeRateNum || 1))
    : rawPayAmountNum;

  const currentBalance = selectedAccount ? Number(selectedAccount.balance_due) : 0;
  const estimatedNewBalance = Math.max(0, currentBalance - calculatedDeductionUsd);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const prev = parseFloat(newPreviousBalance) || 0;
    const period = parseFloat(newPeriodAmount) || 0;

    try {
      await apiClient.post('/accounts/receivables-payables', {
        type: activeTab,
        entity_type: newEntityType,
        entity_name: newEntityName,
        reference_date: newReferenceDate || new Date().toISOString().split('T')[0],
        previous_balance: prev,
        period_amount: period,
      });
      await fetchAccounts();
      setIsCreateModalOpen(false);
      setNewEntityName('');
      setNewPreviousBalance('');
      setNewPeriodAmount('');
      showToast(`Cuenta registrada exitosamente por ${currentUser}.`);
    } catch (err: any) {
      alert(err.message || 'Error registrando cuenta');
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    const amt = parseFloat(payAmount) || 0;
    const rate = parseFloat(payExchangeRate) || 1;

    try {
      const targetEndpoint = activeTab === 'PAYABLE'
        ? `/accounts/payables/${selectedAccount.id}/payments`
        : `/accounts/receivables-payables/${selectedAccount.id}/payments`;

      await apiClient.post(targetEndpoint, {
        payment_method: payMethod,
        amount: amt,
        exchange_rate: rate,
        reference_number: payReference || 'N/A',
        supplier_invoice_number: supplierInvoiceNumber || undefined,
        voucher_attachment_url: attachedFileName || undefined,
      });

      await fetchAccounts();
      setIsPaymentModalOpen(false);
      setPayAmount('');
      setPayReference('');
      setSupplierInvoiceNumber('');
      setAttachedFileName('');
      setAttachedFilePreview(null);
      showToast(`Abono / Factura registrado exitosamente por ${currentUser}.`);
    } catch (err: any) {
      alert(err.message || 'Error al registrar abono');
    }
  };

  const handleProcessExcel = () => {
    const lines = importedRawText.split('\n').filter((l) => l.trim().length > 0);
    const parsedItems: AccountItem[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(/,|\t/).map((p) => p.trim());
      if (parts.length >= 2 && idx > 0) {
        const name = parts[0] || `Proveedor #${idx}`;
        const ref = parts[1] || 'Importado Excel';
        const prev = parseFloat(parts[2]) || 0;
        const period = parseFloat(parts[3]) || 0;
        const paid = parseFloat(parts[4]) || 0;
        const debt = prev + period - paid;

        parsedItems.push({
          id: `imp-${Date.now()}-${idx}`,
          type: activeTab,
          entity_type: activeTab === 'PAYABLE' ? 'PROVIDER' : 'CLIENT',
          entity_name: name,
          reference_date: ref,
          previous_balance: prev,
          period_amount: period,
          total_paid: paid,
          balance_due: debt,
          status: debt <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
          created_by_user_name: currentUser,
          payments: [],
        });
      }
    });

    if (parsedItems.length > 0) {
      setItems([...parsedItems, ...items]);
      showToast(`Importadas ${parsedItems.length} cuentas por ${currentUser}.`);
    }
    setIsImportModalOpen(false);
    setImportedRawText('');
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'CASH_USD':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded">Efectivo USD ($)</span>;
      case 'TRANSFER_USD':
        return <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded">Zelle / Transf. USD</span>;
      case 'DEBIT_BS':
        return <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded">Débito Bs.</span>;
      case 'CASH_BS':
        return <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded">Efectivo Bs.</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded">{method}</span>;
    }
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
          <div className={`border rounded-xl p-3 ${
            activeTab === 'RECEIVABLE'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
              : 'bg-indigo-50 border-indigo-100 text-indigo-600'
          }`}>
            {activeTab === 'RECEIVABLE' ? <Wallet className="w-6 h-6" /> : <FileSpreadsheet className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {activeTab === 'RECEIVABLE' ? 'Cuentas por Cobrar (CxC)' : 'Cuentas por Pagar (CxP)'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'RECEIVABLE'
                ? 'Gestión de saldos pendientes de clientes, facturas fiscales y cobranzas multimoneda'
                : 'Control de compromisos financieros con proveedores, compras y egresos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium rounded-xl transition-all text-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Importar Excel
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-sm transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Cuenta
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {!forcedTab && (
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('PAYABLE')}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'PAYABLE'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-amber-500" />
              Cuentas por Pagar (CXP)
            </button>

            <button
              onClick={() => setActiveTab('RECEIVABLE')}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'RECEIVABLE'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              Cuentas por Cobrar (CXC)
            </button>
          </div>
        )}

        <div className={`relative w-full ${!forcedTab ? 'sm:w-72' : 'sm:w-96'}`}>
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Deuda Pendiente</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">${kpis.total_balance_due.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Meses Anteriores</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">${kpis.total_previous_balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monto Facturado</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">${kpis.total_period_amount.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pagado</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">${kpis.total_paid.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Entidad / Proveedor</th>
                <th className="py-3.5 px-4">Última Compra / Referencia</th>
                <th className="py-3.5 px-4 text-right">Otros Meses ($)</th>
                <th className="py-3.5 px-4 text-right">Facturado ($)</th>
                <th className="py-3.5 px-4 text-right">Monto Pagado ($)</th>
                <th className="py-3.5 px-4 text-right">Cuenta por Pagar ($)</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center bg-slate-50/40">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                        <PackageCheck className="w-6 h-6 text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No hay cuentas por pagar registradas</p>
                      <p className="text-xs text-slate-500">
                        {search ? `No hay resultados para "${search}".` : 'Las cuentas por pagar se generan automáticamente al procesar Notas de Recepción de Almacén o registrando cuentas directas.'}
                      </p>
                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Registrar Cuenta Manual</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setItems(MOCK_ITEMS.filter(i => i.type === activeTab))}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Restaurar Datos de Muestra</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {item.entity_name}
                    {item.entity_type === 'PARTNER' && (
                      <span className="ml-2 bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2 py-0.5 rounded">
                        Socio
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">{item.reference_date || '-'}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    ${Number(item.previous_balance).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    ${Number(item.period_amount).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                    ${Number(item.total_paid).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    ${Number(item.balance_due).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.status === ACCOUNT_STATUS.PAID && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Saldado
                      </span>
                    )}
                    {item.status === ACCOUNT_STATUS.PARTIAL && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Abono Parcial
                      </span>
                    )}
                    {item.status === ACCOUNT_STATUS.PENDING && (
                      <span className="bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center flex items-center justify-center gap-1.5">
                    <ActionTooltip content="Ver Artículos de la Factura / Recepción">
                      <button
                        onClick={() => {
                          setSelectedAccount(item);
                          setIsItemsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </ActionTooltip>

                    <ActionTooltip content={`Ver Historial de Abonos (${item.payments?.length || 0})`}>
                      <button
                        onClick={() => {
                          setSelectedAccount(item);
                          setIsHistoryModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </ActionTooltip>

                    <ActionTooltip content="Abonar / Registrar Pago">
                      <button
                        onClick={() => {
                          setSelectedAccount(item);
                          setIsPaymentModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>
                    </ActionTooltip>
                  </td>
                </tr>
              )))}
            </tbody>
            {/* Totals summary Footer Row */}
            <tfoot>
              <tr className="bg-emerald-50/50 border-t-2 border-emerald-200 font-bold text-slate-900 text-xs uppercase">
                <td colSpan={2} className="py-4 px-4 text-emerald-800">
                  Total Cuentas por Pagar Proveedores y Socios:
                </td>
                <td className="py-4 px-4 text-right font-mono">${kpis.total_previous_balance.toFixed(2)}</td>
                <td className="py-4 px-4 text-right font-mono">${kpis.total_period_amount.toFixed(2)}</td>
                <td className="py-4 px-4 text-right font-mono text-emerald-700">${kpis.total_paid.toFixed(2)}</td>
                <td className="py-4 px-4 text-right font-mono text-emerald-900 text-base">
                  ${kpis.total_balance_due.toFixed(2)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment History Modal */}
      {isHistoryModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Historial de Abonos</h3>
                <p className="text-xs text-slate-500">{selectedAccount.entity_name}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Facturado</p>
                  <p className="text-sm font-bold text-slate-800">${(Number(selectedAccount.previous_balance) + Number(selectedAccount.period_amount)).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Abonado</p>
                  <p className="text-sm font-bold text-emerald-600">${Number(selectedAccount.total_paid).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Saldo Pendiente</p>
                  <p className="text-sm font-bold text-slate-900">${Number(selectedAccount.balance_due).toFixed(2)}</p>
                </div>
              </div>

              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2">
                Trazabilidad de Abonos ({selectedAccount.payments?.length || 0})
              </h4>

              {(!selectedAccount.payments || selectedAccount.payments.length === 0) ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No hay abonos registrados</p>
                  <p className="text-xs text-slate-400 mt-1">Usa el botón "Abonar / Pagar" para registrar una transacción.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAccount.payments.map((p) => (
                    <div key={p.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getMethodBadge(p.payment_method)}
                          <span className="text-xs font-mono text-slate-500">Ref: {p.reference_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{p.paid_at || 'Fecha reciente'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-indigo-600">
                            <UserCheck className="w-3 h-3 text-indigo-500" />
                            Registrado por: {p.created_by_user_name || 'Juana Pérez'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-emerald-600">
                          +${Number(p.amount_usd).toFixed(2)}
                        </p>
                        {p.currency === 'BS' && (
                          <p className="text-[10px] font-mono text-slate-400">
                            Bs. {Number(p.amount).toFixed(2)} (Tasa: {p.exchange_rate})
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl text-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Invoice & Reception Items Modal (Sally's Enterprise UX Redesign) */}
      {isItemsModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Detalle de Factura y Renglones de Almacén
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      Procure-to-Pay
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Proveedor: <strong className="text-slate-800">{selectedAccount.entity_name}</strong> • Ref: <span className="font-mono text-indigo-600 font-bold">{selectedAccount.reference_document_number || selectedAccount.reference_date || 'Factura Directa'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsItemsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {/* Financial KPI Banner (Luminous Executive Theme) */}
              {(() => {
                const totalFacturado = Number(selectedAccount.previous_balance || 0) + Number(selectedAccount.period_amount || 0);
                const totalAbonado = Number(selectedAccount.total_paid || 0);
                const saldoPendiente = Number(selectedAccount.balance_due || 0);
                const pctPagado = totalFacturado > 0 ? Math.min(100, (totalAbonado / totalFacturado) * 100) : 0;

                return (
                  <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white/95 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Receipt className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold uppercase tracking-wider">Total Facturado</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                          ${totalFacturado.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">Monto global de la compra</p>
                      </div>

                      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-emerald-800">
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold uppercase tracking-wider">Total Liquidado</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                          ${totalAbonado.toFixed(2)}
                        </p>
                        <p className="text-xs font-bold text-emerald-600 font-sans mt-0.5">{pctPagado.toFixed(1)}% abonado</p>
                      </div>

                      <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-4 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-indigo-800">
                          <DollarSign className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold uppercase tracking-wider">Saldo por Pagar</span>
                        </div>
                        <p className="text-2xl font-black text-indigo-700 font-mono mt-1">
                          ${saldoPendiente.toFixed(2)}
                        </p>
                        <p className="text-xs text-indigo-600/90 font-sans mt-0.5">
                          {saldoPendiente <= 0 ? '✓ Factura solvente' : 'Compromiso pendiente'}
                        </p>
                      </div>
                    </div>

                    {/* Visual Payment Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Progreso de Pago</span>
                        <span className="font-mono text-indigo-700 font-bold">{pctPagado.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/50">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600 transition-all duration-500"
                          style={{ width: `${pctPagado}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Invoice & Reception Metadata Cards Grid (Enhanced Legibility & Typography) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Proveedor / Razón Social
                  </span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate" title={selectedAccount.entity_name}>
                    {selectedAccount.entity_name}
                  </p>
                  <p className="text-xs font-mono text-slate-600 font-semibold bg-slate-100/90 px-2 py-0.5 rounded-md inline-block mt-1">
                    RIF: {selectedReceptionMeta?.supplier_rif || 'J-98847291-0'}
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    N° Recepción / Documento
                  </span>
                  <p className="font-mono font-extrabold text-indigo-700 text-sm sm:text-base">
                    {selectedAccount.reference_document_number || 'REC-INICIAL'}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Guía NDR: <strong className="font-mono text-slate-800">{selectedReceptionMeta?.ndr_number || 'N/A'}</strong>
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Fecha & Plazo de Pago
                  </span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">
                    {selectedAccount.reference_date || new Date().toISOString().split('T')[0]}
                  </p>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100 mt-1">
                    {selectedReceptionMeta?.payment_term || 'CONTADO'}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-indigo-200 transition-all">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Estado Fiscal & Auditoría
                  </span>
                  <div>
                    {selectedAccount.status === ACCOUNT_STATUS.PAID && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Saldado
                      </span>
                    )}
                    {selectedAccount.status === ACCOUNT_STATUS.PARTIAL && (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Abono Parcial
                      </span>
                    )}
                    {selectedAccount.status === ACCOUNT_STATUS.PENDING && (
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                    Auditor: <strong className="text-slate-700">{selectedAccount.created_by_user_name || 'Juana Pérez'}</strong>
                  </p>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Renglones Recepcionados en Almacén
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {receptionDetailItems.length} {receptionDetailItems.length === 1 ? 'artículo' : 'artículos'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Inventario Verificado
                  </span>
                </div>

                {isLoadingItems ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Cargando renglones detallados de almacén...</span>
                  </div>
                ) : receptionDetailItems.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                    <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No hay renglones detallados de almacén registrados</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                      Esta cuenta por pagar corresponde a un saldo inicial o factura global consolidada por un monto de <strong className="text-slate-600">${Number(selectedAccount.period_amount).toFixed(2)}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Producto / Descripción del Renglón</th>
                          <th className="py-3 px-4 text-center">Cant. Recibida</th>
                          <th className="py-3 px-4 text-right">Costo Unitario ($)</th>
                          <th className="py-3 px-4 text-right">Total Neto ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {receptionDetailItems.map((ri: any, idx: number) => {
                          const qty = Number(ri.quantity_received || ri.quantity || 0);
                          const cost = Number(ri.unit_cost_usd || ri.unit_price || 0);
                          const net = Number(ri.net_total || (qty * cost));
                          return (
                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px] text-center font-semibold">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-start gap-2.5">
                                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg mt-0.5 shrink-0">
                                    <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-xs">
                                      {getProductName(ri)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {getProductSku(ri) && (
                                        <span className="font-mono text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60">
                                          SKU: {getProductSku(ri)}
                                        </span>
                                      )}
                                      {ri.batch_number && (
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          Lote: {ri.batch_number}
                                        </span>
                                      )}
                                    </div>
                                    {ri.line_comment && (
                                      <p className="text-[10px] text-slate-500 font-sans italic mt-1 bg-amber-50/60 border border-amber-100 px-2 py-0.5 rounded text-amber-900">
                                        Nota: {ri.line_comment}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center justify-center font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-xl text-xs">
                                  {qty}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-700 font-medium">
                                ${cost.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                                ${net.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50/80 border-t border-slate-200 text-slate-900 text-xs font-bold">
                        <tr>
                          <td colSpan={2} className="py-3 px-4 text-slate-600 uppercase text-[10px] font-bold">
                            Total Renglones Recepcionados:
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-emerald-800 font-bold">
                            {receptionDetailItems.reduce((acc, it) => acc + Number(it.quantity_received || it.quantity || 0), 0)} unidades
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 text-[10px] uppercase font-bold">
                            Neto Total:
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 text-sm">
                            ${receptionDetailItems.reduce((acc, it) => acc + Number(it.net_total || (Number(it.quantity_received || it.quantity || 0) * Number(it.unit_cost_usd || it.unit_price || 0))), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setIsItemsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
              >
                Cerrar
              </button>
              {Number(selectedAccount.balance_due) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsItemsModalOpen(false);
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Proceder al Abono / Pago</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Registrar Nueva Cuenta ({activeTab})</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nombre de la Entidad / Proveedor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuidora Full Office S.A"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Monto Meses Anteriores ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPreviousBalance}
                    onChange={(e) => setNewPreviousBalance(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Monto Facturado ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPeriodAmount}
                    onChange={(e) => setNewPeriodAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Fecha de Referencia / Notas
                </label>
                <input
                  type="text"
                  placeholder="Ej: 25-abr-26 o Factura #1042"
                  value={newReferenceDate}
                  onChange={(e) => setNewReferenceDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm cursor-pointer"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALLY'S NEW REDESIGNED PAYMENT MODAL WITH FINANCIAL STATUS BAR & LIVE EQUATION */}
      {isPaymentModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registrar Abono / Pago</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedAccount.entity_name}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* TOP FINANCIAL BALANCE STATUS BAR (LUMINOUS EXECUTIVE THEME) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100/90 shadow-2xs">
                <div className="text-center p-3 bg-white/95 border border-slate-200/80 rounded-xl shadow-2xs">
                  <p className="text-xs uppercase tracking-wider text-rose-800 font-bold">Deuda Actual</p>
                  <p className="text-lg sm:text-xl font-black text-rose-600 mt-1 font-mono">${currentBalance.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl shadow-2xs">
                  <p className="text-xs uppercase tracking-wider text-emerald-800 font-bold">Abono (-USD)</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1 font-mono">-${calculatedDeductionUsd.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl shadow-2xs">
                  <p className="text-xs uppercase tracking-wider text-indigo-800 font-bold">Nuevo Saldo</p>
                  <p className="text-lg sm:text-xl font-black text-indigo-700 mt-1 font-mono">${estimatedNewBalance.toFixed(2)}</p>
                </div>
              </div>

              {/* Supplier Invoice & Physical Voucher Metadata */}
              {activeTab === 'PAYABLE' && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <span>Formalización de Factura del Proveedor</span>
                    </div>
                    {selectedAccount.supplier_invoice_number ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        Factura Formalizada
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Registro Inicial Requerido
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  {selectedAccount.supplier_invoice_number ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-white border border-slate-200 rounded-xl">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            N° Factura del Proveedor
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {selectedAccount.supplier_invoice_number}
                          </span>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                              Comprobante / Soporte Adjunto
                            </span>
                            <span className="text-xs font-mono text-indigo-700 font-semibold truncate block max-w-[180px]">
                              {selectedAccount.voucher_attachment_url || 'comprobante_fiscal.pdf'}
                            </span>
                          </div>
                          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                            <Paperclip className="w-4 h-4" />
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200/60">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>
                          Formalizado por: <strong className="text-slate-700">{selectedAccount.invoice_registered_by_user_name || 'Juana Pérez'}</strong>
                          {selectedAccount.invoice_registered_at && (
                            <> el {new Date(selectedAccount.invoice_registered_at).toLocaleString('es-VE')}</>
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            N° Factura del Proveedor *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. FACT-009823 / Control 4410"
                            value={supplierInvoiceNumber}
                            onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Comprobante / Soporte Digital *
                          </label>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs text-slate-700 font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Upload className="w-4 h-4 text-indigo-600 shrink-0" />
                              <span className="truncate">{attachedFileName || 'Adjuntar Imagen o PDF...'}</span>
                            </span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-bold shrink-0">
                              Subir
                            </span>
                          </button>
                        </div>
                      </div>

                      {attachedFilePreview && (
                        <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200">
                          <img
                            src={attachedFilePreview}
                            alt="Previsualización"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-100 shadow-2xs"
                          />
                          <div className="text-xs">
                            <p className="font-bold text-slate-800 truncate">{attachedFileName}</p>
                            <p className="text-[10px] text-emerald-600 font-medium">✓ Imagen de comprobante cargada</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Se registrará la formalización fiscal a nombre de: <strong className="text-slate-700">{currentUser}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* READ-ONLY RECEIVED ITEMS CARD FOR PURCHASES (LOCKED INVENTORY) */}
              {activeTab === 'PAYABLE' && receptionDetailItems.length > 0 && (
                <div className="space-y-2 p-3.5 bg-slate-100/70 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                      <PackageCheck className="w-4 h-4 text-emerald-600" />
                      Detalle de Artículos Recepcionados en Almacén
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Solo Lectura
                    </span>
                  </div>

                  <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[9px]">
                        <tr>
                          <th className="py-1.5 px-3 font-semibold">Producto / Modelo</th>
                          <th className="py-1.5 px-3 text-right font-semibold">Cant. Recibida</th>
                          <th className="py-1.5 px-3 text-right font-semibold">Costo U.</th>
                          <th className="py-1.5 px-3 text-right font-semibold">Neto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {receptionDetailItems.map((ri: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3 font-sans font-medium text-slate-800 truncate max-w-[180px]">
                              <span className="font-bold text-slate-900 block truncate">{getProductName(ri)}</span>
                              {getProductSku(ri) && (
                                <span className="font-mono text-[9px] text-slate-400 block">SKU: {getProductSku(ri)}</span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-emerald-700">
                              {ri.quantity_received}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              ${Number(ri.unit_cost_usd || 0).toFixed(2)}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold">
                              ${Number(ri.net_total || (ri.quantity_received * ri.unit_cost_usd)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPayMethod('CASH_USD')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                      payMethod === 'CASH_USD' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    💵 Efectivo USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('TRANSFER_USD')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                      payMethod === 'TRANSFER_USD' 
                        ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-500/20' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🏦 Zelle / Transf. USD
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('CASH_BS')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                      payMethod === 'CASH_BS' 
                        ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-500/20' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    💵 Efectivo Bs.
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('DEBIT_BS')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                      payMethod === 'DEBIT_BS' 
                        ? 'bg-purple-50 border-purple-300 text-purple-800 ring-2 ring-purple-500/20' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    💳 Débito / Transf. Bs.
                  </button>
                </div>
              </div>

              {/* Amount and Exchange Rate Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Monto a Abonar ({payMethod.includes('BS') ? 'Bs.' : '$'}) *
                  </label>
                  <CurrencyInput
                    value={payAmount}
                    onChange={(val) => setPayAmount(val ? val.toString() : '')}
                    placeholder="0.00"
                    currencyPrefix={payMethod.includes('BS') ? 'Bs.' : '$'}
                    required
                  />
                </div>

                {payMethod.includes('BS') && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Tasa de Cambio (Bs / USD) *
                    </label>
                    <CurrencyInput
                      value={payExchangeRate}
                      onChange={(val) => setPayExchangeRate(val ? val.toString() : '')}
                      placeholder="0.00"
                      currencyPrefix="Bs."
                      decimals={4}
                      required
                    />
                  </div>
                )}
              </div>

              {/* LIVE EQUATION PREVIEW BOX FOR BOLÍVARES (SALLY'S UX SPEC) */}
              {payMethod.includes('BS') && rawPayAmountNum > 0 && (
                <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-200 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      Ecuación de Descuento Exacto
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      4 decimales exactos
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-100 text-xs font-mono space-y-1.5 text-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Abono en Bs / Tasa:</span>
                      <span className="font-bold text-slate-900">
                        Bs. {rawPayAmountNum.toFixed(2)} ÷ {rawExchangeRateNum.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-1 text-emerald-700 font-bold">
                      <span>Deducción en Dólares:</span>
                      <span className="text-sm">-${calculatedDeductionUsd.toFixed(4)} USD</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-indigo-950 font-medium pt-1">
                    <span className="flex items-center gap-1 text-slate-600">
                      Saldo previo: <strong className="text-slate-800">${currentBalance.toFixed(2)}</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-indigo-900 font-bold">
                      Quedará en: <strong className="text-indigo-600 text-sm font-mono">${estimatedNewBalance.toFixed(2)} USD</strong>
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Número de Referencia / Recibo / Transacción
                </label>
                <input
                  type="text"
                  placeholder="Ej: ZELLE-88194 o Recibo #002"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-xs text-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Abono / Pago</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Wizard Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                Asistente de Importación desde Excel ({activeTab})
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Copia las filas de tu planilla Excel o pega el contenido en formato CSV/Tabulado a continuación.
                <br />
                <strong>Formato sugerido:</strong> Proveedor, Fecha/Ref, Otros Meses, Facturado, Monto Pagado
              </p>

              <textarea
                rows={8}
                placeholder={`Distribuidora Full Office S.A\t25-abr-26\t444.46\t3164.32\t1844.48\nFerresoluciones C.A\t24-may-26\t286.50\t0.00\t0.00`}
                value={importedRawText}
                onChange={(e) => setImportedRawText(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-none"
              />

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  {importedRawText.split('\n').filter((l) => l.trim()).length} filas detectadas
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProcessExcel}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm cursor-pointer"
                  >
                    Procesar e Importar Filas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
