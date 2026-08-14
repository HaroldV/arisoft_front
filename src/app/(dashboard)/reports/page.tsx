import React from 'react';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reportes y Analítica | ERP ARI',
  description: 'Dashboard analítico y reportes ejecutivos de ventas, compras, productos y proveedores',
};

export default function ReportsPage() {
  return <ReportsDashboard />;
}
