# Story 7.5: Panel de Control y Saldos Consolidados (Double Currency)

## Descripción del Requerimiento
Permitir a los propietarios visualizar en una sola sección todas sus cuentas y cajas activas, mostrando los saldos expresados en su moneda nativa junto a su equivalencia y un resumen total bimonetario convertido dinámicamente según la tasa global del sistema.

## Cambios Realizados

### Backend
*   El controlador retorna la lista de cuentas activas en `GET /bank-accounts` con sus saldos actualizados y tipados por tenant.

### Frontend
1.  **Dashboard View:** Diseñado el dashboard principal en `/accounts/banks/page.tsx` con soporte responsivo y estética premium de AriSoft.
2.  **KPI metrics header:** Implementadas las tarjetas superiores de resumen que totalizan los fondos en USD, VES, muestran el saldo neto en divisas y permiten editar la tasa cambiaria global de conversión en tiempo real.
3.  **Glassmorphic bank cards:** Creada la representación visual de cada cuenta simulando tarjetas plásticas bancarias con degradados personalizados según la moneda (azul/índigo para bolívares, verde para efectivo, morado para cuentas en USD). Muestra el saldo nativo y la equivalencia bimonetaria de conversión en la parte inferior.

## Verificación y Calidad
*   **Next.js Production Build:** Compilación exitosa libre de errores de importación o TypeScript.
*   **Manual verification:** Verificación en el navegador con Next.js y endpoints NestJS.
