import { defineConfig } from 'vite';
import { fill } from './build/render.js';

/** Vult index.html met de inhoud uit src/data/*.json (dev én build). */
const contentPlugin = () => ({
  name: 'rein-content',
  transformIndexHtml: { order: 'pre', handler: (html) => fill(html) },
  handleHotUpdate({ file, server }) {
    // Pas je een JSON-bestand of de generator aan, dan herlaadt de pagina vanzelf.
    if (/src[\\/]data[\\/].*\.json$|build[\\/]render\.js$/.test(file)) {
      server.ws.send({ type: 'full-reload' });
      return [];
    }
  },
});

export default defineConfig({
  // Op GitHub Pages staat de site in een submap (/Portfolio-Rein/); lokaal gewoon '/'.
  base: process.env.BASE || '/',
  plugins: [contentPlugin()],
  build: { target: 'es2020', cssMinify: true },
});
