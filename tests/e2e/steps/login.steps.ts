import { Given, When, Then } from '@cucumber/cucumber';
import type { CustomWorld } from '../support/world';

Given('que estou na pagina de login', async function (this: CustomWorld) {
  
  const page = this.page;
  if (!page) {
    throw new Error('Playwright page not initialized');
  }
  
  await page.goto(`${this.baseUrl}/login`);

});

When('eu preencho o email {string}', async function (this: CustomWorld, email: string) {
  const page = this.page;
  if (!page) {
    throw new Error('Playwright page not initialized');
  }
  await page.locator('input[name="email"]').fill(email);
});

When('eu preencho a senha {string}', async function (this: CustomWorld, password: string) {
  const page = this.page;
  if (!page) {
    throw new Error('Playwright page not initialized');
  }
  await page.locator('input[name="password"]').fill(password);
});

When('eu clico em {string}', async function (this: CustomWorld, label: string) {
  const page = this.page;
  if (!page) {
    throw new Error('Playwright page not initialized');
  }
  await page.getByRole('button', { name: label }).click();
});

Then('devo ver a pagina de Dashboard', async function (this: CustomWorld) {
  const page = this.page;
  if (!page) {
    throw new Error('Playwright page not initialized');
  }
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ state: 'visible' });
});
