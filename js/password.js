const CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
};

const COMMON_PATTERNS = [
  "password",
  "senha",
  "qwerty",
  "admin",
  "letmein",
  "welcome",
  "1234",
  "abcd",
];

function secureIndex(max) {
  if (!Number.isSafeInteger(max) || max <= 0) {
    throw new RangeError("secureIndex requires a positive integer.");
  }

  const range = 0x100000000;
  const limit = range - (range % max);
  const value = new Uint32Array(1);

  do {
    crypto.getRandomValues(value);
  } while (value[0] >= limit);

  return value[0] % max;
}

function secureCharacter(characters) {
  return characters[secureIndex(characters.length)];
}

function secureShuffle(characters) {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = secureIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.join("");
}

export function generatePassword({ length, uppercase, lowercase, numbers, symbols }) {
  const selectedSets = [
    uppercase && CHARACTER_SETS.uppercase,
    lowercase && CHARACTER_SETS.lowercase,
    numbers && CHARACTER_SETS.numbers,
    symbols && CHARACTER_SETS.symbols,
  ].filter(Boolean);

  if (selectedSets.length === 0) {
    throw new Error("Selecione pelo menos um tipo de caractere.");
  }

  const safeLength = Math.min(32, Math.max(8, Number(length)));
  const pool = selectedSets.join("");
  const password = selectedSets.map(secureCharacter);

  while (password.length < safeLength) {
    password.push(secureCharacter(pool));
  }

  return secureShuffle(password);
}

export function maskPassword(password) {
  return "•".repeat(password.length);
}

export function analyzePassword(password) {
  if (!password) {
    return {
      score: 0,
      label: "Não analisada",
      feedback: "Gere uma senha para calcular a força dela.",
      tips: [],
      color: "#ff4d6d",
    };
  }

  const poolSize =
    (/[A-Z]/.test(password) ? CHARACTER_SETS.uppercase.length : 0) +
    (/[a-z]/.test(password) ? CHARACTER_SETS.lowercase.length : 0) +
    (/\d/.test(password) ? CHARACTER_SETS.numbers.length : 0) +
    (/[^A-Za-z0-9]/.test(password) ? CHARACTER_SETS.symbols.length : 0);

  const entropy = password.length * Math.log2(Math.max(poolSize, 1));
  let score = Math.round(Math.min(100, (entropy / 150) * 100));
  const normalized = password.toLowerCase();
  const ascendingSequence = /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwerty)/i;
  const repeatedBlock = /(.{2,4})\1+/;

  if (/(.)\1{2,}/.test(password)) score -= 8;
  if (/^[A-Za-z]+$/.test(password)) score -= 8;
  if (ascendingSequence.test(password)) score -= 14;
  if (repeatedBlock.test(password)) score -= 12;
  if (COMMON_PATTERNS.some((pattern) => normalized.includes(pattern))) score -= 22;
  if (new Set(password).size < Math.ceil(password.length * 0.55)) score -= 10;
  score = Math.max(0, score);
  const tips = [];
  if (password.length < 16) tips.push("Use pelo menos 16 caracteres quando puder.");
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    tips.push("Misture letras maiúsculas e minúsculas.");
  }
  if (!/\d/.test(password)) tips.push("Adicione números para aumentar a variedade.");
  if (!/[^A-Za-z0-9]/.test(password)) tips.push("Símbolos ajudam quando o site aceita.");
  if (COMMON_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    tips.push("Evite palavras comuns como senha, admin ou sequências fáceis.");
  }

  if (score < 35) {
    return {
      score,
      label: "Fraca",
      feedback: "Senha fraca. Use mais caracteres e misture letras, números e símbolos.",
      tips,
      color: "#ff4d6d",
    };
  }

  if (score < 60) {
    return {
      score,
      label: "Média",
      feedback: "Senha ok para usos simples, mas ainda dá para deixar mais forte.",
      tips,
      color: "#ffd166",
    };
  }

  if (score < 82) {
    return {
      score,
      label: "Forte",
      feedback: "Senha forte. Boa para a maioria dos usos do dia a dia.",
      tips,
      color: "#5eeaff",
    };
  }

  return {
    score,
    label: "Ultra",
    feedback: "Senha muito forte. Comprimento e variedade estão em ótimo nível.",
    tips,
    color: "#65ff9a",
  };
}
