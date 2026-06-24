import test from "node:test";
import assert from "node:assert/strict";
import { dailyChallenge, readProgress, recordRun } from "../js/progress.js";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("progresso guarda somente métricas de carreira", () => {
  const memory = storage();
  const result = recordRun(
    { won: true, score: 6200, elapsed: 42000, shards: 4 },
    memory,
  );
  assert.equal(result.wins, 1);
  assert.equal(result.bestScore, 6200);
  assert.equal(result.bestTime, 42000);
  assert.ok(result.achievements.includes("PRIMEIRO ROMPIMENTO"));
  assert.deepEqual(readProgress(memory), result);
});

test("desafio diário é determinístico para a mesma data", () => {
  const date = new Date("2026-06-24T12:00:00Z");
  assert.deepEqual(dailyChallenge(date), dailyChallenge(date));
});
