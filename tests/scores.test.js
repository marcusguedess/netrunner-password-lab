import test from "node:test";
import assert from "node:assert/strict";
import { clearScores, readScores, saveScore } from "../js/scores.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("salva somente metadados válidos de pontuação", () => {
  const storage = memoryStorage();
  const scores = saveScore(
    {
      score: 7500,
      elapsed: 42_000,
      difficulty: "runner",
      date: "23/06/2026",
    },
    storage,
  );

  assert.equal(scores.length, 1);
  assert.deepEqual(Object.keys(scores[0]).sort(), [
    "date",
    "difficulty",
    "elapsed",
    "score",
  ]);
});

test("descarta conteúdo adulterado e limita o ranking", () => {
  const storage = memoryStorage();
  storage.setItem(
    "netrunner:scores:v1",
    JSON.stringify([{ score: "injetado", password: "não deve existir" }]),
  );
  assert.deepEqual(readScores(storage), []);

  for (let index = 0; index < 8; index += 1) {
    saveScore(
      {
        score: 5000 + index,
        elapsed: 10_000 + index,
        difficulty: "rookie",
        date: "23/06/2026",
      },
      storage,
    );
  }
  const scores = readScores(storage);
  assert.equal(scores.length, 5);
  assert.equal(scores[0].score, 5007);
});

test("limpa o registro local", () => {
  const storage = memoryStorage();
  saveScore(
    { score: 100, elapsed: 1000, difficulty: "legend", date: "23/06/2026" },
    storage,
  );
  assert.equal(clearScores(storage), true);
  assert.deepEqual(readScores(storage), []);
});
