/** Gera senhas seguras para reset de credenciais de usuário. */

// Conjuntos sem caracteres ambíguos (O/0, I/l/1) para facilitar a leitura ao repassar a senha.
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';
const ALL = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;

const randomIndex = (max: number): number => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
};

const pick = (charset: string): string => charset[randomIndex(charset.length)];

/**
 * Gera uma senha aleatória garantindo ao menos um caractere de cada conjunto
 * (maiúscula, minúscula, dígito e símbolo). Usa `crypto.getRandomValues`.
 */
export const generatePassword = (length = 16): string => {
  const required = [UPPERCASE, LOWERCASE, DIGITS, SYMBOLS];
  const chars = required.map(pick);

  while (chars.length < length) {
    chars.push(pick(ALL));
  }

  // Embaralha (Fisher-Yates) para não fixar a posição dos caracteres obrigatórios.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};
