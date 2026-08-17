import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const ARCHIVO_APP = resolve(RAIZ, "app.js");
const ARCHIVO_EXTRA = resolve(RAIZ, "playas-extra.js");
const ARCHIVO_SALIDA = resolve(RAIZ, "data", "pronostico.json");
const TAMANO_LOTE = 50;
const REINTENTOS = 2;

function extraerArray(codigo, nombreConstante, etiqueta) {
  const marcador = `const ${nombreConstante} = [`;
  const inicio = codigo.indexOf(marcador);
  const fin = codigo.indexOf("\n];", inicio);
  if (inicio < 0 || fin < 0) throw new Error(`No se encontró ${etiqueta}.`);
  const definicion = codigo.slice(inicio + `const ${nombreConstante} = `.length, fin + 2);
  const elementos = Function(`"use strict"; return (${definicion});`)();
  if (!Array.isArray(elementos)) throw new Error(`${etiqueta} no es un array.`);
  return elementos;
}

function unirCatalogos(base, extras) {
  const resultado = [...base];
  const claves = new Set(base.map(playa => `${playa.nombre}||${playa.municipio}`));
  for (const playa of extras) {
    const clave = `${playa.nombre}||${playa.municipio}`;
    if (claves.has(clave)) continue;
    claves.add(clave);
    resultado.push(playa);
  }
  return resultado;
}

function dividirEnLotes(elementos, tamano) {
  const lotes = [];
  for (let indice = 0; indice < elementos.length; indice += tamano) {
    lotes.push(elementos.slice(indice, indice + tamano));
  }
  return lotes;
}

async function solicitarJson(url) {
  let ultimoError;
  for (let intento = 0; intento <= REINTENTOS; intento += 1) {
    try {
      const respuesta = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!respuesta.ok) throw new Error(`El servicio respondió con ${respuesta.status}.`);
      return await respuesta.json();
    } catch (error) {
      ultimoError = error;
      if (intento < REINTENTOS) await new Promise(resolve => setTimeout(resolve, 1000 * (intento + 1)));
    }
  }
  throw ultimoError;
}

async function consultarLote(lote) {
  const latitudes = lote.map(playa => playa.lat).join(",");
  const longitudes = lote.map(playa => playa.lon).join(",");
  const meteo = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&daily=temperature_2m_max&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,sunshine_duration,is_day&forecast_days=2&timezone=Europe%2FMadrid&cell_selection=nearest`;
  const mar = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitudes}&longitude=${longitudes}&hourly=sea_surface_temperature,wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,swell_wave_height,swell_wave_direction&forecast_days=2&timezone=Europe%2FMadrid`;
  const [meteorologia, datosMaritimos] = await Promise.all([solicitarJson(meteo), solicitarJson(mar)]);
  const datosMeteorologicos = Array.isArray(meteorologia) ? meteorologia : [meteorologia];
  const datosMar = Array.isArray(datosMaritimos) ? datosMaritimos : [datosMaritimos];
  if (datosMeteorologicos.length !== lote.length || datosMar.length !== lote.length) {
    throw new Error("Open-Meteo devolvió un lote incompleto.");
  }
  return { datosMeteorologicos, datosMaritimos: datosMar };
}

const [codigoApp, codigoExtra] = await Promise.all([
  readFile(ARCHIVO_APP, "utf8"),
  readFile(ARCHIVO_EXTRA, "utf8")
]);
const playasBase = extraerArray(codigoApp, "playas", "el catálogo principal de playas en app.js");
const playasExtra = extraerArray(codigoExtra, "PLAYAS_EXTRA", "la ampliación de playas en playas-extra.js");
const playas = unirCatalogos(playasBase, playasExtra);

if (playas.length !== 180) {
  throw new Error(`Se esperaban 180 playas y se encontraron ${playas.length}. Revisa el catálogo antes de publicar el pronóstico.`);
}

const respuestas = [];
for (const lote of dividirEnLotes(playas, TAMANO_LOTE)) respuestas.push(await consultarLote(lote));

const salida = {
  version: 2,
  generadoEn: new Date().toISOString(),
  totalPlayas: playas.length,
  datosMeteorologicos: respuestas.flatMap(respuesta => respuesta.datosMeteorologicos),
  datosMaritimos: respuestas.flatMap(respuesta => respuesta.datosMaritimos)
};

await mkdir(dirname(ARCHIVO_SALIDA), { recursive: true });
await writeFile(ARCHIVO_SALIDA, `${JSON.stringify(salida)}\n`, "utf8");
console.log(`Pronóstico actualizado para ${playas.length} playas: ${ARCHIVO_SALIDA}`);
