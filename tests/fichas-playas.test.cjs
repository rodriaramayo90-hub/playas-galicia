const assert = require("node:assert/strict");
const { readFileSync, existsSync, readdirSync } = require("node:fs");
const { resolve } = require("node:path");

const raiz = resolve(__dirname, "..");
const catalogo = JSON.parse(readFileSync(resolve(raiz, "data", "playas-detalle.json"), "utf8"));
const sitemap = readFileSync(resolve(raiz, "sitemap.xml"), "utf8");
const app = readFileSync(resolve(raiz, "app.js"), "utf8");
const indexHtml = readFileSync(resolve(raiz, "index.html"), "utf8");
const indiceJs = readFileSync(resolve(raiz, "data", "indice-fichas.js"), "utf8");
const indice = JSON.parse(indiceJs.replace(/^window\.HoyTocaPlayaIndiceFichas\s*=\s*/, "").replace(/;\s*$/, ""));

assert.equal(catalogo.playas.length, 150, "El catálogo debe incluir las 150 playas del ranking.");
assert.equal(catalogo.total, 150);
assert.equal(Object.keys(indice).length, 150, "El índice debe enlazar las 150 fichas.");
assert.equal(readdirSync(resolve(raiz, "playas"), { withFileTypes: true }).filter(item => item.isDirectory()).length, 150);
assert.match(indexHtml, /data\/indice-fichas\.js/, "La portada debe cargar el índice antes de app.js.");
assert.match(app, /data-ficha-url=/, "Las tarjetas del ranking deben enlazar la ficha completa.");
assert.match(app, /window\.location\.href = elemento\.dataset\.fichaUrl/,
  "La tarjeta debe abrir la ficha en la misma pestaña.");
assert.match(app, /function crearEnlaceFicha\(slug\)/,
  "Los enlaces deben adaptarse al dominio oficial y a htmlpreview.");
assert.match(app, /htmlpreview\.github\.io/, "La navegación debe conservar el visor de preview.");
assert.match(app, /horaFinSeleccionada = 22/, "El rango predeterminado debe llegar hasta las 22:00.");
assert.match(app, /function obtenerRaizRecursos\(\)/,
  "Los recursos dinámicos deben resolver la raíz correcta también en htmlpreview.");
assert.match(app, /window\.HoyTocaPlayaIndiceFichas/, "El ranking debe aplicar el índice generado.");
assert.match(app, /municipio: playa\.municipio/, "Los resultados deben conservar el municipio para distinguir nombres repetidos.");
assert.match(app, /!municipio \|\| playa\.municipio === municipio/,
  "La ficha meteorológica debe distinguir playas con el mismo nombre por municipio.");
assert.match(app, /meteorologiaPorPlaya\[indice\]/,
  "La ficha debe reutilizar la misma agrupación meteorológica que el ranking.");

for (const playa of catalogo.playas) {
  const ruta = resolve(raiz, "playas", playa.slug, "index.html");
  assert.ok(existsSync(ruta), `Falta la página generada de ${playa.slug}.`);
  const html = readFileSync(ruta, "utf8");
  const canonical = `https://hoytocaplaya.com/playas/${playa.slug}/`;
  assert.equal(indice[`${playa.nombreCatalogo}||${playa.municipio}`], playa.slug,
    `El índice no enlaza ${playa.nombreCatalogo} (${playa.municipio}).`);
  assert.ok(playa.descripcion, `Falta una descripción mínima para ${playa.slug}.`);
  assert.ok(Array.isArray(playa.fuentes), `Falta el listado de fuentes para ${playa.slug}.`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
  assert.match(html, /<meta name="description" content="[^"]+">/);
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
  if (playa.fotoPrincipal?.url) {
    assert.equal(datosEstructurados.mainEntity.image, playa.fotoPrincipal.url);
    assert.ok(playa.fotoPrincipal.autor && playa.fotoPrincipal.licencia && playa.fotoPrincipal.fuente,
      `Falta atribución completa para ${playa.slug}.`);
  } else {
    assert.equal(datosEstructurados.mainEntity.image, undefined);
    assert.ok(html.includes('<meta property="og:image" content="https://hoytocaplaya.com/og-image.png">'));
  }
  assert.match(html, new RegExp(`data-playa-slug="${playa.slug}"`));
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `El sitemap no incluye ${playa.slug}.`);
}

assert.equal((sitemap.match(/<loc>/g) || []).length, 151, "El sitemap debe incluir portada y 150 fichas.");
console.log("OK: 150 fichas dinámicas con datos, rutas, SEO, sitemap y enlaces desde el ranking.");

