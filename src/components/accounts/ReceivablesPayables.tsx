'use client';

import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@/infrastructure/api/api-client';
import { 
  ACCOUNT_STATUS, 
  ACCOUNT_TYPES, 
  AccountType, 
  ENTITY_TYPES, 
  EntityType, 
  PAYMENT_METHODS, 
  PaymentMethod 
} from '@/constants/domain-constants';
import { AccountItem, SummaryKPIs } from './types';
import { AccountHeader } from './subcomponents/AccountHeader';
import { AccountKpis } from './subcomponents/AccountKpis';
import { AccountFilterBar } from './subcomponents/AccountFilterBar';
import { AccountTable } from './subcomponents/AccountTable';
import { AccountPaymentModal } from './subcomponents/AccountPaymentModal';
import { AccountItemsDetailModal } from './subcomponents/AccountItemsDetailModal';
import { AccountCreateModal } from './subcomponents/AccountCreateModal';
import { AccountExcelModal } from './subcomponents/AccountExcelModal';
import { AccountHistoryModal } from './subcomponents/AccountHistoryModal';

interface ReceivablesPayablesProps {
  forcedTab?: AccountType;
}

export default function ReceivablesPayables({ forcedTab }: ReceivablesPayablesProps) {
  const [activeTab, setActiveTab] = useState<AccountType>(forcedTab || ACCOUNT_TYPES.PAYABLE);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AccountItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals visibility state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

  // Selected item state
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);

  // Payment Form state
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CASH_USD);
  const [payAmount, setPayAmount] = useState('');
  const [payExchangeRate, setPayExchangeRate] = useState('36.50');
  const [payReference, setPayReference] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');

  // Create Form state
  const [newEntityType, setNewEntityType] = useState<EntityType>(ENTITY_TYPES.PROVIDER);
  const [newEntityName, setNewEntityName] = useState('');
  const [newPreviousBalance, setNewPreviousBalance] = useState('');
  const [newPeriodAmount, setNewPeriodAmount] = useState('');
  const [newReferenceDate, setNewReferenceDate] = useState('');

  // Voucher attachment state
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Line items state
  const [receptionDetailItems, setReceptionDetailItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [productsMap, setProductsMap] = useState<Record<string, { name: string; sku: string; description?: string }>>({});

  // Excel Wizard state
  const [importedRawText, setImportedRawText] = useState('');

  const currentUser = 'Juana Pérez';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

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

  useEffect(() => {
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

  useEffect(() => {
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

  useEffect(() => {
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
          if (matched && matched.items && matched.items.length > 0) {
            setReceptionDetailItems(matched.items);
            return;
          }
          apiClient.get('/purchases/orders')
            .then(poRes => {
              const pos = poRes.data || [];
              const matchedPo = pos.find((p: any) => 
                (selectedAccount.reference_document_number && p.order_number === selectedAccount.reference_document_number) ||
                (p.supplier_name && p.supplier_name === selectedAccount.entity_name)
              );
              if (matchedPo && matchedPo.items) {
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
              setReceptionDetailItems([]);
            })
            .catch(() => setReceptionDetailItems([]));
        })
        .catch(() => setReceptionDetailItems([]))
        .finally(() => setIsLoadingItems(false));
    } else {
      setReceptionDetailItems([]);
    }
  }, [isPaymentModalOpen, isItemsModalOpen, selectedAccount, productsMap]);

  const fetchAccounts = async () => {
    try {
      const endpoint = activeTab === ACCOUNT_TYPES.RECEIVABLE ? '/accounts/receivables' : '/accounts/payables';
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
        const normalized: AccountItem[] = fetchedItems.map((item: any) => ({
          ...item,
          type: item.type || activeTab,
          entity_type: item.entity_type || (activeTab === ACCOUNT_TYPES.PAYABLE ? ENTITY_TYPES.PROVIDER : ENTITY_TYPES.CLIENT),
          entity_name: item.entity_name || item.provider_name || item.client_name || 'Entidad General',
          previous_balance: Number(item.previous_balance || 0),
          period_amount: Number(item.period_amount || 0),
          total_paid: Number(item.total_paid || 0),
          balance_due: Number(item.balance_due !== undefined ? item.balance_due : (Number(item.previous_balance || 0) + Number(item.period_amount || 0) - Number(item.total_paid || 0))),
          status: item.status || (Number(item.balance_due || 0) <= 0 ? ACCOUNT_STATUS.PAID : Number(item.total_paid || 0) > 0 ? ACCOUNT_STATUS.PARTIAL : ACCOUNT_STATUS.PENDING),
          payments: item.payments || [],
        }));
        setItems(normalized);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching accounts from backend:', err);
      setItems([]);
    }
  };

  useEffect(() => {
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
      showToast(`Cuenta registrada exitosamente.`);
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
      const targetEndpoint = activeTab === ACCOUNT_TYPES.PAYABLE
        ? `/accounts/payables/${selectedAccount.id}/payments`
        : `/accounts/receivables/${selectedAccount.id}/payments`;

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
      showToast(`Abono / Factura registrado exitosamente.`);
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
      setItems((prev) => [...parsedItems, ...prev]);
      setIsImportModalOpen(false);
      setImportedRawText('');
      showToast(`Se importaron ${parsedItems.length} cuentas exitosamente.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header with Title & Action Controls */}
      <AccountHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hideTabs={Boolean(forcedTab)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      {/* Financial KPIs Grid */}
      <AccountKpis kpis={kpis} activeTab={activeTab} />

      {/* Search & Filter Bar */}
      <AccountFilterBar search={search} setSearch={setSearch} activeTab={activeTab} />

      {/* Data Table */}
      <AccountTable
        items={filteredItems}
        activeTab={activeTab}
        search={search}
        onOpenItemsModal={(item) => {
          setSelectedAccount(item);
          setIsItemsModalOpen(true);
        }}
        onOpenPaymentModal={(item) => {
          setSelectedAccount(item);
          setIsPaymentModalOpen(true);
        }}
        onOpenHistoryModal={(item) => {
          setSelectedAccount(item);
          setIsHistoryModalOpen(true);
        }}
      />

      {/* Detail Modal */}
      <AccountItemsDetailModal
        isOpen={isItemsModalOpen}
        onClose={() => setIsItemsModalOpen(false)}
        selectedAccount={selectedAccount}
        activeTab={activeTab}
        receptionDetailItems={receptionDetailItems}
        isLoadingItems={isLoadingItems}
        onProceedToPayment={() => {
          setIsItemsModalOpen(false);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Payment & Invoice Modal */}
      <AccountPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedAccount={selectedAccount}
        activeTab={activeTab}
        currentUser={currentUser}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        payAmount={payAmount}
        setPayAmount={setPayAmount}
        payExchangeRate={payExchangeRate}
        setPayExchangeRate={setPayExchangeRate}
        payReference={payReference}
        setPayReference={setPayReference}
        supplierInvoiceNumber={supplierInvoiceNumber}
        setSupplierInvoiceNumber={setSupplierInvoiceNumber}
        attachedFileName={attachedFileName}
        attachedFilePreview={attachedFilePreview}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        receptionDetailItems={receptionDetailItems}
        handleRegisterPayment={handleRegisterPayment}
      />

      {/* Manual Create Modal */}
      <AccountCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        activeTab={activeTab}
        newEntityType={newEntityType}
        setNewEntityType={setNewEntityType}
        newEntityName={newEntityName}
        setNewEntityName={setNewEntityName}
        newPreviousBalance={newPreviousBalance}
        setNewPreviousBalance={setNewPreviousBalance}
        newPeriodAmount={newPeriodAmount}
        setNewPeriodAmount={setNewPeriodAmount}
        newReferenceDate={newReferenceDate}
        setNewReferenceDate={setNewReferenceDate}
        handleCreateAccount={handleCreateAccount}
      />

      {/* Excel Import Modal */}
      <AccountExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        activeTab={activeTab}
        importedRawText={importedRawText}
        setImportedRawText={setImportedRawText}
        handleProcessExcel={handleProcessExcel}
      />

      {/* History Modal */}
      <AccountHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        selectedAccount={selectedAccount}
        activeTab={activeTab}
      />
    </div>
  );
}
