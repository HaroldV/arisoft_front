# Story 3.11: Catálogo de Proveedores - CRUD y Persistencia (Backend y Frontend)
Status: ready-for-dev

## Story

**Como** administrador de compras,  
**quiero** registrar, editar y desactivar datos estructurados de mis proveedores (Razón Social, RIF, Teléfono, Dirección),  
**para** asociar con precisión mis facturas de compras y evitar errores manuales.

## Acceptance Criteria

1.  **Entidad y Tabla DB (AC: #1):**
    *   Crear la tabla `providers` con las columnas: `id` (UUID), `tenant_id` (UUID), `name`, `tax_id` (RIF, único por tenant), `email` (opcional), `phone` (opcional), `address` (opcional), `is_active` (boolean, default true).
    *   Añadir migración de base de datos.
2.  **API CRUD Backend (AC: #2):**
    *   Exponer los endpoints:
        *   `POST /providers` ➔ Crear proveedor.
        *   `GET /providers` ➔ Listar proveedores del tenant.
        *   `PUT /providers/:id` ➔ Modificar proveedor.
        *   `DELETE /providers/:id` ➔ Desactivación lógica (`is_active = false`).
    *   Todos los endpoints deben validar pertenencia por `tenant_id`.
3.  **Interfaz Frontend (AC: #3):**
    *   Crear la vista en `/inventory/providers` o en `/settings/providers` (con enlace en el Sidebar).
    *   Mostrar la lista de proveedores con buscador.
    *   Agregar un modal o formulario para registrar y editar proveedores, validando el formato del RIF.

## Tasks / Subtasks

- [ ] **Desarrollo Backend**
  - [ ] Crear la entidad `Provider` y la migración SQL correspondientes.
  - [ ] Implementar `ProviderRepository` con soporte para aislamiento por tenant.
  - [ ] Implementar casos de uso: `CreateProvider`, `ListProviders`, `UpdateProvider`, `DeleteProvider`.
  - [ ] Exponer los endpoints en `ProvidersController` con DTOs de validación y Swagger.
- [ ] **Desarrollo Frontend**
  - [ ] Agregar el enlace "Proveedores" en `Sidebar.tsx` bajo la categoría "Inventario".
  - [ ] Crear la página `/inventory/providers` con tabla de búsqueda y modal para alta/edición de datos.
