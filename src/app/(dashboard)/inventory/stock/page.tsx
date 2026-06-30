'use client';

import { ProductForm } from '@/components/inventory/ProductForm';

export default function StockPage() {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Gestión de Inventario - Stock Actual</h1>
      <ProductForm />
    </div>
  );
}
