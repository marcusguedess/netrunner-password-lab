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
    throw new Error("Selecione pelo menos um protocolo de caracteres.");
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
      feedback: "Gere uma carga para iniciar a varredura de entropia.",
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

  if (score < 35) {
    return {
      score,
      label: "Fraca",
      feedback: "Baixa resistência. Aumente o comprimento e combine mais protocolos.",
      color: "#ff4d6d",
    };
  }

  if (score < 60) {
    return {
      score,
      label: "Média",
      feedback: "Adequada para nós de baixo risco, mas recomenda-se mais entropia.",
      color: "#ffd166",
    };
  }

  if (score < 82) {
    return {
      score,
      label: "Forte",
      feedback: "Assinatura de alta entropia. Adequada para a maioria dos canais seguros.",
      color: "#5eeaff",
    };
  }

  return {
    score,
    label: "Ultra",
    feedback: "Carga de nível máximo. A malha de entropia apresenta alta resistência.",
    color: "#65ff9a",
  };
}
