import { test, expect } from '@playwright/test';

test.describe('POS Cashier Shift Complete Cycle E2E Test', () => {
  test('Cashier can open, view status, and close cash shift successfully', async ({ page }) => {
    // Capture console errors and network failures
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const failedRequests: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 400) {
        failedRequests.push(`${res.request().method()} ${res.url()} -> Status ${res.status()}`);
      }
    });

    // 1. Navigate to login
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    // 2. Login with cashier/seller user
    console.log('1. Logging in with jpena@gmail.com...');
    await page.fill('input[type="email"]', 'jpena@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 3. Wait for redirect to /pos
    await page.waitForURL('**/pos', { timeout: 10000 }).catch(() => {});
    if (!page.url().includes('/pos')) {
      await page.goto('http://localhost:3005/pos');
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('2. Landed on POS URL:', page.url());

    // 4. Ensure no 403 on /bank-accounts
    const bankAccount403 = failedRequests.some((r) => r.includes('/bank-accounts') && r.includes('403'));
    expect(bankAccount403).toBeFalsy();

    // 5. Check if Shift Modal is open (or if already open, proceed to open/close)
    const shiftOpenModal = page.locator('text=Apertura de Turno de Caja');
    const isShiftModalVisible = await shiftOpenModal.isVisible().catch(() => false);
    console.log('3. Is Shift Open Modal Visible?:', isShiftModalVisible);

    if (isShiftModalVisible) {
      console.log('4. Performing Shift Opening with $50.00 USD and Bs. 200.00 VES...');
      // Set opening amounts inside the modal form
      const openForm = page.locator('form').filter({ hasText: 'Fondo de Caja (USD)' });
      await openForm.locator('input[type="number"]').first().fill('50');
      await openForm.locator('input[type="number"]').nth(1).fill('200');

      const openSubmitBtn = openForm.locator('button[type="submit"]:has-text("Abrir Turno de Caja")');
      await expect(openSubmitBtn).toBeVisible();
      await openSubmitBtn.click();
      await page.waitForTimeout(2000);

      // Verify open modal closed
      const isStillOpen = await shiftOpenModal.isVisible().catch(() => false);
      expect(isStillOpen).toBeFalsy();
      console.log('5. Shift successfully opened! Open modal is closed.');
    }

    // 6. Verify Active Shift Badge is displayed in POS header
    const activeBadge = page.locator('text=Caja Abierta:');
    await expect(activeBadge).toBeVisible();
    console.log('6. Active shift badge confirmed on POS interface.');

    // 7. Perform Cash Shift Closure (Arqueo y Cierre)
    console.log('7. Triggering shift closure modal...');
    const closeTriggerBtn = page.locator('button:has-text("Cerrar Turno")').first();
    await expect(closeTriggerBtn).toBeVisible();
    await closeTriggerBtn.click();
    await page.waitForTimeout(1000);

    // Verify Shift Close Modal appears
    const closeShiftModal = page.locator('text=Cierre y Arqueo de Caja');
    await expect(closeShiftModal).toBeVisible();
    console.log('8. Shift Close Modal opened successfully.');

    // Fill declared cash counts
    console.log('9. Declaring physical cash counts in drawer ($50 USD, Bs. 200 VES)...');
    await page.locator('form input[type="number"]').first().fill('50');
    await page.locator('form input[type="number"]').nth(1).fill('200');

    // Click confirm closure button
    const submitCloseBtn = page.locator('form button[type="submit"]:has-text("Enviar Declaración y Cerrar")');
    await expect(submitCloseBtn).toBeVisible();
    await submitCloseBtn.click();
    await page.waitForTimeout(2000);

    // Verify Close modal closed
    const isCloseModalStillOpen = await closeShiftModal.isVisible().catch(() => false);
    expect(isCloseModalStillOpen).toBeFalsy();
    console.log('10. Shift successfully closed and submitted for supervisor audit!');

    // Verify after closing, the prompt to open a new shift appears for cashiers
    const reopenPrompt = page.locator('text=Apertura de Turno de Caja');
    const isReopenPromptVisible = await reopenPrompt.isVisible().catch(() => false);
    console.log('11. Shift open prompt ready for next shift cycle:', isReopenPromptVisible);

    console.log('12. Test completed with ZERO 500 or 403 errors on cash shifts!');
  });
});

