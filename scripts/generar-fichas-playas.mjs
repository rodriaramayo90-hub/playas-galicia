import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { construirCatalogo } from "./construir-catalogo-fichas.mjs";

const RAIZ = resolve(import.meta.dirname, "..");
const PLANTILLA = resolve(RAIZ, "plantillas", "ficha-playa.html");
const DESTINO = resolve(RAIZ, "playas");
const INDICE = resolve(RAIZ, "data", "indice-fichas.js");
const CATALOGO = resolve(RAIZ, "data", "playas-detalle.json");

function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function descripcionMeta(playa) {
  return `Consulta el tiempo, la puntuación, el viento, la lluvia, el oleaje, el agua y la información práctica de ${playa.nombre}, en ${playa.municipio}.`;
}

function datosEstructurados(playa, canonical, descripcion) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: `${playa.nombre} | Hoy Toca Playa`,
    description: descripcion,
    url: canonical,
    inLanguage: "es-ES",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hoy Toca Playa", item: "https://hoytocaplaya.com/" },
        { "@type": "ListItem", position: 2, name: "Playas", item: "https://hoytocaplaya.com/#ranking-mobile" },
        { "@type": "ListItem", position: 3, name: playa.nombre, item: canonical }
      ]
    },
    mainEntity: {
      "@type": "Place",
      name: playa.nombre,
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

function completarPlantilla(plantilla, playa) {
  const canonical = `https://hoytocaplaya.com/playas/${playa.slug}/`;
  const descripcion = descripcionMeta(playa);
  const reemplazos = {
    TITLE: `${playa.nombre}: tiempo, oleaje y guía | Hoy Toca Playa`,
    META_DESCRIPTION: descripcion,
    CANONICAL: canonical,
    OG_IMAGE: playa.fotoPrincipal?.url || "https://hoytocaplaya.com/og-image.png",
    STRUCTURED_DATA: JSON.stringify(datosEstructurados(playa, canonical, descripcion), null, 2).replaceAll("<", "\\u003c"),
    BEACH_DATA: JSON.stringify(playa).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026"),
    SLUG: playa.slug,
    NOMBRE: playa.nombre,
    MUNICIPIO: playa.municipio,
    PROVINCIA: playa.provincia,
    LAT: playa.lat,
    LON: playa.lon
  };
  return Object.entries(reemplazos).reduce(
    (html, [clave, valor]) => html.replaceAll(`{{${clave}}}`, escaparHtml(valor)),
    plantilla
  ).replace(
    escaparHtml(reemplazos.STRUCTURED_DATA),
    reemplazos.STRUCTURED_DATA
  ).replace(
    escaparHtml(reemplazos.BEACH_DATA),
    reemplazos.BEACH_DATA
  );
}

function generarSitemap(playas) {
  const urls = [
    { loc: "https://hoytocaplaya.com/", frecuencia: "daily", prioridad: "1.0" },
    ...playas.map(playa => ({ loc: `https://hoytocaplaya.com/playas/${playa.slug}/`, frecuencia: "daily", prioridad: "0.8" }))
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.frecuencia}</changefreq>
    <priority>${url.prioridad}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

const [plantilla, catalogoActualTexto, catalogo] = await Promise.all([
  readFile(PLANTILLA, "utf8"),
  readFile(CATALOGO, "utf8"),
  construirCatalogo({ escribir: false })
]);
if (!Array.isArray(catalogo.playas) || catalogo.playas.length === 0) throw new Error("No hay fichas para generar.");

const catalogoActual = JSON.parse(catalogoActualTexto);
const playasActuales = Array.isArray(catalogoActual.playas) ? catalogoActual.playas : [];
const slugsNuevos = new Set(catalogo.playas.map(playa => playa.slug));
const slugsPerdidos = playasActuales.map(playa => playa.slug).filter(slug => !slugsNuevos.has(slug));
if (catalogo.playas.length < playasActuales.length || slugsPerdidos.length > 0) {
  throw new Error(
    `Generación bloqueada para evitar pérdida SEO: el catálogo actual tiene ${playasActuales.length} fichas y el generador produciría ${catalogo.playas.length}. ` +
    `Slugs que desaparecerían: ${slugsPerdidos.slice(0, 20).join(", ") || "ninguno"}. Actualiza primero la fuente del catálogo.`
  );
}

await rm(DESTINO, { recursive: true, force: true });
for (const playa of catalogo.playas) {
  const carpeta = resolve(DESTINO, playa.slug);
  await mkdir(carpeta, { recursive: true });
  await writeFile(resolve(carpeta, "index.html"), completarPlantilla(plantilla, playa), "utf8");
}
await writeFile(CATALOGO, `${JSON.stringify(catalogo, null, 2)}\n`, "utf8");
await writeFile(resolve(RAIZ, "sitemap.xml"), generarSitemap(catalogo.playas), "utf8");
const indice = Object.fromEntries(catalogo.playas.map(playa => [`${playa.nombreCatalogo}||${playa.municipio}`, playa.slug]));
await writeFile(INDICE, `window.HoyTocaPlayaIndiceFichas = ${JSON.stringify(indice, null, 2)};\n`, "utf8");
console.log(`Generadas ${catalogo.playas.length} fichas y sitemap.xml.`);
