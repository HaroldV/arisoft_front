'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/infrastructure/api/api-client';
import { PurchaseOrder, ProviderOption, ProductOption, WarehouseOption } from './orders/types';
import { PurchaseOrdersHeader } from './orders/subcomponents/PurchaseOrdersHeader';
import { PurchaseOrdersFilterBar } from './orders/subcomponents/PurchaseOrdersFilterBar';
import { PurchaseOrdersTable } from './orders/subcomponents/PurchaseOrdersTable';
import { PurchaseOrderDetailModal } from './orders/subcomponents/PurchaseOrderDetailModal';
import { PurchaseOrderCreateModal } from './orders/subcomponents/PurchaseOrderCreateModal';
import { PurchaseOrderCancelModal } from './orders/subcomponents/PurchaseOrderCancelModal';

export function PurchaseOrdersList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedViewOrder, setSelectedViewOrder] = useState<PurchaseOrder | null>(null);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<PurchaseOrder | null>(null);

  // Aux Data
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchAuxData();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/purchases/orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [provRes, prodRes, whRes] = await Promise.all([
        apiClient.get('/providers'),
        apiClient.get('/inventory/products'),
        apiClient.get('/inventory/warehouse-locations').catch(() => ({ data: [] })),
      ]);
      const rawProviders = provRes.data || [];
      setProviders(
        rawProviders.map((p: any) => ({
          id: p.id,
          name: p.name,
          rif: p.tax_id || p.rif || '',
        }))
      );
      const rawProducts = prodRes.data || [];
      setProducts(
        rawProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          costUsd: Number(p.cost_usd || p.costUsd || 0),
        }))
      );
      setWarehouses(whRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrder = async (payload: any) => {
    await apiClient.post('/purchases/orders', payload);
    await fetchOrders();
    await fetchAuxData();
  };

  const handleConfirmCancelOrder = async (orderId: string, reason: string) => {
    await apiClient.post(`/purchases/orders/${orderId}/cancel`, { reason });
    await fetchOrders();
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PurchaseOrdersHeader onOpenCreateModal={() => setShowCreateModal(true)} />

      {/* Filter Bar */}
      <PurchaseOrdersFilterBar search={search} onSearchChange={setSearch} />

      {/* Orders Table */}
      <PurchaseOrdersTable
        orders={filteredOrders}
        isLoading={isLoading}
        onViewOrder={(order) => setSelectedViewOrder(order)}
        onCancelOrder={(order) => setSelectedCancelOrder(order)}
      />

      {/* Create Order Modal */}
      <PurchaseOrderCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        providers={providers}
        products={products}
        warehouses={warehouses}
        onSubmit={handleCreateOrder}
        onProviderCreated={(newProv) => {
          setProviders(prev => [newProv, ...prev]);
        }}
      />

      {/* View Order Detail Modal */}
      <PurchaseOrderDetailModal
        order={selectedViewOrder}
        products={products}
        onClose={() => setSelectedViewOrder(null)}
      />

      {/* Cancel Order Modal */}
      <PurchaseOrderCancelModal
        order={selectedCancelOrder}
        isOpen={Boolean(selectedCancelOrder)}
        onClose={() => setSelectedCancelOrder(null)}
        onConfirmCancel={handleConfirmCancelOrder}
      />
    </div>
  );
}
