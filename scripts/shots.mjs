/**
 * Controle-screenshots met Playwright (gebruikt je geïnstalleerde Google Chrome).
 * Gebruik: npm run dev  (in een ander venster), dan: node scripts/shots.mjs [map] [--reduced]
 */
import { chromium } from 'playwright-core';
const out = process.argv[2] || 'screenshots';
const reduced = process.argv.includes('--reduced');
const url = process.env.URL || 'http://localhost:5173/';
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobiel', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: name === 'mobiel', hasTouch: name === 'mobiel' });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  // scroll stap voor stap zodat lazy beelden en scroll-animaties laden
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += vp.height * 0.5) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(250); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  // per scherm een screenshot
  const ids = await page.evaluate(() => [...document.querySelectorAll('main > section[id], .spread')].map((s) => '#' + s.id));
  for (const id of ids) {
    await page.evaluate((id) => { const el = document.querySelector(id); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY); }, id);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${out}/${name}-${id.slice(1)}.png` });
  }
  // procesweergave van elk project
  const procs = await page.evaluate(() => [...document.querySelectorAll('[data-open-process]')].map((b) => b.dataset.openProcess));
  for (const p of procs) {
    await page.evaluate((p) => document.querySelector(`[data-open-process="${p}"]`).click(), p);
    await page.waitForTimeout(1500);
    const track = page.locator(`#process-${p} .process__track`);
    const sw = await track.evaluate((t) => [t.scrollWidth, t.clientWidth, t.scrollHeight, t.clientHeight]);
    const horiz = sw[0] > sw[1] + 5;
    const total = horiz ? sw[0] : sw[2]; const view = horiz ? sw[1] : sw[3];
    let i = 0;
    for (let pos = 0; pos < total - 5 && i < 8; pos += view * 0.95, i++) {
      await track.evaluate((t, [pos, h]) => (h ? (t.scrollLeft = pos) : (t.scrollTop = pos)), [pos, horiz]);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${out}/${name}-proces-${p}-${i + 1}.png` });
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen console-fouten.');
