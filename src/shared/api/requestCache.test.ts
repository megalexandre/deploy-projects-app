import { describe, expect, it, vi } from 'vitest';
import { createKeyedRequestCache, createRequestCache } from './requestCache';

describe('requestCache', () => {
  it('reaproveita uma requisição enquanto ela ainda está em andamento', async () => {
    const cache = createRequestCache<string>();
    const loader = vi.fn(async () => 'resultado');

    const [first, second] = await Promise.all([cache.get(loader), cache.get(loader)]);

    expect(first).toBe('resultado');
    expect(second).toBe('resultado');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('deduplica por chave e permite invalidar somente um registro', async () => {
    const cache = createKeyedRequestCache<string>();
    const loader = vi.fn(async () => 'endereço');

    await Promise.all([cache.get('address-1', loader), cache.get('address-1', loader)]);
    cache.invalidate('address-1');
    await cache.get('address-1', loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });
});
