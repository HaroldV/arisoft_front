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

test.describe('Section & Permission Matrix E2E Test Suite', () => {
  test('User creation modal displays all permission sections including Libro Mayor and Sucursales', async ({ page }) => {
    await loginAsOwner(page);

    // 1. Navegar a /settings/users
    await page.goto('http://localhost:3005/settings/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 2. Abrir modal "Registrar Usuario"
    const newUserBtn = page.locator('button:has-text("Registrar Usuario")');
    await expect(newUserBtn).toBeVisible({ timeout: 10000 });
    await newUserBtn.click();
    await page.waitForTimeout(1000);

    // 3. Verificar presencia de títulos de módulos en la matriz de permisos
    const modal = page.locator('div.fixed.inset-0');
    await expect(modal.locator('text=1. Módulo Punto de Venta (POS)')).toBeVisible();
    await expect(modal.locator('text=2. Módulo Ventas & Documentos')).toBeVisible();
    await expect(modal.locator('text=3. Módulo Compras & Proveedores')).toBeVisible();
    await expect(modal.locator('text=4. Módulo Control de Inventario')).toBeVisible();
    await expect(modal.locator('text=5. Módulo Cuentas y Finanzas')).toBeVisible();
    await expect(modal.locator('text=8. Módulo Configuración de Empresa')).toBeVisible();

    // 4. Verificar items específicos solicitados por el usuario dentro del modal
    await expect(modal.getByText('Cuentas Bancarias', { exact: true })).toBeVisible();
    await expect(modal.getByText('Libro Mayor', { exact: true })).toBeVisible();
    await expect(modal.getByText('Cierres de Caja & Arqueos', { exact: true })).toBeVisible();
    await expect(modal.getByText('Sucursales & Tiendas', { exact: true })).toBeVisible();
    await expect(modal.getByText('Cuentas por Cobrar (CxC)', { exact: true })).toBeVisible();
    await expect(modal.getByText('Cuentas por Pagar (CxP)', { exact: true })).toBeVisible();
    await expect(modal.getByText('Existencias & Stock', { exact: true })).toBeVisible();
    await expect(modal.getByText('Almacenes y Sucursales', { exact: true })).toBeVisible();

    // 5. Verificar badges de "En Construcción" y deshabilitación en módulos del plan
    const securityItem = modal.locator('label:has-text("Seguridad del Sistema")');
    await expect(securityItem.locator('text=En Construcción')).toBeVisible();
    await expect(securityItem.locator('input[type="checkbox"]')).toBeDisabled();
    await expect(securityItem.locator('text=Próximamente')).toBeVisible();

    const historyItem = modal.locator('label:has-text("Historial Financiero")');
    await expect(historyItem.locator('text=En Construcción')).toBeVisible();
    await expect(historyItem.locator('input[type="checkbox"]')).toBeDisabled();

    // 6. Verificar badges de "En Construcción" en Reportes & BI
    const reportsItem = modal.locator('label:has-text("Métricas y Tableros BI")');
    await expect(reportsItem.locator('text=En Construcción')).toBeVisible();
    await expect(reportsItem.locator('input[type="checkbox"]')).toBeDisabled();
  });

  test('Accessing /accounts/history, /reports and /payroll renders InConstructionPlaceholder instead of 404', async ({ page }) => {
    await loginAsOwner(page);

    // 1. Navegar a /accounts/history
    await page.goto('http://localhost:3005/accounts/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const accountsHeading = page.locator('h1:has-text("Historial Financiero")');
    await expect(accountsHeading).toBeVisible();
    await expect(page.locator('text=Sección en Construcción')).toBeVisible();
    await expect(page.locator('text=Próximamente')).toBeVisible();

    // 2. Navegar a /reports
    await page.goto('http://localhost:3005/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const reportsHeading = page.locator('h1:has-text("Reportes & Analítica de Negocio")');
    await expect(reportsHeading).toBeVisible();
    await expect(page.locator('text=Sección en Construcción')).toBeVisible();

    // 3. Navegar a /payroll
    await page.goto('http://localhost:3005/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const payrollHeading = page.locator('h1:has-text("Procesamiento de Nómina")');
    await expect(payrollHeading).toBeVisible();
    await expect(page.locator('text=Sección en Construcción')).toBeVisible();
  });

  test('Owner can create restricted user and verify that excluded sections/permissions are hidden and blocked', async ({ page }) => {
    await loginAsOwner(page);

    const testUserEmail = `restricted.${Date.now()}.${Math.floor(Math.random() * 1000)}@alutech.com`;
    const testUserName = 'Usuario Restricciones Test';
    const testUserPassword = 'password123';

    // 1. Navegar a /settings/users
    await page.goto('http://localhost:3005/settings/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 2. Abrir modal para crear usuario ("Registrar Usuario")
    const newUserBtn = page.locator('button:has-text("Registrar Usuario")');
    await expect(newUserBtn).toBeVisible({ timeout: 10000 });
    await newUserBtn.click();
    await page.waitForTimeout(1000);

    // 3. Completar formulario de usuario
    await page.fill('input[placeholder="ej. Juan Pérez"]', testUserName);
    await page.fill('input[placeholder="ej. juan.perez@ari.com"]', testUserEmail);
    await page.fill('input[placeholder="Min. 8 caracteres"]', testUserPassword);

    // 4. Guardar usuario con rol por defecto CASHIER
    const submitBtn = page.locator('button:has-text("Guardar Usuario")');
    await submitBtn.click();
    await page.waitForTimeout(2500);

    // 5. Cerrar sesión y acceder como el usuario restringido
    await page.goto('http://localhost:3005/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    console.log(`Iniciando sesión con usuario restringido: ${testUserEmail}...`);
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', testUserPassword);
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => {
      return localStorage.getItem('ari_token') !== null;
    }, { timeout: 10000 });

    await page.waitForTimeout(2000);

    // 6. Verificar que en el Sidebar NO aparece "Cuentas por Cobrar"
    const cxcLink = page.locator('a[href="/accounts/receivables"]');
    const isCxcVisible = await cxcLink.isVisible().catch(() => false);
    console.log('¿El enlace a Cuentas por Cobrar es visible para el usuario restringido?:', isCxcVisible);
    expect(isCxcVisible).toBeFalsy();

    // 7. Verificar que en el Sidebar NO aparece "Sucursales & Tiendas"
    const branchesLink = page.locator('a[href="/settings/branches"]');
    const isBranchesVisible = await branchesLink.isVisible().catch(() => false);
    expect(isBranchesVisible).toBeFalsy();

    // 8. Verificar que si intenta acceder directamente por URL a /accounts/receivables, es redirigido
    await page.goto('http://localhost:3005/accounts/receivables');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log('URL tras intentar navegar directamente a /accounts/receivables:', currentUrl);
    expect(currentUrl).not.toContain('/accounts/receivables');
  });
});

