import { chromium } from "@playwright/test";

const baseURL = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const browser = await chromium.launch();

for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.goto(`${baseURL}/assets/favicon.svg`);
  await page.screenshot({
    path: `assets/icon-${size}.png`,
    omitBackground: false,
  });
}

await browser.close();
console.log("Ícones PWA atualizados.");
