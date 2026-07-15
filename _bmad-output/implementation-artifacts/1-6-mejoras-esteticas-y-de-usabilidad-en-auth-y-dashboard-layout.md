# Story 1.6: Mejoras Estéticas y de Usabilidad en Auth y Dashboard Layout (Frontend)
Status: done

## Story

**Como** administrador o cajero del ERP,  
**quiero** contar con interfaces seguras, claras y responsivas en el inicio de sesión, registro y panel de control,  
**para** evitar errores al ingresar credenciales, entender el estado de conexión del sistema y trabajar sin solapamiento de diseño.

## Acceptance Criteria

1.  **Visibilidad de Contraseñas (AC: #1):**
    *   **Dado** los formularios de `/login`, `/register` y `/reset-password`.
    *   **Cuando** el usuario haga clic en el icono de "ojo" al lado de la contraseña.
    *   **Entonces** el texto de la contraseña debe alternar entre oculto (`password`) y visible (`text`), cambiando el icono a `EyeOff` / `Eye`.
2.  **Confirmación y Ayuda en Registro (AC: #2):**
    *   **Dado** la página `/register`.
    *   **Cuando** se renderice el campo de RIF, debe mostrar una etiqueta de ayuda: `Formato requerido: J-12345678-9`.
    *   **Y** debe incluir un campo obligatorio de "Confirmar contraseña".
    *   **Entonces** si las contraseñas no coinciden al enviar, se debe bloquear el envío y mostrar un banner de error.
3.  **Fondo Estético Premium en Auth (AC: #3):**
    *   **Dado** el `AuthLayout`.
    *   **Cuando** se cargue cualquier pantalla de autenticación.
    *   **Entonces** el fondo debe lucir un gradiente moderno y oscuro (Ej: `bg-gradient-to-br from-slate-900 via-slate-950 to-primary-950` con efectos visuales suaves) en lugar de un gris plano.
4.  **Resiliencia y Estado de Conexión Global (AC: #4):**
    *   **Dado** el Header global en `layout.tsx` del dashboard.
    *   **Cuando** cambie el estado de conexión del navegador.
    *   **Entonces** se debe mostrar un indicador dinámico ("🟢 Sincronizado" / "🔴 Modo Offline") visible para todos los módulos.
    *   **Y** se removerá el indicador duplicado de la cabecera interna del POS.
5.  **Dinamizar Datos de Sesión (AC: #5):**
    *   **Dado** el dashboard y la cabecera.
    *   **Cuando** el usuario inicie sesión.
    *   **Entonces** el avatar debe mostrar las iniciales reales extraídas del nombre del usuario, y el saludo de bienvenida debe decir: `Bienvenido, {primer_nombre_usuario}`.

## Tasks / Subtasks

- [x] **Pantallas de Autenticación (Auth)**
  - [x] Implementar el toggle de mostrar/ocultar contraseña en login, registro y reseteo.
  - [x] Agregar helper text de formato RIF en `/register`.
  - [x] Agregar campo "Confirmar contraseña" y validación en `/register`.
  - [x] Rediseñar `AuthLayout` con gradiente premium oscuro.
  - [x] Añadir botón "Volver al login" tras enviar enlace en `/forgot-password`.
- [x] **Layout y Dashboard**
  - [x] Integrar indicador de estado de red global en la cabecera del dashboard.
  - [x] Ajustar altura del POS a `h-[calc(100vh-12rem)]` para evitar scrollbar doble.
  - [x] Consumir `user` de `useAuth()` para iniciales y saludo dinámico.
