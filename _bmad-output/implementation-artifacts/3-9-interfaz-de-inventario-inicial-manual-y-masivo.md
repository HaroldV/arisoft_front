# Story 3.9: Interfaz de Inventario Inicial - Manual y Masivo (Frontend)
Status: ready-for-dev

## Story

**Como** administrador de inventarios,  
**quiero** contar con una pantalla unificada para dar de alta productos de forma manual o cargarlos por lotes desde un archivo CSV,  
**para** realizar la carga de apertura de mi negocio de forma ágil y libre de errores.

## Acceptance Criteria

1.  **Estructura de Tabs (AC: #1):**
    *   **Dado** la página `/inventory/initial` cargada.
    *   **Entonces** debe renderizar un control de pestañas:
        *   **Tab 1:** "Registro Manual" (Formulario).
        *   **Tab 2:** "Carga Masiva (CSV)".
2.  **Registro Manual e Invocación (AC: #2):**
    *   **Dado** el Tab de Registro Manual.
    *   **Cuando** el usuario complete el formulario:
        *   SKU, Nombre del Producto, Costo (USD), Precio (USD), Tasa IVA (16%, 8%, 0%), y Stock Inicial.
    *   **Entonces** el sistema debe llamar a `POST /inventory/products` en el backend.
    *   **Y** al retornar éxito, limpiar el formulario y mostrar un banner verde de confirmación.
3.  **Carga Masiva con Drag-and-Drop (AC: #3):**
    *   **Dado** el Tab de Carga Masiva.
    *   **Cuando** el usuario arrastre o seleccione un archivo `.csv`.
    *   **Entonces** el sistema debe enviar el archivo mediante `POST /inventory/products/bulk` como multipart/form-data.
    *   **Y** mostrar el reporte de resultados (productos importados con éxito / SKU duplicados).
4.  **Descarga de Plantilla (AC: #4):**
    *   Debe incluir un enlace de descarga destacado para descargar el archivo de plantilla CSV estándar.

## Tasks / Subtasks

- [ ] **Desarrollo de Vistas**
  - [ ] Implementar la pantalla `/inventory/initial` con navegación por Tabs.
  - [ ] Adaptar `ProductForm.tsx` para integrarse al Tab 1 y realizar llamadas a `POST /inventory/products`.
- [ ] **Carga Masiva y Plantilla**
  - [ ] Desarrollar la zona interactiva de carga de archivos (Drag-and-Drop) en el Tab 2.
  - [ ] Crear el archivo estático de plantilla CSV en la carpeta pública del frontend.
  - [ ] Conectar la subida del archivo al endpoint bulk del backend y renderizar el reporte de logs del proceso.
