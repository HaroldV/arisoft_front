'use client';

import React, { Suspense } from 'react';
import { PurchaseReceptionsList } from '@/components/purchases/PurchaseReceptionsList';
import { Loader2 } from 'lucide-react';

export default function PurchaseReceptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
          <p className="text-sm font-medium">Cargando recepciones de mercancía...</p>
        </div>
      }
    >
      <PurchaseReceptionsList />
    </Suspense>
  );
}
