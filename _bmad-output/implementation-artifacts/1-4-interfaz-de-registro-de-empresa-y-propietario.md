# Story 1.4: Interfaz de Registro de Empresa y Propietario (Frontend)
Status: ready-for-dev

## Story

**Como** usuario nuevo (propietario),  
**quiero** registrar los datos básicos de mi empresa y mi perfil de administrador,  
**para** crear una nueva cuenta de inquilino (tenant) e iniciar sesión de inmediato.

## Acceptance Criteria

1.  **Formulario de Registro (AC: #1):**
    *   **Dado** la página `/register` cargada.
    *   **Cuando** el usuario complete los campos obligatorios:
        *   Nombre de la empresa (`company_name`)
        *   Identificación fiscal / RIF (`tax_id`)
        *   Nombre completo del propietario (`full_name`)
        *   Email (`email`)
        *   Contraseña (`password`)
        *   Confirmación de contraseña (`confirm_password`)
    *   **Entonces** el sistema debe permitir enviar los datos al hacer clic en "Registrarse".
2.  **Validación de Datos (AC: #2):**
    *   El RIF debe tener el formato venezolano válido (Ej: J-12345678-9).
    *   El email debe ser válido.
    *   La contraseña debe tener un mínimo de 8 caracteres.
    *   Las contraseñas de confirmación deben coincidir.
3.  **Llamada al API y Redirección (AC: #3):**
    *   **Cuando** el formulario sea válido y se envíe, debe realizar una llamada a `POST /auth/register` en el backend.
    *   **Entonces** al retornar éxito, el sistema debe redirigir a `/login?registered=true` mostrando el banner verde de éxito.

## Tasks / Subtasks

- [ ] **Desarrollo del Formulario**
  - [ ] Implementar los inputs controlados en `RegisterForm.tsx`.
  - [ ] Añadir validaciones regex para RIF y formato de email.
- [ ] **Integración de API**
  - [ ] Realizar llamada `apiClient.post('/auth/register', { ... })`.
  - [ ] Controlar errores de duplicidad (Ej: RIF o Email ya registrado) y mostrarlos en el banner de error.
  - [ ] Redirigir a `/login?registered=true` tras el registro exitoso.

## Dev Notes

*   **API Client:** Usar `@/infrastructure/api/api-client`.
*   **Diseño:** El diseño de la página de registro debe ser moderno, limpio, con soporte responsivo y estados visuales para deshabilitar el botón durante el envío (`isSubmitting`).
