/**
 * Animaties — fase 3
 * GSAP + ScrollTrigger + SplitText voor beweging, Lenis voor smooth scroll.
 *
 * Regels:
 *  - alleen transform en opacity animeren (60 fps)
 *  - prefers-reduced-motion → geen animaties, alles meteen zichtbaar
 *  - mobiel (< 901px of touch) → lichtere variant: geen parallax, cursor of magnetisme
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const EASE = 'expo.out';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width: 901px) and (pointer: fine)').matches;

export async function init() {
  const root = document.documentElement;
  if (reduced) {
    root.classList.remove('is-loading');
    return;
  }
  await document.fonts?.ready; // eerst fonts, anders splitst SplitText op de verkeerde breedtes

  const lenis = smoothScroll();
  intro();
  revealText();
  revealMedia();
  sections();
  spreads();
  processMotion(lenis);
  navOnScroll();
  if (desktop) {
    cursor();
    magnetic();
  }
  ScrollTrigger.refresh();
}

/* ---------------------------------------------------------------------------
   Smooth scroll (Lenis) — gekoppeld aan de GSAP-ticker
--------------------------------------------------------------------------- */
function smoothScroll() {
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // ankerlinks via Lenis (met de juiste easing)
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
      history.replaceState(null, '', id);
    })
  );
  return lenis;
}

/* ---------------------------------------------------------------------------
   1. Intro: lijn tekent zich + teller → 'Portfolio' komt letter per letter op
--------------------------------------------------------------------------- */
function intro() {
  const root = document.documentElement;
  const loader = $('.loader');
  const line = $('.loader__line');
  const count = $('.loader__count');
  const hero = $('.hero');
  // de lijn van de loader ligt exact op de lijn van de hero
  loader.style.setProperty('--y', getComputedStyle(hero).getPropertyValue('--hero-line-y') || '34%');

  const chars = new SplitText('.hero__portfolio', { type: 'chars', mask: 'chars' }).chars;
  const name = new SplitText('.hero__name', { type: 'chars', mask: 'chars' }).chars;
  const counter = { v: 0 };

  gsap.set('.hero__frame-cover', { x: 0, xPercent: 0 });
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  tl.set([chars, name], { yPercent: 110 })
    .set(['.hero__tagline', '.hero__foot > *'], { autoAlpha: 0, y: 24 })
    .to(line, { scaleX: 1, duration: 1.4, ease: 'power3.inOut' }, 0)
    .to(counter, {
      v: 100, duration: 1.4, ease: 'power3.inOut',
      onUpdate: () => (count.textContent = Math.round(counter.v)),
    }, 0)
    .to(count, { autoAlpha: 0, y: -20, duration: 0.5 }, 1.45)
    .to(loader, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 1.5)
    .add(() => root.classList.remove('is-loading'), 1.5)
    .to('.hero__frame-cover', { xPercent: 101, duration: 1.6, ease: 'power3.inOut' }, 1.5)
    .to(chars, { yPercent: 0, duration: 1.3, stagger: 0.045 }, 1.55)
    .to(name, { yPercent: 0, duration: 1.1, stagger: 0.025 }, 1.9)
    .to('.hero__tagline', { autoAlpha: 1, y: 0, duration: 1 }, 2.2)
    .to('.hero__foot > *', { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 2.3)
    .from('.brand-dot', { scale: 0, duration: 0.8, ease: 'back.out(2)' }, 2.5)
    .from('.nav__brand, .nav__toggle, .nav__menu li', { autoAlpha: 0, y: -12, duration: 0.8, stagger: 0.06, clearProps: 'all' }, 2.2);

  // subtiele parallax bij het wegscrollen van de hero (alleen desktop)
  if (desktop) {
    gsap.to('.hero__title', {
      yPercent: -18, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

/* ---------------------------------------------------------------------------
   2. Tekst: titels per letter/regel, lopende tekst per regel uit een masker
--------------------------------------------------------------------------- */
function revealText() {
  // grote titels: per regel, uit een masker omhoog
  $$('.section__title, .about__name, .contact__lead').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110, duration: 1.3, ease: EASE, stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }),
    });
  });

  // lopende tekst en koppen: per regel
  const blocks = '.about__intro, .about__grid p, .about__grid h3, .section__kicker, .skills h3';
  $$(blocks).forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 100, duration: 1, ease: EASE, stagger: 0.06,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });

  // lijstjes (interesses, feiten, soft skills): zacht omhoog
  $$('.chips, .facts').forEach((list) =>
    gsap.from(list.children, {
      autoAlpha: 0, y: 16, duration: 0.8, ease: EASE, stagger: 0.05,
      scrollTrigger: { trigger: list, start: 'top 90%', once: true },
    })
  );
}

/* ---------------------------------------------------------------------------
   3. Beelden: een 'gordijn' in de achtergrondkleur schuift weg (transform),
      het beeld zelf zoomt licht uit
--------------------------------------------------------------------------- */
function revealMedia() {
  const targets = $$('.about__visual, .ov-card__media');
  targets.forEach((wrap) => {
    const cover = document.createElement('span');
    cover.className = 'cover';
    cover.setAttribute('aria-hidden', 'true');
    wrap.append(cover);
    const img = $('img', wrap);
    const tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    tl.to(cover, { yPercent: -101, duration: 1.4, ease: 'expo.inOut' }).from(img, { scale: 1.18, duration: 1.8, ease: EASE, clearProps: 'transform' }, 0.15);
  });

  // portret: lichte parallax binnen de kaart
  if (desktop) {
    gsap.to('.about__portrait img', {
      yPercent: -6, ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/* ---------------------------------------------------------------------------
   4. Secties: lijnen tekenen zich, kaarten en bolletjes komen gestaffeld op
--------------------------------------------------------------------------- */
function sections() {
  // horizontale lijnen onder sectiekoppen tekenen zich van links naar rechts
  $$('.section__head').forEach((head) =>
    gsap.from(head, {
      '--rule': 0, duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: head, start: 'top 85%', once: true },
    })
  );

  // over mij: kaart schuift zacht omhoog
  gsap.from('.about__card', {
    y: 60, autoAlpha: 0, duration: 1.4, ease: EASE,
    scrollTrigger: { trigger: '.about', start: 'top 80%', once: true },
  });

  // aanbod: rijen gestaffeld, nummers tellen niet maar 'klikken' op hun plaats
  gsap.from('.service', {
    y: 40, autoAlpha: 0, duration: 1.1, ease: EASE, stagger: { each: 0.08, grid: 'auto' },
    scrollTrigger: { trigger: '.services__list', start: 'top 85%', once: true },
  });

  // projectoverzicht: kaarten komen na elkaar op
  gsap.from('.ov-card', {
    y: 80, autoAlpha: 0, duration: 1.3, ease: EASE, stagger: 0.1,
    scrollTrigger: { trigger: '.overview', start: 'top 85%', once: true },
  });

  // skills: bolletjes vullen zich één voor één
  $$('.skill').forEach((row, i) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 92%', once: true } });
    tl.from(row, { autoAlpha: 0, y: 20, duration: 0.8, ease: EASE })
      .from($$('.dot', row), { scale: 0, duration: 0.5, ease: 'back.out(2.5)', stagger: 0.06 }, 0.15);
  });

  // contact: lijn tekent zich, bolletje 'valt' op zijn plaats
  gsap.set('.contact__row-cover', { x: 0, xPercent: 0 });
  const contact = gsap.timeline({ scrollTrigger: { trigger: '.contact__row', start: 'top 90%', once: true } });
  contact
    .to('.contact__row-cover', { xPercent: 101, duration: 1.6, ease: 'expo.inOut' })
    .from('.contact__dot', { scale: 0, duration: 0.9, ease: 'back.out(2)' }, 0.3)
    .from('.contact__title, .contact__mail', { yPercent: 60, autoAlpha: 0, duration: 1.1, ease: EASE, stagger: 0.1 }, 0.4)
    .from('.contact__links li', { y: 20, autoAlpha: 0, duration: 0.9, ease: EASE, stagger: 0.07 }, 0.7);
}

/* ---------------------------------------------------------------------------
   5. Project-spreads: titel per letter, product met parallax, glazen kaart
--------------------------------------------------------------------------- */
function spreads() {
  $$('.spread').forEach((spread) => {
    const title = $('.spread__title', spread);
    const split = new SplitText(title, { type: 'chars', mask: 'chars' });
    const img = $('.spread__img img', spread);
    const card = $('.spread__card', spread);

    const tl = gsap.timeline({ scrollTrigger: { trigger: spread, start: 'top 65%', once: true } });
    tl.from($('.spread__num', spread), { yPercent: 100, autoAlpha: 0, duration: 1.1, ease: EASE })
      .from(split.chars, { yPercent: 115, duration: 1.2, ease: EASE, stagger: 0.035 }, 0.05)
      .from(img, { autoAlpha: 0, scale: 0.92, y: 50, duration: 1.6, ease: EASE }, 0.1)
      .from(card, { autoAlpha: 0, y: 70, duration: 1.3, ease: EASE }, 0.35)
      .from($$('.spread__goal > *, .keywords li, .meta > div, .btn', card), { autoAlpha: 0, y: 18, duration: 0.9, ease: EASE, stagger: 0.06 }, 0.55);

    if (desktop) {
      // product beweegt trager dan de pagina → diepte
      gsap.fromTo(img, { yPercent: 8 }, {
        yPercent: -8, ease: 'none',
        scrollTrigger: { trigger: spread, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      // titel net iets sneller dan de pagina
      gsap.to(title, {
        yPercent: -30, ease: 'none',
        scrollTrigger: { trigger: spread, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  });
}

/* ---------------------------------------------------------------------------
   6. Procesweergave: hoofdstukken komen op tijdens het horizontaal scrollen,
      exploded view van de luchtreiniger schuift uit elkaar
--------------------------------------------------------------------------- */
function processMotion(lenis) {
  const built = new WeakSet();

  window.addEventListener('process:open', ({ detail: dlg }) => {
    lenis.stop();
    const track = $('.process__track', dlg);
    const horizontal = track.scrollWidth > track.clientWidth + 4;

    // kop en kaart bij het openen
    gsap.fromTo($('.process__card', dlg), { autoAlpha: 0, x: horizontal ? 120 : 0, y: horizontal ? 0 : 40 }, { autoAlpha: 1, x: 0, y: 0, duration: 1.2, ease: EASE });
    gsap.fromTo($$('.process__head > *', dlg), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.06 });

    if (built.has(dlg)) { ScrollTrigger.refresh(); return; }
    built.add(dlg);

    $$('.ch', dlg).forEach((ch) => {
      const items = $$('.ch__copy > *, .ch__fig, .step, .feature', ch);
      gsap.from(items, {
        autoAlpha: 0, [horizontal ? 'x' : 'y']: 60, duration: 1.1, ease: EASE, stagger: 0.07,
        scrollTrigger: {
          trigger: ch, scroller: track, horizontal,
          start: horizontal ? 'left 85%' : 'top 85%', once: true,
        },
      });
    });

    explodedView(dlg, track, horizontal);
  });

  window.addEventListener('process:close', () => lenis.start());
}

/** Snijdt de verticale exploded view in banden die met de scroll uit elkaar schuiven. */
function explodedView(dlg, track, horizontal) {
  const fig = $('.ch--parts .ch__fig--1', dlg);
  if (!fig || !desktop || !horizontal) return;
  const img = $('img', fig);
  const src = img.currentSrc || img.src;
  const BANDS = 9;
  const stack = document.createElement('div');
  stack.className = 'exploded';
  stack.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < BANDS; i++) {
    const band = document.createElement('span');
    band.style.setProperty('--i', i);
    band.style.setProperty('--n', BANDS);
    band.style.backgroundImage = `url("${src}")`;
    stack.append(band);
  }
  fig.append(stack);
  fig.classList.add('is-exploding');
  // stapel exact even groot als het (object-fit: contain) beeld
  const size = () => {
    const r = img.naturalWidth / img.naturalHeight || 0.15;
    const fw = fig.clientWidth, fh = fig.clientHeight;
    const h = Math.min(fh, fw / r), w = h * r;
    stack.style.setProperty('--w', `${w}px`);
    stack.style.setProperty('--h', `${h}px`);
  };
  img.complete ? size() : img.addEventListener('load', size, { once: true });
  addEventListener('resize', size);
  const bands = $$('span', stack);
  gsap.fromTo(bands, { y: (i) => (i - (BANDS - 1) / 2) * -14 }, {
    y: (i) => (i - (BANDS - 1) / 2) * 16, ease: 'none',
    scrollTrigger: { trigger: $('.ch--parts', dlg), scroller: track, horizontal: true, start: 'left right', end: 'center center', scrub: 0.6 },
  });
}

/* ---------------------------------------------------------------------------
   7. Navigatie verbergt zich bij naar beneden scrollen
--------------------------------------------------------------------------- */
function navOnScroll() {
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 'top -120',
    onUpdate: (self) => nav.classList.toggle('is-hidden', self.direction === 1 && !$('.nav__menu.is-open')),
  });
}

/* ---------------------------------------------------------------------------
   8. Eigen cursor (alleen desktop): klein merkrood bolletje,
      groeit met label boven projecten
--------------------------------------------------------------------------- */
function cursor() {
  const c = $('.cursor');
  const label = $('.cursor__label', c);
  document.documentElement.classList.add('has-cursor');
  const x = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); gsap.to(c, { autoAlpha: 1, duration: 0.3 }); });
  document.addEventListener('pointerleave', () => gsap.to(c, { autoAlpha: 0, duration: 0.3 }));

  const set = (state, text = '') => { c.dataset.state = state; label.textContent = text; };
  // een open <dialog> ligt in de 'top layer': cursor tijdelijk daarin verhuizen
  addEventListener('process:open', ({ detail }) => detail.append(c));
  addEventListener('process:close', () => document.body.append(c));
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, [data-open-process]');
    if (!t) return set('');
    if (t.dataset.cursor) return set('label', t.dataset.cursor);
    set('link');
  });
}

/* ---------------------------------------------------------------------------
   9. Magnetische knoppen
--------------------------------------------------------------------------- */
function magnetic() {
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.3);
      y((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}
