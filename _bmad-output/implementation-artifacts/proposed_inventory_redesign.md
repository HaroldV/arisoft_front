# Propuesta de Rediseño: Módulo de Inventario

Basado en la evaluación UX de **Sally** (`🎨`) y las directrices metodológicas de BMad (`📋`), proponemos reorganizar y rediseñar la sección de inventarios para separar las responsabilidades de **carga de datos** (Inventario Inicial) y **auditoría y control diario** (Stock Actual).

---

## 🔄 1. Reestructuración de Rutas y Menú Lateral

Proponemos la siguiente división en `Sidebar.tsx`:

*   **Inventario Inicial (`/inventory/initial`):** Pantalla destinada únicamente al alta de productos nuevos y carga del stock base de apertura (manual o masivo).
*   **Stock Actual (`/inventory/stock`):** Pantalla operativa del día a día. Tabla interactiva y buscador que lee el inventario real y los movimientos agregados.

---

## 🛠️ 2. Diseño de la Interfaz "Inventario Inicial" (`/inventory/initial`)

Esta pantalla unifica los flujos de creación de catálogo inicial bajo un control de pestañas (Tabs) moderno y limpio:

### Tab 1: Registro Manual (Formulario Individual)
*   **Campos:** RIF / SKU (Código único), Nombre del producto, Costo base (USD), Precio de venta (USD), Tasa de IVA (16%, 8%, 0%), Stock Inicial (genera un movimiento `INITIAL_LOAD`).
*   **Mejoras de UI:**
    *   Soporte para generación automática de SKU si se deja en blanco (Ej: `PROD-0001`).
    *   Tooltips informativos en las tasas de IVA explicando la ley tributaria venezolana.

### Tab 2: Carga Masiva (Importar CSV)
*   **Área Drag-and-Drop:** Zona interactiva con borde punteado azul que reacciona al arrastrar archivos.
*   **Descarga de Plantilla:** Botón destacado para bajar el formato correcto de CSV (`template_inventario.csv`).
*   **Indicador de Progreso:** Al subir, muestra una barra de carga dinámica y un reporte final: *"Ej: 45 productos cargados con éxito, 2 errores de SKU duplicado"*.

---

## 📊 3. Diseño de la Interfaz "Stock Actual" (`/inventory/stock`)

El control del inventario diario requiere una vista analítica y ágil:

```text
+-------------------------------------------------------------------------+
|  Stock Actual                                  [ + Registrar Compra ]   |
|  [ Buscar por SKU, Nombre...          ] [ Filtrar por IVA: Todos v ]    |
+-------------------------------------------------------------------------+
| SKU        | Nombre       | Costo   | Precio  | IVA   | Stock   | Acción|
+------------+--------------+---------+---------+-------+---------+-------+
| J-0001     | Harina Pan   | $0.90   | $1.20   | 0%    | 120 un  | [Ed][]|
| V-0023     | Refresco     | $1.20   | $1.80   | 16%   | 4 un ⚠️ | [Ed][]|
| G-0105     | Queso Blanco | $3.50   | $5.00   | 0%    | 0 un 🚫 | [Ed][]|
+-------------------------------------------------------------------------+
| Mostrando 1-3 de 45 productos                             < Anterior [Siguiente] |
+-------------------------------------------------------------------------+
```

### Elementos Clave de Usabilidad (UX):
*   **Semáforo de Stock:**
    *   `Verde:` Stock abundante (> 10 unidades).
    *   `Amarillo (⚠️):` Stock crítico (<= 5 unidades).
    *   `Rojo (🚫):` Sin stock (0 unidades).
*   **Acciones Rápidas por Fila:**
    *   **Botón Editar:** Abre un modal para modificar únicamente metadatos (Nombre, Precio). El stock es inmutable y no se puede editar manualmente (regla de inmutabilidad financiera ST-3.1).
    *   **Botón Desactivar:** Desactivación lógica (Soft-delete) del producto. El botón estará deshabilitado y mostrará un tooltip si el producto cuenta con transacciones vigentes en el POS para prevenir inconsistencias contables.
