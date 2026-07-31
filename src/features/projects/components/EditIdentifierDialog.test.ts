import { describe, expect, it } from 'vitest';
import { normalizeSubsequence } from '../domain/identifier';

describe('normalizeSubsequence', () => {
  it('normaliza letras e espaços', () => {
    expect(normalizeSubsequence('  ab-1 ')).toBe('AB-1');
  });

  it('trata zero como ausência de subsequente', () => {
    expect(normalizeSubsequence('0')).toBe('');
  });
});
