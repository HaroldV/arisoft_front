'use client';

import React from 'react';
import { InConstructionPlaceholder } from '@/components/common/InConstructionPlaceholder';

export default function AccountsHistoryPage() {
  return (
    <InConstructionPlaceholder
      title="Historial Financiero"
      subtitle="Auditoría de movimientos bancarios y libros auxiliares"
      description="El historial consolidado de transacciones financieras y estados de cuenta multi-moneda se encuentra en fase activa de desarrollo."
      returnHref="/accounts/banks"
      returnLabel="Volver a Cuentas"
    />
  );
}
