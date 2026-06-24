const COLS = 16;
const ROWS = 10;
const TILE = 48;
const LOGICAL_WIDTH = COLS * TILE;
const LOGICAL_HEIGHT = ROWS * TILE;

export const ICEBREAKER_MAPS = [
  {
    name: "SETOR A // MALHA DE INICIAÇÃO",
    map: [
      "################",
      "#P....#....S.B.#",
      "#.##..#..###.#.#",
      "#..S...........#",
      "#.###.####.###.#",
      "#......S.......#",
      "#.####.##.###..#",
      "#...........S#T#",
      "#..B.#.........#",
      "################",
    ],
  },
  {
    name: "SETOR B // ESPINHA DE DADOS",
    map: [
      "################",
      "#P.S..#......B.#",
      "#..#..#..##....#",
      "#..#.....S.....#",
      "#..##.###..##..#",
      "#S.............#",
      "#..###.##.###..#",
      "#..........S.#T#",
      "#..B.#.........#",
      "################",
    ],
  },
  {
    name: "SETOR C // ABISMO NEURAL",
    map: [
      "################",
      "#P....#..S..B..#",
      "#.##.....###.#.#",
      "#S...###.......#",
      "#.##.....#.###.#",
      "#......S.#.....#",
      "#.###.##...##..#",
      "#..........S.#T#",
      "#..B...........#",
      "################",
    ],
  },
];

export const ICEBREAKER_MAP = ICEBREAKER_MAPS[0].map;

const DEFAULT_DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

export const DIFFICULTY = Object.freeze({
  rookie: { enemyInterval: 680, gracePeriod: 2200, scoreMultiplier: 0.8, level: 0, traceSpeed: 0.55 },
  runner: { enemyInterval: 460, gracePeriod: 1600, scoreMultiplier: 1, level: 1, traceSpeed: 0.85 },
  legend: { enemyInterval: 320, gracePeriod: 1100, scoreMultiplier: 1.35, level: 2, traceSpeed: 1.15 },
});

export function positionsOverlap(first, second) {
  return first.x === second.x && first.y === second.y;
}

export function calculateScore(elapsed, shards, multiplier = 1) {
  const timePenalty = Math.floor(elapsed / 100);
  return Math.max(0, Math.round((5000 + shards * 750 - timePenalty) * multiplier));
}

export function calculateTrace(
  elapsed,
  moves = 0,
  wallHits = 0,
  traceSpeed = 1,
  strategic = false,
  relief = 0,
) {
  const timeNoise = strategic ? elapsed / 2200 : elapsed / 850;
  const movementNoise = moves * (strategic ? 0.9 : 0.55);
  const wallNoise = wallHits * 7.5;
  return Math.min(
    100,
    Math.max(0, Math.round((timeNoise + movementNoise + wallNoise) * traceSpeed - relief)),
  );
}

export function isWalkable(map, x, y) {
  return Boolean(map[y]?.[x] && map[y][x] !== "#");
}

export class IcebreakerGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.callbacks = callbacks;
    this.state = "idle";
    this.enemyTimer = null;
    this.clockTimer = null;
    this.countdownToken = 0;
    this.wasRunningBeforePause = false;
    this.pausedManually = false;
    this.animationFrame = null;
    this.frame = 0;
    this.startedAt = 0;
    this.elapsedBeforePause = 0;
    this.invulnerableUntil = 0;
    this.moveCount = 0;
    this.wallHits = 0;
    this.pulseCharges = 0;
    this.pulseUntil = 0;
    this.traceRelief = 0;
    this.playerDirection = { x: 1, y: 0 };
    this.difficulty = DIFFICULTY.runner;
    this.strategicMode = false;
    this.bindings = {
      up: "KeyW",
      down: "KeyS",
      left: "KeyA",
      right: "KeyD",
    };
    this.level = ICEBREAKER_MAPS[1];
    this.map = this.level.map;
    this.handleKeydown = this.handleKeydown.bind(this);

    this.configureCanvas();
    this.resetWorld();
    this.renderLoop();
    window.addEventListener("keydown", this.handleKeydown);
  }

  configureCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = LOGICAL_WIDTH * ratio;
    this.canvas.height = LOGICAL_HEIGHT * ratio;
    this.canvas.style.aspectRatio = `${LOGICAL_WIDTH} / ${LOGICAL_HEIGHT}`;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  resetWorld() {
    this.player = { x: 1, y: 1 };
    this.terminal = { x: 14, y: 7 };
    this.shards = [];
    this.bugs = [];

    this.map.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === "S") this.shards.push({ x, y, collected: false });
        if (cell === "P") this.player = { x, y };
        if (cell === "T") this.terminal = { x, y };
        if (cell === "B") {
          this.bugs.push({
            x,
            y,
            direction: this.bugs.length ? { x: 1, y: 0 } : { x: 0, y: 1 },
            color: this.bugs.length ? "#ff4d6d" : "#ff3cac",
          });
        }
      });
    });
  }

  arm() {
    this.countdownToken += 1;
    this.stopEnemyTimer();
    this.stopClock();
    this.resetWorld();
    this.moveCount = 0;
    this.wallHits = 0;
    this.pulseCharges = 0;
    this.pulseUntil = 0;
    this.traceRelief = 0;
    this.setState("idle");
    this.callbacks.onTrace?.(this.traceLevel, this.traceStatus);
    this.callbacks.onPulseCharge?.(this.pulseCharges, this.pulseActive);
    this.callbacks.onMessage?.("Barreira ICE armada. Inicie a invasão quando estiver pronto.");
  }

  async start(difficulty = "runner", options = {}) {
    if (!this.callbacks.canStart?.()) {
      this.callbacks.onMessage?.("Gere uma senha criptografada antes de iniciar o ICEbreaker.");
      return;
    }

    const token = ++this.countdownToken;
    this.stopEnemyTimer();
    this.stopClock();
    this.resetWorld();
    this.difficulty = DIFFICULTY[difficulty] || DIFFICULTY.runner;
    this.strategicMode = Boolean(options.strategicMode);
    this.level = ICEBREAKER_MAPS[this.difficulty.level];
    this.map = this.level.map;
    this.resetWorld();
    this.callbacks.onLevel?.(this.level.name);
    this.elapsedBeforePause = 0;
    this.moveCount = 0;
    this.wallHits = 0;
    this.pulseCharges = 0;
    this.pulseUntil = 0;
    this.traceRelief = 0;
    this.pausedManually = false;
    this.setState("countdown");
    this.callbacks.onMessage?.("Sincronizando enlace neural. Prepare-se.");

    for (const value of ["3", "2", "1", "INVADIR"]) {
      if (token !== this.countdownToken) return;
      this.callbacks.onCountdown?.(value);
      await new Promise((resolve) => window.setTimeout(resolve, value === "INVADIR" ? 450 : 650));
    }

    if (token !== this.countdownToken) return;
    this.setState("running");
    this.startedAt = performance.now();
    this.invulnerableUntil = this.startedAt + this.difficulty.gracePeriod;
    this.callbacks.onMessage?.("ICEbreaker iniciado. Proteção neural temporária ativa.");
    this.callbacks.onStart?.();
    this.callbacks.onSnapshot?.(this.snapshot);
    this.callbacks.onTrace?.(this.traceLevel, this.traceStatus);
    this.callbacks.onPulseCharge?.(this.pulseCharges, this.pulseActive);
    this.canvas.focus({ preventScroll: true });
    this.startTimers();
  }

  restart(difficulty = "runner", options = {}) {
    if (!this.callbacks.canStart?.()) {
      this.callbacks.onMessage?.("Gere uma senha criptografada antes de iniciar o ICEbreaker.");
      return;
    }

    this.start(difficulty, options);
  }

  pause(manual = false) {
    if (this.state !== "running") return;
    this.wasRunningBeforePause = true;
    this.pausedManually = manual;
    this.elapsedBeforePause = this.elapsedTime;
    this.stopEnemyTimer();
    this.stopClock();
    this.setState("paused");
    this.callbacks.onMessage?.(
      manual ? "Incursão pausada pelo operador." : "Enlace neural suspenso: aba fora de foco.",
    );
  }

  resume(manual = false) {
    if (!this.wasRunningBeforePause || this.state !== "paused") return;
    if (this.pausedManually && !manual) return;
    this.wasRunningBeforePause = false;
    this.pausedManually = false;
    this.startedAt = performance.now();
    this.setState("running");
    this.callbacks.onMessage?.("Enlace neural restaurado.");
    this.startTimers();
  }

  togglePause() {
    if (this.state === "running") {
      this.pause(true);
      return;
    }
    if (this.state === "paused") this.resume(true);
  }

  get elapsedTime() {
    if (!this.startedAt) return this.elapsedBeforePause;
    if (this.state === "paused") return this.elapsedBeforePause;
    return this.elapsedBeforePause + (performance.now() - this.startedAt);
  }

  get score() {
    const baseScore = calculateScore(
      this.elapsedTime,
      this.collectedShardCount,
      this.difficulty.scoreMultiplier,
    );
    return Math.max(0, baseScore - this.traceLevel * 18);
  }

  get traceLevel() {
    return calculateTrace(
      this.elapsedTime,
      this.moveCount,
      this.wallHits,
      this.difficulty.traceSpeed,
      this.strategicMode,
      this.traceRelief,
    );
  }

  get traceStatus() {
    if (this.traceLevel >= 85) return "QUEIMANDO";
    if (this.traceLevel >= 60) return "EXPOSTO";
    if (this.traceLevel >= 35) return "RASTREADO";
    return "FANTASMA";
  }

  get pulseActive() {
    return this.state === "running" && performance.now() < this.pulseUntil;
  }

  startTimers() {
    if (!this.strategicMode) {
      this.enemyTimer = window.setInterval(
        () => this.moveBugs(),
        this.difficulty.enemyInterval,
      );
    }
    this.clockTimer = window.setInterval(() => {
      this.callbacks.onClock?.(this.elapsedTime, this.score);
      this.callbacks.onTrace?.(this.traceLevel, this.traceStatus);
      this.checkTraceBurn();
    }, 200);
  }

  setState(state) {
    this.state = state;
    this.callbacks.onStateChange?.(state);
    this.callbacks.onShardChange?.(this.collectedShardCount, this.shards.length);
  }

  get collectedShardCount() {
    return this.shards.filter((shard) => shard.collected).length;
  }

  isWall(x, y) {
    return !isWalkable(this.map, x, y);
  }

  handleKeydown(event) {
    const action = Object.entries(this.bindings).find(([, code]) => code === event.code)?.[0];
    const direction =
      DEFAULT_DIRECTIONS[event.code] ||
      {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      }[action];
    if (event.code === "Escape" || event.code === "KeyP") {
      event.preventDefault();
      this.togglePause();
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      this.activatePulse();
      return;
    }
    if (!direction || this.state !== "running") return;

    event.preventDefault();
    this.movePlayer(direction);
  }

  movePlayer(direction) {
    if (this.state !== "running") return;

    const next = {
      x: this.player.x + direction.x,
      y: this.player.y + direction.y,
    };

    if (this.isWall(next.x, next.y)) {
      this.wallHits += 1;
      this.callbacks.onWall?.();
      this.callbacks.onMessage?.("Rota bloqueada pela arquitetura do cofre.");
      this.callbacks.onTrace?.(this.traceLevel, this.traceStatus);
      this.checkTraceBurn();
      return;
    }

    this.player = next;
    this.playerDirection = direction;
    this.moveCount += 1;
    this.callbacks.onMove?.();
    this.collectShard();

    if (this.checkBugCollision()) return;
    this.checkTerminal();
    if (this.strategicMode && this.state === "running") this.moveBugs();
    this.callbacks.onSnapshot?.(this.snapshot);
    this.callbacks.onTrace?.(this.traceLevel, this.traceStatus);
    this.checkTraceBurn();
  }

  setBinding(action, code) {
    if (!Object.hasOwn(this.bindings, action)) return false;
    const duplicate = Object.entries(this.bindings).find(
      ([currentAction, currentCode]) => currentAction !== action && currentCode === code,
    );
    if (duplicate) return false;
    this.bindings[action] = code;
    return true;
  }

  activatePulse() {
    if (this.state !== "running" || this.pulseCharges <= 0 || this.pulseActive) return false;

    this.pulseCharges -= 1;
    this.pulseUntil = performance.now() + 2600;
    this.traceRelief = Math.min(36, this.traceRelief + 12);
    this.callbacks.onPulse?.();
    this.callbacks.onPulseCharge?.(this.pulseCharges, true);
    this.callbacks.onTrace?.(this.traceLevel, this.traceStatus);
    this.callbacks.onMessage?.("Pulso Fantasma disparado. Bugs ICE congelados e rastro abafado.");
    window.setTimeout(() => {
      this.callbacks.onPulseCharge?.(this.pulseCharges, this.pulseActive);
    }, 2650);
    return true;
  }

  get snapshot() {
    return {
      state: this.state,
      player: { ...this.player },
      terminal: { ...this.terminal },
      shardsRemaining: this.shards.filter((shard) => !shard.collected).length,
      bugs: this.bugs.map((bug) => ({ x: bug.x, y: bug.y })),
      level: this.level.name,
      traceLevel: this.traceLevel,
      traceStatus: this.traceStatus,
      pulseCharges: this.pulseCharges,
      pulseActive: this.pulseActive,
    };
  }

  collectShard() {
    const shard = this.shards.find(
      (item) => !item.collected && item.x === this.player.x && item.y === this.player.y,
    );

    if (!shard) return;

    shard.collected = true;
    this.pulseCharges = Math.min(3, this.pulseCharges + 1);
    const count = this.collectedShardCount;
    this.callbacks.onShardChange?.(count, this.shards.length);
    this.callbacks.onShard?.(count, this.shards.length);
    this.callbacks.onPulseCharge?.(this.pulseCharges, this.pulseActive);
    this.callbacks.onMessage?.(`Fragmento de dados coletado: ${count}/${this.shards.length}.`);
  }

  checkTerminal() {
    if (!positionsOverlap(this.player, this.terminal)) return;

    if (this.collectedShardCount < this.shards.length) {
      this.callbacks.onMessage?.("Terminal bloqueado. Colete todos os fragmentos.");
      this.callbacks.onTerminalLocked?.();
      return;
    }

    this.stopEnemyTimer();
    this.stopClock();
    this.setState("won");
    this.callbacks.onMessage?.("ICE rompido. Senha liberada.");
    this.callbacks.onWin?.(this.elapsedTime, this.score);
  }

  checkBugCollision() {
    if (performance.now() < this.invulnerableUntil) return false;
    const hit = this.bugs.some((bug) => positionsOverlap(bug, this.player));

    if (!hit) return false;

    this.stopEnemyTimer();
    this.stopClock();
    this.setState("lost");
    this.callbacks.onMessage?.("Ruptura pelo ICE detectada. Reinicialização necessária.");
    this.callbacks.onLose?.();
    return true;
  }

  checkTraceBurn() {
    if (this.state !== "running" || this.traceLevel < 100) return false;

    this.stopEnemyTimer();
    this.stopClock();
    this.setState("lost");
    this.callbacks.onMessage?.("TRACE saturado. A rede triangulou o enlace neural.");
    this.callbacks.onTraceBurn?.();
    return true;
  }

  moveBugs() {
    if (this.state !== "running") return;
    if (this.pulseActive) {
      this.callbacks.onSnapshot?.(this.snapshot);
      return;
    }

    const reserved = new Set();
    this.bugs.forEach((bug, index) => {
      const forward = {
        x: bug.x + bug.direction.x,
        y: bug.y + bug.direction.y,
      };

      const choices = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ].filter((direction) => {
          const nextX = bug.x + direction.x;
          const nextY = bug.y + direction.y;
          return !this.isWall(nextX, nextY) && !reserved.has(`${nextX},${nextY}`);
        });

      if (this.difficulty.level === 2 && choices.length) {
        choices.sort((first, second) => {
          const firstDistance =
            Math.abs(bug.x + first.x - this.player.x) +
            Math.abs(bug.y + first.y - this.player.y);
          const secondDistance =
            Math.abs(bug.x + second.x - this.player.x) +
            Math.abs(bug.y + second.y - this.player.y);
          return firstDistance - secondDistance;
        });
        bug.direction = choices[0];
      } else if (
        this.isWall(forward.x, forward.y) ||
        reserved.has(`${forward.x},${forward.y}`)
      ) {
        if (choices.length) {
          bug.direction = choices[(this.frame + index) % choices.length];
        } else {
          bug.direction = { x: 0, y: 0 };
        }
      }

      const next = {
        x: bug.x + bug.direction.x,
        y: bug.y + bug.direction.y,
      };

      const protectedPlayer =
        performance.now() < this.invulnerableUntil && positionsOverlap(next, this.player);

      if (!protectedPlayer) {
        bug.x = next.x;
        bug.y = next.y;
      }
      reserved.add(`${bug.x},${bug.y}`);
    });

    this.checkBugCollision();
    this.callbacks.onSnapshot?.(this.snapshot);
  }

  stopEnemyTimer() {
    if (this.enemyTimer) {
      window.clearInterval(this.enemyTimer);
      this.enemyTimer = null;
    }
  }

  stopClock() {
    if (this.clockTimer) {
      window.clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  destroy() {
    this.countdownToken += 1;
    this.stopEnemyTimer();
    this.stopClock();
    window.cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("keydown", this.handleKeydown);
  }

  renderLoop() {
    this.frame += 1;
    this.draw();
    this.animationFrame = window.requestAnimationFrame(() => this.renderLoop());
  }

  draw() {
    const context = this.context;
    context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const palettes = [
      ["#04080d", "rgba(94, 234, 255, 0.055)"],
      ["#080510", "rgba(255, 60, 172, 0.06)"],
      ["#020b0a", "rgba(101, 255, 154, 0.055)"],
    ];
    const palette = palettes[this.difficulty.level] || palettes[1];
    context.fillStyle = palette[0];
    context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    this.drawFloor(palette[1]);
    this.drawCircuitPulses();
    this.drawWalls();
    this.drawTerminal();
    this.shards.filter((shard) => !shard.collected).forEach((shard) => this.drawShard(shard));
    if (this.pulseActive) this.drawPulseField();
    this.bugs.forEach((bug) => this.drawBug(bug));
    this.drawPlayer();
    this.drawSignature();
  }

  drawFloor(gridColor = "rgba(94, 234, 255, 0.055)") {
    const context = this.context;
    context.strokeStyle = gridColor;
    context.lineWidth = 1;

    for (let x = 0; x <= COLS; x += 1) {
      context.beginPath();
      context.moveTo(x * TILE, 0);
      context.lineTo(x * TILE, ROWS * TILE);
      context.stroke();
    }

    for (let y = 0; y <= ROWS; y += 1) {
      context.beginPath();
      context.moveTo(0, y * TILE);
      context.lineTo(COLS * TILE, y * TILE);
      context.stroke();
    }
  }

  drawCircuitPulses() {
    const context = this.context;
    const pulseColor = this.pulseActive ? "#65ff9a" : "#5eeaff";
    context.save();
    context.globalAlpha = this.pulseActive ? 0.32 : 0.16;
    context.fillStyle = pulseColor;

    this.map.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === "#" || (x + y + Math.floor(this.frame / 18)) % 9 !== 0) return;
        const px = x * TILE;
        const py = y * TILE;
        context.fillRect(px + 22, py + 6, 4, 10);
        context.fillRect(px + 22, py + 32, 4, 10);
        context.fillRect(px + 6, py + 22, 10, 4);
        context.fillRect(px + 32, py + 22, 10, 4);
      });
    });

    context.restore();
  }

  drawWalls() {
    const context = this.context;

    this.map.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell !== "#") return;

        const px = x * TILE;
        const py = y * TILE;
        context.fillStyle = "#0d1a24";
        context.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        context.fillStyle = "#132a36";
        context.fillRect(px + 6, py + 6, TILE - 12, 7);
        context.fillStyle = "rgba(94, 234, 255, 0.28)";
        context.fillRect(px + 6, py + TILE - 9, TILE - 12, 2);
      });
    });
  }

  drawPlayer() {
    const context = this.context;
    const x = this.player.x * TILE;
    const y = this.player.y * TILE;
    const bob = Math.sin(this.frame * 0.09) > 0 ? 0 : 2;
    const step = Math.floor(this.frame / 8) % 2;
    const visorOffset = this.playerDirection.x > 0 ? 2 : this.playerDirection.x < 0 ? -2 : 0;

    const protectedPlayer = performance.now() < this.invulnerableUntil;
    context.globalAlpha = protectedPlayer && this.frame % 12 < 6 ? 0.45 : 1;
    context.shadowColor = protectedPlayer ? "#65ff9a" : "#5eeaff";
    context.shadowBlur = 10;
    context.fillStyle = "rgba(94, 234, 255, 0.18)";
    context.fillRect(x + 10, y + 38, 28, 3);
    context.fillStyle = "#5eeaff";
    context.fillRect(x + 14, y + 9 + bob, 20, 5);
    context.fillRect(x + 12, y + 14 + bob, 24, 20);
    context.fillStyle = "#b8f7ff";
    context.fillRect(x + 15, y + 12 + bob, 5, 3);
    context.fillRect(x + 29, y + 12 + bob, 5, 3);
    context.fillStyle = "#0a1820";
    context.fillRect(x + 17 + visorOffset, y + 16 + bob, 14, 8);
    context.fillStyle = "#65ff9a";
    context.fillRect(x + 19 + visorOffset, y + 19 + bob, 3, 3);
    context.fillRect(x + 27 + visorOffset, y + 19 + bob, 3, 3);
    context.fillStyle = "#ff3cac";
    context.fillRect(x + 9, y + 22 + bob, 5, 9);
    context.fillRect(x + 35, y + 22 + bob, 5, 9);
    context.fillRect(x + 37, y + 17 + bob + step, 3, 3);
    context.fillStyle = "#5eeaff";
    context.fillRect(x + 15, y + 34 + bob + step, 7, 5);
    context.fillRect(x + 27, y + 34 + bob + (step ? 0 : 1), 7, 5);
    context.shadowBlur = 0;
    context.globalAlpha = 1;
  }

  drawShard(shard) {
    const context = this.context;
    const x = shard.x * TILE + TILE / 2;
    const y = shard.y * TILE + TILE / 2;
    const pulse = 2 + Math.abs(Math.sin(this.frame * 0.08)) * 4;

    context.shadowColor = "#ffd166";
    context.shadowBlur = 12 + pulse;
    context.fillStyle = "#ffd166";
    context.beginPath();
    context.moveTo(x, y - 12);
    context.lineTo(x + 8, y);
    context.lineTo(x, y + 12);
    context.lineTo(x - 8, y);
    context.closePath();
    context.fill();
    context.fillStyle = "#fff5c4";
    context.fillRect(x - 2, y - 7, 3, 7);
    context.fillStyle = "#ff3cac";
    context.globalAlpha = 0.65;
    for (let index = 0; index < 4; index += 1) {
      const angle = this.frame * 0.045 + index * Math.PI / 2;
      context.fillRect(x + Math.round(Math.cos(angle) * 15), y + Math.round(Math.sin(angle) * 15), 3, 3);
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  drawPulseField() {
    const context = this.context;
    const pulse = 18 + Math.abs(Math.sin(this.frame * 0.18)) * 14;
    context.save();
    context.globalAlpha = 0.32;
    context.strokeStyle = "#65ff9a";
    context.lineWidth = 2;
    context.shadowColor = "#65ff9a";
    context.shadowBlur = 18;
    context.strokeRect(pulse / 2, pulse / 2, LOGICAL_WIDTH - pulse, LOGICAL_HEIGHT - pulse);
    context.globalAlpha = 0.12;
    context.fillStyle = "#65ff9a";
    context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    context.restore();
  }

  drawBug(bug) {
    const context = this.context;
    const x = bug.x * TILE;
    const y = bug.y * TILE;
    const color = this.pulseActive ? "#65ff9a" : bug.color;
    const leg = Math.floor(this.frame / 10) % 2;

    context.shadowColor = color;
    context.shadowBlur = 10;
    const forecastX = bug.x * TILE + bug.direction.x * 10 + TILE / 2;
    const forecastY = bug.y * TILE + bug.direction.y * 10 + TILE / 2;
    context.globalAlpha = 0.25;
    context.fillStyle = color;
    context.fillRect(forecastX - 3, forecastY - 3, 6, 6);
    context.globalAlpha = 1;
    context.fillStyle = color;
    context.fillRect(x + 18, y + 11 + leg, 12, 4);
    context.fillRect(x + 14, y + 16, 20, 17);
    context.fillRect(x + 10, y + 19, 5, 4);
    context.fillRect(x + 33, y + 19, 5, 4);
    context.fillRect(x + 10, y + 28, 5, 4);
    context.fillRect(x + 33, y + 28, 5, 4);
    context.fillRect(x + 6, y + 23 + leg, 6, 3);
    context.fillRect(x + 36, y + 23 + (leg ? 0 : 1), 6, 3);
    context.fillStyle = "#190511";
    context.fillRect(x + 18, y + 20, 4, 4);
    context.fillRect(x + 27, y + 20, 4, 4);
    context.fillRect(x + 20, y + 28 + leg, 9, 2);
    if (this.pulseActive) {
      context.fillStyle = "#03150a";
      context.fillRect(x + 16, y + 35, 16, 2);
    }
    context.shadowBlur = 0;
  }

  drawTerminal() {
    const context = this.context;
    const x = this.terminal.x * TILE;
    const y = this.terminal.y * TILE;
    const unlocked = this.collectedShardCount === this.shards.length;
    const color = unlocked ? "#65ff9a" : "#ff4d6d";

    context.shadowColor = color;
    context.shadowBlur = unlocked ? 16 : 6;
    context.fillStyle = "#0c171d";
    context.fillRect(x + 8, y + 7, 32, 35);
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.strokeRect(x + 8, y + 7, 32, 35);
    context.fillStyle = color;
    context.fillRect(x + 14, y + 14, 20, 12);
    context.fillStyle = "#06100b";
    const scan = Math.floor(this.frame / 9) % 4;
    context.fillRect(x + 17, y + 17 + scan, 8, 2);
    context.fillRect(x + 17, y + 22, 13, 2);
    context.fillStyle = unlocked && this.frame % 22 < 11 ? "#b8f7ff" : color;
    context.fillRect(x + 31, y + 15, 2, 9);
    context.fillStyle = color;
    context.fillRect(x + 20, y + 34, 9, 4);
    context.shadowBlur = 0;
  }

  drawSignature() {
    const context = this.context;
    context.save();
    context.fillStyle = "rgba(255, 60, 172, 0.16)";
    context.font = "8px monospace";
    context.fillText("MARCUS ESTEVE AQUI", 515, 458);
    context.fillRect(505, 462, 145, 1);
    context.restore();
  }
}
