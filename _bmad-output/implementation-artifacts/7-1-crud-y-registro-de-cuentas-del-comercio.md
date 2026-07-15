# Story 7.1: CRUD y Registro de Cuentas del Comercio

## Descripción del Requerimiento
Permitir a los administradores del comercio registrar, editar y desactivar las cuentas bancarias o cajas físicas de dinero del comercio con soporte multitenant, delimitando la moneda (USD, VES) y guardando los metadatos oficiales de Pago Móvil para cuentas en bolívares.

## Cambios Realizados

### Backend (Base de Datos e Infraestructura)
1.  **Migración SQL:** Ejecutada `009_bank_accounts.sql` para crear las tablas `bank_accounts` (con columnas `name`, `bank_name`, `account_number`, `account_type`, `currency`, `current_balance`, y campos de Pago Móvil P2P) y `bank_movements` (log contable).
2.  **Entidad TypeORM:** Creada `BankAccount` en [bank-account.entity.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/domain/entities/bank-account.entity.ts).
3.  **Repositorio:** Creado `BankAccountRepository` en [bank-account.repository.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/infrastructure/persistence/postgresql/repositories/bank-account.repository.ts) garantizando el aislamiento por tenant.
4.  **Controlador NestJS:** Implementado `BankAccountsController` en [bank-accounts.controller.ts](file:///Users/haroldv/Projects/erp-ari-hv/erp-ari-hv/backend/src/presentation/web/controllers/bank-accounts.controller.ts) con soporte para validaciones de DTOs (`CreateBankAccountDto`, `UpdateBankAccountDto`) y sanitización.

### Frontend
1.  **Dropdown Centralizado:** Implementado el selector de bancos oficiales de Venezuela (`VENEZUELAN_BANKS`) importado desde el módulo de constantes centralizado `@/constants/venezuela`.
2.  **Formulario y Validación:** Integrado el modal de creación y edición. Si se selecciona moneda VES, se despliegan automáticamente los campos de Pago Móvil y se valida en tiempo real que los primeros 4 dígitos del número de cuenta correspondan al banco elegido para evitar errores humanos.

## Verificación y Calidad
*   **NestJS Build:** Compilación exitosa libre de errores.
*   **Unit Tests:** Verificación exitosa en `test` suites (81 tests pasados).
*   **Next.js compilation:** Verificación exitosa sin errores de TypeScript.
