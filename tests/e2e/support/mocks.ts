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
  await page.addInitScript(() => {
    (globalThis as unknown as { __APP_ENV__: Record<string, string> }).__APP_ENV__ = {
      VITE_API_BASE_URL: '/api',
      VITE_AUTH_TOKEN_STORAGE_KEY: 'auth_token',
    };
  });
  for (const resource of ['customers', 'services', 'price_tables', 'concessionaires']) {
    await page.route(`**/api/${resource}/paginate*`, (route) =>
      route.fulfill({
        json: { content: [], totalPages: 1, totalElements: 0, number: 0, size: 100, last: true },
      }),
    );
  }
  await page.route('**/api/auth/users', (route) => route.fulfill({ json: [ADMIN_USER] }));

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
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/paginate')) {
        const limit = Number(url.searchParams.get('limit') || 20);
        const page = Number(url.searchParams.get('page') || 1);
        return route.fulfill({
          json: {
            content: list.slice((page - 1) * limit, page * limit),
            totalElements: list.length,
            totalPages: Math.max(1, Math.ceil(list.length / limit)),
            size: limit,
            number: page - 1,
            last: page * limit >= list.length,
          },
        });
      }
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
