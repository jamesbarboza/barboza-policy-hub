import { test, expect } from '@playwright/test';

const URL = 'https://polite-marzipan-4624d1.netlify.app/';
const userAdminConfig = {
    email: 'admin@barboza.com',
    password: 'test123'
}

const userForPolicies = 'a1816883-7a80-453f-8eb6-15b2dd91a083';

test('login and fetch user policies', async({ page }) => {
    await page.route('**', route => route.continue());
    await page.goto(URL);

    const email_input_count = await page.locator('input[type=email]').count();
    if (email_input_count > 0) {
        await page.locator('input[type=email]').first().fill(userAdminConfig.email);
    } else {
        const fixedCode = `await page.locator('button#popup-skip').first().click(); await page.waitForTimeout(1000);`
        const runFixedCode = new Function('page', `
            return (async () => {
              ${fixedCode}
            })();
          `);
        await runFixedCode(page);
        // await page.locator('button#popup-skip').first().click();await page.waitForTimeout(1000);

        console.log("pink floyd")
        await page.locator('input[type=email]').first().fill(userAdminConfig.email);
    }

    const passwordInput = await page.locator('input[type=password]').first();
    await passwordInput.fill(userAdminConfig.password);

    const loginButton = await page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(10000);

    const searchInput = await page.locator('input#search-email').first();
    const searchButton = await page.locator('button#search-user-button').first();

    await searchInput.fill(userForPolicies);
    await searchButton.click();

    await page.waitForTimeout(10000);

    const userPolicies = await page.locator('div#searched-user-details').first();
    console.log('userPolicies', userPolicies);

    await expect(userPolicies).toBeVisible();

    await page.screenshot({ path: 'screenshot.png' });
});