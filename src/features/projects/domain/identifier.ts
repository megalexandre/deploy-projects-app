export const normalizeSubsequence = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return normalized === '0' ? '' : normalized;
};
