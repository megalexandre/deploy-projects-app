import { describe, expect, it } from 'vitest';
import { calculateProjectReceipts, resolveProjectPaymentStatus } from '../domain/projectFinance';

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

  it('mantem pagamentos parciais como projeto em aberto', () => {
    const result = calculateProjectReceipts(1_000, 400);

    expect(resolveProjectPaymentStatus(1_000, result.remaining)).toBe('aberto');
  });

  it('considera totalmente pago somente quando nao existe valor restante', () => {
    const result = calculateProjectReceipts(1_000, 1_000);

    expect(resolveProjectPaymentStatus(1_000, result.remaining)).toBe('pago');
  });

  it('nao considera um projeto sem valor como totalmente pago', () => {
    expect(resolveProjectPaymentStatus(0, 0)).toBe('aberto');
  });

  it('quita centavos sem deixar saldo residual invisível', () => {
    const result = calculateProjectReceipts(0.8, 0.1 + 0.7);
    expect(result.remaining).toBe(0);
    expect(resolveProjectPaymentStatus(0.8, result.remaining)).toBe('pago');
  });

  it('considera o valor final arredondado e reabre quando falta um centavo', () => {
    expect(
      resolveProjectPaymentStatus(100.004, calculateProjectReceipts(100.004, 100).remaining),
    ).toBe('pago');
    expect(resolveProjectPaymentStatus(100, calculateProjectReceipts(100, 99.99).remaining)).toBe(
      'aberto',
    );
  });
});
