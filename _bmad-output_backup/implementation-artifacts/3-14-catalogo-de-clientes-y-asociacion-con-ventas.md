# Story 3.14: Catálogo de Clientes y Asociación con Ventas (Backend y Frontend)
Status: ready-for-dev

## Story

**Como** cajero del punto de venta,  
**quiero** registrar a mis clientes y asociarlos a los tickets de venta al momento de facturar,  
**para** emitir comprobantes personalizados, llevar un histórico de consumos por cliente y analizar comportamientos de compra.

## Acceptance Criteria

1.  **Entidad y Tabla DB (AC: #1):**
    *   Crear la tabla `clients` en el backend: `id` (UUID), `tenant_id` (UUID), `name` (razón social/nombre), `tax_id` (cédula o RIF, único por tenant), `email`, `phone`, `address`, `is_active` (boolean, default true).
    *   Generar e implementar la migración SQL correspondiente.
2.  **API CRUD Backend (AC: #2):**
    *   Exponer los endpoints bajo `/clients` con validaciones de `tenant_id`.
    *   Actualizar la tabla `sales` para añadir una clave foránea `client_id` (UUID, nullable). Si es nula, representa una "Venta Mostrador" (Cliente Genérico).
3.  **Interfaz Frontend CRUD (AC: #3):**
    *   Crear la vista en `/sales/clients` para listar, buscar por cédula/RIF y gestionar (crear/editar/desactivar) clientes.
4.  **Integración en Punto de Venta (POS) (AC: #4):**
    *   En `PosInterface.tsx`, agregar un selector de Cliente.
    *   Permitir buscar clientes cargados o registrar uno rápido desde un modal emergente sin salir de la pantalla de ventas.
    *   Al cerrar la venta, el JSON enviado a `POST /sales` debe incluir `client_id`.

## Tasks / Subtasks

- [ ] **Desarrollo Backend**
  - [ ] Crear la entidad `Client` y la migración SQL correspondiente.
  - [ ] Modificar la entidad `Sale` para admitir `client_id` (asociación nullable).
  - [ ] Implementar `ClientRepository` y casos de uso CRUD de clientes.
  - [ ] Crear `ClientsController` y exponer endpoints con validación y Swagger.
- [ ] **Desarrollo Frontend**
  - [ ] Crear la pantalla `/sales/clients` con tabla, filtros y modales CRUD de clientes.
  - [ ] Integrar el selector de cliente en el flujo de facturación de `PosInterface.tsx` (con soporte para cliente genérico "Venta Mostrador" por defecto).
