// Legt frames van de intro vast + een reduced-motion-controle.
import { chromium } from 'playwright-core';
const out = process.argv[2];
const b = await chromium.launch({ channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://localhost:5173/');
for (const t of [400, 1200, 1900, 2400, 3600]) { await p.waitForTimeout(t - (globalThis.last || 0)); globalThis.last = t; await p.screenshot({ path: `${out}/intro-${t}.png` }); }
// reduced motion: alles moet meteen zichtbaar zijn, geen loader
const r = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
await r.goto('http://localhost:5173/'); await r.waitForTimeout(600);
await r.screenshot({ path: `${out}/reduced-top.png` });
const state = await r.evaluate(() => ({ loading: document.documentElement.classList.contains('is-loading'), loaderVisible: getComputedStyle(document.querySelector('.loader')).display, lenis: document.documentElement.classList.contains('lenis'), cursor: document.documentElement.classList.contains('has-cursor') }));
await r.evaluate(() => document.querySelector('#contact').scrollIntoView()); await r.waitForTimeout(400);
await r.screenshot({ path: `${out}/reduced-contact.png` });
console.log('reduced motion:', JSON.stringify(state));
console.log(errs.length ? 'FOUTEN: ' + errs.join(' | ') : 'Geen fouten.');
await b.close();
