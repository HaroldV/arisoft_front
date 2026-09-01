'use client';

import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { usePurchaseInvoicesData } from '@/components/purchases/invoices/hooks/usePurchaseInvoicesData';
import { PurchaseInvoicesHeader } from '@/components/purchases/invoices/subcomponents/PurchaseInvoicesHeader';
import { PurchaseInvoicesFilterBar } from '@/components/purchases/invoices/subcomponents/PurchaseInvoicesFilterBar';
import { PurchaseInvoicesTable } from '@/components/purchases/invoices/subcomponents/PurchaseInvoicesTable';
import { PurchaseInvoiceDetailModal } from '@/components/purchases/invoices/subcomponents/PurchaseInvoiceDetailModal';
import { PurchaseFiscalNoteModal } from '@/components/purchases/invoices/subcomponents/PurchaseFiscalNoteModal';

export default function PurchasesPage() {
  const {
    purchases,
    rawPurchases,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    isLoading,
    error,
    selectedPurchaseId,
    purchaseDetails,
    isDetailsLoading,
    detailsError,
    fetchPurchaseDetails,
    setSelectedPurchaseId,
    setPurchaseDetails,
    selectedNoteId,
    noteDetail,
    isLoadingNoteDetail,
    setSelectedNoteId,
    fetchNoteDetails,
    isRegisteringNote,
    setIsRegisteringNote,
    noteDocumentNumber,
    setNoteDocumentNumber,
    noteControlNumber,
    setNoteControlNumber,
    noteType,
    setNoteType,
    noteReason,
    setNoteReason,
    noteDescription,
    setNoteDescription,
    noteExchangeRate,
    setNoteExchangeRate,
    noteAdjustStock,
    setNoteAdjustStock,
    noteLocationId,
    setNoteLocationId,
    locations,
    fetchLocations,
    noteItems,
    noteTotalUsdInput,
    setNoteTotalUsdInput,
    isSubmittingNote,
    handleToggleItemSelect,
    handleQtyChange,
    handleUnitPriceChange,
    handleCreateNoteSubmit,
    feedbackMessage,
    setFeedbackMessage,
  } = usePurchaseInvoicesData();

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <PurchaseInvoicesHeader
        onOpenRegisterNote={() => {
          fetchLocations();
          setIsRegisteringNote(true);
        }}
      />

      {/* Barra de Filtros */}
      <PurchaseInvoicesFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
      />

      {/* Estados de Carga y Error */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
          <p className="text-sm font-medium">Cargando facturas de compra...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : (
        /* Tabla de Facturas */
        <PurchaseInvoicesTable
          purchases={purchases}
          onViewDetails={(id) => fetchPurchaseDetails(id, false)}
          onEmitFiscalNote={(id) => fetchPurchaseDetails(id, true)}
          onNoteClick={(noteId) => {
            setSelectedNoteId(noteId);
            fetchNoteDetails(noteId);
          }}
        />
      )}

      {/* Modal de Detalle de Factura */}
      <PurchaseInvoiceDetailModal
        isOpen={Boolean(selectedPurchaseId && !isRegisteringNote)}
        onClose={() => {
          setSelectedPurchaseId(null);
          setPurchaseDetails(null);
        }}
        purchaseDetails={purchaseDetails}
        isLoading={isDetailsLoading}
        error={detailsError}
        onEmitNote={(id) => fetchPurchaseDetails(id, true)}
      />

      {/* Modal de Registro de Nota Fiscal */}
      <PurchaseFiscalNoteModal
        isOpen={isRegisteringNote}
        onClose={() => {
          setIsRegisteringNote(false);
          setNoteDocumentNumber('');
          setNoteControlNumber('');
          setNoteDescription('');
          setNoteType('CREDIT');
          setNoteReason('RETURN');
          setSelectedPurchaseId(null);
          setPurchaseDetails(null);
        }}
        purchaseDetails={purchaseDetails}
        purchasesList={rawPurchases}
        onSelectPurchase={(id) => fetchPurchaseDetails(id, true)}
        noteType={noteType}
        onNoteTypeChange={setNoteType}
        noteReason={noteReason}
        onNoteReasonChange={setNoteReason}
        documentNumber={noteDocumentNumber}
        onDocumentNumberChange={setNoteDocumentNumber}
        controlNumber={noteControlNumber}
        onControlNumberChange={setNoteControlNumber}
        description={noteDescription}
        onDescriptionChange={setNoteDescription}
        exchangeRate={noteExchangeRate}
        onExchangeRateChange={setNoteExchangeRate}
        adjustStock={noteAdjustStock}
        onAdjustStockChange={setNoteAdjustStock}
        locationId={noteLocationId}
        onLocationIdChange={setNoteLocationId}
        locations={locations}
        noteItems={noteItems}
        onToggleItemSelect={handleToggleItemSelect}
        onQtyChange={handleQtyChange}
        onUnitPriceChange={handleUnitPriceChange}
        totalUsdInput={noteTotalUsdInput}
        onTotalUsdInputChange={setNoteTotalUsdInput}
        isSubmitting={isSubmittingNote}
        onSubmit={handleCreateNoteSubmit}
      />

      {/* Modal de Feedback Notificación */}
      {feedbackMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900">{feedbackMessage.title}</h3>
            <p className="text-xs text-slate-600">{feedbackMessage.message}</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setFeedbackMessage(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
