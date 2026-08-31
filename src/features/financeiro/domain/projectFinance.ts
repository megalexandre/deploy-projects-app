export const calculateProjectReceipts = (projectAmount: number, receivedAmount: number) => ({
  paid: receivedAmount,
  remaining: Math.max(projectAmount - receivedAmount, 0),
});
