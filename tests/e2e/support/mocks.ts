import type { Page } from 'playwright';

const ADMIN_USER = {
  id: 'mock-user-1',
  name: 'Admin Teste',
  email: 'admin@teste.com',
  profile: 'admin',
};

const MOCK_CONCESSIONAIRES = [
  {
    id: '1',
    name: 'CEMIG',
    acronym: 'CMG',
    code: 'MG01',
    region: 'Sudeste',
    phone: '',
    email: '',
    active: true,
    logo: null,
  },
  {
    id: '2',
    name: 'COPEL',
    acronym: 'CPL',
    code: 'PR01',
    region: 'Sul',
    phone: '',
    email: '',
    active: true,
    logo: null,
  },
  {
    id: '3',
    name: 'COELBA',
    acronym: 'CLB',
    code: 'BA01',
    region: 'Nordeste',
    phone: '',
    email: '',
    active: false,
    logo: null,
  },
  {
    id: '4',
    name: 'CEMIG Teste',
    acronym: 'CMG',
    code: 'MG01',
    region: 'Sudeste',
    phone: '',
    email: '',
    active: true,
    logo: null,
  },
];

export const setupAuthMocks = async (page: Page) => {
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ json: { token: 'mock-token', type: 'Bearer' } }),
  );

  await page.route('**/api/auth/me', (route) => route.fulfill({ json: ADMIN_USER }));

  await page.route('**/api/projects**', (route) => route.fulfill({ json: [] }));

  await page.route('**/api/approvals**', (route) => route.fulfill({ json: [] }));
};

export const setupConcessionnaireMocks = async (page: Page) => {
  type MockItem = (typeof MOCK_CONCESSIONAIRES)[0];
  const list: MockItem[] = [...MOCK_CONCESSIONAIRES];

  await page.route('**/api/concessionaires**', (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      return route.fulfill({ json: list });
    }

    if (method === 'POST') {
      const body = route.request().postDataJSON() as Partial<MockItem>;
      const newItem: MockItem = {
        id: String(list.length + 1),
        name: body.name ?? '',
        acronym: body.acronym ?? '',
        code: body.code ?? '',
        region: body.region ?? '',
        phone: body.phone ?? '',
        email: body.email ?? '',
        active: true,
        logo: null,
      };
      list.push(newItem);
      return route.fulfill({ json: newItem, status: 201 });
    }

    if (method === 'PUT') {
      const urlParts = route.request().url().split('/');
      const id = urlParts[urlParts.length - 1].split('?')[0];
      const body = route.request().postDataJSON() as Partial<MockItem>;
      const idx = list.findIndex((item) => item.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...body };
        return route.fulfill({ json: list[idx] });
      }
    }

    return route.continue();
  });
};

export { MOCK_CONCESSIONAIRES };
