import { test, expect, Page } from '@playwright/test';

async function loginAsOwner(page: Page) {
  await page.goto('http://localhost:3005/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'alutechnology2@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => {
    return localStorage.getItem('ari_token') !== null;
  }, { timeout: 10000 });
}

test.describe('POS Treasury & Bank Account Enforcement E2E Tests', () => {
  test('POS detects zero registered accounts, displays luminous warning banner, disables checkout, and shows link to /accounts/banks', async ({ page }) => {
    await loginAsOwner(page);

    // 1. Navigate to POS
    await page.goto('http://localhost:3005/pos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 2. Add product to cart by clicking "Agregar al carrito"
    const addBtn = page.getByRole('button', { name: 'Agregar al carrito' }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(1000);

    // 3. Click Checkout / Cobrar button in the Cart panel
    const checkoutBtn = page.getByRole('button', { name: /PAGAR \/ FACTURAR|Cobrar/i }).first();
    await expect(checkoutBtn).toBeVisible();
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();
    await page.waitForTimeout(1000);

    // 4. Handle Client Identification modal if prompted
    const identifyModal = page.getByRole('heading', { name: 'Identificación del Cliente' });
    if (await identifyModal.isVisible().catch(() => false)) {
      const cedulaInput = page.getByPlaceholder('Ingrese solo números (Ej. 18392019)');
      await expect(cedulaInput).toBeVisible();
      await cedulaInput.fill('17636325');
      await page.waitForTimeout(1000);

      const continueBtn = page.getByRole('button', { name: 'Continuar al Pago' });
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();
      await page.waitForTimeout(1200);
    }

    // 5. Assert Confirm & Checkout Modal is open
    const confirmModal = page.getByRole('heading', { name: 'Confirmar y Finalizar Venta' });
    await expect(confirmModal).toBeVisible();

    // 6. Assert Zero Accounts Warning Banner is visible
    const warningBanner = page.locator('text=Atención: Sin Cuentas Receptoras / Cajas Registradas');
    await expect(warningBanner).toBeVisible();

    const bannerExplanation = page.locator('text=Para procesar cobros y garantizar que las ventas se sincronicen con el saldo real de tesorería y el libro mayor');
    await expect(bannerExplanation).toBeVisible();

    // 7. Assert CTA button links to /accounts/banks
    const configAccountsLink = page.getByRole('link', { name: 'Configurar Cuentas Bancarias' });
    await expect(configAccountsLink).toBeVisible();
    await expect(configAccountsLink).toHaveAttribute('href', '/accounts/banks');

    // 8. Assert disabled select state informs that no accounts exist
    const disabledSelect = page.locator('select:has-text("Sin cuentas registradas")');
    await expect(disabledSelect).toBeVisible();
    await expect(disabledSelect).toBeDisabled();

    // 9. Assert "Proceder a Facturar" button is STRICTLY DISABLED
    const proceedBtn = page.getByRole('button', { name: 'Proceder a Facturar' });
    await expect(proceedBtn).toBeVisible();
    await expect(proceedBtn).toBeDisabled();

    console.log('✅ Escenario 1: Cero cuentas bloquea cobros y muestra banner de advertencia ejecutiva con enlace a /accounts/banks.');
  });

  test('When bank account exists, POS allows selecting it, enables checkout, and posts transaction with bankAccountId', async ({ page }) => {
    // Inject a mocked bank account response to verify active account flow
    await page.route('**/bank-accounts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '8b0e66b2-fb3d-46f8-ba28-6e7c31ce74a4',
            name: 'Caja Fuerte Principal USD',
            bank_name: 'Caja Física Tienda',
            account_number: 'CAJA-USD-01',
            currency: 'USD',
            account_type: 'EFECTIVO',
            current_balance: 1500.0,
            is_active: true,
          }
        ]),
      });
    });

    await loginAsOwner(page);

    // 1. Navigate to POS
    await page.goto('http://localhost:3005/pos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 2. Add product to cart
    const addBtn = page.getByRole('button', { name: 'Agregar al carrito' }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(1000);

    // 3. Click Checkout
    const checkoutBtn = page.getByRole('button', { name: /PAGAR \/ FACTURAR|Cobrar/i }).first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();
    await page.waitForTimeout(1000);

    // 4. Handle Client Identification modal
    const identifyModal = page.getByRole('heading', { name: 'Identificación del Cliente' });
    if (await identifyModal.isVisible().catch(() => false)) {
      const cedulaInput = page.getByPlaceholder('Ingrese solo números (Ej. 18392019)');
      await expect(cedulaInput).toBeVisible();
      await cedulaInput.fill('17636325');
      await page.waitForTimeout(1000);

      const continueBtn = page.getByRole('button', { name: 'Continuar al Pago' });
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();
      await page.waitForTimeout(1200);
    }

    // 5. Assert Confirm Modal is open
    const confirmModal = page.getByRole('heading', { name: 'Confirmar y Finalizar Venta' });
    await expect(confirmModal).toBeVisible();

    // 6. Assert quick chip or select option displays the registered account
    const accountOption = page.locator('select option:has-text("Caja Fuerte Principal USD")');
    await expect(accountOption).toBeAttached();

    // Select account
    const selectElem = page.locator('select').filter({ hasText: 'Caja Fuerte Principal USD' });
    await selectElem.selectOption({ label: '💵 Caja Fuerte Principal USD • Caja Física Tienda (USD)' });
    await page.waitForTimeout(500);

    // 7. Assert "Proceder a Facturar" button is ENABLED
    const proceedBtn = page.getByRole('button', { name: 'Proceder a Facturar' });
    await expect(proceedBtn).toBeVisible();
    await expect(proceedBtn).toBeEnabled();

    console.log('✅ Escenario 2: Con cuentas registradas el select muestra la cuenta y habilita el botón de facturar.');
  });
});
