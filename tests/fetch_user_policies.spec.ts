import { test, expect } from '@playwright/test';

const URL = 'https://polite-marzipan-4624d1.netlify.app/';
const userAdminConfig = {
    email: 'admin@barboza.com',
    password: 'test123'
}

const userForPolicies = 'a1816883-7a80-453f-8eb6-15b2dd91a083';

test('login and fetch user policies', async({ page }) => {
    await page.goto(URL);

    const emailInput = await page.locator('input[type=email]').first();
    const passwordInput = await page.locator('input[type=password]').first();
    const loginButton = await page.locator('button[type="submit"]').first();

    console.log('emailInput', emailInput);
    console.log('passwordInput', passwordInput);
    console.log('loginButton', loginButton);

    await emailInput.fill(userAdminConfig.email);
    await passwordInput.fill(userAdminConfig.password);
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