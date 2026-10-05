'use client';

import React from 'react';
import { InConstructionPlaceholder } from '@/components/common/InConstructionPlaceholder';

export default function PayrollPage() {
  return (
    <InConstructionPlaceholder
      title="Procesamiento de Nómina"
      subtitle="Cálculo de asignaciones, deducciones y generación de recibos"
      description="El procesador automatizado de nómina, cálculo de pasivos laborales y generación de archivos bancarios se encuentra en desarrollo y estará disponible próximamente."
      returnHref="/"
      returnLabel="Volver al Inicio"
    />
  );
}
