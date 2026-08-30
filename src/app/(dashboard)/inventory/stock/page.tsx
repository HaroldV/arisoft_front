'use client';

import React from 'react';
import { Plus, AlertCircle, X, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useStockData } from '@/components/inventory/hooks/useStockData';
import { StockFilterBar } from '@/components/inventory/subcomponents/StockFilterBar';
import { StockTable } from '@/components/inventory/subcomponents/StockTable';
import { ProductEditModal } from '@/components/inventory/subcomponents/ProductEditModal';

export default function StockPage() {
  const {
    products,
    processedProducts,
    uniqueCategories,
    categories,
    search,
    setSearch,
    searchField,
    setSearchField,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    taxFilter,
    sortField,
    sortOrder,
    isLoading,
    error,
    setError,
    editingProduct,
    setEditingProduct,
    deletingId,
    setDeletingId,
    isDeleting,
    handleToggleSort,
    handleResetFilters,
    handleDeleteConfirm,
    fetchProducts,
  } = useStockData();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Listado de Productos</h1>
          <p className="text-slate-500">Listado de todos los productos creados con sus niveles de stock y valoración en tiempo real.</p>
        </div>
        <Link
          href="/inventory/initial"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-lg cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Registrar Producto
        </Link>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950">Acción rechazada</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Multidimensional Filter Bar */}
      <StockFilterBar
        search={search}
        setSearch={setSearch}
        searchField={searchField}
        setSearchField={setSearchField}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        uniqueCategories={uniqueCategories}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        taxFilter={taxFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        totalProductsCount={products.length}
        filteredProductsCount={processedProducts.length}
        onResetFilters={handleResetFilters}
      />

      {/* Loading State or Data Table */}
      {isLoading && products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Cargando inventario...</span>
        </div>
      ) : (
        <StockTable
          products={processedProducts}
          isLoading={isLoading}
          sortField={sortField}
          sortOrder={sortOrder}
          onToggleSort={handleToggleSort}
          onEdit={(product) => setEditingProduct(product)}
          onDelete={(id) => setDeletingId(id)}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => fetchProducts(search)}
        />
      )}

      {/* Delete / Deactivate Product Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Desactivar Producto?</h3>
                <p className="text-xs text-slate-500">El producto ya no estará disponible para ventas ni movimientos.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-rose-200 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Desactivar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
