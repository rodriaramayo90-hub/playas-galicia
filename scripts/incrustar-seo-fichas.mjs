import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const CATALOGO = resolve(RAIZ, "data", "playas-detalle.json");
const INFORMACION = resolve(RAIZ, "data", "informacion-verificada.json");
const PRONOSTICO = resolve(RAIZ, "data", "pronostico.json");
const NO_DISPONIBLE = "Información no disponible";
const HORARIO_INICIO = 11;
const HORARIO_FIN = 20;

const etiquetas = {
  caracteristicas: {
    tipo: "🏖️ Tipo de playa", composicion: "◫ Composición", longitud: "↔ Longitud",
    anchura: "↔ Anchura", entorno: "⛰️ Entorno", forma: "⌁ Forma",
    orientacion: "🧭 Orientación", exposicion: "◭ Exposición"
  },
  servicios: {
    parking: "🚗 Parking", accesibilidad: "♿ Accesibilidad", duchas: "🚿 Duchas",
    aseos: "🚻 Aseos", socorrista: "🛟 Socorrista", chiringuito: "🥤 Chiringuito",
    restaurantes: "🍴 Restaurantes cercanos", transportePublico: "🚌 Transporte público"
  },
  normas: {
    perros: "🐕 Perros", nudismo: "Normas sobre nudismo", deportesAcuaticos: "🏄 Deportes acuáticos",
    barbacoasFuego: "🔥 Barbacoas / fuego", accesoVehiculos: "🚙 Acceso de vehículos"
  },
  marea: {
    dependencia: "🌊 Dependencia", superficiePleamar: "Superficie en pleamar",
    accesoCondicionado: "Acceso condicionado", riesgoAislamiento: "Riesgo de aislamiento"
  },
  bano: {
    entradaAgua: "Entrada al agua", fondo: "Fondo", oleajeHabitual: "Oleaje habitual",
    corrientes: "Corrientes", ninos: "Adecuada para niños", profundidad: "Profundidad"
  }
};

function escaparHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function valorVisible(valor) {
  if (valor === null || valor === undefined || valor === "") return NO_DISPONIBLE;
  if (valor === true) return "Sí";
  if (valor === false) return "No";
  return String(valor);
}

function renderizarLista(datos, nombres) {
  return Object.entries(nombres).map(([clave, etiqueta]) => {
    const valor = valorVisible(datos?.[clave]);
    const clase = valor === NO_DISPONIBLE ? ' class="dato-no-disponible"' : "";
    return `<div><dt>${escaparHtml(etiqueta)}</dt><dd${clase}>${escaparHtml(valor)}</dd></div>`;
  }).join("");
}

function renderizarPractica(playa) {
  return renderizarLista({
    municipio: playa.municipio,
    provincia: playa.provincia,
    coordenadas: `${Number(playa.lat).toFixed(6)}, ${Number(playa.lon).toFixed(6)}`,
    temporadaBano: playa.practica?.temporadaBano,
    notaVigencia: playa.practica?.notaVigencia,
    ultimaVerificacion: playa.practica?.ultimaVerificacion
  }, {
    municipio: "Municipio", provincia: "Provincia", coordenadas: "Coordenadas",
    temporadaBano: "Temporada de baño", notaVigencia: "Vigencia de los datos",
    ultimaVerificacion: "Última verificación"
  });
}

function renderizarFuentes(fuentes = []) {
  if (!Array.isArray(fuentes) || fuentes.length === 0) {
    return `<li class="dato-no-disponible">${NO_DISPONIBLE}</li>`;
  }
  return fuentes.map(fuente => {
    const nota = fuente.nota ? `<small>${escaparHtml(fuente.nota)}</small>` : "";
    return `<li><a href="${escaparHtml(fuente.url)}" target="_blank" rel="noopener noreferrer">${escaparHtml(fuente.nombre)}</a>${nota}</li>`;
  }).join("");
}

function reemplazarContenido(html, expresion, contenido, descripcion) {
  if (!expresion.test(html)) throw new Error(`No se encontró ${descripcion}.`);
  return html.replace(expresion, contenido);
}

async function cargarDescripciones() {
  const mapa = new Map();
  for (let numero = 1; numero <= 5; numero += 1) {
    const ruta = resolve(RAIZ, "data", `descripciones-seo-${numero}.json`);
    const bloque = JSON.parse(await readFile(ruta, "utf8"));
    for (const [nombre, municipio, texto] of bloque.d || []) {
      mapa.set(`${nombre}||${municipio}`, texto);
    }
  }
  return mapa;
}

function aplicarInformacionVerificada(playa, investigacion) {
  for (const actualizacion of investigacion?.actualizaciones || []) {
    if (actualizacion.slug !== playa.slug) continue;
    const camposAplicados = [];
    for (const [grupo, valores] of Object.entries(actualizacion.values || {})) {
      playa[grupo] ||= {};
      for (const [campo, valor] of Object.entries(valores || {})) {
        const anterior = playa[grupo][campo];
        if (anterior == null || anterior === "" || anterior === NO_DISPONIBLE) {
          playa[grupo][campo] = valor;
        }
        if (playa[grupo][campo] === valor) camposAplicados.push(`${grupo}.${campo}`);
      }
    }
    if (!camposAplicados.length) continue;
    playa.fuentes ||= [];
    const nota = `Consulta ${actualizacion.fecha} · ${camposAplicados.join(", ")}.${actualizacion.nota ? ` ${actualizacion.nota}` : ""}`;
    if (!playa.fuentes.some(fuente => fuente.url === actualizacion.url && fuente.nota === nota)) {
      playa.fuentes.push({ nombre: actualizacion.nombre, url: actualizacion.url, nota });
    }
  }
}

function aplicarAjustesLocales(playa) {
  if (playa.slug === "playa-nino-do-corvo") {
    playa.marea = {
      dependencia: "Alta",
      superficiePleamar: "El arenal se reduce mucho con la marea alta",
      accesoCondicionado: "Conviene visitarla con margen respecto a la pleamar",
      riesgoAislamiento: "Bajo si se permanece en la zona de acceso",
      recomendacion: "Consulta la marea antes de ir: Niño do Corvo es un arenal estrecho y con pleamar queda bastante menos espacio de playa."
    };
  }
  if (playa.slug === "playa-de-lapaman") {
    playa.servicios = { ...playa.servicios, chiringuito: "Sí · Solo pago en efectivo" };
    const aviso = "El acceso a la playa requiere bajar a pie por una pendiente pronunciada.";
    if (!playa.descripcion?.includes(aviso)) playa.descripcion = `${playa.descripcion || ""} ${aviso}`.trim();
  }
}

function promedio(valores) {
  const validos = valores.filter(Number.isFinite);
  return validos.length ? validos.reduce((suma, valor) => suma + valor, 0) / validos.length : null;
}

function maximo(valores) {
  const validos = valores.filter(Number.isFinite);
  return validos.length ? Math.max(...validos) : null;
}

function indicesHorario(tiempos = []) {
  const primeraFecha = tiempos.find(valor => typeof valor === "string")?.slice(0, 10);
  if (!primeraFecha) return [];
  const indices = [];
  tiempos.forEach((valor, indice) => {
    if (typeof valor !== "string" || valor.slice(0, 10) !== primeraFecha) return;
    const hora = Number(valor.slice(11, 13));
    if (hora >= HORARIO_INICIO && hora <= HORARIO_FIN) indices.push(indice);
  });
  return indices;
}

function seleccionar(serie = [], indices = []) {
  return indices.map(indice => Number(serie[indice])).filter(Number.isFinite);
}

function formatearNumero(valor, decimales = 1) {
  return Number.isFinite(valor) ? valor.toFixed(decimales).replace(".", ",") : null;
}

function construirInstantanea(meteo, mar, generadoEn) {
  const indices = indicesHorario(meteo?.hourly?.time || []);
  if (!indices.length) return null;
  const temperatura = promedio(seleccionar(meteo?.hourly?.temperature_2m, indices));
  const viento = promedio(seleccionar(meteo?.hourly?.wind_speed_10m, indices));
  const lluvia = maximo(seleccionar(meteo?.hourly?.precipitation_probability, indices));
  const oleaje = promedio(seleccionar(mar?.hourly?.wave_height, indices));
  const agua = promedio(seleccionar(mar?.hourly?.sea_surface_temperature, indices));
  const fecha = meteo?.hourly?.time?.[indices[0]]?.slice(0, 10) || null;
  const generado = generadoEn ? new Date(generadoEn) : null;
  const horaGenerado = generado && !Number.isNaN(generado.getTime())
    ? new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(generado)
    : null;
  return { temperatura, viento, lluvia, oleaje, agua, fecha, horaGenerado };
}

function enriquecerHtml(html, playa, instantanea) {
  html = reemplazarContenido(
    html,
    /<h2>Descripción<\/h2><p id="descripcionPlaya">[\s\S]*?<\/p>/,
    `<h2>¿Cómo es ${escaparHtml(playa.nombre)}?</h2><p id="descripcionPlaya">${escaparHtml(valorVisible(playa.descripcion))}</p>`,
    "la descripción"
  );
  html = reemplazarContenido(html, /(<dl id="listaCaracteristicas" class="lista-datos dos-columnas">)[\s\S]*?(<\/dl>)/, `$1${renderizarLista(playa.caracteristicas, etiquetas.caracteristicas)}$2`, "las características");
  html = reemplazarContenido(html, /(<dl id="listaMarea" class="lista-datos tres-columnas">)[\s\S]*?(<\/dl>)/, `$1${renderizarLista(playa.marea, etiquetas.marea)}$2`, "los datos de marea");
  html = reemplazarContenido(html, /<p id="recomendacionMarea" class="aviso-neutro">[\s\S]*?<\/p>/, `<p id="recomendacionMarea" class="aviso-neutro">${escaparHtml(valorVisible(playa.marea?.recomendacion))}</p>`, "la recomendación de marea");
  html = reemplazarContenido(html, /(<dl id="listaBano" class="lista-datos tres-columnas">)[\s\S]*?(<\/dl>)/, `$1${renderizarLista(playa.bano, etiquetas.bano)}$2`, "los datos de baño");
  html = reemplazarContenido(html, /(<dl id="listaServicios" class="lista-filas">)[\s\S]*?(<\/dl>)/, `$1${renderizarLista(playa.servicios, etiquetas.servicios)}$2`, "los servicios");
  html = reemplazarContenido(html, /(<dl id="listaNormas" class="lista-filas">)[\s\S]*?(<\/dl>)/, `$1${renderizarLista(playa.normas, etiquetas.normas)}$2`, "las normas");
  html = reemplazarContenido(html, /(<dl id="listaPractica" class="lista-filas">)[\s\S]*?(<\/dl>)/, `$1${renderizarPractica(playa)}$2`, "la información práctica");
  html = reemplazarContenido(html, /(<ul id="fuentesConsultadas" class="lista-fuentes">)[\s\S]*?(<\/ul>)/, `$1${renderizarFuentes(playa.fuentes)}$2`, "las fuentes");

  if (instantanea) {
    const temperatura = formatearNumero(instantanea.temperatura);
    const viento = formatearNumero(instantanea.viento, 0);
    const lluvia = formatearNumero(instantanea.lluvia, 0);
    const oleaje = formatearNumero(instantanea.oleaje);
    const agua = formatearNumero(instantanea.agua);
    const actualizado = instantanea.horaGenerado ? `Previsión ${instantanea.horaGenerado}` : "Previsión de hoy";
    html = html.replace('<span id="actualizacionCondiciones">Actualizando…</span>', `<span id="actualizacionCondiciones">${actualizado}</span>`);
    html = html.replace('class="condiciones-cargando" role="status" aria-live="polite">Consultando las condiciones actuales…</div>', 'class="condiciones-cargando" role="status" aria-live="polite">Previsión base disponible; calculando la valoración de Hoy Toca Playa…</div>');
    html = html.replace('<div id="condicionesContenido" hidden>', '<div id="condicionesContenido">');
    html = html.replace('<strong id="estadoPlaya">Información no disponible</strong>', '<strong id="estadoPlaya">Valoración en curso</strong>');
    html = html.replace('<dd id="temperaturaPlaya">–</dd>', `<dd id="temperaturaPlaya">${temperatura ? `${temperatura} °C` : NO_DISPONIBLE}</dd>`);
    html = html.replace('<dd id="vientoPlaya">–</dd>', `<dd id="vientoPlaya">${viento ? `${viento} km/h` : NO_DISPONIBLE}</dd>`);
    html = html.replace('<dd id="lluviaPlaya">–</dd>', `<dd id="lluviaPlaya">${lluvia ? `hasta ${lluvia}%` : NO_DISPONIBLE}</dd>`);
    html = html.replace('<dd id="oleajePlaya">–</dd>', `<dd id="oleajePlaya">${oleaje ? `${oleaje} m` : NO_DISPONIBLE}</dd>`);
    html = html.replace('<dd id="aguaPlaya">–</dd>', `<dd id="aguaPlaya">${agua ? `${agua} °C` : NO_DISPONIBLE}</dd>`);
  }

  html = html.replace(
    '<noscript>Necesitas activar JavaScript para consultar las condiciones meteorológicas de esta playa.</noscript>',
    '<noscript>La ficha incluye una previsión base y la información práctica disponible. Activa JavaScript para ver la puntuación y la valoración completa del ranking.</noscript>'
  );
  return html;
}

const [catalogo, investigacion, descripciones, pronostico] = await Promise.all([
  readFile(CATALOGO, "utf8").then(JSON.parse),
  readFile(INFORMACION, "utf8").then(JSON.parse),
  cargarDescripciones(),
  readFile(PRONOSTICO, "utf8").then(JSON.parse)
]);

if (!Array.isArray(catalogo.playas) || !catalogo.playas.length) throw new Error("El catálogo de playas está vacío.");
if (!Array.isArray(pronostico.datosMeteorologicos)) throw new Error("El pronóstico compartido no es válido.");

let actualizadas = 0;
for (const [indice, original] of catalogo.playas.entries()) {
  const playa = structuredClone(original);
  const descripcion = descripciones.get(`${playa.nombreCatalogo || playa.nombre}||${playa.municipio}`);
  if (descripcion) playa.descripcion = descripcion;
  aplicarInformacionVerificada(playa, investigacion);
  aplicarAjustesLocales(playa);

  const instantanea = construirInstantanea(
    pronostico.datosMeteorologicos[indice],
    pronostico.datosMaritimos?.[indice],
    pronostico.generadoEn
  );
  const ruta = resolve(RAIZ, "playas", playa.slug, "index.html");
  const html = await readFile(ruta, "utf8");
  await writeFile(ruta, enriquecerHtml(html, playa, instantanea), "utf8");
  actualizadas += 1;
}

console.log(`SEO prerenderizado en ${actualizadas} fichas (previsión ${HORARIO_INICIO}:00–${HORARIO_FIN}:00).`);
