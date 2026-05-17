/** Utilitarios de 'masks': funcoes puras de apoio usadas em diferentes modulos. */
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
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

export const maskCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
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
    currency: 'BRL',
  }).format(value);
};

export const maskCoordinate = (value: string, _maxIntegerDigits = 3, maxDecimalDigits = 8) => {
  const trimmed = value.trim().replace(/\s+/g, '').replace(',', '.');
  const signal = trimmed.startsWith('-') ? '-' : '';
  const unsigned = trimmed.replace(/-/g, '');
  const [integerPart = '', ...decimalParts] = unsigned.split('.');
  const integerDigits = integerPart.replace(/\D/g, '').slice(0, _maxIntegerDigits);
  const decimalDigits = decimalParts.join('').replace(/\D/g, '').slice(0, maxDecimalDigits);
  const endsWithDecimalSeparator = /[.,]$/.test(trimmed);

  if (trimmed === '-') {
    return '-';
  }

  if ((trimmed === '.' || trimmed === '-.') && !integerDigits && !decimalDigits) {
    return `${signal}0.`;
  }

  if (!integerDigits && !decimalDigits) {
    return '';
  }

  if (!integerDigits && decimalDigits) {
    return `${signal}0.${decimalDigits}`;
  }

  if (decimalDigits) {
    return `${signal}${integerDigits}.${decimalDigits}`;
  }

  if (endsWithDecimalSeparator) {
    return `${signal}${integerDigits}.`;
  }

  return `${signal}${integerDigits}`;
};

export const maskLatitude = (value: string, maxDecimalDigits = 8) =>
  maskCoordinate(value, 2, maxDecimalDigits);

export const maskLongitude = (value: string, maxDecimalDigits = 8) =>
  maskCoordinate(value, 3, maxDecimalDigits);

export const parseCoordinate = (value: string): number | null => {
  const normalized = maskCoordinate(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
