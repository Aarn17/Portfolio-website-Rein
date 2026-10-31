/**
 * Zet de inhoud uit src/data/*.json om naar statische HTML.
 * Wordt door vite.config.js gebruikt, zowel tijdens `npm run dev` als `npm run build`.
 * Zo staat alle tekst gewoon in de HTML (goed voor SEO en snelheid).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
/** Basispad (bv. /Portfolio-Rein/ op GitHub Pages). */
const BASE = (process.env.BASE || '/').replace(/\/?$/, '/');
const url = (p) => BASE + p.replace(/^\//, '');

/* ---------- Beelden ---------- */
let manifest = {};
function loadManifest() {
  manifest = read('public/images/manifest.json');
}

/**
 * <picture> met AVIF, WebP en JPG-fallback, in twee breedtes.
 * @param {string} name   naam uit manifest.json
 * @param {string} alt    alt-tekst
 * @param {object} o      { sizes, eager, cls }
 */
function picture(name, alt, o = {}) {
  const m = manifest[name];
  if (!m) throw new Error(`Beeld "${name}" ontbreekt in public/images/manifest.json`);
  const sizes = o.sizes || '(min-width: 1024px) 40vw, 90vw';
  const set = (ext) => m.sizes.map((w) => `${url(`images/${name}-${w}.${ext}`)} ${w}w`).join(', ');
  const big = m.sizes[m.sizes.length - 1];
  const h = Math.round((m.h / m.w) * big);
  return `<picture class="${o.cls || ''}">
    <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
    <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
    <img src="${url(`images/${name}-${m.sizes[0]}.jpg`)}" srcset="${set('jpg')}" sizes="${sizes}" width="${big}" height="${h}" alt="${esc(alt)}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
  </picture>`;
}

const icon = (t) =>
  `<span class="tool${t.iconOnly ? ' tool--logo' : ''}"><img src="${url(`images/icons/${t.icon}.webp`)}" alt="${t.iconOnly ? esc(t.name) : ''}" class="tool__icon" loading="lazy" decoding="async">${t.iconOnly ? '' : `<span>${esc(t.name)}</span>`}</span>`;

/* ---------- Secties ---------- */
function dots(score) {
  // 5 bolletjes; .5 = half gevuld (zoals in de PDF)
  let out = '';
  for (let i = 1; i <= 5; i++) {
    const cls = score >= i ? 'is-full' : score >= i - 0.5 ? 'is-half' : '';
    out += `<span class="dot ${cls}"></span>`;
  }
  return `<span class="dots" role="img" aria-label="${score} op 5">${out}</span>`;
}

function overviewCards(projects) {
  return projects
    .map(
      (p, i) => `<li class="ov-card" style="--accent:${p.accent};--bg:${p.bg}">
      <a href="#project-${p.id}" class="ov-card__link" data-cursor="Bekijk">
        <span class="ov-card__frame" aria-hidden="true"></span>
        <span class="ov-card__num num">${pad(i + 1)}</span>
        <span class="ov-card__media">${picture(p.hero.image, '', { sizes: '(min-width: 1024px) 22vw, 45vw' })}</span>
        <span class="ov-card__title">${esc(p.title)}</span>
      </a>
    </li>`
    )
    .join('');
}

function projectSpread(p, i, total) {
  const n = pad(i + 1);
  const pager = Array.from({ length: total }, (_, k) => `<span class="${k === i ? 'is-active' : ''}"></span>`).join('');
  return `<article class="spread" id="project-${p.id}" data-theme="${p.theme}" style="--accent:${p.accent};--accent-soft:${p.accentSoft};--bg:${p.bg}" aria-labelledby="title-${p.id}">
    <div class="spread__tab" aria-hidden="true"></div>
    <span class="spread__num num" aria-hidden="true">${n}</span>
    <div class="spread__media">${picture(p.hero.image, p.hero.alt, { sizes: '(min-width: 1024px) 45vw, 100vw', cls: 'spread__img' })}</div>
    <h3 class="spread__title display" id="title-${p.id}"><span class="visually-hidden">Project ${n}: </span>${esc(p.title)}</h3>
    <div class="spread__card glass">
      <div class="spread__goal">
        <h4 class="h-strong">Ontwerpdoel</h4>
        <p class="lead">${esc(p.goal)}</p>
      </div>
      <ul class="keywords" aria-label="Kernwoorden">${p.keywords.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
      <dl class="meta">
        <div><dt>Team</dt><dd>${esc(p.meta.team)}</dd></div>
        <div><dt>Duur</dt><dd>${esc(p.meta.duur)}</dd></div>
        <div><dt>Jaar</dt><dd>${esc(p.meta.jaar)}</dd></div>
      </dl>
      <button class="btn btn--accent" type="button" data-open-process="${p.id}" aria-haspopup="dialog" data-magnetic>
        <span>Bekijk het proces</span><span class="btn__arrow" aria-hidden="true">→</span>
      </button>
    </div>
    <div class="spread__pager" aria-hidden="true">${pager}</div>
  </article>`;
}

/* Hoofdstukken in de procesweergave */
function chapter(c, p) {
  const imgs = (c.images || [])
    .map(
      (im, k) =>
        `<figure class="ch__fig ch__fig--${k + 1}${im.annotations ? ' has-notes' : ''}">${picture(im.name, im.alt, { sizes: '(min-width: 1024px) 35vw, 85vw' })}${
          im.annotations ? `<figcaption class="notes">${im.annotations.map((a) => `<span class="note">${esc(a)}</span>`).join('')}</figcaption>` : ''
        }</figure>`
    )
    .join('');
  const head = c.title ? `<h4 class="ch__title h-light">${esc(c.title)}</h4>` : '';
  const text = c.text ? `<p class="ch__text body">${esc(c.text)}</p>` : '';
  const list = c.list
    ? `<div class="ch__list"><h5 class="h-light">${esc(c.list.title)}</h5><ul>${c.list.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`
    : '';
  const steps = c.steps
    ? `<ol class="steps">${c.steps
        .map(
          (s) => `<li class="step">
            <div class="step__media">${s.images.map((im) => `<figure>${picture(im.name, im.alt, { sizes: '(min-width: 1024px) 25vw, 70vw' })}</figure>`).join('')}</div>
            <span class="step__n num" aria-hidden="true">${s.n}</span>
            <p class="step__text body">${esc(s.text)}</p>
            ${s.note ? `<p class="step__note body">${esc(s.note)}</p>` : ''}
          </li>`
        )
        .join('')}</ol>`
    : '';
  const features = c.features
    ? `<div class="features">${c.features
        .map(
          (f) => `<div class="feature">
            <figure>${picture(f.image.name, f.image.alt, { sizes: '(min-width: 1024px) 22vw, 70vw' })}${f.annotation ? `<figcaption class="notes"><span class="note">${esc(f.annotation)}</span></figcaption>` : ''}</figure>
            <h5 class="h-light">${esc(f.title)}</h5>
            <p class="body">${esc(f.text)}</p>
          </div>`
        )
        .join('')}</div>`
    : '';
  const parts = c.parts
    ? `<ol class="parts" aria-label="Onderdelen">${c.parts.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`
    : '';
  const tools = c.tools ? `<div class="ch__tools">${c.tools.map(icon).join('')}</div>` : '';
  return `<section class="ch ch--${c.layout}">
    <div class="ch__copy">${head}${text}${list}${parts}${tools}</div>
    ${steps}${features}${imgs ? `<div class="ch__media">${imgs}</div>` : ''}
  </section>`;
}

function processDialog(p, i) {
  return `<dialog class="process" data-lenis-prevent id="process-${p.id}" data-theme="${p.theme}" style="--accent:${p.accent};--accent-soft:${p.accentSoft};--bg:${p.bg}" aria-labelledby="process-title-${p.id}">
    <div class="process__inner">
      <header class="process__head">
        <span class="process__num num" aria-hidden="true">${pad(i + 1)}</span>
        <h3 class="process__title" id="process-title-${p.id}">${esc(p.title)} <span>— proces</span></h3>
        <button class="process__close" type="button" data-close-process aria-label="Sluit procesweergave">Sluiten <span aria-hidden="true">×</span></button>
      </header>
      <div class="process__track" tabindex="0" autofocus aria-label="Proces van ${esc(p.title)}, scroll horizontaal">
        <div class="process__card">${p.chapters.map((c) => chapter(c, p)).join('')}</div>
      </div>
      <p class="process__hint" aria-hidden="true">Scroll →</p>
    </div>
  </dialog>`;
}

export function renderAll() {
  loadManifest();
  const site = read('src/data/site.json');
  const { projects } = read('src/data/projects.json');
  const c = site.contact;

  const skills = site.digitalSkills
    .map((s) => `<li class="skill">${icon(s)}${dots(s.score)}</li>`)
    .join('');

  const services = site.services
    .map(
      (s, i) => `<li class="service">
        <span class="service__num num">${pad(i + 1)}</span>
        <h3 class="service__title">${esc(s.title)}</h3>
        <p class="service__text body">${esc(s.text)}</p>
      </li>`
    )
    .join('');

  return {
    SITE_NAME: esc(site.name),
    TAGLINE: esc(site.tagline),
    ROLE: esc(site.role),
    ROLE_NL: esc(site.roleNl),
    FIRST_NAME: esc(site.firstName),
    DISCIPLINE: esc(site.discipline),
    PERIOD: esc(site.period),
    SELECTED: esc(site.selectedWorks),
    INTRO: esc(site.intro),
    VISION: esc(site.vision),
    PORTRAIT: picture('about-portrait', `Portret van ${site.name}`, { sizes: '(min-width: 1024px) 24vw, 80vw', cls: 'about__portrait' }),
    EDUCATION: [...site.education, ...site.experience]
      .map((e) => `<div><dt>${esc(e.label)}</dt><dd>${esc(e.title)}<span>${esc(e.place)}</span></dd></div>`)
      .join(''),
    SKILLS: skills,
    SOFT_SKILLS: site.softSkills.map((s) => `<li>${esc(s)}</li>`).join(''),
    INTERESTS: site.interests.map((s) => `<li>${esc(s)}</li>`).join(''),
    SERVICES: services,
    OVERVIEW: overviewCards(projects),
    SPREADS: projects.map((p, i) => projectSpread(p, i, projects.length)).join(''),
    DIALOGS: projects.map((p, i) => processDialog(p, i)).join(''),
    EMAIL: esc(c.email),
    PHONE: esc(c.phone),
    PHONE_HREF: esc(c.phone.replace(/\s/g, '')),
    LINKEDIN: esc(c.linkedin),
    LOCATION: esc(c.location),
    PDF: esc(url(c.portfolioPdf)),
    BASE: BASE,
    YEAR: String(new Date().getFullYear()),
  };
}

/** Vervangt {{SLEUTEL}} in index.html door de gegenereerde HTML. */
export function fill(html) {
  const data = renderAll();
  return html.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in data ? data[k] : m));
}
