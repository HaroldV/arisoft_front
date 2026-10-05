import { test, expect } from '@playwright/test';

test.describe('User Creation & SaaS Plan Status E2E Test', () => {
  test('Creating a new user inherits active tenant plan and allows login with active status', async ({ page }) => {
    const randomSuffix = Date.now().toString().slice(-4);
    const testUserEmail = `operador${randomSuffix}@alutech.com`;
    const testUserName = `Operador Test ${randomSuffix}`;

    // 1. Iniciar sesión como Owner
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'alutechnology2@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('http://localhost:3005/', { timeout: 10000 }).catch(() => {});
    
    // 2. Navegar a /settings/users
    await page.goto('http://localhost:3005/settings/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 3. Abrir modal para crear usuario
    const newUserBtn = page.locator('button:has-text("Nuevo Usuario")');
    await expect(newUserBtn).toBeVisible();
    await newUserBtn.click();

    // 4. Completar formulario de usuario
    await page.fill('input[placeholder*="Nombre"], input[placeholder*="nombre"]', testUserName);
    await page.fill('input[placeholder*="correo"], input[type="email"]', testUserEmail);
    await page.fill('input[placeholder*="contraseña"], input[placeholder*="Contraseña"], input[type="password"]', 'password123');

    // 5. Guardar usuario
    const submitBtn = page.locator('button:has-text("Crear Usuario"), button:has-text("Guardar")');
    await submitBtn.last().click();
    await page.waitForTimeout(2500);

    // 6. Cerrar sesión del Owner
    await page.goto('http://localhost:3005/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 7. Iniciar sesión con el nuevo usuario
    console.log(`Logging in with newly created user: ${testUserEmail}...`);
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 8. Verificar que el usuario no tiene la pantalla bloqueada por plan inactivo
    const blockedModal = page.locator('text=Suscripción Bloqueada, text=Plan Suspendido');
    const isBlocked = await blockedModal.isVisible().catch(() => false);
    expect(isBlocked).toBeFalsy();

    // 9. Verificar que el usuario está en el sistema y puede navegar
    const userData = await page.evaluate(() => {
      const u = localStorage.getItem('ari_user');
      return u ? JSON.parse(u) : null;
    });

    console.log('Logged in user session in frontend:', userData);
    expect(userData).not.toBeNull();
    expect(userData.is_active).toBe(true);
    expect(userData.plan_is_active).toBe(true);
  });
});
