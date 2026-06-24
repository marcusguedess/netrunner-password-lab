const STORAGE_KEY = "netrunner:progress:v1";

const DEFAULT_PROGRESS = Object.freeze({
  runs: 0,
  wins: 0,
  bestScore: 0,
  bestTime: null,
  shards: 0,
  streak: 0,
  lastWinDate: "",
  achievements: [],
});

function sanitize(value) {
  if (!value || typeof value !== "object") return { ...DEFAULT_PROGRESS };
  return {
    runs: Math.max(0, Number(value.runs) || 0),
    wins: Math.max(0, Number(value.wins) || 0),
    bestScore: Math.max(0, Number(value.bestScore) || 0),
    bestTime: Number.isFinite(value.bestTime) && value.bestTime >= 0 ? value.bestTime : null,
    shards: Math.max(0, Number(value.shards) || 0),
    streak: Math.max(0, Number(value.streak) || 0),
    lastWinDate: typeof value.lastWinDate === "string" ? value.lastWinDate.slice(0, 10) : "",
    achievements: Array.isArray(value.achievements)
      ? value.achievements.filter((item) => typeof item === "string").slice(0, 20)
      : [],
  };
}

export function readProgress(storage = window.localStorage) {
  try {
    return sanitize(JSON.parse(storage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function recordRun({ won, score = 0, elapsed = 0, shards = 0 }, storage = window.localStorage) {
  const progress = readProgress(storage);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  progress.runs += 1;
  progress.shards += Math.max(0, Number(shards) || 0);

  if (won) {
    progress.wins += 1;
    progress.bestScore = Math.max(progress.bestScore, Number(score) || 0);
    progress.bestTime =
      progress.bestTime === null ? elapsed : Math.min(progress.bestTime, Math.max(0, elapsed));
    if (progress.lastWinDate !== today) {
      progress.streak = progress.lastWinDate === yesterday ? progress.streak + 1 : 1;
      progress.lastWinDate = today;
    }
  }

  const unlocked = new Set(progress.achievements);
  if (progress.wins >= 1) unlocked.add("PRIMEIRO ROMPIMENTO");
  if (progress.wins >= 5) unlocked.add("OPERADOR PERSISTENTE");
  if (progress.bestScore >= 6000) unlocked.add("FANTASMA DA MALHA");
  if (progress.bestTime !== null && progress.bestTime <= 45000) unlocked.add("VELOCIDADE NEURAL");
  if (progress.shards >= 25) unlocked.add("ARQUIVISTA DE SHARDS");
  progress.achievements = [...unlocked];

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    return progress;
  }
  return progress;
}

export function dailyChallenge(date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  const seed = [...key].reduce((total, char) => total + char.charCodeAt(0), 0);
  const difficulty = ["rookie", "runner", "legend"][seed % 3];
  const strategicMode = seed % 2 === 0;
  const targetScore = { rookie: 4300, runner: 5200, legend: 6100 }[difficulty];
  return { key, difficulty, strategicMode, targetScore };
}
