const assert = require("node:assert/strict");
const { readFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");

const raiz = resolve(__dirname, "..");
const catalogo = JSON.parse(readFileSync(resolve(raiz, "data", "playas-detalle.json"), "utf8"));
const sitemap = readFileSync(resolve(raiz, "sitemap.xml"), "utf8");
const app = readFileSync(resolve(raiz, "app.js"), "utf8");

assert.equal(catalogo.playas.length, 5, "La demostración debe incluir cinco fichas.");

for (const playa of catalogo.playas) {
  const ruta = resolve(raiz, "playas", playa.slug, "index.html");
  assert.ok(existsSync(ruta), `Falta la página generada de ${playa.slug}.`);
  const html = readFileSync(ruta, "utf8");
  const canonical = `https://hoytocaplaya.com/playas/${playa.slug}/`;
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<script type="application\/ld\+json">/);
  assert.ok(!html.includes("{{"), `Quedaron variables sin reemplazar en ${playa.slug}.`);
  const bloqueDatos = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(bloqueDatos, `Faltan datos estructurados en ${playa.slug}.`);
  const datosEstructurados = JSON.parse(bloqueDatos[1]);
  assert.equal(datosEstructurados["@type"], "ItemPage");
  assert.equal(datosEstructurados.mainEntity["@type"], "Place");
  assert.equal(datosEstructurados.mainEntity.geo.latitude, playa.lat);
  assert.equal(datosEstructurados.mainEntity.geo.longitude, playa.lon);
  assert.match(html, new RegExp(`data-playa-slug="${playa.slug}"`));
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `El sitemap no incluye ${playa.slug}.`);
  assert.ok(app.includes(`slugFicha: "${playa.slug}"`), `El ranking no enlaza ${playa.slug}.`);
}

console.log("OK: cinco fichas dinámicas con rutas, SEO, sitemap y enlaces desde el ranking.");

