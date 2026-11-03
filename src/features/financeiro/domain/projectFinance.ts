export const moneyToCents = (value: number) =>
  Number.isFinite(value)
    ? Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100)
    : 0;

export const calculateProjectReceipts = (projectAmount: number, receivedAmount: number) => {
  const paidCents = moneyToCents(receivedAmount);
  return {
    paid: paidCents / 100,
    remaining: Math.max(moneyToCents(projectAmount) - paidCents, 0) / 100,
  };
};

export type ProjectPaymentStatus = 'aberto' | 'pago';

export const resolveProjectPaymentStatus = (
  projectAmount: number,
  remainingAmount: number,
): ProjectPaymentStatus =>
  moneyToCents(projectAmount) > 0 && moneyToCents(remainingAmount) <= 0 ? 'pago' : 'aberto';
