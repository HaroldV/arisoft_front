'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { SalesOrder } from './orders/types';
import { SalesOrdersHeader } from './orders/subcomponents/SalesOrdersHeader';
import { SalesOrdersFilterBar } from './orders/subcomponents/SalesOrdersFilterBar';
import { SalesOrdersTable } from './orders/subcomponents/SalesOrdersTable';
import { SalesOrderDetailModal } from './orders/subcomponents/SalesOrderDetailModal';
import { SalesOrderTransportModal } from './orders/subcomponents/SalesOrderTransportModal';

export default function SalesOrdersList() {
  const [items, setItems] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delivery / Transport modal state
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Detail viewing modal state
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/sales/documents?type=SALES_ORDER');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching sales orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredItems = items.filter(
    (i) =>
      (i.document_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.client_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenTransportModal = (doc: SalesOrder) => {
    setSelectedOrder(doc);
    setIsTransportModalOpen(true);
  };

  const handleConfirmDelivery = async (payload: {
    carrier_name: string;
    vehicle_plate: string;
    driver_name: string;
  }) => {
    if (!selectedOrder) return;

    try {
      await apiClient.post(`/sales/documents/${selectedOrder.id}/convert`, {
        target_type: 'DELIVERY_NOTE',
        ...payload,
      });

      await fetchOrders();
      showToast(
        `📦 Nota de Entrega generada exitosamente para el Pedido #${selectedOrder.document_number} (Salida de Stock efectuada).`
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al generar la nota de entrega');
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Header Container */}
      <SalesOrdersHeader />

      {/* Search Bar */}
      <SalesOrdersFilterBar search={search} onSearchChange={setSearch} />

      {/* Main Data Table */}
      <SalesOrdersTable
        orders={filteredItems}
        onViewDetail={(order) => setViewingOrder(order)}
        onOpenTransportModal={handleOpenTransportModal}
      />

      {/* Detail Modal */}
      <SalesOrderDetailModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onDispatch={(order) => {
          setViewingOrder(null);
          handleOpenTransportModal(order);
        }}
      />

      {/* Delivery / Transport Modal */}
      <SalesOrderTransportModal
        order={selectedOrder}
        isOpen={isTransportModalOpen}
        onClose={() => setIsTransportModalOpen(false)}
        onConfirm={handleConfirmDelivery}
      />
    </div>
  );
}
