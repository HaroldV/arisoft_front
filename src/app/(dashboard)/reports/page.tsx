import React, { Suspense } from 'react';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reportes & Analítica | ERP ARI',
  description: 'Dashboard analítico y reportes ejecutivos de ventas, compras, productos y proveedores',
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando reportes...</div>}>
      <ReportsDashboard />
    </Suspense>
  );
}
