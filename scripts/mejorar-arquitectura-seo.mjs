import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const RUTA_CATALOGO = resolve(RAIZ, "data", "playas-detalle.json");
const RUTA_INDEX = resolve(RAIZ, "index.html");
const RUTA_APP = resolve(RAIZ, "app.js");
const LIMITE_CERCANAS = 5;

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonSeguro(valor, pretty = false) {
  return JSON.stringify(valor, null, pretty ? 2 : 0)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

function nombrePlaya(playa) {
  return playa.nombre || playa.nombreCatalogo || playa.slug;
}

function descripcionMeta(playa) {
  return `Consulta el tiempo, la puntuación, el viento, la lluvia, el oleaje, el agua y la información práctica de ${nombrePlaya(playa)}, en ${playa.municipio}.`;
}

function datosEstructurados(playa) {
  const nombre = nombrePlaya(playa);
  const canonical = `https://hoytocaplaya.com/playas/${playa.slug}/`;
  const descripcion = descripcionMeta(playa);
  return {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: `${nombre} | Hoy Toca Playa`,
    description: descripcion,
    url: canonical,
    inLanguage: "es-ES",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hoy Toca Playa", item: "https://hoytocaplaya.com/" },
        { "@type": "ListItem", position: 2, name: "Playas", item: "https://hoytocaplaya.com/#ranking-mobile" },
        { "@type": "ListItem", position: 3, name: nombre, item: canonical }
      ]
    },
    mainEntity: {
      "@type": "Place",
      name: nombre,
      description: descripcion,
      ...(playa.fotoPrincipal?.url ? { image: playa.fotoPrincipal.url } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: playa.municipio,
        addressRegion: playa.provincia,
        addressCountry: "ES"
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: playa.lat,
        longitude: playa.lon
      }
    }
  };
}

function asegurarDatosSeo(html, playa) {
  if (!html.includes('<script type="application/ld+json">')) {
    const bloque = `  <script type="application/ld+json">\n${jsonSeguro(datosEstructurados(playa), true)}\n  </script>\n`;
    if (!html.includes("</head>")) throw new Error(`No se encontró </head> en ${playa.slug}.`);
    html = html.replace("</head>", `${bloque}</head>`);
  }
  if (!html.includes("window.HoyTocaPlayaFicha =")) {
    const bloque = `<script>window.HoyTocaPlayaFicha = ${jsonSeguro(playa)};</script>\n`;
    const marcador = html.includes("<script src=\"../../app.js") ? "<script src=\"../../app.js" : "</body>";
    if (marcador === "</body>") html = html.replace("</body>", `${bloque}</body>`);
    else html = html.replace(marcador, `${bloque}${marcador}`);
  }
  return html;
}

function radianes(grados) {
  return grados * Math.PI / 180;
}

function distanciaKm(a, b) {
  const lat1 = Number(a.lat);
  const lon1 = Number(a.lon);
  const lat2 = Number(b.lat);
  const lon2 = Number(b.lon);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;
  const dLat = radianes(lat2 - lat1);
  const dLon = radianes(lon2 - lon1);
  const valor = Math.sin(dLat / 2) ** 2
    + Math.cos(radianes(lat1)) * Math.cos(radianes(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(valor), Math.sqrt(1 - valor));
}

function obtenerCercanas(playa, catalogo, limite = LIMITE_CERCANAS) {
  return catalogo
    .filter(candidata => candidata.slug !== playa.slug)
    .map(candidata => ({ playa: candidata, distancia: distanciaKm(playa, candidata) }))
    .filter(item => Number.isFinite(item.distancia))
    .sort((a, b) => a.distancia - b.distancia)
    .slice(0, limite);
}

function bloqueMarcado(id, contenido) {
  return `<!-- SEO_${id}_INICIO -->\n${contenido}\n<!-- SEO_${id}_FIN -->`;
}

function insertarOReemplazar(html, id, contenido, marcadorInsercion) {
  const inicio = `<!-- SEO_${id}_INICIO -->`;
  const fin = `<!-- SEO_${id}_FIN -->`;
  const bloque = bloqueMarcado(id, contenido);
  const posicionInicio = html.indexOf(inicio);
  if (posicionInicio >= 0) {
    const posicionFin = html.indexOf(fin, posicionInicio);
    if (posicionFin < 0) throw new Error(`Falta el cierre del bloque ${id}.`);
    return html.slice(0, posicionInicio) + bloque + html.slice(posicionFin + fin.length);
  }
  const posicionMarcador = html.indexOf(marcadorInsercion);
  if (posicionMarcador < 0) throw new Error(`No se encontró el marcador para insertar ${id}.`);
  return html.slice(0, posicionMarcador) + `${bloque}\n` + html.slice(posicionMarcador);
}

function eliminarBloqueMarcado(html, id) {
  const inicio = `<!-- SEO_${id}_INICIO -->`;
  const fin = `<!-- SEO_${id}_FIN -->`;
  const posicionInicio = html.indexOf(inicio);
  if (posicionInicio < 0) return html;
  const posicionFin = html.indexOf(fin, posicionInicio);
  if (posicionFin < 0) throw new Error(`Falta el cierre del bloque ${id}.`);
  const despues = posicionFin + fin.length;
  const saltoFinal = html.slice(despues).startsWith("\n") ? 1 : 0;
  return html.slice(0, posicionInicio) + html.slice(despues + saltoFinal);
}

function renderizarCercanas(playa, cercanas) {
  const elementos = cercanas.map(({ playa: cercana, distancia }) =>
    `<li><a href="../${escaparHtml(cercana.slug)}/">${escaparHtml(nombrePlaya(cercana))}</a><small>${escaparHtml(cercana.municipio || "Galicia")} · ${distancia.toFixed(1).replace(".", ",")} km en línea recta</small></li>`
  ).join("");
  return `<section id="playas-cercanas" class="panel-ficha" aria-labelledby="tituloPlayasCercanas">
  <h2 id="tituloPlayasCercanas">Playas cercanas a ${escaparHtml(nombrePlaya(playa))}</h2>
  <p>Otros arenales próximos que puedes consultar en Hoy Toca Playa.</p>
  <ul class="lista-fuentes lista-playas-cercanas">${elementos}</ul>
</section>`;
}

function canonicalizarEnlacesDelRanking(codigo) {
  const inicio = codigo.indexOf("function crearEnlaceFicha(slug) {");
  const fin = codigo.indexOf("\n\nasync function cargarRankingInterno()", inicio);
  if (inicio < 0 || fin < 0) throw new Error("No se encontró crearEnlaceFicha en app.js.");
  const funcion = `function crearEnlaceFicha(slug) {
  const rutaCanonica = \`playas/\${slug}/\`;
  if (typeof window === "undefined" || window.location?.hostname !== "htmlpreview.github.io") return rutaCanonica;
  const rutaPreview = \`playas/\${slug}/index.html\`;
  const fuente = decodeURIComponent(window.location.search.slice(1)).split("#")[0];
  if (!fuente.includes("github.com/") || !fuente.endsWith("/index.html")) return rutaPreview;
  const raizFuente = fuente.slice(0, fuente.lastIndexOf("/") + 1);
  return \`\${window.location.origin}\${window.location.pathname}?\${raizFuente}\${rutaPreview}\`;
}`;
  return codigo.slice(0, inicio) + funcion + codigo.slice(fin);
}

const catalogo = JSON.parse(await readFile(RUTA_CATALOGO, "utf8"));
if (!Array.isArray(catalogo.playas) || catalogo.playas.length < 179) {
  throw new Error(`Catálogo incompleto: se esperaban al menos 179 playas y hay ${catalogo.playas?.length || 0}.`);
}

let indexHtml = await readFile(RUTA_INDEX, "utf8");
indexHtml = eliminarBloqueMarcado(indexHtml, "DIRECTORIO_PLAYAS");
indexHtml = indexHtml.replace(
  "<noscript>El ranking meteorológico necesita JavaScript para actualizarse, pero puedes consultar todas las fichas de playas en el directorio incluido en esta página.</noscript>",
  "<noscript>El ranking inicial está disponible en esta página. Activa JavaScript para usar filtros, horarios y actualizaciones interactivas.</noscript>"
);
await writeFile(RUTA_INDEX, indexHtml, "utf8");

let modificadas = 0;
for (const playa of catalogo.playas) {
  const ruta = resolve(RAIZ, "playas", playa.slug, "index.html");
  const original = await readFile(ruta, "utf8");
  const cercanas = obtenerCercanas(playa, catalogo.playas);
  let actualizado = asegurarDatosSeo(original, playa);
  actualizado = insertarOReemplazar(actualizado, "PLAYAS_CERCANAS", renderizarCercanas(playa, cercanas), '<section id="ubicacion"');
  if (actualizado !== original) {
    await writeFile(ruta, actualizado, "utf8");
    modificadas += 1;
  }
}

const appOriginal = await readFile(RUTA_APP, "utf8");
const appActualizado = canonicalizarEnlacesDelRanking(appOriginal);
if (appActualizado !== appOriginal) await writeFile(RUTA_APP, appActualizado, "utf8");

console.log(`Arquitectura SEO actualizada: directorio visible eliminado, ${modificadas} fichas reforzadas y enlaces canónicos en el ranking.`);
