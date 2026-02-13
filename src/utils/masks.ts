export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const maskNumeric = (value: string, maxDigits?: number) => {
  const digits = onlyDigits(value);
  return maxDigits ? digits.slice(0, maxDigits) : digits;
};

export const maskCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

export const maskCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const maskCpfOrCnpj = (value: string) => {
  const digits = onlyDigits(value);
  return digits.length <= 11 ? maskCpf(digits) : maskCnpj(digits);
};

export const maskPhoneBR = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

export const maskCurrencyBRL = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) return '';

  const numericValue = Number(digits) / 100;
  return formatCurrencyBRL(numericValue);
};

export const formatCurrencyBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
