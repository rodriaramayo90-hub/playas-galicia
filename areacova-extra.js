// Praia de Areacova: alta local añadida tras verificar que no estaba en el catálogo del ranking.
if (typeof playas !== "undefined" && !playas.some(p => p.nombre === "Praia de Areacova" && p.municipio === "Cangas")) {
  playas.push({
    nombre: "Praia de Areacova",
    slugFicha: "praia-de-areacova",
    municipio: "Cangas",
    provincia: "Pontevedra",
    lat: 42.287894,
    lon: -8.820833,
    orientacion: "SE",
    anguloAproximado: 140,
    nivelAbrigo: "alto",
    zonaMeteorologica: "aldan",
    destinoMaps: "Praia de Areacova, Aldán, Cangas, Galicia"
  });
  if (window.HoyTocaPlayaIndiceFichas) {
    window.HoyTocaPlayaIndiceFichas["Praia de Areacova||Cangas"] = "praia-de-areacova";
  }
}

// Capa de rendimiento para el pronóstico.
// 1) Reutiliza durante 30 min el último pronóstico válido guardado en el navegador.
// 2) Lo refresca en segundo plano para que la siguiente interacción ya use datos nuevos.
// 3) Si no hay caché reciente, intenta primero el JSON compartido.
// 4) Solo cae a Open-Meteo directo si tampoco hay una copia válida de respaldo.
//
// Esta capa no modifica puntuaciones ni datos; únicamente cambia cómo se obtienen.
const HTP_CACHE_PRONOSTICO_NOMBRE = "hoy-toca-playa-pronostico-v1";
const HTP_CACHE_PRONOSTICO_CLAVE = "hoyTocaPlaya:pronostico:v1";
const HTP_CACHE_PRIMARIA_MS = 30 * 60 * 1000;
const HTP_INTERVALO_VERSION_PRONOSTICO_MS = 10 * 60 * 1000;
const HTP_TIMEOUT_PRONOSTICO_COMPARTIDO_MS = 5000;
let htpPromesaCargaPronostico = null;
let htpPromesaRefrescoPronostico = null;

function htpFechaHoyMadrid() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const mapa = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
  return `${mapa.year}-${mapa.month}-${mapa.day}`;
}

function htpValidarPronosticoCache(datos, antiguedadMaximaMs) {
  const generadoEn = Date.parse(datos?.generadoEn);
  const datosMeteorologicos = datos?.datosMeteorologicos;
  const datosMaritimos = datos?.datosMaritimos;
  const fechaBase = datosMeteorologicos?.[0]?.daily?.time?.[0];
  const antiguedad = Date.now() - generadoEn;

  if (
    !Number.isFinite(generadoEn) ||
    antiguedad < -5 * 60 * 1000 ||
    antiguedad > antiguedadMaximaMs ||
    fechaBase !== htpFechaHoyMadrid() ||
    !Array.isArray(datosMeteorologicos) ||
    !Array.isArray(datosMaritimos) ||
    datosMeteorologicos.length !== playas.length ||
    datosMaritimos.length !== playas.length
  ) {
    return null;
  }

  return { datosMeteorologicos, datosMaritimos };
}

function htpPeticionCachePronostico() {
  return new Request(new URL("data/.pronostico-cache-local", window.location.href).href);
}

async function htpGuardarPronosticoCache(datos) {
  try {
    if ("caches" in window) {
      const cache = await caches.open(HTP_CACHE_PRONOSTICO_NOMBRE);
      await cache.put(
        htpPeticionCachePronostico(),
        new Response(JSON.stringify(datos), {
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }
  } catch (error) {
    console.debug("No se pudo guardar el pronóstico en Cache Storage.", error);
  }

  try {
    localStorage.setItem(HTP_CACHE_PRONOSTICO_CLAVE, JSON.stringify(datos));
  } catch (error) {
    console.debug("No se pudo guardar el pronóstico en localStorage.", error);
  }
}

async function htpLeerPronosticoCache(antiguedadMaximaMs) {
  try {
    if ("caches" in window) {
      const cache = await caches.open(HTP_CACHE_PRONOSTICO_NOMBRE);
      const respuesta = await cache.match(htpPeticionCachePronostico());
      if (respuesta) {
        const datos = await respuesta.json();
        const validado = htpValidarPronosticoCache(datos, antiguedadMaximaMs);
        if (validado) return validado;
      }
    }
  } catch (error) {
    console.debug("No se pudo leer el pronóstico de Cache Storage.", error);
  }

  try {
    const guardado = localStorage.getItem(HTP_CACHE_PRONOSTICO_CLAVE);
    if (!guardado) return null;
    return htpValidarPronosticoCache(JSON.parse(guardado), antiguedadMaximaMs);
  } catch (error) {
    console.debug("No se pudo leer el pronóstico de localStorage.", error);
    return null;
  }
}

async function htpCargarPronosticoCompartidoOptimizado() {
  const version = Math.floor(Date.now() / HTP_INTERVALO_VERSION_PRONOSTICO_MS);
  const url = `${URL_PRONOSTICO_COMPARTIDO}?v=${version}`;
  const datos = await solicitarJson(url, {
    reintentos: 0,
    tiempoLimite: HTP_TIMEOUT_PRONOSTICO_COMPARTIDO_MS
  });
  const validado = validarPronosticoCompartido(datos);
  htpGuardarPronosticoCache(datos).catch(() => {});
  return validado;
}

// Sustituye únicamente la estrategia de descarga; la validación y el contenido
// siguen siendo los mismos que usa app.js.
cargarPronosticoCompartido = htpCargarPronosticoCompartidoOptimizado;

function htpRefrescarPronosticoEnSegundoPlano() {
  if (htpPromesaRefrescoPronostico) return htpPromesaRefrescoPronostico;

  htpPromesaRefrescoPronostico = (async () => {
    try {
      const actualizado = await htpCargarPronosticoCompartidoOptimizado();
      respuestasPronosticoCache = actualizado;
      datosPlayasCache = {};
    } catch (error) {
      console.debug("El refresco silencioso del pronóstico no estaba disponible.", error);
    } finally {
      htpPromesaRefrescoPronostico = null;
    }
  })();

  return htpPromesaRefrescoPronostico;
}

cargarRespuestasPronostico = async function() {
  if (htpPromesaCargaPronostico) return htpPromesaCargaPronostico;

  htpPromesaCargaPronostico = (async () => {
    const cacheRapida = await htpLeerPronosticoCache(HTP_CACHE_PRIMARIA_MS);
    if (cacheRapida) {
      htpRefrescarPronosticoEnSegundoPlano();
      return cacheRapida;
    }

    try {
      return await htpCargarPronosticoCompartidoOptimizado();
    } catch (errorCompartido) {
      const cacheRespaldo = await htpLeerPronosticoCache(ANTIGUEDAD_MAXIMA_PRONOSTICO_MS);
      if (cacheRespaldo) {
        console.warn("Se usará temporalmente el último pronóstico válido guardado.", errorCompartido);
        return cacheRespaldo;
      }

      console.warn("Se usará Open-Meteo directamente como último respaldo.", errorCompartido);
      const directo = await consultarPronosticoDirecto();
      htpGuardarPronosticoCache({
        version: 1,
        generadoEn: new Date().toISOString(),
        totalPlayas: playas.length,
        datosMeteorologicos: directo.datosMeteorologicos,
        datosMaritimos: directo.datosMaritimos
      }).catch(() => {});
      return directo;
    }
  })();

  try {
    return await htpPromesaCargaPronostico;
  } finally {
    htpPromesaCargaPronostico = null;
  }
};
