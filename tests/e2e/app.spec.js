import { test, expect } from "@playwright/test";
import { ICEBREAKER_MAPS } from "../../js/game.js";

const DIRECTIONS = [
  { dx: 1, dy: 0, code: "ArrowRight" },
  { dx: -1, dy: 0, code: "ArrowLeft" },
  { dx: 0, dy: 1, code: "ArrowDown" },
  { dx: 0, dy: -1, code: "ArrowUp" },
];

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      throw new Error(`Console do navegador: ${message.text()}`);
    }
  });
});

function find(map, symbol) {
  const cells = [];
  map.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === symbol) cells.push({ x, y });
    });
  });
  return cells;
}

function shortestPath(map, start, target) {
  const queue = [{ ...start, path: [] }];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length) {
    const current = queue.shift();
    if (current.x === target.x && current.y === target.y) return current.path;

    for (const direction of DIRECTIONS) {
      const next = { x: current.x + direction.dx, y: current.y + direction.dy };
      const key = `${next.x},${next.y}`;
      const cell = map[next.y]?.[next.x];
      if (cell && cell !== "#" && !visited.has(key)) {
        visited.add(key);
        queue.push({ ...next, path: [...current.path, direction.code] });
      }
    }
  }

  throw new Error("Rota E2E não encontrada.");
}

function completeRoute(map) {
  let current = find(map, "P")[0];
  const remaining = find(map, "S");
  const route = [];

  while (remaining.length) {
    const options = remaining.map((target, index) => ({
      index,
      target,
      path: shortestPath(map, current, target),
    }));
    options.sort((first, second) => first.path.length - second.path.length);
    const selected = options[0];
    route.push(...selected.path);
    current = selected.target;
    remaining.splice(selected.index, 1);
  }

  route.push(...shortestPath(map, current, find(map, "T")[0]));
  return route;
}

async function enterDeck(page) {
  await page.goto("/");
  await page.getByRole("button", { name: /CONECTAR/ }).click();
  await expect(page.locator("#boot-screen")).toBeHidden({ timeout: 5000 });
}

async function generate(page) {
  await page.getByRole("button", { name: /Gerar Senha Segura/ }).click();
  await expect(page.locator("#vault-status")).toHaveText("SENHA BLOQUEADA PELO ICE");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await expect(page.locator("#hide-password-button")).toBeHidden();
}

test("fluxo completo revela a senha somente após vencer o ICEbreaker", async ({ page }) => {
  await enterDeck(page);
  await page.locator("#difficulty").selectOption("rookie");
  await generate(page);
  await page.getByRole("button", { name: "Iniciar ICEbreaker" }).click();
  await expect(page.locator("#game-state-badge")).toHaveText("EM EXECUÇÃO", {
    timeout: 6000,
  });

  const route = completeRoute(ICEBREAKER_MAPS[0].map);
  await page.evaluate((codes) => {
    codes.forEach((code) => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
    });
  }, route);

  await expect(page.locator("#vault-status")).toHaveText("SENHA LIBERADA");
  await expect(page.locator("#copy-button")).toBeEnabled();
  await expect(page.locator("#hide-password-button")).toBeVisible();
  await expect(page.locator("#mission-step-reveal")).toHaveClass(/active/);
  await expect(page.locator("#score-list li")).toHaveCount(1);
  const stored = await page.evaluate(() => localStorage.getItem("netrunner:scores:v1"));
  expect(stored).not.toContain("password");
  expect(stored).not.toContain("senha");
  await page.locator("#copy-button").click();
  await expect(page.locator("#copy-label")).toContainText("Copiada");
});

test("pausa e modo conforto mantêm estados coerentes", async ({ page }) => {
  await enterDeck(page);
  await generate(page);
  await page.getByRole("button", { name: "Iniciar ICEbreaker" }).click();
  await expect(page.locator("#game-state-badge")).toHaveText("EM EXECUÇÃO", {
    timeout: 6000,
  });
  await page.getByRole("button", { name: "Pausar" }).click();
  await expect(page.locator("#game-state-badge")).toHaveText("PAUSADO");
  await page.getByRole("button", { name: "Retomar" }).click();
  await expect(page.locator("#game-state-badge")).toHaveText("EM EXECUÇÃO");
  await page.locator("#comfort-toggle").click();
  await expect(page.locator("body")).toHaveClass(/comfort-mode/);
});

test("interface móvel oferece controles por toque", async ({ page }, testInfo) => {
  test.skip(
    !testInfo.project.name.startsWith("mobile"),
    "Validação específica dos projetos móveis.",
  );
  await enterDeck(page);
  await generate(page);
  await expect(page.locator(".touch-controls")).toBeVisible();
  await expect(page.locator("[data-direction='up']")).toHaveCSS("touch-action", "manipulation");
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    touchSizes: [...document.querySelectorAll(".touch-controls button")].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
  layout.touchSizes.forEach(({ width, height }) => {
    expect(width).toBeGreaterThanOrEqual(42);
    expect(height).toBeGreaterThanOrEqual(42);
  });
});

test("glossário explica os termos preservados em inglês", async ({ page }) => {
  await enterDeck(page);
  await expect(page.getByRole("heading", { name: "Glossário do Ciberespaço" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ICE", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cyberdeck", exact: true })).toBeVisible();
  await expect(page.getByText("Intrusion Countermeasures Electronics")).toBeVisible();
});

test("controles podem ser remapeados sem duplicar teclas", async ({ page }) => {
  await enterDeck(page);
  const up = page.locator("[data-bind='up']");
  await up.click();
  await page.keyboard.press("I");
  await expect(up.locator("kbd")).toHaveText("I");

  const left = page.locator("[data-bind='left']");
  await left.click();
  await page.keyboard.press("I");
  await expect(page.locator("#game-message")).toContainText("já está em uso");
});

test("modo estratégico elimina movimento autônomo dos bugs", async ({ page }) => {
  await enterDeck(page);
  await generate(page);
  await page.locator("#strategic-mode").check();
  await page.getByRole("button", { name: "Iniciar ICEbreaker" }).click();
  await expect(page.locator("#game-state-badge")).toHaveText("EM EXECUÇÃO", {
    timeout: 6000,
  });
  const before = await page.locator("#game-status-detail").textContent();
  await page.waitForTimeout(1200);
  const afterWait = await page.locator("#game-status-detail").textContent();
  expect(afterWait).toBe(before);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#game-status-detail")).not.toHaveText(before);
});

test("primeiro acesso oferece entrada sem áudio, tutorial e modo leve", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /ENTRAR SEM ÁUDIO/ }).click();
  await expect(page.locator("#boot-screen")).toBeHidden({ timeout: 5000 });
  await expect(page.locator("#sound-label")).toHaveText("ÁUDIO SILENCIADO");
  await expect(page.locator("#quiet-mode-button")).toHaveAttribute("aria-pressed", "true");

  await page.locator("#sound-toggle").click();
  await expect(page.locator("#sound-label")).toHaveText("ÁUDIO ATIVO");
  await expect(page.locator("#quiet-mode-button")).toHaveAttribute("aria-pressed", "false");

  await page.locator("#lite-toggle").click();
  await expect(page.locator("body")).toHaveClass(/lite-mode/);
  await expect(page.locator("#sound-label")).toHaveText("ÁUDIO SILENCIADO");
  await expect(page.locator("#quiet-mode-button")).toHaveAttribute("aria-pressed", "true");

  await page.locator("#training-start-button").click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#training-message")).toContainText("Fragmento coletado");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#training-message")).toContainText("Tutorial completo");

  await page.locator("#share-link-button").click();
  await expect(page.locator("#share-link-button")).toContainText(/Link copiado|Copie no README/);
});

test("pulso fantasma congela bugs e consome carga", async ({ page }) => {
  await enterDeck(page);
  await page.locator("#difficulty").selectOption("rookie");
  await generate(page);
  await page.getByRole("button", { name: "Iniciar ICEbreaker" }).click();
  await expect(page.locator("#game-state-badge")).toHaveText("EM EXECUÇÃO", {
    timeout: 6000,
  });

  const map = ICEBREAKER_MAPS[0].map;
  const route = shortestPath(map, find(map, "P")[0], find(map, "S")[0]);
  await page.evaluate((codes) => {
    codes.forEach((code) => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
    });
  }, route);

  await expect(page.locator("#pulse-count")).toHaveText("1");
  await expect(page.locator("#pulse-game-button")).toBeEnabled();
  await page.locator("#pulse-game-button").click();
  await expect(page.locator("#pulse-count")).toContainText("ATIVO");
  await expect(page.locator("#pulse-game-button")).toBeDisabled();
  const before = await page.locator("#game-status-detail").textContent();
  await page.waitForTimeout(1000);
  await expect(page.locator("#game-status-detail")).toHaveText(before);
});

test("app shell permanece acessível offline", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Service Worker validado no Chromium.");
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle("Netrunner Password Lab");
  await expect(page.getByRole("button", { name: /CONECTAR/ })).toBeVisible();
});
