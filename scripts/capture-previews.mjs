import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
await mkdir("assets/screenshots", { recursive: true });

const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await desktop.goto(baseURL);
await desktop.screenshot({
  path: "assets/netrunner-password-lab-preview.png",
  fullPage: false,
});
await desktop.getByRole("button", { name: "CONECTAR" }).click();
await desktop.locator("#boot-screen").waitFor({ state: "hidden" });
await desktop.getByRole("button", { name: /Gerar Senha Criptografada/ }).click();
await desktop.locator(".dashboard").screenshot({
  path: "assets/screenshots/laboratorio-desktop.png",
});
await desktop.locator(".game-section").screenshot({
  path: "assets/screenshots/icebreaker-desktop.png",
});

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(baseURL);
await mobile.getByRole("button", { name: "CONECTAR" }).click();
await mobile.locator("#boot-screen").waitFor({ state: "hidden" });
await mobile.getByRole("button", { name: /Gerar Senha Criptografada/ }).click();
await mobile.locator(".game-section").scrollIntoViewIfNeeded();
await mobile.screenshot({
  path: "assets/screenshots/mobile-390x844.png",
  fullPage: true,
});

await browser.close();
console.log("Capturas atualizadas.");
