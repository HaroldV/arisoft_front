# Story 3.10: Tabla de Stock Actual con Alertas Críticas (Frontend)
Status: ready-for-dev

## Story

**Como** operador de tienda,  
**quiero** visualizar el catálogo completo de productos con sus respectivos niveles de stock en tiempo real y alertas visuales para artículos críticos,  
**para** conocer de inmediato qué productos requieren reposición y auditar las valoraciones del inventario.

## Acceptance Criteria

1.  **Tabla de Productos (AC: #1):**
    *   **Dado** la página `/inventory/stock` cargada.
    *   **Cuando** se monte el componente, debe realizar una llamada a `GET /inventory/products`.
    *   **Entonces** debe renderizar una tabla con las columnas: `SKU`, `Nombre`, `Costo Base (USD)`, `Precio Venta (USD)`, `IVA`, `Stock Disponible` y `Acciones`.
2.  **Buscador y Filtro (AC: #2):**
    *   El buscador debe realizar peticiones con debounce a la API filtrando por SKU o Nombre.
3.  **Semáforo de Alertas de Stock (AC: #3):**
    *   Si `stock > 10` ➔ Badge de stock normal en verde.
    *   Si `stock <= 5` e `stock > 0` ➔ Badge de advertencia en amarillo (`⚠️ Crítico`).
    *   Si `stock === 0` ➔ Badge de error en rojo (`🚫 Sin Stock`).
4.  **Acciones por Fila (AC: #4):**
    *   **Editar:** Debe abrir un modal que permita editar metadatos del producto (Nombre, Costo, Precio, IVA) llamando a `PUT /inventory/products/:id`. El stock NO se edita desde aquí.
    *   **Desactivar:** Debe llamar a `DELETE /inventory/products/:id` (Soft-delete). Si el producto cuenta con transacciones vigentes en el POS, el botón de eliminar debe estar deshabilitado y mostrar un aviso al pasar el cursor.

## Tasks / Subtasks

- [ ] **Desarrollo de Tabla y Buscador**
  - [ ] Implementar la vista `/inventory/stock` con tabla responsiva y paginación.
  - [ ] Integrar el buscador conectado a `GET /inventory/products` con soporte para debounce.
- [ ] **Modales de Acción**
  - [ ] Desarrollar el modal de edición de metadatos (Name, Cost, Price, IVA).
  - [ ] Conectar la acción de editar a `PUT /inventory/products/:id`.
  - [ ] Conectar la acción de soft-delete con validaciones de ciclo de vida del producto.
