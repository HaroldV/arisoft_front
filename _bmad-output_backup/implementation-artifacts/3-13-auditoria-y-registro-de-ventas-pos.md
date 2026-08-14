# Story 3.13: Auditoría y Registro de Ventas POS (Frontend)
Status: ready-for-dev

## Story

**Como** propietario del ERP,  
**quiero** visualizar el historial de transacciones de ventas del POS y auditar el detalle de cada ticket de compra,  
**para** supervisar la facturación de las cajas y revisar las justificaciones registradas al vender cantidades en negativo.

## Acceptance Criteria

1.  **Historial de Ventas (AC: #1):**
    *   **Dado** la página `/sales` (enlace en Sidebar).
    *   **Entonces** debe realizar una llamada a `GET /sales` y renderizar la tabla: ID de venta (ticket), Cajero (nombre), Fecha, Total en USD y Total en VES.
2.  **Conversión y Tipo de Cambio (AC: #2):**
    *   Los totales de venta deben formatearse y convertirse dinámicamente usando la tasa de cambio vigente del backend.
3.  **Modal Detalle de Venta (AC: #3):**
    *   **Dado** una fila de venta en la tabla.
    *   **Cuando** el usuario haga clic.
    *   **Entonces** debe abrir un modal estilo recibo que muestre:
        *   Cabecera con fecha, cajero y tenant.
        *   Lista de items (Cantidad, SKU, Nombre, Costo Unitario, Subtotal).
        *   Impuesto (IVA 16%, 8%, 0%) calculado.
4.  **Justificaciones en Negativo (AC: #4):**
    *   **Dado** que un ítem de la venta se registró con cantidad o precio negativo (Egreso / Ajuste de caja).
    *   **Entonces** el modal del ticket debe destacar visualmente este ítem en rojo e imprimir debajo la **Justificación** cargada por el cajero al realizar la venta.

## Tasks / Subtasks

- [ ] **Desarrollo del Historial**
  - [ ] Crear la página `/sales` con la tabla de transacciones de venta.
  - [ ] Implementar la conversión de monedas USD/VES en tiempo real basándose en la tasa de cambio activa.
- [ ] **Modal de Recibo y Auditoría**
  - [ ] Desarrollar el modal de ticket de compra (`GET /sales/:id`).
  - [ ] Implementar el bloque de visualización de justificaciones contables de egresos.
