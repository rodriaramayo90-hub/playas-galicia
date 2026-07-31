const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const llamadas = [];
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
      cloud_cover: repetir(25)
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
}

(async () => {
  await probarDistancias();
  await probarPronostico();
  console.log("OK: 200 playas en 5 lotes de distancia y 4 lotes de pronóstico.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
