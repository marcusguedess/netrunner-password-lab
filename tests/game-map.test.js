import test from "node:test";
import assert from "node:assert/strict";
import {
  ICEBREAKER_MAP,
  ICEBREAKER_MAPS,
  calculateScore,
  calculateTrace,
  isWalkable,
  positionsOverlap,
} from "../js/game.js";

function findCells(symbol) {
  const cells = [];

  ICEBREAKER_MAP.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === symbol) cells.push({ x, y });
    });
  });

  return cells;
}

function findCellsIn(map, symbol) {
  const cells = [];
  map.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === symbol) cells.push({ x, y });
    });
  });
  return cells;
}

function reachableFrom(start, map = ICEBREAKER_MAP) {
  const queue = [start];
  const visited = new Set([`${start.x},${start.y}`]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length) {
    const current = queue.shift();

    directions.forEach((direction) => {
      const next = {
        x: current.x + direction.x,
        y: current.y + direction.y,
      };
      const key = `${next.x},${next.y}`;
      const cell = map[next.y]?.[next.x];

      if (cell && cell !== "#" && !visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    });
  }

  return visited;
}

test("mapa contém quatro shards, um player e um terminal", () => {
  assert.equal(findCells("S").length, 4);
  assert.equal(findCells("P").length, 1);
  assert.equal(findCells("T").length, 1);
});

test("todos os shards e o terminal são alcançáveis", () => {
  const start = findCells("P")[0];
  const targets = [...findCells("S"), ...findCells("T")];
  const reachable = reachableFrom(start);

  targets.forEach((target) => {
    assert.ok(reachable.has(`${target.x},${target.y}`));
  });
});

test("todas as arquiteturas possuem objetivos e rotas válidas", () => {
  ICEBREAKER_MAPS.forEach(({ map, name }) => {
    assert.equal(map.length, 10, `${name}: altura inválida`);
    map.forEach((row) => assert.equal(row.length, 16, `${name}: largura inválida`));
    assert.equal(findCellsIn(map, "P").length, 1, `${name}: player`);
    assert.equal(findCellsIn(map, "T").length, 1, `${name}: terminal`);
    assert.equal(findCellsIn(map, "S").length, 4, `${name}: shards`);
    assert.equal(findCellsIn(map, "B").length, 2, `${name}: bugs`);

    const start = findCellsIn(map, "P")[0];
    const reachable = reachableFrom(start, map);
    [...findCellsIn(map, "S"), ...findCellsIn(map, "T")].forEach((target) => {
      assert.ok(reachable.has(`${target.x},${target.y}`), `${name}: alvo inalcançável`);
    });
  });
});

test("paredes e áreas caminháveis são distinguidas corretamente", () => {
  assert.equal(isWalkable(ICEBREAKER_MAP, 0, 0), false);
  assert.equal(isWalkable(ICEBREAKER_MAP, 1, 1), true);
  assert.equal(isWalkable(ICEBREAKER_MAP, -1, 99), false);
});

test("colisão exige coordenadas idênticas", () => {
  assert.equal(positionsOverlap({ x: 2, y: 3 }, { x: 2, y: 3 }), true);
  assert.equal(positionsOverlap({ x: 2, y: 3 }, { x: 3, y: 3 }), false);
});

test("pontuação premia fragmentos e penaliza o tempo", () => {
  assert.ok(calculateScore(10_000, 4) > calculateScore(40_000, 4));
  assert.ok(calculateScore(10_000, 4, 1.35) > calculateScore(10_000, 4, 1));
  assert.equal(calculateScore(999_999, 0), 0);
});

test("trace cresce com tempo, movimento e colisões com paredes", () => {
  assert.ok(calculateTrace(30_000, 20, 0, 1) > calculateTrace(5_000, 5, 0, 1));
  assert.ok(calculateTrace(5_000, 5, 2, 1) > calculateTrace(5_000, 5, 0, 1));
  assert.ok(calculateTrace(30_000, 20, 0, 1, false, 12) < calculateTrace(30_000, 20, 0, 1));
  assert.ok(calculateTrace(999_999, 999, 999, 1) <= 100);
});
