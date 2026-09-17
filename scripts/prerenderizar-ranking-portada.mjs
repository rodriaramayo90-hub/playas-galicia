import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const RAIZ = resolve(import.meta.dirname, "..");
const RUTA_APP = resolve(RAIZ, "app.js");
const RUTA_INDEX = resolve(RAIZ, "index.html");
const RUTA_PRONOSTICO = resolve(RAIZ, "data", "pronostico.json");
const RUTA_INDICE = resolve(RAIZ, "data", "indice-fichas.js");
const HORARIO_INICIO = 11;
const HORARIO_FIN = 20;

const MARCADOR_TABLA_INICIO = "<!-- SEO_RANKING_PRERENDER_TABLA_INICIO -->";
const MARCADOR_TABLA_FIN = "<!-- SEO_RANKING_PRERENDER_TABLA_FIN -->";
const MARCADOR_MOBILE_INICIO = "<!-- SEO_RANKING_PRERENDER_MOBILE_INICIO -->";
const MARCADOR_MOBILE_FIN = "<!-- SEO_RANKING_PRERENDER_MOBILE_FIN -->";

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escaparAtributo(valor) {
  return escaparHtml(valor);
}

function parsearIndice(codigo) {
  return JSON.parse(
    codigo
      .replace(/^window\.HoyTocaPlayaIndiceFichas\s*=\s*/, "")
      .replace(/;\s*$/, "")
  );
}

function enriquecerEtiquetasApp(codigo) {
  let actualizado = codigo;
  actualizado = actualizado.replace(
    'if (puntos < 35) return "🔴 Mejor evitar";',
    'if (puntos < 35) return "🔴 Mejor evitar esta playa hoy";'
  );
  actualizado = actualizado.replace(
    'if (condicionesExcelentes) return "🟢 Excelente";',
    'if (condicionesExcelentes) return "🟢 Excelente día de playa";'
  );

  if (!actualizado.includes('return "🔴 Mejor evitar esta playa hoy";')) {
    throw new Error("No se pudo aplicar la etiqueta SEO de 'Mejor evitar esta playa hoy'.");
  }
  if (!actualizado.includes('return "🟢 Excelente día de playa";')) {
    throw new Error("No se pudo aplicar la etiqueta SEO de 'Excelente día de playa'.");
  }
  return actualizado;
}

function crearSandbox(appSource, indiceFichas) {
  const sandbox = {
    console,
    URL,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async () => {
      throw new Error("El prerender no debe realizar peticiones de red; usa data/pronostico.json.");
    },
    document: {
      currentScript: { src: "https://hoytocaplaya.com/app.js" }
    },
    window: {
      location: {
        hostname: "hoytocaplaya.com",
        href: "https://hoytocaplaya.com/",
        origin: "https://hoytocaplaya.com",
        pathname: "/",
        search: ""
      },
      HoyTocaPlayaIndiceFichas: indiceFichas,
      addEventListener: () => {}
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(appSource, sandbox, { filename: "app.js" });
  return sandbox;
}

function formatearNumero(valor, decimales = 1) {
  return Number.isFinite(valor) ? Number(valor).toFixed(decimales).replace(".", ",") : "-";
}

function claseValoracion(puntuacion) {
  if (puntuacion >= 70) return "valoracion-buena";
  if (puntuacion >= 50) return "valoracion-aceptable";
  if (puntuacion >= 35) return "valoracion-regular";
  return "valoracion-evitar";
}

function enlaceFicha(playa) {
  return playa.slugFicha ? `playas/${playa.slugFicha}/` : null;
}

function renderizarFila(playa, posicion, crearEnlaceGoogleMaps) {
  const ficha = enlaceFicha(playa);
  const maps = crearEnlaceGoogleMaps(playa);
  const nombre = ficha
    ? `<a class="enlace-ficha-playa" href="${escaparAtributo(ficha)}">${escaparHtml(playa.nombre)}</a>`
    : `<span>${escaparHtml(playa.nombre)}</span>`;
  const agua = Number.isFinite(playa.agua) ? `${formatearNumero(playa.agua)}°C` : "-";
  const oleaje = escaparHtml(playa.estadoOleaje || "-");

  return `<tr${ficha ? ` class="fila-con-ficha" data-ficha-url="${escaparAtributo(ficha)}" tabindex="0"` : ""} data-prerendered="true">
    <td>${posicion}</td>
    <td><div class="nombre-playa-tabla">${nombre}<a class="enlace-maps" href="${escaparAtributo(maps)}" target="_blank" rel="noopener noreferrer" aria-label="Cómo llegar en coche a ${escaparAtributo(playa.nombre)}">Cómo llegar</a></div></td>
    <td>-</td>
    <td>${escaparHtml(playa.cielo)}</td>
    <td class="detalle oculto">${formatearNumero(playa.temperaturaMaxima)}°C</td>
    <td>${formatearNumero(playa.temperaturaMediaPlaya)}°C</td>
    <td class="detalle oculto">${escaparHtml(playa.viento)} km/h estimados en playa (${escaparHtml(playa.direccionViento)}) · máx. ${escaparHtml(playa.vientoMaximo)} km/h</td>
    <td class="detalle oculto">Riesgo ${escaparHtml(playa.lluvia)}% · máximo ${escaparHtml(playa.lluviaMaxima)}% · promedio ${escaparHtml(playa.lluviaPromedio)}%</td>
    <td class="detalle oculto">${agua}</td>
    <td class="detalle oculto">${oleaje}</td>
    <td class="col-estado">${escaparHtml(playa.estado)}</td>
    <td class="detalle oculto">${escaparHtml(playa.puntuacion)}</td>
    <td class="col-explicacion">${escaparHtml(playa.explicacion)}</td>
  </tr>`;
}

function renderizarTarjeta(playa, posicion, crearEnlaceGoogleMaps) {
  const ficha = enlaceFicha(playa);
  const maps = crearEnlaceGoogleMaps(playa);
  const nombre = ficha
    ? `<a class="enlace-ficha-playa" href="${escaparAtributo(ficha)}">${escaparHtml(playa.nombre)}</a>`
    : escaparHtml(playa.nombre);
  const agua = Number.isFinite(playa.agua) ? `${formatearNumero(playa.agua)}°C` : "-";

  return `<article class="tarjeta-playa ${claseValoracion(playa.puntuacion)}${ficha ? " tarjeta-con-ficha" : ""}"${ficha ? ` data-ficha-url="${escaparAtributo(ficha)}" tabindex="0" aria-label="Abrir ficha de ${escaparAtributo(playa.nombre)}"` : ""} data-prerendered="true">
    <div class="tarjeta-cabecera">
      <div class="tarjeta-identidad"><span class="posicion-ranking" aria-label="Posición ${posicion}">${posicion}</span><div><div class="titulo-playa-con-maps"><h2>${nombre}</h2></div><div class="estado">${escaparHtml(playa.estado)}</div></div></div>
      <div class="puntuacion" aria-label="Puntuación ${escaparAtributo(playa.puntuacion)} sobre 100"><span>Puntaje del día</span><strong>${escaparHtml(playa.puntuacion)}<small>/100</small></strong></div>
    </div>
    <div class="resumen-condiciones"><span>🌡️ ${formatearNumero(playa.temperaturaMediaPlaya)}°C</span><span>💨 ${escaparHtml(playa.viento)} km/h</span><span>🌧️ ${escaparHtml(playa.lluvia)}%</span></div>
    <div class="tarjeta-contexto"><span>${escaparHtml(playa.cielo)}</span><div class="tarjeta-destino"><span>📍 ${escaparHtml(playa.municipio || "Galicia")}</span><a class="enlace-maps enlace-maps-tarjeta" href="${escaparAtributo(maps)}" target="_blank" rel="noopener noreferrer" aria-label="Cómo llegar en coche a ${escaparAtributo(playa.nombre)}">Cómo llegar</a></div></div>
    <p class="explicacion">${escaparHtml(playa.explicacion)}</p>
    <button class="btn-detalles" type="button" aria-expanded="false">Ver detalles ▼</button>
    <div class="detalles-mobile oculto"><p>🌡️ Temperatura máxima: ${formatearNumero(playa.temperaturaMaxima)}°C</p><p>🌡️💧 Agua: ${agua}</p><p>💨 ${escaparHtml(playa.viento)} km/h estimados en playa (${escaparHtml(playa.direccionViento)}) · máx. ${escaparHtml(playa.vientoMaximo)} km/h</p><p>🌧️ Riesgo estimado: ${escaparHtml(playa.lluvia)}% · máximo horario: ${escaparHtml(playa.lluviaMaxima)}% · promedio: ${escaparHtml(playa.lluviaPromedio)}%</p><p>${escaparHtml(playa.estadoOleaje || "-")}</p></div>
  </article>`;
}

function reemplazarBloqueMarcado(html, inicio, fin, contenido, aperturaContenedor) {
  const bloque = `${inicio}\n${contenido}\n${fin}`;
  const posicionInicio = html.indexOf(inicio);
  if (posicionInicio >= 0) {
    const posicionFin = html.indexOf(fin, posicionInicio);
    if (posicionFin < 0) throw new Error(`Falta el cierre del marcador ${fin}.`);
    return html.slice(0, posicionInicio) + bloque + html.slice(posicionFin + fin.length);
  }

  const posicionApertura = html.indexOf(aperturaContenedor);
  if (posicionApertura < 0) throw new Error(`No se encontró ${aperturaContenedor} en index.html.`);
  const posicionInsercion = posicionApertura + aperturaContenedor.length;
  return html.slice(0, posicionInsercion) + `\n${bloque}` + html.slice(posicionInsercion);
}

function actualizarMensajeEstado(html, generadoEn) {
  const fecha = new Date(generadoEn);
  const hora = Number.isNaN(fecha.getTime())
    ? ""
    : ` · previsión actualizada a las ${new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(fecha)}`;
  const mensaje = `Ranking de hoy prerenderizado para ${HORARIO_INICIO}:00–${HORARIO_FIN}:00${hora}.`;
  return html.replace(
    /<p id="estadoCarga" class="estado-carga" role="status" aria-live="polite">[\s\S]*?<\/p>/,
    `<p id="estadoCarga" class="estado-carga" role="status" aria-live="polite">${escaparHtml(mensaje)}</p>`
  );
}

const [appOriginal, indexOriginal, pronostico, indiceCodigo] = await Promise.all([
  readFile(RUTA_APP, "utf8"),
  readFile(RUTA_INDEX, "utf8"),
  readFile(RUTA_PRONOSTICO, "utf8").then(JSON.parse),
  readFile(RUTA_INDICE, "utf8")
]);

if (!Array.isArray(pronostico.datosMeteorologicos) || !Array.isArray(pronostico.datosMaritimos)) {
  throw new Error("data/pronostico.json no contiene las series necesarias para prerenderizar el ranking.");
}

const appActualizado = enriquecerEtiquetasApp(appOriginal);
if (appActualizado !== appOriginal) {
  await writeFile(RUTA_APP, appActualizado, "utf8");
}

const indiceFichas = parsearIndice(indiceCodigo);
const sandbox = crearSandbox(appActualizado, indiceFichas);
const playas = sandbox.window.HoyTocaPlaya?.playas;
if (!Array.isArray(playas) || playas.length === 0) throw new Error("No se pudo cargar el catálogo del ranking desde app.js.");
if (pronostico.datosMeteorologicos.length !== playas.length || pronostico.datosMaritimos.length !== playas.length) {
  throw new Error(`El pronóstico (${pronostico.datosMeteorologicos.length}/${pronostico.datosMaritimos.length}) no coincide con las ${playas.length} playas del ranking.`);
}

const meteorologiaPorPlaya = sandbox.compartirMeteorologiaPorZona(playas, pronostico.datosMeteorologicos);
const resultados = await Promise.all(playas.map((playa, indice) =>
  sandbox.procesarDatosPlaya(
    playa,
    meteorologiaPorPlaya[indice],
    pronostico.datosMaritimos[indice],
    0,
    HORARIO_INICIO,
    HORARIO_FIN
  )
));

resultados.sort((a, b) =>
  b.puntuacion - a.puntuacion || String(a.nombre).localeCompare(String(b.nombre), "es")
);

const crearEnlaceGoogleMaps = sandbox.window.HoyTocaPlaya.crearEnlaceGoogleMaps;
const filas = resultados.map((playa, indice) => renderizarFila(playa, indice + 1, crearEnlaceGoogleMaps)).join("\n");
const tarjetas = resultados.map((playa, indice) => renderizarTarjeta(playa, indice + 1, crearEnlaceGoogleMaps)).join("\n");

let indexActualizado = indexOriginal;
indexActualizado = reemplazarBloqueMarcado(
  indexActualizado,
  MARCADOR_TABLA_INICIO,
  MARCADOR_TABLA_FIN,
  filas,
  '<tbody id="ranking">'
);
indexActualizado = reemplazarBloqueMarcado(
  indexActualizado,
  MARCADOR_MOBILE_INICIO,
  MARCADOR_MOBILE_FIN,
  tarjetas,
  '<div id="ranking-mobile" aria-label="Ranking de playas en tarjetas">'
);
indexActualizado = actualizarMensajeEstado(indexActualizado, pronostico.generadoEn);

await writeFile(RUTA_INDEX, indexActualizado, "utf8");

const excelentes = resultados.filter(item => item.estado.includes("Excelente día de playa")).length;
const evitar = resultados.filter(item => item.estado.includes("Mejor evitar esta playa hoy")).length;
console.log(`Ranking SEO prerenderizado: ${resultados.length} playas, ${excelentes} excelentes y ${evitar} a evitar (${HORARIO_INICIO}:00–${HORARIO_FIN}:00).`);
