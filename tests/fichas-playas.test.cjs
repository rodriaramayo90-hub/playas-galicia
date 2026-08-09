const assert = require("node:assert/strict");
const { readFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");

const raiz = resolve(__dirname, "..");
const catalogo = JSON.parse(readFileSync(resolve(raiz, "data", "playas-detalle.json"), "utf8"));
const sitemap = readFileSync(resolve(raiz, "sitemap.xml"), "utf8");
const app = readFileSync(resolve(raiz, "app.js"), "utf8");

assert.equal(catalogo.playas.length, 5, "La demostración debe incluir cinco fichas.");
assert.match(app, /data-ficha-url=/, "Las tarjetas del ranking deben enlazar la ficha completa.");
assert.match(app, /window\.location\.href = elemento\.dataset\.fichaUrl/,
  "La tarjeta debe abrir la ficha en la misma pestaña.");
assert.match(app, /function crearEnlaceFicha\(slug\)/,
  "Los enlaces deben adaptarse al dominio oficial y a htmlpreview.");
assert.match(app, /htmlpreview\.github\.io/, "La navegación debe conservar el visor de preview.");
assert.match(app, /horaFinSeleccionada = 22/, "El rango predeterminado debe llegar hasta las 22:00.");
assert.match(app, /function obtenerRaizRecursos\(\)/,
  "Los recursos dinámicos deben resolver la raíz correcta también en htmlpreview.");

for (const playa of catalogo.playas) {
  const ruta = resolve(raiz, "playas", playa.slug, "index.html");
  assert.ok(existsSync(ruta), `Falta la página generada de ${playa.slug}.`);
  const html = readFileSync(ruta, "utf8");
  const canonical = `https://hoytocaplaya.com/playas/${playa.slug}/`;
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.ok(playa.fotoPrincipal?.url, `Falta la fotografía demostrativa de ${playa.slug}.`);
  assert.ok(playa.fotoPrincipal?.autor && playa.fotoPrincipal?.licencia && playa.fotoPrincipal?.fuente,
    `Falta atribución completa para ${playa.slug}.`);
  assert.ok(html.includes(`<meta property="og:image" content="${playa.fotoPrincipal.url.replaceAll("&", "&amp;")}">`));
  assert.match(html, /<script type="application\/ld\+json">/);
  assert.ok(!html.includes('id="galeriaPlaya"'), `La ficha ${playa.slug} no debe incluir galería adicional.`);
  assert.ok(!html.includes("{{"), `Quedaron variables sin reemplazar en ${playa.slug}.`);
  assert.match(html, /window\.HoyTocaPlayaFicha = \{/,
    `La ficha ${playa.slug} debe incluir sus datos estáticos generados.`);
  assert.ok(html.includes(JSON.stringify(playa.descripcion)),
    `La ficha ${playa.slug} debe incluir su descripción sin una petición adicional.`);
  const bloqueDatos = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(bloqueDatos, `Faltan datos estructurados en ${playa.slug}.`);
  const datosEstructurados = JSON.parse(bloqueDatos[1]);
  assert.equal(datosEstructurados["@type"], "ItemPage");
  assert.equal(datosEstructurados.mainEntity["@type"], "Place");
  assert.equal(datosEstructurados.mainEntity.geo.latitude, playa.lat);
  assert.equal(datosEstructurados.mainEntity.geo.longitude, playa.lon);
  assert.equal(datosEstructurados.mainEntity.image, playa.fotoPrincipal.url);
  assert.match(html, new RegExp(`data-playa-slug="${playa.slug}"`));
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `El sitemap no incluye ${playa.slug}.`);
  assert.ok(app.includes(`slugFicha: "${playa.slug}"`), `El ranking no enlaza ${playa.slug}.`);
}

console.log("OK: cinco fichas dinámicas con rutas, SEO, sitemap y enlaces desde el ranking.");

