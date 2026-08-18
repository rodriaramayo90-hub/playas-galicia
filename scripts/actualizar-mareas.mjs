// Actualización de prueba: fuerza la validación completa del flujo de mareas.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const ARCHIVO_SALIDA = resolve(RAIZ, "data", "mareas.json");
const URL_MAREAS = "https://servizos.meteogalicia.gal/mgrss/predicion/mareas/jsonMareas.action";
const IDS_PORTOS_GALICIA = new Set([1, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
const REINTENTOS = 2;

function fechaMadrid(offsetDias = 0) {
  const ahora = new Date(Date.now() + offsetDias * 86400000);
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(ahora);
  const mapa = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
  return `${mapa.year}-${mapa.month}-${mapa.day}`;
}

function fechaConsulta(fechaIso) {
  const [ano, mes, dia] = fechaIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

async function solicitarJson(url) {
  let ultimoError;
  for (let intento = 0; intento <= REINTENTOS; intento += 1) {
    try {
      const respuesta = await fetch(url, {
        headers: { "User-Agent": "HoyTocaPlaya/1.0 (+https://hoytocaplaya.com/)" },
        signal: AbortSignal.timeout(30000)
      });
      if (!respuesta.ok) throw new Error(`MeteoGalicia respondió ${respuesta.status}.`);
      return await respuesta.json();
    } catch (error) {
      ultimoError = error;
      if (intento < REINTENTOS) await new Promise(resolve => setTimeout(resolve, 1200 * (intento + 1)));
    }
  }
  throw ultimoError;
}

function recolectarBloquesPuerto(nodo, salida = []) {
  if (!nodo) return salida;
  if (Array.isArray(nodo)) {
    nodo.forEach(elemento => recolectarBloquesPuerto(elemento, salida));
    return salida;
  }
  if (typeof nodo !== "object") return salida;
  if (Array.isArray(nodo.listaMareas) && Number.isFinite(Number(nodo.idPorto))) {
    salida.push(nodo);
    return salida;
  }
  Object.values(nodo).forEach(valor => recolectarBloquesPuerto(valor, salida));
  return salida;
}

function normalizarMarea(marea) {
  const idTipo = Number(marea.idTipoMarea);
  const hora = typeof marea.hora === "string"
    ? marea.hora.slice(0, 5)
    : (typeof marea.data === "string" ? marea.data.slice(11, 16) : null);
  if (!hora || ![0, 1].includes(idTipo)) return null;
  const altura = Number(marea.altura);
  return {
    tipo: idTipo === 1 ? "pleamar" : "bajamar",
    hora,
    altura: Number.isFinite(altura) ? altura : null
  };
}

function normalizarPuerto(bloque) {
  const idPorto = Number(bloque.idPorto);
  if (!IDS_PORTOS_GALICIA.has(idPorto)) return null;
  const mareas = (bloque.listaMareas || [])
    .map(normalizarMarea)
    .filter(Boolean)
    .sort((a, b) => a.hora.localeCompare(b.hora));
  if (!mareas.length) return null;

  const latitud = Number(bloque.latitude ?? bloque.latitud);
  const longitud = Number(bloque.lonxitude ?? bloque.longitude ?? bloque.longitud);
  return {
    idPorto,
    nombre: bloque.nomePorto || bloque.nombrePorto || bloque.nome || `Puerto ${idPorto}`,
    lat: Number.isFinite(latitud) ? latitud : null,
    lon: Number.isFinite(longitud) ? longitud : null,
    mareas
  };
}

async function consultarDia(fechaIso) {
  const url = new URL(URL_MAREAS);
  url.searchParams.set("data", fechaConsulta(fechaIso));
  const datos = await solicitarJson(url.href);
  const bloques = recolectarBloquesPuerto(datos);
  const puertos = {};
  bloques.map(normalizarPuerto).filter(Boolean).forEach(puerto => {
    puertos[String(puerto.idPorto)] = puerto;
  });

  if (!Object.keys(puertos).length) {
    throw new Error(`MeteoGalicia no devolvió puertos reconocibles para ${fechaIso}.`);
  }
  return puertos;
}

const fechas = [fechaMadrid(0), fechaMadrid(1)];
const dias = {};
for (const fecha of fechas) {
  dias[fecha] = await consultarDia(fecha);
}

const salida = {
  version: 1,
  generadoEn: new Date().toISOString(),
  zonaHoraria: "Europe/Madrid",
  fuente: {
    nombre: "MeteoGalicia · Xunta de Galicia",
    licencia: "CC BY-SA 4.0",
    documentacion: "https://meteo-estaticos.xunta.gal/datosred/infoweb/meteo/docs/rss/JSON_Mareas_gl.pdf"
  },
  dias
};

await mkdir(dirname(ARCHIVO_SALIDA), { recursive: true });
await writeFile(ARCHIVO_SALIDA, `${JSON.stringify(salida, null, 2)}\n`, "utf8");
console.log(`Mareas guardadas para ${fechas.join(" y ")} (${Object.keys(dias[fechas[0]]).length} puertos hoy).`);
