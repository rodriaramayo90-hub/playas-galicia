import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const ARCHIVO_APP = resolve(RAIZ, "app.js");
const ARCHIVO_SALIDA = resolve(RAIZ, "data", "pronostico.json");
const TAMANO_LOTE = 50;
const REINTENTOS = 2;

function extraerPlayas(codigo) {
  const inicio = codigo.indexOf("const playas = [");
  const fin = codigo.indexOf("\n];", inicio);
  if (inicio < 0 || fin < 0) throw new Error("No se encontró el catálogo de playas en app.js.");
  const definicion = codigo.slice(inicio + "const playas = ".length, fin + 2);
  const playas = Function(`"use strict"; return (${definicion});`)();
  if (!Array.isArray(playas) || playas.length === 0) throw new Error("El catálogo de playas está vacío.");
  return playas;
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

const codigo = await readFile(ARCHIVO_APP, "utf8");
const playas = extraerPlayas(codigo);
const respuestas = [];
for (const lote of dividirEnLotes(playas, TAMANO_LOTE)) respuestas.push(await consultarLote(lote));

const salida = {
  version: 1,
  generadoEn: new Date().toISOString(),
  totalPlayas: playas.length,
  datosMeteorologicos: respuestas.flatMap(respuesta => respuesta.datosMeteorologicos),
  datosMaritimos: respuestas.flatMap(respuesta => respuesta.datosMaritimos)
};

await mkdir(dirname(ARCHIVO_SALIDA), { recursive: true });
await writeFile(ARCHIVO_SALIDA, `${JSON.stringify(salida)}\n`, "utf8");
console.log(`Pronóstico actualizado para ${playas.length} playas: ${ARCHIVO_SALIDA}`);

