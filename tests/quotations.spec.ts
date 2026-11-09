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

test.describe('Quotations POS-Style Flow and Modal Validation', () => {
  test('User can stage products, open modal, register/select client and button states are active', async ({ page }) => {
    // 1. Login
    await loginAsOwner(page);

    // 2. Navigate to Quotations module
    await page.goto('http://localhost:3005/sales/quotations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 3. Verify Quotations Terminal elements
    await expect(page.locator('text=Terminal de Cotización')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Generar Cotización')).toBeVisible();

    // 4. Click a product to add to cart
    const addProductBtn = page.locator('button[title="Añadir a la cotización"]').first();
    if (await addProductBtn.isVisible()) {
      await addProductBtn.click();
    } else {
      // Fallback click on product card
      await page.locator('.cursor-pointer').filter({ hasText: '$' }).first().click();
    }

    // 5. Verify button "Generar Cotización" in cart sidebar is clickable and opens modal
    const generateBtn = page.locator('button:has-text("Generar Cotización")');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 6. Verify Modal "Generar Nueva Cotización" is open
    await expect(page.locator('h3:has-text("Generar Nueva Cotización")')).toBeVisible();

    // 7. Check save button: "Guardar Cotización" is immediately ENABLED and active
    const saveBtn = page.locator('button:has-text("Guardar Cotización")');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeEnabled();

    // 8. Test Client autocomplete and input routing
    const clientSearch = page.locator('input[placeholder*="cédula, RIF o razón social"]');
    await clientSearch.fill('V-29999888');

    // Verify auto-fill of RIF
    const docInput = page.locator('input[placeholder="12345678-0"]');
    await expect(docInput).toHaveValue('29999888');

    // Fill Client Name
    const nameInput = page.locator('input[placeholder*="Inversiones El Sol"]');
    await nameInput.fill('Empresa Prueba Playwright C.A.');

    // Save button must remain enabled
    await expect(saveBtn).toBeEnabled();
  });
});
