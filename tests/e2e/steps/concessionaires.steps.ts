import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';
import { setupAuthMocks, setupConcessionnaireMocks, MOCK_CONCESSIONAIRES } from '../support/mocks';

const getPage = (world: CustomWorld) => {
  if (!world.page) throw new Error('Playwright page not initialized');
  return world.page;
};

Given('que estou autenticado como administrador', async function (this: CustomWorld) {
  const page = getPage(this);

  await setupAuthMocks(page);
  await setupConcessionnaireMocks(page);

  await page.goto(`${this.baseUrl}/login`);
  await page.locator('input[name="email"]').fill('admin@teste.com');
  await page.locator('input[name="password"]').fill('qualquer-senha');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(`${this.baseUrl}/dashboard`);
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ state: 'visible' });
});

Given('que estou na pagina de concessionarias', async function (this: CustomWorld) {
  const page = getPage(this);
  await page.goto(`${this.baseUrl}/concessionarias`);
  await page
    .getByRole('heading', { name: 'Concessionárias', exact: true, level: 1 })
    .waitFor({ state: 'visible' });
});

Then('devo ver o titulo {string}', async function (this: CustomWorld, titulo: string) {
  const page = getPage(this);
  await expect(page.getByRole('heading', { name: titulo, exact: true, level: 1 })).toBeVisible();
});

Then('devo ver a tabela de concessionarias', async function (this: CustomWorld) {
  const page = getPage(this);
  await expect(page.getByRole('columnheader', { name: 'Nome' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Sigla' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  for (const item of MOCK_CONCESSIONAIRES) {
    await expect(page.getByRole('cell', { name: item.name, exact: true })).toBeVisible();
  }
});

When(
  'eu preencho o campo {string} com {string}',
  async function (this: CustomWorld, label: string, value: string) {
    const page = getPage(this);
    await page.getByLabel(label).fill(value);
  },
);

When('eu busco por {string}', async function (this: CustomWorld, termo: string) {
  const page = getPage(this);
  await page.getByPlaceholder('Buscar por nome, sigla ou código...').fill(termo);
});

Then(
  'devo ver {string} na tabela de concessionarias',
  async function (this: CustomWorld, nome: string) {
    const page = getPage(this);
    await expect(page.getByRole('cell', { name: nome, exact: true }).first()).toBeVisible();
  },
);

Then(
  'devo ver apenas concessionarias que contem {string}',
  async function (this: CustomWorld, termo: string) {
    const page = getPage(this);
    const rows = page.getByRole('row', { name: new RegExp(termo, 'i') });
    await expect(rows.first()).toBeVisible();
  },
);

Given(
  'que existe uma concessionaria chamada {string} na tabela',
  async function (this: CustomWorld, nome: string) {
    const page = getPage(this);
    await expect(page.getByRole('cell', { name: nome })).toBeVisible();
  },
);

When(
  'eu clico em editar a concessionaria {string}',
  async function (this: CustomWorld, nome: string) {
    const page = getPage(this);
    const row = page.getByRole('row', { name: new RegExp(nome) });
    await row.getByRole('button', { name: 'Editar' }).click();
  },
);

Then(
  'devo ver o formulario com titulo {string}',
  async function (this: CustomWorld, titulo: string) {
    const page = getPage(this);
    await expect(page.getByText(titulo)).toBeVisible();
  },
);

Then(
  'o campo {string} deve conter {string}',
  async function (this: CustomWorld, label: string, valor: string) {
    const page = getPage(this);
    await expect(page.getByLabel(label)).toHaveValue(valor);
  },
);
