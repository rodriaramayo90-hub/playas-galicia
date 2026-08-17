import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const ARCHIVO_EXTRA = resolve(RAIZ, "playas-extra.js");
const PLANTILLA = resolve(RAIZ, "plantillas", "ficha-playa.html");
const INDICE = resolve(RAIZ, "data", "indice-fichas.js");
const DETALLE = resolve(RAIZ, "data", "playas-detalle.json");
const SITEMAP = resolve(RAIZ, "sitemap.xml");
const DESTINO = resolve(RAIZ, "playas");

function extraerExtras(codigo) {
  const marcador = "const PLAYAS_EXTRA = [";
  const inicio = codigo.indexOf(marcador);
  const fin = codigo.indexOf("\n];", inicio);
  if (inicio < 0 || fin < 0) throw new Error("No se encontró PLAYAS_EXTRA en playas-extra.js.");
  const definicion = codigo.slice(inicio + "const PLAYAS_EXTRA = ".length, fin + 2);
  const extras = Function(`"use strict"; return (${definicion});`)();
  if (!Array.isArray(extras) || extras.length !== 30) {
    throw new Error(`Se esperaban 30 elementos en PLAYAS_EXTRA y se encontraron ${extras?.length ?? 0}.`);
  }
  return extras;
}

function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function fichaDesdeExtra(playa) {
  const esParqueNacional = playa.nombre.includes("Isla de Ons") || playa.nombre.includes("Islas Cíes");
  return {
    slug: playa.slugFicha,
    nombreCatalogo: playa.nombre,
    nombre: playa.nombre,
    municipio: playa.municipio,
    provincia: playa.provincia,
    lat: playa.lat,
    lon: playa.lon,
    destinoMaps: playa.destinoMaps,
    descripcion: playa.descripcionSEO || `${playa.nombre} se encuentra en ${playa.municipio}, ${playa.provincia}.`,
    fotoPrincipal: null,
    caracteristicas: {
      tipo: playa.tipoOficial || null,
      composicion: playa.composicionOficial || null,
      longitud: null,
      anchura: null,
      entorno: esParqueNacional ? "Parque Nacional de las Illas Atlánticas de Galicia" : null,
      forma: null,
      orientacion: playa.orientacion || null,
      exposicion: playa.nivelAbrigo ? `Nivel de abrigo usado por el ranking: ${playa.nivelAbrigo}` : null
    },
    servicios: {
      parking: esParqueNacional ? "No accesible en coche; acceso a la isla por transporte marítimo autorizado" : null,
      accesibilidad: null,
      duchas: null,
      aseos: null,
      socorrista: null,
      chiringuito: null,
      restaurantes: null,
      transportePublico: esParqueNacional ? "Acceso a la isla mediante transporte marítimo autorizado" : null
    },
    normas: {
      perros: esParqueNacional ? "No se permite desembarcar animales domésticos, salvo perros guía" : null,
      nudismo: null,
      deportesAcuaticos: null,
      barbacoasFuego: esParqueNacional ? "Sujeto a las normas del Parque Nacional" : null,
      accesoVehiculos: esParqueNacional ? "No hay acceso de vehículos particulares" : null
    },
    marea: {
      dependencia: null,
      superficiePleamar: null,
      accesoCondicionado: null,
      riesgoAislamiento: null,
      recomendacion: null
    },
    bano: {
      entradaAgua: null,
      fondo: playa.composicionOficial || null,
      oleajeHabitual: null,
      corrientes: null,
      ninos: null,
      profundidad: null
    },
    practica: {
      temporadaBano: null,
      fuente: playa.fuenteNombre || null,
      ultimaVerificacion: "17 de agosto de 2026",
      notaVigencia: "Los datos descriptivos mostrados proceden de la fuente indicada. Los servicios estacionales y las normas locales pueden cambiar; conviene confirmarlos antes de desplazarse."
    },
    fuentes: playa.fuenteUrl ? [{
      nombre: playa.fuenteNombre || "Fuente oficial consultada",
      url: playa.fuenteUrl,
      nota: "Ubicación y características generales contrastadas para incorporar esta playa al catálogo."
    }] : []
  };
}

function descripcionMeta(playa) {
  const ubicacion = playa.nombre.includes("Portonovo") ? "Portonovo y Sanxenxo" : playa.municipio;
  return `Consulta el tiempo, viento, lluvia, oleaje y temperatura del agua de ${playa.nombre}, en ${ubicacion}, y descubre sus condiciones para ir hoy.`;
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
    TITLE: `${playa.nombre}: tiempo y condiciones hoy | Hoy Toca Playa`,
    META_DESCRIPTION: descripcion,
    CANONICAL: canonical,
    OG_IMAGE: "https://hoytocaplaya.com/og-image.png",
    STRUCTURED_DATA: JSON.stringify(datosEstructurados(playa, canonical, descripcion), null, 2).replaceAll("<", "\\u003c"),
    BEACH_DATA: JSON.stringify(playa).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026"),
    SLUG: playa.slug,
    NOMBRE: playa.nombre,
    MUNICIPIO: playa.municipio,
    PROVINCIA: playa.provincia,
    LAT: playa.lat,
    LON: playa.lon
  };

  let html = Object.entries(reemplazos).reduce(
    (resultado, [clave, valor]) => resultado.replaceAll(`{{${clave}}}`, escaparHtml(valor)),
    plantilla
  );
  html = html
    .replace(escaparHtml(reemplazos.STRUCTURED_DATA), reemplazos.STRUCTURED_DATA)
    .replace(escaparHtml(reemplazos.BEACH_DATA), reemplazos.BEACH_DATA)
    .replace(
      '<script src="../../app.js?v=4.3"></script>\n  <script src="../../ficha-playa.js?v=8"></script>',
      '<script src="../../app.js?v=4.6"></script>\n  <script src="../../playas-extra.js?v=1"></script>\n  <script src="../../areacova-extra.js?v=4"></script>\n  <script src="../../ficha-playa.js?v=8"></script>'
    );
  return html;
}

function leerIndice(contenido) {
  const ventana = {};
  Function("window", `${contenido}\nreturn window.HoyTocaPlayaIndiceFichas || {};`)(ventana);
  return ventana.HoyTocaPlayaIndiceFichas || {};
}

const [codigoExtra, plantilla, contenidoIndice, contenidoDetalle, sitemapActual] = await Promise.all([
  readFile(ARCHIVO_EXTRA, "utf8"),
  readFile(PLANTILLA, "utf8"),
  readFile(INDICE, "utf8"),
  readFile(DETALLE, "utf8"),
  readFile(SITEMAP, "utf8")
]);

const extras = extraerExtras(codigoExtra);
const nuevas = extras.filter(playa => playa.slugFicha !== "praia-de-areacova");
if (nuevas.length !== 29) throw new Error(`Se esperaban 29 fichas nuevas y se encontraron ${nuevas.length}.`);

const fichas = nuevas.map(fichaDesdeExtra);
for (const ficha of fichas) {
  const carpeta = resolve(DESTINO, ficha.slug);
  await mkdir(carpeta, { recursive: true });
  await writeFile(resolve(carpeta, "index.html"), completarPlantilla(plantilla, ficha), "utf8");
}

const catalogo = JSON.parse(contenidoDetalle);
const existentes = new Map((catalogo.playas || []).map(playa => [playa.slug, playa]));
for (const ficha of fichas) existentes.set(ficha.slug, ficha);
catalogo.playas = [...existentes.values()];
catalogo.total = catalogo.playas.length;
catalogo.generado = "17 de agosto de 2026";
await writeFile(DETALLE, `${JSON.stringify(catalogo, null, 2)}\n`, "utf8");

const indice = leerIndice(contenidoIndice);
for (const playa of extras) indice[`${playa.nombre}||${playa.municipio}`] = playa.slugFicha;
const indiceOrdenado = Object.fromEntries(Object.entries(indice).sort(([a], [b]) => a.localeCompare(b, "es")));
await writeFile(INDICE, `window.HoyTocaPlayaIndiceFichas = ${JSON.stringify(indiceOrdenado, null, 2)};\n`, "utf8");

let sitemap = sitemapActual;
const urlsFaltantes = extras
  .map(playa => `https://hoytocaplaya.com/playas/${playa.slugFicha}/`)
  .filter(url => !sitemap.includes(`<loc>${url}</loc>`));
if (urlsFaltantes.length) {
  const bloques = urlsFaltantes.map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`).join("\n");
  sitemap = sitemap.replace("</urlset>", `${bloques}\n</urlset>`);
  await writeFile(SITEMAP, sitemap, "utf8");
}

console.log(`Generadas ${fichas.length} fichas nuevas. Catálogo estático: ${catalogo.total} fichas + Areacova personalizada.`);
