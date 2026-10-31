/**
 * Rein Lasure — portfolio
 * Fase 1–2: interactie zonder animaties (menu, procesweergave, actieve sectie).
 * Animaties (GSAP, ScrollTrigger, Lenis) komen in src/motion.js (fase 3).
 */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Mobiel menu ---------- */
const toggle = $('.nav__toggle');
const menu = $('#nav-menu');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
});
$$('#nav-menu a').forEach((a) =>
  a.addEventListener('click', () => {
    toggle?.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
  })
);

/* ---------- Hero: lijn exact door het midden van 'Portfolio' ---------- */
function placeHeroLine() {
  const hero = $('.hero');
  const word = $('.hero__portfolio');
  if (!hero || !word) return;
  const h = hero.getBoundingClientRect();
  const w = word.getBoundingClientRect();
  // In de PDF loopt de lijn op ~60% van de letterhoogte
  hero.style.setProperty('--hero-line-y', `${w.top - h.top + w.height * 0.56}px`);
}
placeHeroLine();
addEventListener('resize', placeHeroLine);
document.fonts?.ready.then(placeHeroLine);

/* ---------- Actieve sectie: nav + paginabolletjes ---------- */
const sections = $$('main > section[id]');
const pagerDots = $$('.pager li');
const navLinks = $$('.nav__menu a');
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      pagerDots.forEach((d) => d.classList.toggle('is-active', d.dataset.target === id));
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    });
  },
  { rootMargin: '-45% 0px -45% 0px' }
);
sections.forEach((s) => io.observe(s));

/* ---------- Procesweergave (dialog) ---------- */
let lastTrigger = null;
$$('[data-open-process]').forEach((btn) =>
  btn.addEventListener('click', () => {
    const dlg = $(`#process-${btn.dataset.openProcess}`);
    if (!dlg) return;
    lastTrigger = btn;
    dlg.showModal();
    document.documentElement.classList.add('has-dialog');
    $('.process__track', dlg).scrollTo({ left: 0, top: 0 });
    window.dispatchEvent(new CustomEvent('process:open', { detail: dlg }));
  })
);
$$('.process').forEach((dlg) => {
  $('[data-close-process]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => {
    document.documentElement.classList.remove('has-dialog');
    lastTrigger?.focus();
    window.dispatchEvent(new CustomEvent('process:close', { detail: dlg }));
  });
  // Klik op de achtergrond (buiten de kaart) sluit niet: voorkomt per ongeluk sluiten.

  // Verticale scroll (muiswiel) → horizontaal op desktop
  const track = $('.process__track', dlg);
  track.addEventListener(
    'wheel',
    (e) => {
      if (track.scrollWidth <= track.clientWidth) return; // mobiel: verticaal
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY;
      }
    },
    { passive: false }
  );
  // Pijltjestoetsen
  track.addEventListener('keydown', (e) => {
    if (track.scrollWidth <= track.clientWidth) return;
    const step = track.clientWidth * 0.6;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); track.scrollBy({ left: step }); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); track.scrollBy({ left: -step }); }
  });
});

/* ---------- Animaties laden (fase 3) ---------- */
import('./motion.js')
  .then((m) => m.init?.())
  .catch((err) => {
    // animaties mogen de site nooit blokkeren: loader weg, inhoud zichtbaar
    console.error('Animaties konden niet starten:', err);
    document.documentElement.classList.remove('is-loading');
  });
