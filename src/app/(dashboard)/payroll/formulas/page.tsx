'use client';

import React from 'react';
import { InConstructionPlaceholder } from '@/components/common/InConstructionPlaceholder';

export default function PayrollFormulasPage() {
  return (
    <InConstructionPlaceholder
      title="Fórmulas Legales de Nómina"
      subtitle="Configuración y personalización de cálculos y asignaciones"
      description="El editor dinámico de fórmulas legales, deducciones laborales y asignaciones salariales estará disponible próximamente."
      returnHref="/payroll"
      returnLabel="Volver a Nómina"
    />
  );
}
