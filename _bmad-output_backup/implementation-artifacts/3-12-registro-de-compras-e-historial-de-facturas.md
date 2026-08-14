# Story 3.12: Registro de Compras e Historial de Facturas (Frontend)
Status: ready-for-dev

## Story

**Como** administrador de inventarios,  
**quiero** registrar compras asociadas a proveedores subiendo la factura digital y detallando los productos ingresados,  
**para** actualizar automáticamente el stock inicial contable y tener una bitácora digital de mis comprobantes de compra.

## Acceptance Criteria

1.  **Formulario de Carga (AC: #1):**
    *   **Dado** la página `/inventory/purchases/new` o modal.
    *   **Cuando** el usuario complete:
        *   Selección de proveedor (llenada desde `GET /providers`).
        *   Número de Factura.
        *   Carga de archivo de comprobante (PDF o imagen, obligatorio).
        *   Detalle de items: Búsqueda de productos, ingreso de Cantidad y Costo Unitario de compra.
    *   **Entonces** al enviar, debe realizar una llamada multipart/form-data a `POST /inventory/purchases`.
2.  **Incremento de Stock Inmutable (AC: #2):**
    *   Al guardar la compra, el backend creará registros de tipo `PURCHASE` en la tabla `STOCKS` (verificado en la Story 3.2 de backend).
3.  **Historial de Compras (AC: #3):**
    *   **Dado** la página `/inventory/purchases`.
    *   **Entonces** debe listar las compras registradas con: Número de Factura, Proveedor, Total (USD) y enlace para descargar/ver el archivo adjunto.

## Tasks / Subtasks

- [ ] **Desarrollo del Formulario de Registro**
  - [ ] Diseñar el formulario de factura en `/inventory/purchases/new`.
  - [ ] Integrar el selector de proveedores consumiendo la API de proveedores.
  - [ ] Implementar la grilla de productos dinámica con cálculos automáticos de subtotal.
  - [ ] Desarrollar la subida de archivos multipart para PDF e imágenes de facturas.
- [ ] **Auditoría de Compras**
  - [ ] Crear la tabla de historial en `/inventory/purchases`.
  - [ ] Habilitar descarga o visualización en modal del comprobante físico de la factura de compra.
