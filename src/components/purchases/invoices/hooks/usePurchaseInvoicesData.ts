'use client';

import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/infrastructure/api/api-client';
import { PurchaseInvoice, PurchaseNoteSummary, LocationOption, NoteItemForm } from '../types';

export function usePurchaseInvoicesData() {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [notes, setNotes] = useState<PurchaseNoteSummary[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Note Detail Modal State
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteDetail, setNoteDetail] = useState<any | null>(null);
  const [isLoadingNoteDetail, setIsLoadingNoteDetail] = useState(false);

  // Register Note Form State
  const [isRegisteringNote, setIsRegisteringNote] = useState(false);
  const [noteDocumentNumber, setNoteDocumentNumber] = useState('');
  const [noteControlNumber, setNoteControlNumber] = useState('');
  const [noteType, setNoteType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [noteReason, setNoteReason] = useState<'RETURN' | 'DISCOUNT' | 'PRICE_ERR' | 'TAX_ERR' | 'OTHER'>('RETURN');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteExchangeRate, setNoteExchangeRate] = useState(50.0);
  const [noteAdjustStock, setNoteAdjustStock] = useState(true);
  const [noteLocationId, setNoteLocationId] = useState('');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [noteItems, setNoteItems] = useState<NoteItemForm[]>([]);
  const [noteTotalUsdInput, setNoteTotalUsdInput] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Feedback Notification Modal State
  const [feedbackMessage, setFeedbackMessage] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPurchases();
    fetchNotes();
  }, []);

  const fetchPurchases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/inventory/purchases');
      setPurchases(response.data);
    } catch (err: any) {
      setError('Error al cargar el historial de compras.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await apiClient.get('/inventory/purchases/notes');
      setNotes(response.data);
    } catch (err: any) {
      console.error('Error fetching purchase notes:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get('/inventory/warehouse-locations/tree');
      const list: LocationOption[] = [];
      const flatten = (nodes: any[], depth = 0) => {
        for (const node of nodes) {
          list.push({
            id: node.id,
            name: node.name,
            type: node.type,
            depth,
          });
          if (node.children && node.children.length > 0) {
            flatten(node.children, depth + 1);
          }
        }
      };
      flatten(response.data);
      setLocations(list);
      if (list.length > 0) {
        setNoteLocationId(list[0].id);
      }
    } catch (err) {
      console.error('Error al cargar almacenes:', err);
    }
  };

  const fetchPurchaseDetails = async (id: string, autoOpenEmitForm = false) => {
    setIsDetailsLoading(true);
    setDetailsError(null);
    setSelectedPurchaseId(id);
    try {
      const res = await apiClient.get(`/inventory/purchases/${id}`);
      setPurchaseDetails(res.data);

      const itemsPayload: NoteItemForm[] = res.data.items.map((item: any) => ({
        productId: item.product_id,
        name: item.product_name,
        originalQty: item.quantity,
        quantity: item.quantity,
        unitPriceUsd: Number(item.unit_cost_usd || 0),
        selected: true,
      }));
      setNoteItems(itemsPayload);
      const total = itemsPayload.reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
      setNoteTotalUsdInput(total > 0 ? total.toFixed(2) : '');

      if (autoOpenEmitForm) {
        fetchLocations();
        setIsRegisteringNote(true);
      }
    } catch (err) {
      setDetailsError('No se pudieron cargar los detalles de la factura.');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const fetchNoteDetails = async (id: string) => {
    setIsLoadingNoteDetail(true);
    try {
      const response = await apiClient.get(`/inventory/purchases/notes/${id}`);
      setNoteDetail(response.data);
    } catch (err: any) {
      setError('No se pudo cargar el detalle de la nota fiscal.');
    } finally {
      setIsLoadingNoteDetail(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchNotes();
  }, []);

  const handleToggleItemSelect = (productId: string) => {
    setNoteItems(prev => {
      const next = prev.map(item =>
        item.productId === productId ? { ...item, selected: !item.selected } : item
      );
      const total = next.filter(i => i.selected).reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
      setNoteTotalUsdInput(total > 0 ? total.toFixed(2) : '');
      return next;
    });
  };

  const handleQtyChange = (productId: string, val: number) => {
    setNoteItems(prev => {
      const next = prev.map(item => {
        if (item.productId === productId) {
          const limited = Math.min(item.originalQty, Math.max(1, val));
          return { ...item, quantity: limited };
        }
        return item;
      });
      const total = next.filter(i => i.selected).reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
      setNoteTotalUsdInput(total > 0 ? total.toFixed(2) : '');
      return next;
    });
  };

  const handleUnitPriceChange = (productId: string, val: number) => {
    setNoteItems(prev => {
      const next = prev.map(item => {
        if (item.productId === productId) {
          return { ...item, unitPriceUsd: Math.max(0, val) };
        }
        return item;
      });
      const total = next.filter(i => i.selected).reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);
      setNoteTotalUsdInput(total > 0 ? total.toFixed(2) : '');
      return next;
    });
  };

  const handleCreateNoteSubmit = async () => {
    if (!purchaseDetails || !noteDocumentNumber) return;

    const selected = noteItems.filter(i => i.selected);
    if (selected.length === 0) {
      setFeedbackMessage({
        title: 'Error de Selección',
        message: 'Debe seleccionar al menos un producto afectado.',
        type: 'error',
      });
      return;
    }

    const calculatedTotalUsd = selected.reduce((sum, i) => sum + i.quantity * i.unitPriceUsd, 0);

    setIsSubmittingNote(true);
    try {
      await apiClient.post('/inventory/purchases/notes', {
        original_invoice_id: purchaseDetails.id,
        type: noteType,
        document_number: noteDocumentNumber,
        control_number: noteControlNumber,
        reason_code: noteReason,
        description: noteDescription,
        exchange_rate: noteExchangeRate,
        adjust_stock: noteAdjustStock,
        warehouse_location_id: noteAdjustStock ? noteLocationId : undefined,
        total_usd: calculatedTotalUsd,
        items: selected.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_cost_usd: item.unitPriceUsd,
        })),
      });

      setFeedbackMessage({
        title: 'Nota Fiscal Registrada',
        message: `La ${noteType === 'CREDIT' ? 'Nota de Crédito' : 'Nota de Débito'} ${noteDocumentNumber} fue emitida exitosamente.`,
        type: 'success',
      });

      setIsRegisteringNote(false);
      fetchPurchases();
      fetchNotes();
    } catch (err: any) {
      setFeedbackMessage({
        title: 'Error al Emitir',
        message: err.response?.data?.message || 'Ocurrió un error al emitir la nota fiscal.',
        type: 'error',
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const matchSearch =
        (item.invoice_number?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
        (item.supplier_name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
        (item.creator_name?.toLowerCase() ?? '').includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchPayment = paymentFilter === 'ALL' || (item.payment_status || 'PAID') === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [purchases, search, statusFilter, paymentFilter]);

  return {
    purchases: filteredPurchases,
    rawPurchases: purchases,
    notes,
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
    refreshData: () => {
      fetchPurchases();
      fetchNotes();
    },
  };
}
