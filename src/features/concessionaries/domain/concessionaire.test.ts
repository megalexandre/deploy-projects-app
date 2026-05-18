import { describe, expect, it } from 'vitest';
import { Concessionaire, type ConcessionaireData } from './concessionaire';

const makeData = (overrides: Partial<ConcessionaireData> = {}): ConcessionaireData => ({
  id: '1',
  name: 'Enel',
  acronym: 'EN',
  code: 'C01',
  region: 'Sul',
  phone: '11999990000',
  email: 'contato@enel.com',
  active: true,
  logo: null,
  ...overrides,
});

describe('Concessionaire', () => {
  it('mapeia todos os campos corretamente', () => {
    const data = makeData({ logo: 'data:image/png;base64,abc' });
    const item = new Concessionaire(data);

    expect(item.id).toBe('1');
    expect(item.name).toBe('Enel');
    expect(item.acronym).toBe('EN');
    expect(item.code).toBe('C01');
    expect(item.region).toBe('Sul');
    expect(item.phone).toBe('11999990000');
    expect(item.email).toBe('contato@enel.com');
    expect(item.active).toBe(true);
    expect(item.logo).toBe('data:image/png;base64,abc');
  });

  it('trimeia espaços do name', () => {
    const item = new Concessionaire(makeData({ name: '  Enel  ' }));
    expect(item.name).toBe('Enel');
  });

  it('aceita logo null', () => {
    const item = new Concessionaire(makeData({ logo: null }));
    expect(item.logo).toBeNull();
  });

  it('mapeia active false corretamente', () => {
    const item = new Concessionaire(makeData({ active: false }));
    expect(item.active).toBe(false);
  });
});
