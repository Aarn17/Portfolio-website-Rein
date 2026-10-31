# Portfolio Rein Lasure

Onepager-portfolio voor Rein Lasure, student Productontwikkeling (Universiteit Antwerpen).
Gebouwd met **Vite** + gewone HTML/CSS/JS, **GSAP** (ScrollTrigger, SplitText) en **Lenis**.

Live: https://aarn17.github.io/Portfolio-website-Rein/

---

## Lokaal starten

Je hebt [Node.js](https://nodejs.org) (versie 20 of nieuwer) nodig.

```bash
npm install      # eenmalig
npm run dev      # start op http://localhost:5173
```

Andere commando's:

| Commando | Wat het doet |
|---|---|
| `npm run build` | maakt de productieversie in `dist/` |
| `npm run preview` | bekijkt die productieversie lokaal |
| `npm run shots` | maakt screenshots (desktop + mobiel) met Playwright, terwijl `npm run dev` draait |

## Mapstructuur

```
index.html              sjabloon van de pagina ({{...}} wordt ingevuld uit de data)
build/render.js         zet de JSON-data om naar HTML (secties, projecten, beelden)
src/data/site.json      jouw gegevens: intro, visie, skills, diensten, contact
src/data/projects.json  alle projecten (volgorde = volgorde op de site)
src/main.js             menu, procesweergave, actieve sectie
src/motion.js           alle animaties
src/styles/             tokens.css (huisstijl) · base · sections · process · responsive · motion
public/images/          geoptimaliseerde beelden (AVIF, WebP, JPG) + manifest.json
public/fonts/           Coolvetica-fontbestanden (zie LEESMIJ.txt) + fonts.css
public/downloads/       portfolio-PDF
```

## Teksten aanpassen

Alles staat in `src/data/site.json` en `src/data/projects.json`. Opslaan is genoeg: de pagina herlaadt vanzelf.
Waarden met `PLACEHOLDER` (stagebedrijf, telefoon, LinkedIn) moeten nog ingevuld worden.

## Een nieuw project toevoegen

1. **Beelden** — exporteer ze als JPG/PNG en zet ze om naar web-formaten met dezelfde naamgeving als de bestaande
   (`<naam>-<breedte>.avif/.webp/.jpg`, bv. `lamp-hero-800.avif` en `lamp-hero-1600.avif`) in `public/images/`.
   Voeg in `public/images/manifest.json` een regel toe:
   ```json
   "lamp-hero": { "w": 1600, "h": 1200, "sizes": [800, 1600] }
   ```
   Tip: [Squoosh](https://squoosh.app) maakt AVIF/WebP in de browser.
2. **Project** — kopieer in `src/data/projects.json` een bestaand project en pas aan:
   - `id` (kort, zonder spaties), `title`, `goal`, `keywords` (3), `meta` (team/duur/jaar)
   - `theme` + `accent` + `accentSoft` + `bg`: gebruik enkel kleuren uit de huisstijl (`tokens.css`)
   - `hero.image` = naam uit het manifest
   - `chapters`: elk hoofdstuk heeft een `title`, `text`, `images` en een `layout`
     (`media-side`, `media-wide`, `sketches`, `grid-3x2`, `grid-2x2-plus`, `steps`, `features`, `prototypes`,
     `brand`, `analysis`, `prints`, `final`, `parts`, `reference`, `workspace`, `triptych`).
3. Opslaan — nummering, overzichtskaart, spread en procesweergave worden automatisch gemaakt.

## Huisstijl

Exact overgenomen uit de portfolio-PDF (kleuren gemeten op pixelniveau, zie `src/styles/tokens.css`).

| Rol | Kleur |
|---|---|
| Achtergrond rosé / mauve / blush / ijsblauw | `#ECE3E6` / `#E8DCE1` / `#F3E7EB` / `#D8E6EE` |
| Binnenkaart | `#F0F0F0` |
| Tekst / lijnen | `#000000` / `#231F20` |
| Merkrood | `#A2143A` |
| Schiller | `#ED4583` (zacht `#EEB6CB`) |
| Luchtreiniger | `#D28DBA` (zacht `#EBCDD9`) |
| Dierenspotter | `#363545` (zacht `#868D97`) |
| Koffiemachine | `#5E8BA8` (zacht `#AEC5D3`) |

**Font:** Coolvetica (Typodermic) — ExtraLight voor titels en lopende tekst, Light voor tussenkoppen,
Book voor nummers en kernwoorden, Regular voor nadruk ('Ontwerpdoel'). Zet de bestanden in `public/fonts/`.

## Animaties

- Intro: lijn tekent zich + teller → 'Portfolio' komt letter per letter op
- Lenis smooth scroll; titels en tekst per regel uit een masker; beelden met een gordijn-reveal
- Project-spreads met parallax; procesweergave scrollt horizontaal, de exploded view van de luchtreiniger schuift uit elkaar
- Eigen cursor en magnetische knoppen (alleen desktop)
- Alleen `transform`/`opacity` worden geanimeerd. Met *reduced motion* staat alles meteen stil en zichtbaar;
  op mobiel draait een lichtere versie.

## Online zetten

**GitHub Pages (huidig):** elke push naar `main` bouwt en publiceert automatisch via
`.github/workflows/deploy.yml`. Het subpad (`/Portfolio-website-Rein/`) wordt automatisch ingesteld.

**Eigen domein of Netlify/Vercel:** importeer de repository, build-commando `npm run build`, map `dist`.
Laat `BASE` leeg (de site staat dan op `/`).
