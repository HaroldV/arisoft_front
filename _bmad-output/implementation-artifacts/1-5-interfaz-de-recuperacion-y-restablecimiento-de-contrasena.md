# Story 1.5: Interfaz de Recuperación y Restablecimiento de Contraseña (Frontend)
Status: ready-for-dev

## Story

**Como** usuario del sistema que ha olvidado su clave,  
**quiero** solicitar un enlace de restablecimiento de contraseña e ingresar una nueva credencial segura,  
**para** recuperar el acceso a mi cuenta del inquilino (tenant) de forma segura.

## Acceptance Criteria

1.  **Solicitud de Enlace (AC: #1):**
    *   **Dado** la página `/forgot-password` cargada.
    *   **Cuando** el usuario ingrese su email y envíe el formulario.
    *   **Entonces** el sistema debe llamar a `POST /auth/forgot-password`.
    *   **Y** mostrar un mensaje de éxito indicando que se ha enviado el enlace de recuperación a su correo electrónico.
2.  **Formulario de Restablecimiento (AC: #2):**
    *   **Dado** la página `/reset-password?token=XYZ` abierta desde el enlace de recuperación.
    *   **Cuando** el usuario complete los campos:
        *   Nueva Contraseña (`password`)
        *   Confirmar Contraseña (`confirm_password`)
    *   **Entonces** al enviar, el sistema debe llamar a `POST /auth/reset-password` enviando el token (extraído de los search params de la URL) y la nueva contraseña.
3.  **Redirección Post-Reseteo (AC: #3):**
    *   **Cuando** el cambio sea exitoso, el sistema debe redirigir a `/login?reset=true` mostrando el banner verde de éxito.

## Tasks / Subtasks

- [ ] **Flujo de Recuperación (Forgot Password)**
  - [ ] Implementar la captura de email en `forgot-password/page.tsx`.
  - [ ] Realizar petición `POST /auth/forgot-password` y manejar errores de "Email no encontrado".
- [ ] **Flujo de Restablecimiento (Reset Password)**
  - [ ] Extraer el parámetro `token` de los `searchParams` en `reset-password/page.tsx`.
  - [ ] Implementar validaciones de coincidencia de contraseña y tamaño mínimo.
  - [ ] Realizar petición `POST /auth/reset-password` enviando el token y password.
  - [ ] Redirigir a `/login?reset=true` tras la actualización exitosa.

## Dev Notes

*   **API Client:** Usar `@/infrastructure/api/api-client`.
*   **Next.js Navigation:** Usar `useSearchParams` para extraer el token en el cliente de Next.js.
