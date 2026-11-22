// Renders apps/web/public/icons/icon.svg to the PNG sizes used by the manifest.
// Usage: node scripts/generate-icons.mjs   (uses the Playwright Chromium already installed)
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const dir = path.join(import.meta.dirname, '../apps/web/public/icons');
const svg = readFileSync(path.join(dir, 'icon.svg'), 'utf8');

const targets = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0, square: true },
  { file: 'icon-512-maskable.png', size: 512, pad: 0.12, square: true },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  const body = t.square
    ? `<div style="width:${t.size}px;height:${t.size}px;background:#fbf3ef;display:grid;place-items:center">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `).replace('rx="112"', 'rx="0"')}</div>`
    : svg.replace('<svg ', `<svg width="${t.size}" height="${t.size}" `);
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${body}</body></html>`,
  );
  await page.screenshot({
    path: path.join(dir, t.file),
    omitBackground: true,
    clip: { x: 0, y: 0, width: t.size, height: t.size },
  });
  console.log('wrote', t.file);
}
await browser.close();
