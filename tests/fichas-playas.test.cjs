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
const total = catalogo.playas.length;
const slugsCatalogo = new Set(catalogo.playas.map(playa => playa.slug));
const fichasEspeciales = new Set(["praia-de-areacova"]);
const slugsPermitidos = new Set([...slugsCatalogo, ...fichasEspeciales]);
const slugsIndiceHuerfanos = [...new Set(Object.values(indice).filter(slug => !slugsPermitidos.has(slug)))];
const carpetas = readdirSync(resolve(raiz, "playas"), { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name);
const carpetasHuerfanas = carpetas.filter(slug => !slugsPermitidos.has(slug));

assert.ok(total >= 179, `El catálogo no puede retroceder por debajo de 179 playas; contiene ${total}.`);
assert.equal(catalogo.total, total, "catalogo.total debe coincidir con el número real de playas.");
assert.deepEqual(slugsIndiceHuerfanos, [], `El índice contiene slugs huérfanos: ${slugsIndiceHuerfanos.join(", ")}`);
assert.deepEqual(carpetasHuerfanas, [], `Existen carpetas de fichas huérfanas: ${carpetasHuerfanas.join(", ")}`);
assert.equal(Object.keys(indice).length, total + fichasEspeciales.size,
  "El índice debe enlazar todas las fichas del catálogo y las fichas especiales.");
assert.equal(carpetas.length, total + fichasEspeciales.size,
  "Debe existir una carpeta por cada ficha del catálogo y cada ficha especial.");
for (const slug of fichasEspeciales) {
  assert.ok(existsSync(resolve(raiz, "playas", slug, "index.html")), `Falta la ficha especial ${slug}.`);
  assert.ok(sitemap.includes(`<loc>https://hoytocaplaya.com/playas/${slug}/</loc>`),
    `El sitemap no incluye la ficha especial ${slug}.`);
}
assert.match(indexHtml, /data\/indice-fichas\.js/, "La portada debe cargar el índice antes de app.js.");
assert.match(indexHtml, /SEO_DIRECTORIO_PLAYAS_INICIO/, "La portada debe incluir un directorio HTML rastreable.");
assert.match(indexHtml, /horaInicioSeleccionada=11;horaFinSeleccionada=20;/,
  "El horario inicial visible debe ser 11:00–20:00.");
assert.match(app, /data-ficha-url=/, "Las tarjetas del ranking deben enlazar la ficha completa.");
assert.match(app, /window\.location\.href = elemento\.dataset\.fichaUrl/,
  "La tarjeta debe abrir la ficha en la misma pestaña.");
assert.match(app, /function crearEnlaceFicha\(slug\)/,
  "Los enlaces deben adaptarse al dominio oficial y a htmlpreview.");
assert.match(app, /const rutaCanonica = `playas\/\$\{slug\}\/`/,
  "El ranking debe enlazar la URL canonical sin /index.html en producción.");
assert.match(app, /htmlpreview\.github\.io/, "La navegación debe conservar el visor de preview.");
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
  assert.match(html, /SEO_PLAYAS_CERCANAS_INICIO/,
    `La ficha ${playa.slug} debe incluir enlaces internos a playas cercanas.`);

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

assert.equal((sitemap.match(/<loc>/g) || []).length, total + fichasEspeciales.size + 1,
  "El sitemap debe incluir la portada, todas las fichas del catálogo base y las fichas especiales.");
console.log(`OK: ${total} fichas base + ${fichasEspeciales.size} especial(es), con SEO, sitemap, directorio e interlinking.`);
