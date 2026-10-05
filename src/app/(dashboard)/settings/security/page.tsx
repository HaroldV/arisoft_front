'use client';

import React from 'react';
import { InConstructionPlaceholder } from '@/components/common/InConstructionPlaceholder';

export default function SecuritySettingsPage() {
  return (
    <InConstructionPlaceholder
      title="Seguridad del Sistema"
      subtitle="Políticas de acceso, sesiones activas y autenticación de 2 factores (2FA)"
      description="El panel de configuración de seguridad avanzada, registro de auditoría de sesiones y llaves de acceso se encuentra en desarrollo."
      returnHref="/settings/users"
      returnLabel="Volver a Usuarios"
    />
  );
}
