import {
  analyzePassword,
  generatePassphrase,
  generatePassword,
  maskPassword,
} from "./password.js";
import { IcebreakerGame } from "./game.js";
import { CyberAudio } from "./audio.js";
import { startCyberCity, startDataRain } from "./visuals.js";
import { clearScores, readScores, saveScore } from "./scores.js";
import { dailyChallenge, readProgress, recordRun } from "./progress.js";

const elements = {
  bootScreen: document.querySelector("#boot-screen"),
  bootLog: document.querySelector("#boot-log"),
  bootProgress: document.querySelector("#boot-progress"),
  jackInButton: document.querySelector("#jack-in-button"),
  silentEntryButton: document.querySelector("#silent-entry-button"),
  cityCanvas: document.querySelector("#city-canvas"),
  backgroundCanvas: document.querySelector("#background-canvas"),
  soundToggle: document.querySelector("#sound-toggle"),
  soundLabel: document.querySelector("#sound-label"),
  comfortToggle: document.querySelector("#comfort-toggle"),
  liteToggle: document.querySelector("#lite-toggle"),
  shareLinkButton: document.querySelector("#share-link-button"),
  trainingGrid: document.querySelector("#training-grid"),
  trainingStartButton: document.querySelector("#training-start-button"),
  trainingResetButton: document.querySelector("#training-reset-button"),
  trainingMessage: document.querySelector("#training-message"),
  trainingTouchControls: document.querySelectorAll("[data-training-direction]"),
  musicVolume: document.querySelector("#music-volume"),
  ambientVolume: document.querySelector("#ambient-volume"),
  effectsVolume: document.querySelector("#effects-volume"),
  length: document.querySelector("#password-length"),
  lengthOutput: document.querySelector("#length-output"),
  uppercase: document.querySelector("#include-uppercase"),
  lowercase: document.querySelector("#include-lowercase"),
  numbers: document.querySelector("#include-numbers"),
  symbols: document.querySelector("#include-symbols"),
  excludeAmbiguous: document.querySelector("#exclude-ambiguous"),
  configAlert: document.querySelector("#config-alert"),
  generateButton: document.querySelector("#generate-button"),
  passwordVault: document.querySelector("#password-vault"),
  passwordOutput: document.querySelector("#password-output"),
  vaultStatus: document.querySelector("#vault-status"),
  vaultCipher: document.querySelector("#vault-cipher"),
  vaultLength: document.querySelector("#vault-length"),
  vaultLed: document.querySelector(".vault-led"),
  lockIcon: document.querySelector("#lock-icon"),
  copyButton: document.querySelector("#copy-button"),
  copyLabel: document.querySelector("#copy-label"),
  hidePasswordButton: document.querySelector("#hide-password-button"),
  expiryNotice: document.querySelector("#expiry-notice"),
  expiryCountdown: document.querySelector("#expiry-countdown"),
  strengthLabel: document.querySelector("#strength-label"),
  strengthScore: document.querySelector("#strength-score"),
  strengthBar: document.querySelector("#strength-bar"),
  strengthTrack: document.querySelector(".strength-track"),
  strengthFeedback: document.querySelector("#strength-feedback"),
  strengthTips: document.querySelector("#strength-tips"),
  terminalLog: document.querySelector("#terminal-log"),
  clearLogButton: document.querySelector("#clear-log-button"),
  systemClock: document.querySelector("#system-clock"),
  startGameButton: document.querySelector("#start-game-button"),
  restartGameButton: document.querySelector("#restart-game-button"),
  pauseGameButton: document.querySelector("#pause-game-button"),
  pulseGameButton: document.querySelector("#pulse-game-button"),
  difficulty: document.querySelector("#difficulty"),
  strategicMode: document.querySelector("#strategic-mode"),
  gameStateBadge: document.querySelector("#game-state-badge"),
  shardCount: document.querySelector("#shard-count"),
  iceStatus: document.querySelector("#ice-status"),
  runTime: document.querySelector("#run-time"),
  runScore: document.querySelector("#run-score"),
  traceLevel: document.querySelector("#trace-level"),
  traceStatus: document.querySelector("#trace-status"),
  pulseCount: document.querySelector("#pulse-count"),
  vaultLevel: document.querySelector("#vault-level"),
  gameMessage: document.querySelector("#game-message"),
  gameOverlay: document.querySelector("#game-overlay"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayMessage: document.querySelector("#overlay-message"),
  canvas: document.querySelector("#game-canvas"),
  touchControls: document.querySelectorAll("[data-direction]"),
  bindingButtons: document.querySelectorAll("[data-bind]"),
  gameStatusDetail: document.querySelector("#game-status-detail"),
  missionGenerate: document.querySelector("#mission-step-generate"),
  missionBreak: document.querySelector("#mission-step-break"),
  missionReveal: document.querySelector("#mission-step-reveal"),
  scoreList: document.querySelector("#score-list"),
  clearScoresButton: document.querySelector("#clear-scores-button"),
  reduceGlowButton: document.querySelector("#reduce-glow-button"),
  bigControlsButton: document.querySelector("#big-controls-button"),
  quietModeButton: document.querySelector("#quiet-mode-button"),
  shell: document.querySelector("#main-content"),
  zoneButtons: document.querySelectorAll("[data-zone-target]"),
  operationFull: document.querySelector("#operation-full"),
  operationQuick: document.querySelector("#operation-quick"),
  randomModeButton: document.querySelector("#random-mode-button"),
  passphraseModeButton: document.querySelector("#passphrase-mode-button"),
  profileButtons: document.querySelectorAll("[data-profile]"),
  passphraseOptions: document.querySelector("#passphrase-options"),
  passphraseWords: document.querySelector("#passphrase-words"),
  passphraseSeparator: document.querySelector("#passphrase-separator"),
  passphraseCapitalize: document.querySelector("#passphrase-capitalize"),
  passphraseNumber: document.querySelector("#passphrase-number"),
  dailyDescription: document.querySelector("#daily-description"),
  dailyTargetScore: document.querySelector("#daily-target-score"),
  dailyActivateButton: document.querySelector("#daily-activate-button"),
  careerRank: document.querySelector("#career-rank"),
  careerWins: document.querySelector("#career-wins"),
  careerScore: document.querySelector("#career-score"),
  careerTime: document.querySelector("#career-time"),
  careerStreak: document.querySelector("#career-streak"),
  achievementGrid: document.querySelector("#achievement-grid"),
  actionFeedback: document.querySelector("#action-feedback"),
};

let currentPassword = "";
let passwordUnlocked = false;
let passwordVisible = false;
let soundEnabled = true;
let expiryAt = 0;
let expiryTimer = null;
let bindingAction = null;
let operationMode = "full";
let generatorMode = "random";
let activeZone = "forge";
let feedbackTimer = null;
const audio = new CyberAudio();
const PASSWORD_TTL = 5 * 60 * 1000;
const OFFICIAL_URL = "https://marcusguedess.github.io/netrunner-password-lab/";
const PREFERENCES_KEY = "netrunner:preferences:v1";
const PROFILE_OPTIONS = {
  daily: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true },
  bank: { length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true },
  wifi: { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: false },
  maximum: { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true },
};
const TRAINING_MAP = [
  "#####",
  "#P.S#",
  "#.#.#",
  "#B.T#",
  "#####",
];

const training = {
  active: false,
  won: false,
  player: { x: 1, y: 1 },
  shard: { x: 3, y: 1, collected: false },
  bug: { x: 1, y: 3 },
  terminal: { x: 3, y: 3 },
};

window.addEventListener("keydown", (event) => {
  if (event.key === "Tab") document.body.classList.add("keyboard-navigation");
});
window.addEventListener(
  "pointerdown",
  () => document.body.classList.remove("keyboard-navigation"),
  { passive: true },
);

function timestamp() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function notify(message, tone = "info") {
  window.clearTimeout(feedbackTimer);
  elements.actionFeedback.textContent = message;
  elements.actionFeedback.dataset.tone = tone;
  elements.actionFeedback.classList.add("visible");
  feedbackTimer = window.setTimeout(() => {
    elements.actionFeedback.classList.remove("visible");
  }, 2200);
}

function setZone(zone, { focus = false, announce = true } = {}) {
  const allowed = new Set(["forge", "breaker", "vault", "archive"]);
  activeZone = allowed.has(zone) ? zone : "forge";
  elements.shell.dataset.activeZone = activeZone;
  elements.zoneButtons.forEach((button) => {
    const selected = button.dataset.zoneTarget === activeZone;
    button.classList.toggle("active", selected);
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (focus) {
    const target = document.querySelector(
      activeZone === "vault"
        ? "[data-panel-zone='vault']"
        : `[data-zone='${activeZone}']`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const labels = {
    forge: "Forja aberta.",
    breaker: "ICEbreaker aberto.",
    vault: "Cofre aberto.",
    archive: "Arquivo de bordo aberto.",
  };
  if (announce) notify(labels[activeZone]);
}

function savePreferences() {
  const preferences = {
    operationMode,
    generatorMode,
    length: Number(elements.length.value),
    uppercase: elements.uppercase.checked,
    lowercase: elements.lowercase.checked,
    numbers: elements.numbers.checked,
    symbols: elements.symbols.checked,
    excludeAmbiguous: elements.excludeAmbiguous.checked,
    difficulty: elements.difficulty.value,
    strategicMode: elements.strategicMode.checked,
  };
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Preferências são opcionais; nenhuma senha é persistida.
  }
}

function setOperationMode(mode, { announce = true } = {}) {
  operationMode = mode === "quick" ? "quick" : "full";
  const quick = operationMode === "quick";
  elements.operationFull.classList.toggle("active", !quick);
  elements.operationQuick.classList.toggle("active", quick);
  elements.operationFull.setAttribute("aria-pressed", String(!quick));
  elements.operationQuick.setAttribute("aria-pressed", String(quick));
  elements.generateButton.querySelector("span").textContent = quick
    ? "Gerar e Liberar Senha"
    : "Gerar Senha Segura";
  savePreferences();
  if (announce) notify(quick ? "Acesso rápido ativado." : "Operação completa ativada.");
}

function setGeneratorMode(mode, { announce = true } = {}) {
  generatorMode = mode === "passphrase" ? "passphrase" : "random";
  const passphrase = generatorMode === "passphrase";
  elements.randomModeButton.classList.toggle("active", !passphrase);
  elements.passphraseModeButton.classList.toggle("active", passphrase);
  elements.randomModeButton.setAttribute("aria-selected", String(!passphrase));
  elements.passphraseModeButton.setAttribute("aria-selected", String(passphrase));
  elements.passphraseOptions.hidden = !passphrase;
  document.querySelector(".length-control").hidden = passphrase;
  document.querySelector(".option-grid").hidden = passphrase;
  document.querySelector(".ambiguity-toggle").hidden = passphrase;
  savePreferences();
  if (announce) {
    notify(passphrase ? "Gerador de frase-senha ativado." : "Gerador aleatório ativado.");
  }
}

function applyProfile(name) {
  const profile = PROFILE_OPTIONS[name];
  if (!profile) return;
  Object.assign(elements.length, { value: String(profile.length) });
  elements.uppercase.checked = profile.uppercase;
  elements.lowercase.checked = profile.lowercase;
  elements.numbers.checked = profile.numbers;
  elements.symbols.checked = profile.symbols;
  setGeneratorMode("random");
  elements.profileButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.profile === name);
  });
  updateRange();
  savePreferences();
  addLog(`perfil carregado: ${name}`, "success");
  notify(`Perfil ${name} carregado.`, "success");
}

function formatElapsed(milliseconds) {
  if (!Number.isFinite(milliseconds)) return "--:--";
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function renderProgress(progress = readProgress()) {
  const ranks = [
    [20, "LENDA DA MALHA"],
    [10, "ESPECTRO"],
    [5, "NETRUNNER"],
    [1, "OPERADOR"],
    [0, "RECRUTA"],
  ];
  elements.careerRank.textContent = ranks.find(([wins]) => progress.wins >= wins)[1];
  elements.careerWins.textContent = String(progress.wins);
  elements.careerScore.textContent = String(progress.bestScore).padStart(4, "0");
  elements.careerTime.textContent = formatElapsed(progress.bestTime);
  elements.careerStreak.textContent = `${progress.streak} ${progress.streak === 1 ? "DIA" : "DIAS"}`;
  elements.achievementGrid.replaceChildren();
  const achievements = progress.achievements.length
    ? progress.achievements
    : ["Conclua sua primeira incursão para desbloquear uma conquista."];
  achievements.forEach((name, index) => {
    const badge = document.createElement("span");
    badge.className = progress.achievements.length ? "achievement unlocked" : "achievement";
    badge.textContent = progress.achievements.length ? `◆ ${name}` : name;
    badge.style.setProperty("--badge-delay", `${index * 70}ms`);
    elements.achievementGrid.append(badge);
  });
}

function renderDaily() {
  const contract = dailyChallenge();
  const labels = { rookie: "Operador", runner: "Netrunner", legend: "Lenda Urbana" };
  elements.dailyDescription.textContent =
    `${labels[contract.difficulty]} // ${contract.strategicMode ? "modo estratégico" : "tempo real"} // ` +
    `alcance ${contract.targetScore} pontos.`;
  elements.dailyTargetScore.textContent = String(contract.targetScore);
}

function renderScores(scores = readScores()) {
  elements.scoreList.replaceChildren();
  if (!scores.length) {
    const empty = document.createElement("li");
    empty.className = "empty-score";
    empty.textContent = "Nenhuma incursão concluída neste dispositivo.";
    elements.scoreList.append(empty);
    return;
  }

  const labels = {
    rookie: "Operador",
    runner: "Netrunner",
    legend: "Lenda Urbana",
  };

  scores.forEach((entry, index) => {
    const item = document.createElement("li");
    const rank = document.createElement("span");
    const score = document.createElement("strong");
    const meta = document.createElement("small");
    const totalSeconds = Math.floor(entry.elapsed / 1000);
    rank.textContent = `#${index + 1}`;
    score.textContent = String(entry.score).padStart(4, "0");
    meta.textContent =
      `${labels[entry.difficulty]} // ` +
      `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:` +
      `${String(totalSeconds % 60).padStart(2, "0")} // ${entry.date}`;
    item.append(rank, score, meta);
    elements.scoreList.append(item);
  });
}

function addLog(message, tone = "") {
  const line = document.createElement("p");
  const time = document.createElement("time");
  const content = document.createElement("span");

  time.textContent = timestamp();
  content.textContent = `> ${message}`;
  if (tone) content.classList.add(tone);
  line.append(time, content);
  elements.terminalLog.append(line);
  elements.terminalLog.scrollTop = elements.terminalLog.scrollHeight;
}

function updateRange() {
  const min = Number(elements.length.min);
  const max = Number(elements.length.max);
  const value = Number(elements.length.value);
  const percentage = ((value - min) / (max - min)) * 100;

  elements.lengthOutput.value = String(value).padStart(2, "0");
  elements.length.style.background = `linear-gradient(90deg, var(--cyan) 0 ${percentage}%, rgba(94, 234, 255, 0.12) ${percentage}%)`;
}

function selectedOptions() {
  if (generatorMode === "passphrase") {
    return {
      mode: "passphrase",
      words: Number(elements.passphraseWords.value),
      separator: elements.passphraseSeparator.value,
      capitalize: elements.passphraseCapitalize.checked,
      includeNumber: elements.passphraseNumber.checked,
    };
  }
  return {
    mode: "random",
    length: Number(elements.length.value),
    uppercase: elements.uppercase.checked,
    lowercase: elements.lowercase.checked,
    numbers: elements.numbers.checked,
    symbols: elements.symbols.checked,
    excludeAmbiguous: elements.excludeAmbiguous.checked,
  };
}

function updateStrength(password) {
  const analysis = analyzePassword(password);
  elements.strengthLabel.textContent = analysis.label.toUpperCase();
  elements.strengthScore.value = String(analysis.score).padStart(2, "0");
  elements.strengthBar.style.width = `${analysis.score}%`;
  elements.strengthBar.style.background = analysis.color;
  elements.strengthLabel.style.color = analysis.color;
  elements.strengthFeedback.textContent = analysis.feedback;
  elements.strengthTrack.setAttribute("aria-valuenow", String(analysis.score));
  elements.strengthTips.replaceChildren();
  analysis.tips?.forEach((tip) => {
    const item = document.createElement("li");
    item.textContent = tip;
    elements.strengthTips.append(item);
  });
}

function setMission(stage) {
  const order = ["generate", "break", "reveal"];
  const current = order.indexOf(stage);
  const steps = {
    generate: elements.missionGenerate,
    break: elements.missionBreak,
    reveal: elements.missionReveal,
  };

  order.forEach((name, index) => {
    steps[name].classList.toggle("active", index === current);
    steps[name].classList.toggle("complete", index < current);
  });
}

function lockPassword() {
  passwordUnlocked = false;
  passwordVisible = false;
  elements.passwordVault.classList.remove("unlocked", "decrypting");
  elements.passwordVault.classList.add("locked");
  elements.passwordOutput.value = maskPassword(currentPassword);
  elements.vaultStatus.textContent = "SENHA BLOQUEADA PELO ICE";
  elements.vaultCipher.textContent = "BLOQUEIO // ICE ATIVO";
  elements.lockIcon.textContent = "◆";
  elements.vaultLed.style.background = "var(--red)";
  elements.vaultLed.style.boxShadow = "0 0 12px var(--red)";
  elements.copyButton.disabled = true;
  elements.copyButton.title = "Vença o ICEbreaker para liberar a cópia.";
  elements.copyLabel.textContent = "Copiar Senha";
  elements.hidePasswordButton.hidden = true;
  elements.expiryNotice.hidden = true;
  elements.shell.classList.remove("vault-breached");
  expiryAt = 0;
  if (expiryTimer) window.clearInterval(expiryTimer);
  expiryTimer = null;
}

function unlockPassword() {
  if (!currentPassword) return;

  passwordUnlocked = true;
  passwordVisible = true;
  elements.passwordVault.classList.remove("locked");
  elements.passwordVault.classList.add("unlocked", "decrypting");
  elements.passwordOutput.value = currentPassword;
  elements.vaultStatus.textContent = "SENHA LIBERADA";
  elements.vaultCipher.textContent = "BLOQUEIO // ROMPIDO";
  elements.lockIcon.textContent = "◇";
  elements.vaultLed.style.background = "var(--green)";
  elements.vaultLed.style.boxShadow = "0 0 12px var(--green)";
  elements.copyButton.disabled = false;
  elements.copyButton.title = "Copiar a senha liberada.";
  elements.hidePasswordButton.hidden = false;
  elements.hidePasswordButton.textContent = "Ocultar novamente";
  elements.expiryNotice.hidden = false;
  resetExpiryTimer();
  setMission("reveal");
  setZone("vault", { focus: true });
  elements.shell.classList.add("vault-breached");
  window.setTimeout(() => elements.shell.classList.remove("vault-breached"), 1200);
  window.setTimeout(() => elements.passwordVault.classList.remove("decrypting"), 800);
}

function togglePasswordVisibility() {
  if (!passwordUnlocked || !currentPassword) return;
  passwordVisible = !passwordVisible;
  elements.passwordOutput.value = passwordVisible
    ? currentPassword
    : maskPassword(currentPassword);
  elements.hidePasswordButton.textContent = passwordVisible
    ? "Ocultar novamente"
    : "Revelar novamente";
  elements.vaultStatus.textContent = passwordVisible
    ? "SENHA LIBERADA"
    : "SENHA LIBERADA // VISOR OCULTO";
}

function clearPassword(reason = "senha apagada da memória") {
  currentPassword = "";
  passwordUnlocked = false;
  passwordVisible = false;
  expiryAt = 0;
  if (expiryTimer) window.clearInterval(expiryTimer);
  expiryTimer = null;
  elements.passwordOutput.value = "SEM_SENHA";
  elements.vaultStatus.textContent = "SENHA EXPIRADA";
  elements.vaultCipher.textContent = "BLOQUEIO // MEMÓRIA LIMPA";
  elements.vaultLength.textContent = "00 BYTES";
  elements.copyButton.disabled = true;
  elements.hidePasswordButton.hidden = true;
  elements.expiryNotice.hidden = true;
  elements.startGameButton.disabled = true;
  updateStrength("");
  game.arm();
  setMission("generate");
  addLog(reason, "warning");
}

function updateExpiryCountdown() {
  if (!expiryAt) return;
  const remaining = Math.max(0, expiryAt - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  elements.expiryCountdown.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  elements.expiryNotice.classList.toggle("expiring", remaining <= 30000);
  if (remaining === 0) clearPassword("senha apagada após inatividade");
}

function resetExpiryTimer() {
  if (!passwordUnlocked || !currentPassword) return;
  expiryAt = Date.now() + PASSWORD_TTL;
  if (!expiryTimer) {
    expiryTimer = window.setInterval(updateExpiryCountdown, 1000);
  }
  updateExpiryCountdown();
}

function generateEncryptedPassword() {
  elements.configAlert.hidden = true;
  expiryAt = 0;
  if (expiryTimer) window.clearInterval(expiryTimer);
  expiryTimer = null;

  try {
    const options = selectedOptions();
    currentPassword =
      options.mode === "passphrase" ? generatePassphrase(options) : generatePassword(options);
  } catch (error) {
    elements.configAlert.textContent = error.message;
    elements.configAlert.hidden = false;
    addLog("geração abortada: selecione ao menos um tipo de caractere", "warning");
    return;
  }

  lockPassword();
  elements.shell.classList.add("generation-sequence");
  window.setTimeout(() => elements.shell.classList.remove("generation-sequence"), 1000);
  audio.play("generate");
  updateStrength(currentPassword);
  elements.vaultLength.textContent = `${String(currentPassword.length).padStart(2, "0")} BYTES`;
  addLog("senha gerada", "success");
  notify("Senha criada com segurança no navegador.", "success");
  savePreferences();

  if (operationMode === "quick") {
    game.arm();
    unlockPassword();
    addLog("acesso rápido autorizado", "success");
    return;
  }

  elements.startGameButton.disabled = false;
  game.arm();
  setMission("break");
  setOverlay(
    "CAMADA ICE DETECTADA",
    "A senha foi criada e está escondida. Clique em Iniciar ICEbreaker para liberá-la.",
    true,
  );
  addLog("ICE detectado", "danger");
  addLog("clique em iniciar icebreaker", "warning");
  window.setTimeout(() => setZone("breaker", { focus: true }), 540);
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function copyPassword() {
  if (!passwordUnlocked || !currentPassword) return;

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(currentPassword);
      } catch {
        if (!fallbackCopy(currentPassword)) throw new Error("Clipboard indisponível");
      }
    } else if (!fallbackCopy(currentPassword)) {
      throw new Error("Clipboard indisponível");
    }
    audio.play("copy");
    elements.copyLabel.textContent = "Copiada para a Área de Transferência";
    addLog("senha copiada para a área de transferência", "success");
    notify("Senha copiada.", "success");
    window.setTimeout(() => {
      elements.copyLabel.textContent = "Copiar Senha";
    }, 1800);
  } catch {
    addLog("acesso à área de transferência negado pelo navegador", "danger");
    notify("O navegador bloqueou a cópia.", "danger");
  }
}

function setOverlay(title, message, visible) {
  elements.overlayTitle.textContent = title;
  elements.overlayMessage.textContent = message;
  elements.gameOverlay.classList.toggle("visible", visible);
}

function updateGameState(state) {
  const badges = {
    idle: "EM ESPERA",
    running: "EM EXECUÇÃO",
    won: "VITÓRIA",
    lost: "DERROTA",
    countdown: "SINCRONIZANDO",
    paused: "PAUSADO",
  };

  elements.gameStateBadge.textContent = badges[state];
  elements.gameStateBadge.className = `game-state-badge ${state}`;

  const states = {
    idle: "DORMENTE",
    running: "ATIVO",
    won: "ROMPIDO",
    lost: "HOSTIL",
    countdown: "ARMANDO",
    paused: "SUSPENSO",
  };

  elements.iceStatus.textContent = states[state];
  const gameBusy = ["running", "paused", "countdown"].includes(state);
  elements.difficulty.disabled = gameBusy;
  elements.strategicMode.disabled = gameBusy;
  elements.generateButton.disabled = gameBusy;
  elements.startGameButton.disabled = state === "countdown";
  elements.restartGameButton.disabled = state === "countdown";
  updatePulse(Number.parseInt(elements.pulseCount.textContent, 10) || 0, false);
  elements.startGameButton.title = currentPassword
    ? "Iniciar ou reiniciar a incursão."
    : "Gere uma senha na Forja para habilitar.";
  elements.pauseGameButton.title =
    state === "running" || state === "paused"
      ? "Pausar ou retomar a incursão."
      : "Disponível durante uma incursão.";

  if (state === "running") {
    setOverlay("", "", false);
    elements.startGameButton.textContent = "Reiniciar ICEbreaker";
    elements.pauseGameButton.disabled = false;
    elements.pauseGameButton.textContent = "Pausar";
  } else if (state === "countdown") {
    elements.pauseGameButton.disabled = true;
    elements.runTime.textContent = "00:00";
    elements.runScore.textContent = "0000";
    updateTrace(0, "FANTASMA");
    updatePulse(0, false);
  } else if (state === "paused") {
    setOverlay("INCURSÃO PAUSADA", "Pressione P, Esc ou use o botão para retomar.", true);
    elements.pauseGameButton.disabled = false;
    elements.pauseGameButton.textContent = "Retomar";
  } else if (state === "lost") {
    elements.pauseGameButton.disabled = true;
    setOverlay(
      "SINAL DO RUNNER CORTADO",
      "Um bug ICE interceptou o sinal. Reinicie a incursão e escolha outra rota.",
      true,
    );
  } else if (state === "won") {
    elements.pauseGameButton.disabled = true;
    setOverlay(
      "ICE ESTILHAÇADO",
      "Senha liberada. O cofre está aberto.",
      true,
    );
  }
}

function updateTrace(level, status) {
  const value = Math.max(0, Math.min(100, Number(level) || 0));
  elements.traceLevel.textContent = `${String(value).padStart(2, "0")}%`;
  elements.traceStatus.textContent = status;
  elements.traceLevel.dataset.trace = value >= 85 ? "hot" : value >= 60 ? "warn" : "cool";
  elements.traceStatus.dataset.trace = elements.traceLevel.dataset.trace;
}

function updatePulse(charges, active = false) {
  const value = Math.max(0, Number(charges) || 0);
  elements.pulseCount.textContent = active ? `${value} // ATIVO` : String(value);
  elements.pulseGameButton.disabled = game.state !== "running" || value === 0 || active;
  elements.pulseGameButton.classList.toggle("active", active);
  elements.pulseGameButton.title =
    value > 0
      ? "Congela temporariamente os bugs ICE e reduz o TRACE."
      : "Colete um fragmento para carregar um Pulso Fantasma.";
}

const game = new IcebreakerGame(elements.canvas, {
  canStart: () => Boolean(currentPassword),
  onStateChange: updateGameState,
  onMessage: (message) => {
    elements.gameMessage.textContent = message;
  },
  onStart: () => addLog("ICEbreaker iniciado"),
  onCountdown: (value) => {
    elements.gameOverlay.classList.add("countdown");
    setOverlay(value, value === "INVADIR" ? "Enlace liberado." : "Bugs ICE ainda estão inativos.", true);
    if (value === "INVADIR") {
      window.setTimeout(() => elements.gameOverlay.classList.remove("countdown"), 430);
    }
  },
  onClock: (elapsed, score) => {
    const totalSeconds = Math.floor(elapsed / 1000);
    elements.runTime.textContent = `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
    elements.runScore.textContent = String(score).padStart(4, "0");
  },
  onTrace: updateTrace,
  onPulseCharge: updatePulse,
  onPulse: () => {
    audio.play("shard");
    addLog("pulso fantasma disparado: bugs congelados", "success");
  },
  onLevel: (name) => {
    elements.vaultLevel.textContent = name.split("//")[0].trim();
    const profile = { "SETOR A": 0, "SETOR B": 1, "SETOR C": 2 }[
      name.split("//")[0].trim()
    ];
    audio.setMusicProfile(profile);
    addLog(`arquitetura carregada: ${name.toLowerCase()}`);
  },
  onSnapshot: ({ player, terminal, shardsRemaining, bugs, level }) => {
    const bugPositions = bugs.map((bug) => `coluna ${bug.x + 1}, linha ${bug.y + 1}`).join("; ");
    elements.gameStatusDetail.textContent =
      `${level}. Netrunner na coluna ${player.x + 1}, linha ${player.y + 1}. ` +
      `${shardsRemaining} fragmentos restantes. Terminal na coluna ${terminal.x + 1}, ` +
      `linha ${terminal.y + 1}. Bugs ICE em ${bugPositions}.`;
  },
  onMove: () => audio.play("move"),
  onWall: () => audio.play("wall"),
  onShardChange: (collected, total) => {
    elements.shardCount.textContent = `${collected} / ${total}`;
  },
  onShard: (collected, total) => {
    audio.play("shard");
    addLog(`fragmento de dados coletado: ${collected}/${total}`, "success");
  },
  onTerminalLocked: () => {
    audio.play("locked");
    addLog("terminal bloqueado: colete todos os fragmentos", "warning");
  },
  onLose: () => {
    audio.play("lose");
    document.body.classList.add("danger-flash");
    window.setTimeout(() => document.body.classList.remove("danger-flash"), 500);
    addLog("ruptura pelo ICE detectada: reinicialização necessária", "danger");
    renderProgress(
      recordRun({
        won: false,
        score: game.score,
        elapsed: game.elapsedTime,
        shards: game.collectedShardCount,
      }),
    );
  },
  onTraceBurn: () => {
    audio.play("lose");
    document.body.classList.add("danger-flash");
    window.setTimeout(() => document.body.classList.remove("danger-flash"), 500);
    addLog("trace saturado: enlace triangulado pela rede", "danger");
    renderProgress(
      recordRun({
        won: false,
        score: game.score,
        elapsed: game.elapsedTime,
        shards: game.collectedShardCount,
      }),
    );
  },
  onWin: (elapsed, score) => {
    const totalSeconds = Math.floor(elapsed / 1000);
    elements.runTime.textContent = `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
    elements.runScore.textContent = String(score).padStart(4, "0");
    audio.play("win");
    document.body.classList.add("breach-flash");
    window.setTimeout(() => document.body.classList.remove("breach-flash"), 900);
    unlockPassword();
    renderScores(
      saveScore({
        elapsed,
        score,
        difficulty: elements.difficulty.value,
        date: new Intl.DateTimeFormat("pt-BR").format(new Date()),
      }),
    );
    renderProgress(
      recordRun({
        won: true,
        elapsed,
        score,
        shards: game.collectedShardCount,
      }),
    );
    addLog("ICE rompido", "success");
    addLog("senha liberada", "success");
  },
});

elements.length.addEventListener("input", updateRange);
elements.generateButton.addEventListener("click", generateEncryptedPassword);
elements.copyButton.addEventListener("click", copyPassword);
elements.hidePasswordButton.addEventListener("click", togglePasswordVisibility);
elements.zoneButtons.forEach((button) => {
  button.addEventListener("click", () => setZone(button.dataset.zoneTarget, { focus: true }));
});
elements.operationFull.addEventListener("click", () => setOperationMode("full"));
elements.operationQuick.addEventListener("click", () => setOperationMode("quick"));
elements.randomModeButton.addEventListener("click", () => setGeneratorMode("random"));
elements.passphraseModeButton.addEventListener("click", () => setGeneratorMode("passphrase"));
elements.profileButtons.forEach((button) => {
  button.addEventListener("click", () => applyProfile(button.dataset.profile));
});
[
  elements.uppercase,
  elements.lowercase,
  elements.numbers,
  elements.symbols,
  elements.excludeAmbiguous,
  elements.passphraseWords,
  elements.passphraseSeparator,
  elements.passphraseCapitalize,
  elements.passphraseNumber,
  elements.difficulty,
  elements.strategicMode,
].forEach((control) => control.addEventListener("change", savePreferences));

elements.dailyActivateButton.addEventListener("click", () => {
  const contract = dailyChallenge();
  elements.difficulty.value = contract.difficulty;
  elements.strategicMode.checked = contract.strategicMode;
  elements.dailyActivateButton.textContent = "Contrato carregado";
  savePreferences();
  addLog(`desafio diário carregado: ${contract.key}`, "success");
  notify("Contrato diário carregado.", "success");
  window.setTimeout(() => {
    elements.dailyActivateButton.textContent = "Carregar contrato";
  }, 1800);
});

function gameOptions() {
  return { strategicMode: elements.strategicMode.checked };
}

elements.startGameButton.addEventListener("click", () =>
  game.start(elements.difficulty.value, gameOptions()),
);
elements.restartGameButton.addEventListener("click", () =>
  game.restart(elements.difficulty.value, gameOptions()),
);
elements.pauseGameButton.addEventListener("click", () => game.togglePause());
elements.pulseGameButton.addEventListener("click", () => game.activatePulse());

async function copyOfficialLink() {
  const text = OFFICIAL_URL;
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopy(text)) {
      throw new Error("Clipboard indisponível");
    }
    elements.shareLinkButton.textContent = "Link copiado";
    addLog("link oficial copiado", "success");
  } catch {
    elements.shareLinkButton.textContent = "Copie no README";
    addLog("não foi possível copiar o link oficial", "warning");
  }
  window.setTimeout(() => {
    elements.shareLinkButton.textContent = "Copiar link oficial";
  }, 1800);
}

elements.shareLinkButton.addEventListener("click", copyOfficialLink);

function resetTraining(message = "Use WASD, setas ou os botões para pegar o fragmento e ir ao terminal.") {
  training.active = false;
  training.won = false;
  training.player = { x: 1, y: 1 };
  training.shard = { x: 3, y: 1, collected: false };
  training.bug = { x: 1, y: 3 };
  training.terminal = { x: 3, y: 3 };
  elements.trainingMessage.textContent = message;
  renderTraining();
}

function renderTraining() {
  elements.trainingGrid.replaceChildren();
  TRAINING_MAP.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const tile = document.createElement("span");
      tile.className = "training-cell";
      if (cell === "#") tile.classList.add("wall");
      if (training.terminal.x === x && training.terminal.y === y) {
        tile.classList.add("terminal");
        tile.textContent = "▣";
      }
      if (!training.shard.collected && training.shard.x === x && training.shard.y === y) {
        tile.classList.add("shard");
        tile.textContent = "◆";
      }
      if (training.bug.x === x && training.bug.y === y) {
        tile.classList.add("bug");
        tile.textContent = "×";
      }
      if (training.player.x === x && training.player.y === y) {
        tile.className = "training-cell runner";
        tile.textContent = "●";
      }
      elements.trainingGrid.append(tile);
    });
  });
}

function moveTraining(direction) {
  if (!training.active || training.won) return;
  const next = {
    x: training.player.x + direction.x,
    y: training.player.y + direction.y,
  };
  if (TRAINING_MAP[next.y]?.[next.x] === "#") {
    elements.trainingMessage.textContent = "Parede do cofre. Tente outro caminho.";
    renderTraining();
    return;
  }
  training.player = next;
  if (training.player.x === training.bug.x && training.player.y === training.bug.y) {
    resetTraining("O bug ICE te pegou. Bora de novo.");
    training.active = true;
    return;
  }
  if (training.player.x === training.shard.x && training.player.y === training.shard.y) {
    training.shard.collected = true;
    elements.trainingMessage.textContent = "Fragmento coletado. Agora vá ao terminal verde.";
  }
  if (training.player.x === training.terminal.x && training.player.y === training.terminal.y) {
    if (!training.shard.collected) {
      elements.trainingMessage.textContent = "Terminal bloqueado. Pegue o fragmento amarelo primeiro.";
    } else {
      training.won = true;
      elements.trainingMessage.textContent = "Tutorial completo. Agora você já sabe a lógica do ICEbreaker.";
    }
  }
  renderTraining();
}

elements.trainingStartButton.addEventListener("click", () => {
  resetTraining();
  training.active = true;
  elements.trainingGrid.focus({ preventScroll: true });
  notify("Tutorial iniciado. Use as setas ou WASD.");
});
elements.trainingResetButton.addEventListener("click", () => {
  resetTraining("Treino reiniciado.");
  notify("Tutorial reiniciado.");
});
elements.trainingTouchControls.forEach((button) => {
  button.addEventListener("click", () => {
    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    moveTraining(directions[button.dataset.trainingDirection]);
  });
});
elements.trainingGrid.addEventListener("keydown", (event) => {
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyD: { x: 1, y: 0 },
  };
  if (!directions[event.code]) return;
  event.preventDefault();
  moveTraining(directions[event.code]);
});
elements.touchControls.forEach((button) => {
  button.addEventListener("click", () => {
    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };

    game.movePlayer(directions[button.dataset.direction]);
  });
});

elements.bindingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    bindingAction = button.dataset.bind;
    elements.bindingButtons.forEach((item) => item.classList.toggle("listening", item === button));
    elements.gameMessage.textContent = `Pressione a nova tecla para ${bindingAction}.`;
  });
});

window.addEventListener("keydown", (event) => {
  if (!bindingAction) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const accepted = game.setBinding(bindingAction, event.code);
  const button = [...elements.bindingButtons].find(
    (item) => item.dataset.bind === bindingAction,
  );
  if (accepted && button) {
    button.querySelector("kbd").textContent = event.key.length === 1
      ? event.key.toUpperCase()
      : event.key;
    elements.gameMessage.textContent = "Controle remapeado para esta sessão.";
  } else {
    elements.gameMessage.textContent = "Essa tecla já está em uso. Escolha outra.";
  }
  elements.bindingButtons.forEach((item) => item.classList.remove("listening"));
  bindingAction = null;
}, true);
elements.clearLogButton.addEventListener("click", () => {
  elements.terminalLog.replaceChildren();
  addLog("buffer do terminal limpo");
  notify("Terminal limpo.");
});
elements.clearScoresButton.addEventListener("click", () => {
  clearScores();
  renderScores([]);
  addLog("registro local de pontuações removido");
  notify("Registro local removido.");
});

document.querySelectorAll("button, .protocol-toggle").forEach((control) => {
  control.addEventListener("pointerenter", () => audio.play("hover"));
  control.addEventListener("click", () => audio.play("click"));
});

async function setSoundEnabled(enabled, label = true) {
  if (enabled) {
    try {
      await audio.initialize();
    } catch {
      soundEnabled = false;
      elements.soundToggle.setAttribute("aria-pressed", "true");
      elements.quietModeButton.setAttribute("aria-pressed", "true");
      if (label) elements.soundLabel.textContent = "ÁUDIO INDISPONÍVEL";
      return false;
    }
  }

  soundEnabled = enabled;
  audio.setEnabled(enabled);
  elements.soundToggle.setAttribute("aria-pressed", String(!enabled));
  elements.quietModeButton.setAttribute("aria-pressed", String(!enabled));
  if (label) elements.soundLabel.textContent = enabled ? "ÁUDIO ATIVO" : "ÁUDIO SILENCIADO";
  return true;
}

elements.soundToggle.addEventListener("click", () => setSoundEnabled(!soundEnabled));

elements.comfortToggle.addEventListener("click", () => {
  const enabled = document.body.classList.toggle("comfort-mode");
  elements.comfortToggle.setAttribute("aria-pressed", String(enabled));
  addLog(enabled ? "modo conforto ativado" : "modo conforto desativado");
  notify(enabled ? "Modo conforto ativado." : "Modo conforto desativado.");
});

elements.liteToggle.addEventListener("click", () => {
  const enabled = document.body.classList.toggle("lite-mode");
  elements.liteToggle.setAttribute("aria-pressed", String(enabled));
  if (enabled) setSoundEnabled(false);
  addLog(enabled ? "modo leve ativado" : "modo leve desativado");
  notify(enabled ? "Modo leve ativado." : "Modo leve desativado.");
});

elements.reduceGlowButton.addEventListener("click", () => {
  const enabled = document.body.classList.toggle("reduced-glow");
  elements.reduceGlowButton.setAttribute("aria-pressed", String(enabled));
  notify(enabled ? "Brilho reduzido." : "Brilho restaurado.");
});

elements.bigControlsButton.addEventListener("click", () => {
  const enabled = document.body.classList.toggle("big-controls");
  elements.bigControlsButton.setAttribute("aria-pressed", String(enabled));
  notify(enabled ? "Controles ampliados." : "Controles restaurados.");
});

elements.quietModeButton.addEventListener("click", () => {
  const enabled = elements.quietModeButton.getAttribute("aria-pressed") !== "true";
  setSoundEnabled(!enabled);
  notify(enabled ? "Todo o áudio foi silenciado." : "Áudio reativado.");
});

[
  [elements.musicVolume, "music"],
  [elements.ambientVolume, "ambient"],
  [elements.effectsVolume, "effects"],
].forEach(([control, channel]) => {
  control.addEventListener("input", () => {
    audio.setChannelVolume(channel, Number(control.value) / 100);
  });
});

async function jackIn({ silent = false } = {}) {
  elements.jackInButton.disabled = true;
  elements.silentEntryButton.disabled = true;
  if (silent) {
    await setSoundEnabled(false);
  } else {
    try {
      await audio.initialize();
      audio.play("jackIn");
    } catch {
      soundEnabled = false;
      elements.soundToggle.setAttribute("aria-pressed", "true");
      elements.quietModeButton.setAttribute("aria-pressed", "true");
      elements.soundLabel.textContent = "ÁUDIO INDISPONÍVEL";
    }
  }

  const messages = [
    ["MEM", "preparando o gerador de senhas"],
    ["ENLACE", "canal neural seguro estabelecido"],
    ["ICE", "assinaturas de contramedidas detectadas"],
    ["DECK", "forja de credenciais montada"],
    ["PRONTO", "acesso do operador autorizado"],
  ];

  for (let index = 0; index < messages.length; index += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    const line = document.createElement("p");
    const label = document.createElement("span");
    label.textContent = messages[index][0];
    line.append(label, ` ${messages[index][1]}`);
    elements.bootLog.append(line);
    elements.bootProgress.style.width = `${((index + 1) / messages.length) * 100}%`;
  }

  document.body.classList.add("deck-online");
  window.setTimeout(() => {
    elements.bootScreen.hidden = true;
    document.querySelector("#generate-button").focus({ preventScroll: true });
  }, 850);
}

elements.jackInButton.addEventListener("click", jackIn);
elements.silentEntryButton.addEventListener("click", () => jackIn({ silent: true }));

["pointerdown", "keydown"].forEach((eventName) => {
  document.addEventListener(eventName, resetExpiryTimer, { passive: true });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    game.pause();
    audio.suspend();
  } else {
    game.resume();
    audio.resume();
  }
});

window.addEventListener("pagehide", () => {
  currentPassword = "";
  passwordUnlocked = false;
  game.destroy();
});

window.setInterval(() => {
  elements.systemClock.textContent = timestamp();
}, 1000);

try {
  const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
  if (Number.isFinite(preferences.length)) {
    elements.length.value = String(Math.min(32, Math.max(8, preferences.length)));
  }
  for (const key of ["uppercase", "lowercase", "numbers", "symbols", "excludeAmbiguous"]) {
    if (typeof preferences[key] === "boolean") elements[key].checked = preferences[key];
  }
  if (["rookie", "runner", "legend"].includes(preferences.difficulty)) {
    elements.difficulty.value = preferences.difficulty;
  }
  elements.strategicMode.checked = Boolean(preferences.strategicMode);
  setOperationMode(preferences.operationMode, { announce: false });
  setGeneratorMode(preferences.generatorMode, { announce: false });
} catch {
  setOperationMode("full", { announce: false });
  setGeneratorMode("random", { announce: false });
}

updateRange();
elements.systemClock.textContent = timestamp();
startCyberCity(elements.cityCanvas);
startDataRain(elements.backgroundCanvas);
setMission("generate");
setZone("forge", { announce: false });
renderScores();
renderProgress();
renderDaily();
resetTraining("Clique em Iniciar tutorial para ensaiar a rota.");

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    const serviceWorkerPath = "./sw.js";
    let trustedServiceWorkerPath = serviceWorkerPath;

    if (window.trustedTypes) {
      const policy = window.trustedTypes.createPolicy("netrunner-static", {
        createScriptURL(value) {
          if (value !== serviceWorkerPath) {
            throw new TypeError("Caminho de script não autorizado.");
          }
          return value;
        },
      });
      trustedServiceWorkerPath = policy.createScriptURL(serviceWorkerPath);
    }

    navigator.serviceWorker.register(trustedServiceWorkerPath).catch(() => {
      addLog("modo offline indisponível neste navegador", "warning");
    });
  });
}
