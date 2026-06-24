import { readFile, access } from "node:fs/promises";

const files = [
  "index.html",
  "404.html",
  "css/404.css",
  "css/style.css",
  "js/app.js",
  "js/audio.js",
  "js/game.js",
  "js/password.js",
  "js/scores.js",
  "js/visuals.js",
  "manifest.webmanifest",
  "sw.js",
  "playwright.config.js",
];

await Promise.all(files.map((file) => access(file)));

const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
const combined = sources.join("\n");
const forbidden = [
  /\.innerHTML\b/,
  /\.outerHTML\b/,
  /insertAdjacentHTML\s*\(/,
  /\beval\s*\(/,
  /new\s+Function\s*\(/,
  /document\.write\s*\(/,
  /localStorage\.(?:setItem|getItem)\(\s*["'][^"']*(?:password|senha|token|secret|session|auth)/i,
  /sessionStorage\./,
  /<script[^>]+src=["']https?:\/\//i,
  /\son[a-z]+=["']/i,
];

for (const pattern of forbidden) {
  if (pattern.test(combined)) {
    throw new Error(`Padrão inseguro encontrado: ${pattern}`);
  }
}

const index = sources[0];
if (!index.includes("Content-Security-Policy")) {
  throw new Error("Content Security Policy ausente.");
}
if (!index.includes('lang="pt-BR"')) {
  throw new Error("Idioma principal não está definido como pt-BR.");
}

const ids = [...index.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, position) => ids.indexOf(id) !== position);
if (duplicateIds.length) {
  throw new Error(`IDs duplicados: ${[...new Set(duplicateIds)].join(", ")}`);
}

JSON.parse(await readFile("manifest.webmanifest", "utf8"));

const workflows = await Promise.all(
  [".github/workflows/pages.yml", ".github/workflows/codeql.yml"].map((file) =>
    readFile(file, "utf8"),
  ),
);
for (const workflow of workflows) {
  const mutableAction = workflow.match(/uses:\s+[^@\s]+@(?![a-f0-9]{40}\b)[^\s#]+/i);
  if (mutableAction) {
    throw new Error(`GitHub Action não fixada por SHA: ${mutableAction[0]}`);
  }
}

console.log("Validação estrutural e de segurança concluída.");
