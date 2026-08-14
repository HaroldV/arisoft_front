# Story 7.6: Transacciones de Caja: Ingresos, Retiros y Transferencias

## Descripción del Requerimiento
Permitir a los administradores registrar manualmente ingresos (depósitos), egresos (retiros) y transferencias bancarias entre cuentas propias del comercio bajo un entorno de consistencia contable y atómica.

## Cambios Realizados

### Backend (Transaccionalidad Atómica)
1.  **Ajuste manual (`POST /bank-accounts/:id/adjust`):** Ejecuta una transacción TypeORM que actualiza el saldo de la cuenta e inyecta un registro contable en `bank_movements` con el tipo (`DEPOSIT` o `WITHDRAWAL`), monto, referencia y descripción.
2.  **Transferencias propias (`POST /bank-accounts/transfer`):** Ejecuta una transacción atómica que descuenta el monto de la cuenta de origen, lo suma a la cuenta de destino, y registra los correspondientes movimientos de egreso (`WITHDRAWAL`) e ingreso (`DEPOSIT`) con referencias cruzadas. Valida que las cuentas pertenezcan al mismo tenant y tengan saldos suficientes en la misma moneda.

### Frontend
1.  **Modal de Ajuste:** Formulario dinámico para seleccionar la cuenta, tipo de ajuste (Depósito/Retiro), monto, referencia y concepto.
2.  **Modal de Transferencia:** Formulario para elegir la cuenta de origen, destino y monto a transferir con controles y validaciones para evitar transferencias a la misma cuenta o con montos superiores al saldo disponible.

## Verificación y Calidad
*   **NestJS Build:** Compilación exitosa libre de errores.
*   **Unit Tests:** Verificación exitosa en `test` suites (81 tests pasados).
*   **Next.js compilation:** Verificación exitosa sin errores de TypeScript.
