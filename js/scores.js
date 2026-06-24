const STORAGE_KEY = "netrunner:scores:v1";
const ALLOWED_DIFFICULTIES = new Set(["rookie", "runner", "legend"]);
const MAX_ENTRIES = 5;

function validEntry(entry) {
  return (
    entry &&
    Number.isFinite(entry.score) &&
    entry.score >= 0 &&
    Number.isFinite(entry.elapsed) &&
    entry.elapsed >= 0 &&
    ALLOWED_DIFFICULTIES.has(entry.difficulty) &&
    typeof entry.date === "string" &&
    entry.date.length <= 32
  );
}

export function readScores(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function saveScore(entry, storage = window.localStorage) {
  if (!validEntry(entry)) return [];
  const scores = [...readScores(storage), entry]
    .sort((first, second) => second.score - first.score)
    .slice(0, MAX_ENTRIES);

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    return [];
  }
  return scores;
}

export function clearScores(storage = window.localStorage) {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    return false;
  }
  return true;
}
