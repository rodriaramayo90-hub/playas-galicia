const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const llamadas = [];
let pronosticoCompartido = null;
const fechas = ["2030-07-01", "2030-07-02"];
const horas = fechas.flatMap(fecha =>
  Array.from({ length: 24 }, (_, hora) => `${fecha}T${String(hora).padStart(2, "0")}:00`)
);

function respuestaJson(datos) {
  return {
    ok: true,
    json: async () => datos
  };
}

function repetir(valor) {
  return Array(horas.length).fill(valor);
}

function crearMeteorologia() {
  return {
    daily: {
      time: fechas,
      temperature_2m_max: [25, 26]
    },
    hourly: {
      time: horas,
      temperature_2m: repetir(23),
      precipitation_probability: repetir(10),
      wind_speed_10m: repetir(12),
      wind_direction_10m: repetir(270),
      cloud_cover: repetir(25),
      cloud_cover_low: repetir(20),
      cloud_cover_mid: repetir(15),
      cloud_cover_high: repetir(25),
      sunshine_duration: repetir(2700),
      is_day: repetir(1)
    }
  };
}

function crearDatosMarinos() {
  return {
    hourly: {
      time: horas,
      sea_surface_temperature: repetir(17),
      wave_height: repetir(0.5),
      wave_direction: repetir(270),
      wave_period: repetir(8),
      wind_wave_height: repetir(0.2),
      wind_wave_direction: repetir(270),
      swell_wave_height: repetir(0.4),
      swell_wave_direction: repetir(270)
    }
  };
}

async function fetchSimulado(url) {
  const direccion = String(url);
  llamadas.push(direccion);
  if (direccion.startsWith("data/pronostico.json")) {
    return pronosticoCompartido
      ? respuestaJson(pronosticoCompartido)
      : { ok: false, status: 404, json: async () => ({}) };
  }
  const urlAnalizada = new URL(direccion);

  if (direccion.includes("router.project-osrm.org/table/")) {
    const totalDestinos = urlAnalizada.searchParams.get("destinations").split(";").length;
    return respuestaJson({
      distances: [Array.from({ length: totalDestinos }, (_, indice) => 1000 + indice)]
    });
  }

  const totalUbicaciones = urlAnalizada.searchParams.get("latitude").split(",").length;
  const fabrica = direccion.includes("marine-api.open-meteo.com")
    ? crearDatosMarinos
    : crearMeteorologia;
  const datos = Array.from({ length: totalUbicaciones }, fabrica);
  return respuestaJson(totalUbicaciones === 1 ? datos[0] : datos);
}

const contexto = {
  AbortController,
  URL,
  console,
  Date,
  Math,
  Number,
  Promise,
  clearTimeout,
  document: {},
  fetch: fetchSimulado,
  navigator: {},
  setTimeout,
  window: { addEventListener() {} }
};
vm.createContext(contexto);

const rutaApp = path.join(__dirname, "..", "app.js");
const codigo = fs.readFileSync(rutaApp, "utf8");
vm.runInContext(`${codigo}\n;globalThis.__pruebas = {
  calcularDistanciasCoche,
  obtenerDatosPlayas,
  factorAbrigoDireccional,
  compartirMeteorologiaPorZona,
  resumirNubosidad,
  resumirProbabilidadLluvia,
  obtenerCielo,
  puntosConfortSolar,
  calcularPuntuacion,
  contarPlayasConAbrigo() {
    return playas.filter(playa =>
      playa.nivelAbrigo || playa.abrigoViento || playa.abrigoOleaje
    ).length;
  },
  contarZonasMeteorologicas() {
    const agrupadas = playas.filter(playa => playa.zonaMeteorologica);
    return {
      playas: agrupadas.length,
      zonas: new Set(agrupadas.map(playa => playa.zonaMeteorologica)).size
    };
  },
  prepararPlayas(total) {
    while (playas.length < total) {
      const original = playas[playas.length % 50];
      const indice = playas.length;
      playas.push({
        ...original,
        nombre: \`Playa de prueba \${indice + 1}\`,
        lat: original.lat + indice * 0.00001,
        lon: original.lon - indice * 0.00001
      });
    }
  },
  reiniciar() {
    respuestasPronosticoCache = null;
    datosPlayasCache = {};
    cacheDistanciasCoche.clear();
    cacheFallosDistancia.clear();
  }
};`, contexto);

async function probarDistancias() {
  contexto.__pruebas.reiniciar();
  llamadas.length = 0;
  const origen = { lat: 43.36, lon: -8.41 };
  const destinos = Array.from({ length: 200 }, (_, indice) => ({
    lat: 42 + indice * 0.001,
    lon: -9 + indice * 0.001
  }));

  const distancias = await contexto.__pruebas.calcularDistanciasCoche(origen, destinos);
  const llamadasTabla = llamadas.filter(url => url.includes("router.project-osrm.org/table/"));
  assert.equal(distancias.length, 200);
  assert.equal(llamadasTabla.length, 5);
  assert.ok(distancias.every(Number.isFinite));
  assert.ok(llamadasTabla.every(url =>
    new URL(url).searchParams.get("destinations").split(";").length <= 40
  ));

  await contexto.__pruebas.calcularDistanciasCoche(origen, destinos);
  assert.equal(
    llamadas.filter(url => url.includes("router.project-osrm.org/table/")).length,
    5,
    "La segunda consulta debe resolverse por completo desde la caché"
  );
}

async function probarPronostico() {
  contexto.__pruebas.reiniciar();
  contexto.__pruebas.prepararPlayas(200);
  llamadas.length = 0;

  const resultados = await contexto.__pruebas.obtenerDatosPlayas(0);
  assert.equal(resultados.length, 200);
  assert.equal(
    llamadas.filter(url => url.includes("api.open-meteo.com/v1/forecast")).length,
    4
  );
  assert.equal(
    llamadas.filter(url => url.includes("marine-api.open-meteo.com/v1/marine")).length,
    4
  );

  const sanAmaro = resultados.find(playa => playa.nombre === "Playa de San Amaro");
  const playaAbierta = resultados.find(playa => playa.nombre === "Playa de Orzán");
  assert.equal(sanAmaro.vientoModelo, 12);
  assert.equal(sanAmaro.viento, 3, "El viento de W debe quedar muy atenuado dentro de San Amaro");
  assert.equal(playaAbierta.viento, 12, "Una playa sin abrigo debe conservar el viento del modelo");
  assert.ok(sanAmaro.oleaje < 0.15, "El mar exterior de W debe llegar prácticamente plano a San Amaro");
}

async function probarPronosticoCompartido() {
  contexto.__pruebas.reiniciar();
  contexto.__pruebas.prepararPlayas(200);
  pronosticoCompartido = {
    generadoEn: new Date().toISOString(),
    datosMeteorologicos: Array.from({ length: 200 }, crearMeteorologia),
    datosMaritimos: Array.from({ length: 200 }, crearDatosMarinos)
  };
  llamadas.length = 0;

  const resultados = await contexto.__pruebas.obtenerDatosPlayas(1, 17, 21);
  assert.equal(resultados.length, 200);
  assert.equal(llamadas.filter(url => url.startsWith("data/pronostico.json")).length, 1);
  assert.equal(llamadas.filter(url => url.includes("api.open-meteo.com/v1/forecast")).length, 0);
  assert.equal(llamadas.filter(url => url.includes("marine-api.open-meteo.com/v1/marine")).length, 0);
  pronosticoCompartido = null;
}

function probarAbrigoDireccional() {
  assert.ok(contexto.__pruebas.contarPlayasConAbrigo() >= 29);
  const zonasMeteorologicas = contexto.__pruebas.contarZonasMeteorologicas();
  assert.ok(zonasMeteorologicas.playas >= 22);
  assert.ok(zonasMeteorologicas.zonas >= 8);
  const abrigo = { direccionApertura: 45, factorMinimo: 0.25, factorMaximo: 0.45, amplitud: 70 };
  assert.equal(contexto.__pruebas.factorAbrigoDireccional(null, 270), 1);
  assert.equal(contexto.__pruebas.factorAbrigoDireccional(abrigo, 45), 0.45);
  assert.equal(contexto.__pruebas.factorAbrigoDireccional(abrigo, 270), 0.25);
  const lateral = contexto.__pruebas.factorAbrigoDireccional(abrigo, 90);
  assert.ok(lateral > 0.25 && lateral < 0.45);
}

function probarZonasMeteorologicas() {
  const serie = valor => Array(48).fill(valor);
  const crearDatos = (temperatura, nubosidad, direccion) => ({
    daily: { time: ["2026-08-01", "2026-08-02"], temperature_2m_max: [temperatura, temperatura] },
    hourly: {
      time: Array.from({ length: 48 }, (_, indice) => `2026-08-0${indice < 24 ? 1 : 2}T${String(indice % 24).padStart(2, "0")}:00`),
      temperature_2m: serie(temperatura),
      precipitation_probability: serie(20),
      wind_speed_10m: serie(10),
      wind_direction_10m: serie(direccion),
      cloud_cover: serie(nubosidad),
      cloud_cover_low: serie(nubosidad),
      cloud_cover_mid: serie(nubosidad),
      cloud_cover_high: serie(nubosidad),
      sunshine_duration: serie(1800),
      is_day: serie(1)
    }
  });
  const independiente = crearDatos(18, 80, 180);
  const resultado = contexto.__pruebas.compartirMeteorologiaPorZona(
    [{ zonaMeteorologica: "coruna" }, { zonaMeteorologica: "coruna" }, {}],
    [crearDatos(20, 40, 350), crearDatos(22.6, 60, 10), independiente]
  );
  assert.equal(resultado[0], resultado[1]);
  assert.equal(resultado[0].hourly.temperature_2m[0], 21.3);
  assert.equal(resultado[0].hourly.cloud_cover[0], 50);
  assert.ok(resultado[0].hourly.wind_direction_10m[0] < 0.01);
  assert.equal(resultado[2], independiente);
}

function probarNubosidadEfectiva() {
  const cieloAltoConSol = contexto.__pruebas.resumirNubosidad([{
    nubosidad: 90,
    nubosidadBaja: 0,
    nubosidadMedia: 10,
    nubosidadAlta: 90,
    duracionSol: 3600
  }, {
    nubosidad: 90, nubosidadBaja: 0, nubosidadMedia: 10, nubosidadAlta: 90, duracionSol: 3600
  }, {
    nubosidad: 90, nubosidadBaja: 0, nubosidadMedia: 10, nubosidadAlta: 90, duracionSol: 3600
  }]);
  const cieloCubierto = contexto.__pruebas.resumirNubosidad([{
    nubosidad: 90,
    nubosidadBaja: 90,
    nubosidadMedia: 80,
    nubosidadAlta: 50,
    duracionSol: 0
  }]);
  assert.ok(cieloAltoConSol.nubosidad <= 10, "Las nubes altas con sol no deben figurar como cielo nublado");
  assert.ok(cieloCubierto.nubosidad > 80, "Las nubes bajas sin sol deben conservar la categoría de cielo cubierto");

  const variable = contexto.__pruebas.resumirNubosidad([
    { nubosidad: 0, nubosidadBaja: 0, nubosidadMedia: 0, nubosidadAlta: 0, duracionSol: 3600 },
    { nubosidad: 0, nubosidadBaja: 0, nubosidadMedia: 0, nubosidadAlta: 0, duracionSol: 1200 }
  ]);
  assert.ok(variable.nubosidad > 10 && variable.nubosidad <= 30, "Despejado exige al menos un 75 % de horas realmente soleadas");

  const intervaloCortoNublado = contexto.__pruebas.resumirNubosidad([
    { nubosidad: 80, nubosidadBaja: 75, nubosidadMedia: 40, nubosidadAlta: 10, duracionSol: 3000, esDeDia: 1 },
    { nubosidad: 65, nubosidadBaja: 60, nubosidadMedia: 35, nubosidadAlta: 10, duracionSol: 3000, esDeDia: 1 }
  ]);
  assert.ok(intervaloCortoNublado.nubosidad > 60, "Un intervalo corto con nubes bajas no puede quedar como algunas nubes");

  const intervaloConNubesAltas = contexto.__pruebas.resumirNubosidad([
    { nubosidad: 85, nubosidadBaja: 5, nubosidadMedia: 10, nubosidadAlta: 85, duracionSol: 3300, esDeDia: 1 },
    { nubosidad: 75, nubosidadBaja: 5, nubosidadMedia: 15, nubosidadAlta: 75, duracionSol: 3200, esDeDia: 1 }
  ]);
  assert.ok(intervaloConNubesAltas.nubosidad <= 30, "Las nubes altas finas no deben convertir un intervalo soleado en parcialmente nublado");
  assert.equal(intervaloConNubesAltas.predominioNubesAltas, true);
  assert.equal(
    contexto.__pruebas.obtenerCielo(intervaloConNubesAltas.nubosidad, intervaloConNubesAltas.predominioNubesAltas),
    "🌥️ Nubes altas"
  );
}

function probarResumenLluvia() {
  const registros = valores => valores.map(lluvia => ({ lluvia }));

  assert.deepEqual(
    { ...contexto.__pruebas.resumirProbabilidadLluvia(registros([10, 70])) },
    { lluvia: 70, lluviaPromedio: 40, lluviaMaxima: 70 },
    "En intervalos cortos debe mostrarse el riesgo de la peor hora"
  );
  assert.deepEqual(
    { ...contexto.__pruebas.resumirProbabilidadLluvia(registros([0, 0, 20, 60, 0])) },
    { lluvia: 49, lluviaPromedio: 16, lluviaMaxima: 60 },
    "En rangos medios debe dominar el máximo sin ignorar el promedio"
  );
  assert.deepEqual(
    { ...contexto.__pruebas.resumirProbabilidadLluvia(registros([0, 0, 0, 0, 0, 0, 0, 0, 0, 60])) },
    { lluvia: 38, lluviaPromedio: 6, lluviaMaxima: 60 },
    "En rangos largos un pico de lluvia no debe desaparecer dentro de la media"
  );
}

function probarConfortSolar() {
  assert.equal(
    contexto.__pruebas.puntosConfortSolar(20.4, 7, 0, 20),
    5,
    "Un día fresco, soleado, seco y con poco viento debe recibir el bono de confort"
  );
  assert.equal(contexto.__pruebas.puntosConfortSolar(20.4, 7, 0, 31), 0);
  assert.equal(contexto.__pruebas.puntosConfortSolar(20.4, 11, 0, 20), 0);
  assert.equal(contexto.__pruebas.puntosConfortSolar(20.4, 7, 6, 20), 0);

  const puntuacionConBono = contexto.__pruebas.calcularPuntuacion(
    20.4, 7, 8, 0, 20, 18, 0.5, 0, 0
  );
  const puntuacionSinBono = contexto.__pruebas.calcularPuntuacion(
    20.4, 7, 8, 0, 31, 18, 0.5, 0, 0
  );
  assert.ok(
    puntuacionConBono - puntuacionSinBono >= 5,
    "El bono debe compensar el fresco solo cuando también se cumplen las condiciones solares"
  );
}

(async () => {
  probarAbrigoDireccional();
  probarZonasMeteorologicas();
  probarNubosidadEfectiva();
  probarResumenLluvia();
  probarConfortSolar();
  await probarDistancias();
  await probarPronostico();
  await probarPronosticoCompartido();
  console.log("OK: 200 playas con caché compartida y fallback directo por lotes.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

