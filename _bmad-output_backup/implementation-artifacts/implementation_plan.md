# Plan de Implementación: Módulo de Inventario y Clientes Completo (Stories 3.9 a 3.14)

Este plan detalla los cambios técnicos para implementar el rediseño de inventarios junto a los nuevos módulos de **Proveedores**, **Clientes**, **Registro de Compras** y **Registro e Historial de Ventas POS**.

---

## User Review Required

> [!IMPORTANT]
> *   **Integración de Proveedores y Clientes:** En la base de datos crearemos las tablas `providers` y `clients` y actualizaremos las relaciones con `purchase_invoices` y `sales` mediante migraciones SQL.
> *   **Subida de Facturas Físicas:** El formulario de registro de compras enviará el adjunto (imagen o PDF) como `multipart/form-data` al endpoint `POST /inventory/purchases`.
> *   **Integración del Cliente en el POS:** El checkout de `PosInterface` incluirá un selector de cliente para vincular la compra a un cliente registrado (o dejarla como cliente genérico "Venta Mostrador").

---

## Proposed Changes

### [Component] Rutas y Enlaces del Sidebar

#### [MODIFY] [Sidebar.tsx](file:///Users/haroldv/Projects/erp-ari-hv/erp-frontend/src/components/Sidebar.tsx)
*   Modificar los sub-elementos de la categoría **Inventario** para incluir:
    *   `Inventario Inicial` ➔ `href: '/inventory/initial'`
    *   `Stock Actual` ➔ `href: '/inventory/stock'`
    *   `Proveedores` ➔ `href: '/inventory/providers'`
    *   `Registro de Compras` ➔ `href: '/inventory/purchases'`
*   Modificar la categoría **Ventas** para incluir:
    *   `Punto de Venta` ➔ `href: '/pos'`
    *   `Registro de Ventas` ➔ `href: '/sales'`
    *   `Clientes` ➔ `href: '/sales/clients'`

---

### [Component] Catálogo de Proveedores (Story 3.11)

#### [NEW] [provider.entity.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/domain/entities/provider.entity.ts)
*   Crear la entidad `Provider` de TypeORM con aislamiento de `tenant_id`.

#### [NEW] [1719792000000-CreateProvidersTable.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/infrastructure/persistence/postgresql/migrations/1719792000000-CreateProvidersTable.ts)
*   Crear la migración para la tabla `providers` con restricciones únicas por `(tenant_id, tax_id)`.

#### [NEW] [ProvidersController.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/presentation/web/controllers/providers.controller.ts)
*   Exponer CRUD API endpoints: `POST`, `GET`, `PUT`, `DELETE` en `/providers`.

#### [NEW] [page.tsx](file:///Users/haroldv/Projects/erp-ari-hv/erp-frontend/src/app/(dashboard)/inventory/providers/page.tsx)
*   Crear pantalla para listar, crear, editar y desactivar proveedores con formulario y validación de RIF.

---

### [Component] Catálogo de Clientes y POS Selector (Story 3.14)

#### [NEW] [client.entity.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/domain/entities/client.entity.ts)
*   Crear la entidad `Client` en el backend.

#### [NEW] [1719793000000-CreateClientsTable.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/infrastructure/persistence/postgresql/migrations/1719793000000-CreateClientsTable.ts)
*   Crear la migración de base de datos para la tabla `clients` y alterar `sales` para añadir `client_id`.

#### [NEW] [ClientsController.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/presentation/web/controllers/clients.controller.ts)
*   Exponer CRUD API endpoints en `/clients`.

#### [NEW] [page.tsx](file:///Users/haroldv/Projects/erp-ari-hv/erp-frontend/src/app/(dashboard)/sales/clients/page.tsx)
*   Crear la pantalla de administración de clientes (CRUD).

#### [MODIFY] [PosInterface.tsx](file:///Users/haroldv/Projects/erp-ari-hv/erp-frontend/src/components/pos/PosInterface.tsx)
*   Agregar el selector de cliente en el panel de cobro.
*   Al pagar, enviar el `client_id` (o nulo para venta mostrador) en el cuerpo de la petición.

---

### [Component] Registro de Compras (`/inventory/purchases` - Story 3.12)

#### [NEW] [page.tsx](file:///Users/haroldv/Projects/erp-ari-hv/erp-frontend/src/app/(dashboard)/inventory/purchases/page.tsx)
*   Página de historial de compras con tabla que liste facturas registradas y enlaces de descarga de comprobantes.

#### [NEW] [new/page.tsx](file:///Users/haroldv/Projects/erp-ari-hv/erp-frontend/src/app/(dashboard)/inventory/purchases/new/page.tsx)
*   Formulario de carga de factura:
    *   Select de Proveedor (alimentado de `GET /providers`).
    *   Número de Factura, File Uploader de soporte de factura.
    *   Grilla dinámica de ítems comprados (Cantidad, SKU, Costo unitario).
    *   Llamada API a `POST /inventory/purchases`.

---

### [Component] Registro de Ventas POS (`/sales` - Story 3.13)

#### [NEW] [page.tsx](file:///Users/haroldv/Projects/erp-ari-hv/erp-frontend/src/app/(dashboard)/sales/page.tsx)
*   Tabla de transacciones de ventas del POS. Muestra ID, cajero, fecha, total USD y VES.
*   **Modal Detalle de Venta:** Renderiza un modal estilo ticket con el desglose de productos. Si el ítem es negativo (egreso de caja), se destaca en rojo e imprime la justificación escrita por el cajero.

---

## Verification Plan

### Automated Tests
*   `npm run test` en el backend para validar el CRUD de proveedores y clientes, y tests de aislamiento de tenant.
*   `npm run build` en el frontend para validar importaciones y compilación.

### Manual Verification
*   Crear un cliente en `/sales/clients`.
*   Realizar una venta en el POS asociándola a ese cliente.
*   Verificar que la venta en `/sales` registre correctamente el cliente asociado.
