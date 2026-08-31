import { describe, expect, it } from 'vitest';
import { calculateProjectReceipts } from '../domain/projectFinance';

describe('calculateProjectReceipts', () => {
  it('exibe como pago o valor parcialmente recebido e mantem apenas o restante em aberto', () => {
    const result = calculateProjectReceipts(1_000, 400);

    expect(result.paid).toBe(400);
    expect(result.remaining).toBe(600);
  });

  it('exibe o total efetivamente recebido quando o projeto foi quitado', () => {
    const result = calculateProjectReceipts(1_000, 1_000);

    expect(result.paid).toBe(1_000);
    expect(result.remaining).toBe(0);
  });
});
