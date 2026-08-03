let modoVista = "";
let columnaOrden = "puntuacion";
let direccionOrden = "desc";
let ubicacionUsuario = null;
let distanciaMaxima = null;

let datosPlayasCache = {};
let respuestasPronosticoCache = null;
let diaSeleccionado = 0;
let horaInicioSeleccionada = 7;
let horaFinSeleccionada = 21;
let detallesVisibles = false;

const TAMANO_LOTE_PRONOSTICO = 50;
const CONCURRENCIA_PRONOSTICO = 2;
const TAMANO_LOTE_DISTANCIAS = 40;
const CONCURRENCIA_DISTANCIAS = 2;
const MAX_DISTANCIAS_EN_CACHE = 5000;
const cacheDistanciasCoche = new Map();
const cacheFallosDistancia = new Map();

function mostrarEstado(mensaje, tipo = "info") {
  const estado = document.getElementById("estadoCarga");
  if (!estado) return;
  estado.textContent = mensaje;
  estado.dataset.tipo = tipo;
}

function actualizarOrigenDistancia(origen) {
  const indicador = document.getElementById("origenDistancia");
  if (!indicador) return;
  indicador.textContent = `📏 Distancias desde: ${origen}`;
  indicador.hidden = false;
}

function establecerControlesBloqueados(bloqueados) {
  document.querySelectorAll(".filtros button, .filtros input, .filtros select").forEach(control => {
    control.disabled = bloqueados;
  });
}

function actualizarOrdenAccesible() {
  document.querySelectorAll(".ordenable").forEach(cabecera => {
    const activa = cabecera.dataset.orden === columnaOrden;
    cabecera.setAttribute(
      "aria-sort",
      activa ? (direccionOrden === "asc" ? "ascending" : "descending") : "none"
    );
  });
}

function configurarCabecerasOrdenables() {
  document.querySelectorAll(".ordenable").forEach(cabecera => {
    cabecera.addEventListener("keydown", evento => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        cambiarOrden(cabecera.dataset.orden);
      }
    });
  });
  actualizarOrdenAccesible();
}


function toggleDetalles() {

    detallesVisibles = !detallesVisibles;

    actualizarVisibilidadDetalles();

    const boton = document.getElementById("btnDetalles");

    boton.textContent = detallesVisibles
        ? "Ocultar detalles"
        : "Ver detalles";
    boton.setAttribute("aria-expanded", String(detallesVisibles));
}

function ordenarResultados(resultados){

  resultados.sort((a,b)=>{

    let valorA = a[columnaOrden];
    let valorB = b[columnaOrden];
    if(valorA === null) valorA = Infinity;
    if(valorB === null) valorB = Infinity;
    // Para textos
    if(typeof valorA === "string"){
      return direccionOrden === "asc"
      ? valorA.localeCompare(valorB)
      : valorB.localeCompare(valorA);
    }

    // Para números
    return direccionOrden === "asc"
    ? valorA - valorB
    : valorB - valorA;

  });

}

function cambiarOrden(columna){

  if(columnaOrden === columna){

    direccionOrden =
      direccionOrden === "asc"
      ? "desc"
      : "asc";

  }
  else{

    columnaOrden = columna;
    direccionOrden = "desc";

  }

  actualizarOrdenAccesible();
  cargarRanking();

}
// Ángulo aproximado de apertura al mar: 0° = N, 90° = E, 180° = S, 270° = W.
// Las fórmulas actuales siguen utilizando `orientacion`; este valor queda preparado para refinarlas.
const playas = [
  {
    nombre: "Playa de la Magdalena",
    municipio: "Cabanas",
    lat: 43.417042,
    lon: -8.174374,
    orientacion: "S",
    anguloAproximado: 175,
    nivelAbrigo: "alto"
  },
  {
    nombre: "Playa de Langosteira",
    municipio: "Fisterra",
    lat: 42.920567,
    lon: -9.257438,
    orientacion: "E",
    anguloAproximado: 70,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "fisterra_este"
  },
  {
    nombre: "Playa de Mar de Fóra",
    municipio: "Fisterra",
    lat: 42.908542,
    lon: -9.275347,
    orientacion: "W",
    anguloAproximado: 260
  },
  {
    nombre: "Playa de O Rostro",
    municipio: "Fisterra",
    lat: 42.967344,
    lon: -9.265853,
    orientacion: "W",
    anguloAproximado: 265
  },
  {
    nombre: "Playa de Talón",
    municipio: "Fisterra",
    lat: 42.9285,
    lon: -9.2417,
    orientacion: "W",
    anguloAproximado: 255
  },
  {
    nombre: "Playa de Arnela",
    municipio: "Fisterra",
    lat: 42.9425,
    lon: -9.2837,
    orientacion: "W",
    anguloAproximado: 260
  },
  {
    nombre: "Playa de Sardiñeiro",
    municipio: "Fisterra",
    lat: 42.941184,
    lon: -9.231519,
    orientacion: "SE",
    anguloAproximado: 140,
    nivelAbrigo: "alto",
    zonaMeteorologica: "fisterra_este"
  },
  {
    nombre: "Playa A Ribeira / O Corbeiro",
    municipio: "Fisterra",
    lat: 42.906,
    lon: -9.263,
    orientacion: "E",
    anguloAproximado: 95,
    nivelAbrigo: "alto"
  },
  {
    nombre: "Playa de Miño",
    municipio: "Miño",
    lat: 43.359563,
    lon: -8.211869,
    orientacion: "NW",
    anguloAproximado: 320,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "mino_perbes"
  },
  {
    nombre: "Playa de Perbes",
    municipio: "Miño",
    lat: 43.376525,
    lon: -8.215169,
    orientacion: "NW",
    anguloAproximado: 325,
    nivelAbrigo: "alto",
    zonaMeteorologica: "mino_perbes"
  },
  {
    nombre: "Playa de Sada",
    municipio: "Sada",
    lat: 43.352235,
    lon: -8.251879,
    orientacion: "SE",
    anguloAproximado: 140,
    nivelAbrigo: "muyAlto"
  },
  {
    nombre: "Playa de Mera",
    municipio: "Oleiros",
    lat: 43.380657,
    lon: -8.3386,
    orientacion: "NE",
    anguloAproximado: 40,
    nivelAbrigo: "moderado"
  },
  {
    nombre: "Playa de Sabón",
    municipio: "Arteixo",
    lat: 43.329662,
    lon: -8.50887,
    orientacion: "NW",
    anguloAproximado: 310
  },
  {
    nombre: "Playa de Orzán",
    municipio: "A Coruña",
    lat: 43.37,
    lon: -8.406,
    orientacion: "NW",
    anguloAproximado: 315,
    zonaMeteorologica: "coruna_urbana"
  },
  {
    nombre: "Playa de las Lapas",
    municipio: "A Coruña",
    lat: 43.382,
    lon: -8.405,
    orientacion: "NE",
    anguloAproximado: 45,
    nivelAbrigo: "alto",
    zonaMeteorologica: "coruna_urbana"
  },
  {
    nombre: "Praia de Area Maior",
    municipio: "Muros",
    lat: 42.751455,
    lon: -9.093209,
    orientacion: "W",
    anguloAproximado: 270
  },
  {
    nombre: "Playa de San Francisco",
    municipio: "Muros",
    lat: 42.758833,
    lon: -9.073694,
    orientacion: "S",
    anguloAproximado: 190,
    nivelAbrigo: "moderado"
  },
  {
    nombre: "Playa de Carnota",
    municipio: "Carnota",
    lat: 42.824534,
    lon: -9.108395,
    orientacion: "W",
    anguloAproximado: 270
  },
  {
    nombre: "Playa de San Xurxo",
    municipio: "Ferrol",
    lat: 43.527887,
    lon: -8.303013,
    orientacion: "NW",
    anguloAproximado: 315
  },
  {
    nombre: "Playa de Sonreiras",
    municipio: "Cedeira",
    lat: 43.659107,
    lon: -8.072705,
    orientacion: "NW",
    anguloAproximado: 315,
    nivelAbrigo: "alto"
  },
  {
    nombre: "Praia da Ladeira (Dunas de Corrubedo)",
    municipio: "Ribeira",
    lat: 42.575573,
    lon: -9.052865,
    orientacion: "W",
    anguloAproximado: 270
  },
  {
    nombre: "Playa de Samil",
    municipio: "Vigo",
    lat: 42.211157,
    lon: -8.777686,
    orientacion: "W",
    anguloAproximado: 270,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "vigo_oeste"
  },
  {
    nombre: "Praia do Vao",
    municipio: "Vigo",
    lat: 42.198063,
    lon: -8.793113,
    orientacion: "SW",
    anguloAproximado: 240,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "vigo_oeste"
  },
  {
    nombre: "Playa Niño do Corvo",
    municipio: "Moaña",
    lat: 42.265138,
    lon: -8.753091,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "alto",
    zonaMeteorologica: "moana"
  },
  {
    nombre: "Playa do Con",
    municipio: "Moaña",
    lat: 42.270666,
    lon: -8.741197,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "alto",
    zonaMeteorologica: "moana"
  },
  {
    nombre: "Praia Borna",
    municipio: "Moaña",
    lat: 42.281156,
    lon: -8.698295,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "alto",
    zonaMeteorologica: "moana"
  },
  {
    nombre: "Praia Viño",
    municipio: "Cangas",
    lat: 42.2601,
    lon: -8.84433,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "cangas_sur"
  },
  {
    nombre: "Playa de Limens",
    municipio: "Cangas",
    lat: 42.261,
    lon: -8.816,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "cangas_sur"
  },
  {
    nombre: "Playa de Lapaman",
    municipio: "Marín",
    lat: 42.342207,
    lon: -8.753497,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "marin"
  },
  {
    nombre: "Playa de Mogor",
    municipio: "Marín",
    lat: 42.385548,
    lon: -8.720692,
    orientacion: "SE",
    anguloAproximado: 135,
    nivelAbrigo: "alto",
    zonaMeteorologica: "marin"
  },
  {
    nombre: "Playa de Portocelo",
    municipio: "Marín",
    lat: 42.390275,
    lon: -8.714898,
    orientacion: "SE",
    anguloAproximado: 135,
    nivelAbrigo: "alto",
    zonaMeteorologica: "marin"
  },
  {
    nombre: "Playa de Rodas (Islas Cíes)",
    municipio: "Vigo",
    lat: 42.222202,
    lon: -8.901842,
    orientacion: "E",
    anguloAproximado: 90,
    nivelAbrigo: "alto"
  },
  {
    nombre: "Praia de Compostela",
    municipio: "Vilagarcía de Arousa",
    lat: 42.607669,
    lon: -8.768775,
    orientacion: "W",
    anguloAproximado: 270,
    nivelAbrigo: "muyAlto"
  },
  {
    nombre: "Playa de San Amaro",
    municipio: "A Coruña",
    lat: 43.38175,
    lon: -8.39671,
    orientacion: "NE",
    anguloAproximado: 45,
    zonaMeteorologica: "coruna_urbana",
    // Cala urbana protegida por la costa y el entorno construido. La apertura
    // principal queda hacia el NE; viento y mar de otros sectores llegan muy
    // atenuados a la zona de baño.
    abrigoViento: {
      direccionApertura: 45,
      factorMinimo: 0.25,
      factorMaximo: 0.45,
      amplitud: 70
    },
    abrigoOleaje: {
      direccionApertura: 45,
      factorMinimo: 0.15,
      factorMaximo: 0.45,
      amplitud: 50
    }
  },
  {
    nombre: "Playa de Riazor",
    municipio: "A Coruña",
    lat: 43.36915,
    lon: -8.41138,
    orientacion: "NW",
    anguloAproximado: 330,
    nivelAbrigo: "alto",
    zonaMeteorologica: "coruna_urbana"
  },
  {
    nombre: "Praia de Doniños",
    municipio: "Ferrol",
    lat: 43.503311,
    lon: -8.318419,
    orientacion: "W",
    anguloAproximado: 280
  },
  {
    nombre: "Praia da Frouxeira",
    municipio: "Valdoviño",
    lat: 43.61247,
    lon: -8.16695,
    orientacion: "NW",
    anguloAproximado: 315
  },
  {
    nombre: "Praia de Pantín",
    municipio: "Valdoviño",
    lat: 43.63913,
    lon: -8.11388,
    orientacion: "NW",
    anguloAproximado: 315
  },
  {
    nombre: "Praia das Catedrais",
    municipio: "Ribadeo",
    lat: 43.55701,
    lon: -7.17304,
    orientacion: "N",
    anguloAproximado: 0
  },
  {
    nombre: "Praia de Llas",
    municipio: "Foz",
    lat: 43.58002,
    lon: -7.26042,
    orientacion: "N",
    anguloAproximado: 0
  },
  {
    nombre: "Praia de Covas",
    municipio: "Viveiro",
    lat: 43.67269,
    lon: -7.60516,
    orientacion: "N",
    anguloAproximado: 0,
    nivelAbrigo: "moderado"
  },
  {
    nombre: "Praia de Nemiña",
    municipio: "Muxía",
    lat: 43.00751,
    lon: -9.26165,
    orientacion: "W",
    anguloAproximado: 270
  },
  {
    nombre: "Praia de Lariño",
    municipio: "Carnota",
    lat: 42.76464,
    lon: -9.11843,
    orientacion: "W",
    anguloAproximado: 270
  },
  {
    nombre: "Praia da Aguieira",
    municipio: "Porto do Son",
    lat: 42.74211,
    lon: -8.96921,
    orientacion: "W",
    anguloAproximado: 265
  },
  {
    nombre: "Praia de Barra",
    municipio: "Cangas",
    lat: 42.26106,
    lon: -8.85233,
    orientacion: "S",
    anguloAproximado: 190,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "cangas_sur"
  },
  {
    nombre: "Praia de Melide",
    municipio: "Cangas",
    lat: 42.2514,
    lon: -8.86678,
    orientacion: "W",
    anguloAproximado: 250
  },
  {
    nombre: "Praia de Silgar",
    municipio: "Sanxenxo",
    lat: 42.40053,
    lon: -8.81194,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "alto",
    zonaMeteorologica: "sanxenxo"
  },
  {
    nombre: "Praia da Lanzada",
    municipio: "O Grove / Sanxenxo",
    lat: 42.4473,
    lon: -8.87984,
    orientacion: "W",
    anguloAproximado: 270
  },
  {
    nombre: "Praia de Montalvo",
    municipio: "Sanxenxo",
    lat: 42.39638,
    lon: -8.85048,
    orientacion: "SW",
    anguloAproximado: 225,
    zonaMeteorologica: "sanxenxo"
  },
  {
    nombre: "Praia de Canelas",
    municipio: "Sanxenxo",
    lat: 42.38927,
    lon: -8.83183,
    orientacion: "S",
    anguloAproximado: 200,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "sanxenxo"
  }
];

function dividirEnLotes(elementos, tamano) {
  const lotes = [];
  for (let indice = 0; indice < elementos.length; indice += tamano) {
    lotes.push(elementos.slice(indice, indice + tamano));
  }
  return lotes;
}

async function ejecutarConConcurrencia(elementos, limite, tarea) {
  const resultados = new Array(elementos.length);
  let siguienteIndice = 0;

  async function ejecutar() {
    while (siguienteIndice < elementos.length) {
      const indice = siguienteIndice;
      siguienteIndice += 1;
      resultados[indice] = await tarea(elementos[indice], indice);
    }
  }

  const trabajadores = Array.from(
    { length: Math.min(limite, elementos.length) },
    () => ejecutar()
  );
  await Promise.all(trabajadores);
  return resultados;
}

function esperar(milisegundos) {
  return new Promise(resolver => setTimeout(resolver, milisegundos));
}

async function solicitarJson(url, { reintentos = 1, tiempoLimite = 15000 } = {}) {
  let ultimoError;

  for (let intento = 0; intento <= reintentos; intento += 1) {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), tiempoLimite);

    try {
      const respuesta = await fetch(url, { signal: controlador.signal });
      if (!respuesta.ok) {
        throw new Error(`El servicio respondió con ${respuesta.status}`);
      }
      return await respuesta.json();
    } catch (error) {
      ultimoError = error;
      if (intento < reintentos) await esperar(400 * (intento + 1));
    } finally {
      clearTimeout(temporizador);
    }
  }

  throw ultimoError;
}

function claveDistancia(origen, destino) {
  return [origen.lat, origen.lon, destino.lat, destino.lon]
    .map(coordenada => Number(coordenada).toFixed(5))
    .join(":");
}

function guardarDistanciaEnCache(clave, distancia) {
  if (cacheDistanciasCoche.size >= MAX_DISTANCIAS_EN_CACHE) {
    const primeraClave = cacheDistanciasCoche.keys().next().value;
    cacheDistanciasCoche.delete(primeraClave);
  }
  cacheDistanciasCoche.set(clave, distancia);
}

async function calcularLoteDistanciasCoche(origen, destinos) {
  const coordenadas = [origen, ...destinos]
    .map(punto => `${punto.lon},${punto.lat}`)
    .join(";");
  const indicesDestinos = destinos.map((_, indice) => indice + 1).join(";");
  const url =
    `https://router.project-osrm.org/table/v1/driving/${coordenadas}` +
    `?sources=0&destinations=${indicesDestinos}&annotations=distance`;

  try {
    const datos = await solicitarJson(url, { reintentos: 1, tiempoLimite: 18000 });
    const distancias = datos.distances?.[0];
    if (!Array.isArray(distancias) || distancias.length !== destinos.length) {
      throw new Error("OSRM devolvió una tabla de distancias incompleta");
    }
    return distancias.map(distancia =>
      Number.isFinite(distancia) ? distancia / 1000 : null
    );
  } catch (error) {
    console.warn("No se pudo calcular un lote de distancias por carretera", error);
    return destinos.map(() => null);
  }
}

async function calcularDistanciasCoche(origen, destinos) {
  const resultados = new Array(destinos.length).fill(null);
  const pendientes = [];
  const ahora = Date.now();

  destinos.forEach((destino, indice) => {
    const clave = claveDistancia(origen, destino);
    if (cacheDistanciasCoche.has(clave)) {
      resultados[indice] = cacheDistanciasCoche.get(clave);
      return;
    }
    if ((cacheFallosDistancia.get(clave) || 0) > ahora) return;
    pendientes.push({ destino, indice, clave });
  });

  const lotes = dividirEnLotes(pendientes, TAMANO_LOTE_DISTANCIAS);
  await ejecutarConConcurrencia(lotes, CONCURRENCIA_DISTANCIAS, async lote => {
    const distancias = await calcularLoteDistanciasCoche(
      origen,
      lote.map(elemento => elemento.destino)
    );

    lote.forEach((elemento, indice) => {
      const distancia = distancias[indice];
      resultados[elemento.indice] = distancia;
      if (Number.isFinite(distancia)) {
        guardarDistanciaEnCache(elemento.clave, distancia);
        cacheFallosDistancia.delete(elemento.clave);
      } else {
        cacheFallosDistancia.set(elemento.clave, Date.now() + 60000);
      }
    });
  });

  return resultados;
}

function actualizarVisibilidadDetalles(){

  document
    .querySelectorAll(".detalle")
    .forEach(elemento => {

      if(detallesVisibles){
        elemento.classList.remove("oculto");
      }
      else{
        elemento.classList.add("oculto");
      }

    });

}

function obtenerUbicacionGPS() {
  if (!navigator.geolocation) {
    mostrarEstado("Tu dispositivo no permite utilizar la ubicación.", "error");
    return;
  }

  mostrarEstado("Obteniendo tu ubicación…", "info");

  navigator.geolocation.getCurrentPosition(
    posicion => {
      ubicacionUsuario = {
        lat: posicion.coords.latitude,
        lon: posicion.coords.longitude
      };
      document.getElementById("codigoPostal").value = "";
      actualizarOrigenDistancia("tu ubicación actual");
      cargarRanking();
    },
    () => {
      mostrarEstado(
        "No se pudo obtener tu ubicación. Puedes introducir un código postal.",
        "error"
      );
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}

async function aplicarBusqueda() {

    const codigoPostal =
        document.getElementById("codigoPostal").value.trim();

    const valorDistancia =
        document.getElementById("distanciaMaxima").value.trim();

    // Si se escribió una distancia, comprobamos que sea válida
    if (valorDistancia !== "") {

        const distanciaIntroducida = Number(valorDistancia);

        if (
            !Number.isFinite(distanciaIntroducida) ||
            distanciaIntroducida <= 0
        ) {
            alert("Introduce una distancia válida");
            return;
        }

        distanciaMaxima = distanciaIntroducida;

    } else {

        distanciaMaxima = null;

    }

    // Si se escribió un código postal, buscar sus coordenadas
    if (codigoPostal !== "") {

        await buscarCodigoPostal(codigoPostal);
        return;

    }

    // Si se quiere filtrar por distancia, hace falta una ubicación
    if (
        distanciaMaxima !== null &&
        ubicacionUsuario === null
    ) {

        alert(
            "Para filtrar por distancia, introduce un código postal o pulsa Mi ubicación"
        );

        // No dejamos activo un filtro imposible de aplicar
        distanciaMaxima = null;

        return;

    }

    // Sin código postal, recargar usando la ubicación existente
    // o mostrar todas las playas si no hay ubicación
    await cargarRanking();

}

async function buscarCodigoPostal(codigo) {
  if (!/^\d{5}$/.test(codigo)) {
    mostrarEstado("Introduce un código postal español de cinco cifras.", "error");
    return;
  }

  const parametros = new URLSearchParams({
    format: "json",
    postalcode: codigo,
    countrycodes: "es",
    limit: "1"
  });

  try {
    mostrarEstado("Buscando el código postal…", "info");
    const respuesta = await fetch(
      `https://nominatim.openstreetmap.org/search?${parametros}`
    );

    if (!respuesta.ok) {
      throw new Error(`Nominatim respondió con ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    if (datos.length === 0) {
      mostrarEstado("No se encontró ese código postal.", "error");
      return;
    }

    ubicacionUsuario = {
      lat: Number(datos[0].lat),
      lon: Number(datos[0].lon)
    };
    actualizarOrigenDistancia(`código postal ${codigo}`);

    await cargarRanking();
  } catch (error) {
    console.error(error);
    mostrarEstado(
      "No se pudo consultar el código postal. Inténtalo de nuevo.",
      "error"
    );
  }
}

function puntosTemperatura(temp) {

  if (temp < 16) return -20;
  if (temp < 16.5) return -18;
  if (temp < 17) return -16;
  if (temp < 17.5) return -14;
  if (temp < 18) return -12;
  if (temp < 18.5) return -10;
  if (temp < 19) return -8;
  if (temp < 19.5) return -6;
  if (temp < 20) return -4;
  if (temp < 20.5) return -2;
  if (temp < 21) return 0;
  if (temp < 21.5) return 2;
  if (temp < 22) return 4;
  if (temp < 22.5) return 6;
  if (temp < 23) return 8;
  if (temp < 23.5) return 10;
  if (temp < 24) return 12;
  if (temp < 24.5) return 14;
  if (temp < 25) return 16;
  if (temp < 25.5) return 18;
  if (temp < 26) return 20;
  if (temp < 27) return 20;
  if (temp < 28) return 20;
  if (temp < 29) return 20;
  if (temp < 30) return 20;

  return 20;
}

function puntosViento(viento) {
  if (viento <= 5) return 10;
  if (viento <= 7.5) return 9;
  if (viento <= 10) return 8;
  if (viento <= 12.5) return 7;
  if (viento <= 15) return 6;
  if (viento <= 17.5) return 5;
  if (viento <= 20) return 4;
  if (viento <= 22.5) return 2;
  if (viento <= 25) return 0;
  if (viento <= 27.5) return -2;
  if (viento <= 30) return -4;
  return -8;
}

function puntosVientoMaximo(vientoMaximo) {
  if (!Number.isFinite(vientoMaximo) || vientoMaximo < 25) return 0;
  if (vientoMaximo < 30) return -1;
  if (vientoMaximo < 35) return -3;
  return -6;
}

function puntosLluvia(lluvia) {
  const valorSeguro = Math.max(0, Math.min(100, lluvia));
  if (valorSeguro <= 15) return 25 - valorSeguro / 3;
  if (valorSeguro <= 30) return 20 - (valorSeguro - 15) * 2 / 3;
  if (valorSeguro <= 50) return 10 - (valorSeguro - 30);
  return -10 - (valorSeguro - 50) * 0.3;
}

function resumirProbabilidadLluvia(registros) {
  const valores = registros
    .map(registro => registro.lluvia)
    .filter(Number.isFinite)
    .map(valor => Math.max(0, Math.min(100, valor)));
  if (valores.length === 0) {
    return { lluvia: 0, lluviaPromedio: 0, lluviaMaxima: 0 };
  }

  const lluviaPromedio = Math.round(
    valores.reduce((suma, valor) => suma + valor, 0) / valores.length
  );
  const lluviaMaxima = Math.round(Math.max(...valores));

  // En una visita corta importa especialmente la peor hora prevista. Para
  // rangos amplios se combina ese pico con el riesgo medio para no ocultar
  // una franja lluviosa ni sobrerreaccionar a una sola hora aislada.
  let lluvia;
  if (valores.length <= 3) {
    lluvia = lluviaMaxima;
  } else {
    const pesoMaximo = valores.length <= 6 ? 0.75 : 0.6;
    lluvia = Math.round(
      lluviaMaxima * pesoMaximo + lluviaPromedio * (1 - pesoMaximo)
    );
  }

  return { lluvia, lluviaPromedio, lluviaMaxima };
}

function puntosAgua(agua) {

  if (!agua) return 0;

  if (agua < 16) return -7;
  if (agua < 18) return -3;
  if (agua < 20) return 3;

  return 7;
}
function puntosNubosidad(nubosidad){
  // El cielo despejado conserva el máximo, pero un día cubierto no invalida
  // por sí solo unas condiciones razonables de temperatura, viento y lluvia.
  const valorSeguro = Math.max(0, Math.min(100, nubosidad));
  return 25 - valorSeguro * 0.3;
}

function puntosConfortSolar(temperatura, viento, lluvia, nubosidad) {
  const diaFrescoPeroAgradable =
    temperatura >= 19.5 &&
    temperatura <= 23 &&
    viento <= 10 &&
    lluvia <= 5 &&
    nubosidad <= 30;

  return diaFrescoPeroAgradable ? 5 : 0;
}

function calcularNubosidadHora(registro) {
  const limitar = valor => Math.max(0, Math.min(100, valor));
  const total = Number.isFinite(registro.nubosidad) ? registro.nubosidad : 0;
  const baja = Number.isFinite(registro.nubosidadBaja) ? registro.nubosidadBaja : total;
  const media = Number.isFinite(registro.nubosidadMedia) ? registro.nubosidadMedia : total;
  const alta = Number.isFinite(registro.nubosidadAlta) ? registro.nubosidadAlta : total;
  const nubosidadBajaMedia = Math.max(baja, media * 0.9);
  if (!Number.isFinite(registro.duracionSol) || registro.esDeDia === 0) {
    return limitar(Math.max(nubosidadBajaMedia, alta * 0.15));
  }
  const proporcionSol = Math.max(0, Math.min(1, registro.duracionSol / 3600));
  const efectoFaltaDeSol = (1 - proporcionSol) * 100 * 0.55;
  return limitar(Math.max(nubosidadBajaMedia, efectoFaltaDeSol + alta * 0.08));
}

function resumirNubosidad(registros) {
  const valores = registros.map(calcularNubosidadHora);
  if (valores.length === 0) return { nubosidad: 0, proporcionHorasSoleadas: 0, predominioNubesAltas: false };
  const horasSoleadas = registros.filter(registro =>
    Number.isFinite(registro.duracionSol) && registro.duracionSol >= 3000 &&
    (registro.nubosidadBaja ?? registro.nubosidad) <= 20 &&
    (registro.nubosidadMedia ?? registro.nubosidad) <= 30
  ).length;
  const proporcionHorasSoleadas = horasSoleadas / registros.length;
  const promedioCapa = campo => registros.reduce((suma, registro) =>
    suma + (Number.isFinite(registro[campo]) ? registro[campo] : 0), 0
  ) / registros.length;
  const predominioNubesAltas = promedioCapa("nubosidadAlta") >= 40 &&
    promedioCapa("nubosidadBaja") <= 20 &&
    promedioCapa("nubosidadMedia") <= 30 &&
    proporcionHorasSoleadas >= 0.5;
  let nubosidad = Math.round(valores.reduce((suma, valor) => suma + valor, 0) / valores.length);
  const opacidades = registros.map(registro => Math.max(
    registro.nubosidadBaja ?? registro.nubosidad ?? 0,
    (registro.nubosidadMedia ?? registro.nubosidad ?? 0) * 0.9
  ));
  const proporcionNublada = opacidades.filter(valor => valor >= 60).length / opacidades.length;
  const peorHora = Math.max(...opacidades);
  if (registros.length <= 2) {
    if (peorHora >= 80) nubosidad = Math.max(nubosidad, 81);
    else if (peorHora >= 50) nubosidad = Math.max(nubosidad, 61);
    else if (peorHora >= 25) nubosidad = Math.max(nubosidad, 31);
  } else if (proporcionNublada >= 0.5) {
    nubosidad = Math.max(nubosidad, 61);
  }
  if (nubosidad <= 10 && proporcionHorasSoleadas < 0.75) nubosidad = 11;
  return { nubosidad, proporcionHorasSoleadas, predominioNubesAltas };
}
function diferenciaAngular(anguloA, anguloB) {
  const diferencia = Math.abs(anguloA - anguloB) % 360;
  return diferencia > 180 ? 360 - diferencia : diferencia;
}

const PERFILES_ABRIGO = {
  moderado: {
    viento: { factorMinimo: 0.7, factorMaximo: 0.9, amplitud: 110 },
    oleaje: { factorMinimo: 0.55, factorMaximo: 0.8, amplitud: 100 }
  },
  alto: {
    viento: { factorMinimo: 0.45, factorMaximo: 0.7, amplitud: 90 },
    oleaje: { factorMinimo: 0.3, factorMaximo: 0.6, amplitud: 80 }
  },
  muyAlto: {
    viento: { factorMinimo: 0.25, factorMaximo: 0.5, amplitud: 75 },
    oleaje: { factorMinimo: 0.15, factorMaximo: 0.45, amplitud: 60 }
  }
};

function obtenerConfiguracionAbrigo(playa, tipo) {
  const configuracionPropia = tipo === "viento"
    ? playa.abrigoViento
    : playa.abrigoOleaje;
  if (configuracionPropia) return configuracionPropia;

  const perfil = PERFILES_ABRIGO[playa.nivelAbrigo]?.[tipo];
  if (!perfil || !Number.isFinite(playa.anguloAproximado)) return null;
  return {
    ...perfil,
    direccionApertura: playa.anguloAproximado
  };
}

function factorAbrigoDireccional(configuracion, direccion) {
  if (!configuracion || !Number.isFinite(direccion)) return 1;

  const direccionApertura = configuracion.direccionApertura;
  const factorMinimo = Math.max(0, Math.min(1, configuracion.factorMinimo ?? 1));
  const factorMaximo = Math.max(
    factorMinimo,
    Math.min(1, configuracion.factorMaximo ?? 1)
  );
  const amplitud = Math.max(1, Math.min(180, configuracion.amplitud ?? 90));
  if (!Number.isFinite(direccionApertura)) return factorMinimo;

  const diferencia = diferenciaAngular(direccionApertura, direccion);
  if (diferencia >= amplitud) return factorMinimo;

  // Transición suave: conserva toda la intensidad por la apertura y baja
  // progresivamente hasta el factor mínimo en los sectores protegidos.
  const aperturaRelativa = Math.cos((diferencia / amplitud) * Math.PI / 2);
  return factorMinimo + (factorMaximo - factorMinimo) * Math.pow(aperturaRelativa, 1.5);
}

function factorExposicionOleaje(anguloPlaya, direccionOlas) {
  if (!Number.isFinite(anguloPlaya) || !Number.isFinite(direccionOlas)) {
    return 0.65;
  }

  const diferencia = diferenciaAngular(anguloPlaya, direccionOlas);
  const componenteFrontal = Math.max(
    0,
    Math.cos(diferencia * Math.PI / 180)
  );

  // Conservamos una fracción del oleaje por refracción y mar local.
  return 0.15 + 0.85 * Math.pow(componenteFrontal, 1.35);
}

function calcularOleajeEfectivo(playa, datosMarine, fechaObjetivo, horaInicio = 7, horaFin = 21) {
  const horas = datosMarine.hourly?.time ?? [];
  const valores = [];

  horas.forEach((hora, indice) => {
    const horaLocal = Number(hora.split("T")[1]?.split(":")[0]);
    if (!hora.startsWith(fechaObjetivo) || horaLocal < horaInicio || horaLocal > horaFin) return;

    const alturaTotal = datosMarine.hourly?.wave_height?.[indice];
    const direccionTotal = datosMarine.hourly?.wave_direction?.[indice];
    const alturaMarFondo = datosMarine.hourly?.swell_wave_height?.[indice];
    const direccionMarFondo = datosMarine.hourly?.swell_wave_direction?.[indice];
    const alturaMarViento = datosMarine.hourly?.wind_wave_height?.[indice];
    const direccionMarViento = datosMarine.hourly?.wind_wave_direction?.[indice];
    if (!Number.isFinite(alturaTotal)) return;

    let factorExposicion = factorExposicionOleaje(playa.anguloAproximado, direccionTotal);
    if (Number.isFinite(alturaMarFondo) || Number.isFinite(alturaMarViento)) {
      const energiaMarFondo = Number.isFinite(alturaMarFondo) ? Math.pow(alturaMarFondo, 2) : 0;
      const energiaMarViento = Number.isFinite(alturaMarViento) ? Math.pow(alturaMarViento, 2) : 0;
      const energiaTotal = energiaMarFondo + energiaMarViento;
      if (energiaTotal > 0) {
        const factorMarFondo = factorExposicionOleaje(playa.anguloAproximado, direccionMarFondo);
        const factorMarViento = factorExposicionOleaje(playa.anguloAproximado, direccionMarViento);
        factorExposicion = Math.sqrt((energiaMarFondo * Math.pow(factorMarFondo, 2) + energiaMarViento * Math.pow(factorMarViento, 2)) / energiaTotal);
      }
    }

    const periodo = datosMarine.hourly?.wave_period?.[indice];
    const factorPeriodo = Number.isFinite(periodo) ? Math.min(1.3, Math.max(0.8, Math.sqrt(periodo / 8))) : 1;
    const configuracionAbrigo = obtenerConfiguracionAbrigo(playa, "oleaje");
    const factorAbrigo = factorAbrigoDireccional(configuracionAbrigo, direccionTotal);
    valores.push(alturaTotal * factorExposicion * factorPeriodo * factorAbrigo);
  });

  if (valores.length === 0) return null;
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

function obtenerTemperaturaAgua(datosMarine, fechaObjetivo, horaInicio = 7, horaFin = 21) {
  const valores = (datosMarine.hourly?.time ?? []).map((hora, indice) => ({
    hora,
    valor: datosMarine.hourly?.sea_surface_temperature?.[indice]
  })).filter(registro => {
    const horaLocal = Number(registro.hora.split("T")[1]?.split(":")[0]);
    return registro.hora.startsWith(fechaObjetivo) && horaLocal >= horaInicio && horaLocal <= horaFin && Number.isFinite(registro.valor);
  });
  if (valores.length === 0) return null;
  return valores.reduce((suma, registro) => suma + registro.valor, 0) / valores.length;
}

function puntosOleaje(oleaje) {
  if (!Number.isFinite(oleaje)) return 0;

  if (oleaje < 0.15) return 3;
  if (oleaje < 0.4) return 2;
  if (oleaje < 0.8) return 0;
  if (oleaje < 1.4) return -2;

  return -3;
}

function obtenerEstadoOleaje(oleaje) {
  if (!Number.isFinite(oleaje))
    return "-";

  if (oleaje < 0.15)
    return "🌊 Mar prácticamente plano";

  if (oleaje < 0.4)
    return "🌊 Oleaje suave";

  if (oleaje < 0.8)
    return "🌊 Oleaje moderado";

  if (oleaje < 1.4)
    return "🌊 Mar movido";

  return "🌊 Oleaje fuerte";
}

function obtenerEstadoAgua(agua) {

  if (!agua)
    return null;

  if (agua < 14)
    return "agua congelada";

  if (agua < 18)
    return "agua muy fría";

  if (agua <= 21)
    return "agua fría pero metible";

  if (agua <= 25)
    return "agua agradable";

  return "agua cálida";
}
function calcularPercentil(valores, proporcion) {
  const ordenados = valores
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (ordenados.length === 0) return null;

  const posicion = (ordenados.length - 1) * proporcion;
  const inferior = Math.floor(posicion);
  const superior = Math.ceil(posicion);

  if (inferior === superior) return ordenados[inferior];

  const pesoSuperior = posicion - inferior;
  return ordenados[inferior] * (1 - pesoSuperior) +
    ordenados[superior] * pesoSuperior;
}

function promedioDireccionViento(direcciones, velocidades) {
  let este = 0;
  let norte = 0;
  direcciones.forEach((direccion, indice) => {
    if (!Number.isFinite(direccion)) return;
    const peso = Number.isFinite(velocidades[indice]) ? Math.max(velocidades[indice], 1) : 1;
    const radianes = direccion * Math.PI / 180;
    este += Math.sin(radianes) * peso;
    norte += Math.cos(radianes) * peso;
  });
  if (este === 0 && norte === 0) return null;
  return (Math.atan2(este, norte) * 180 / Math.PI + 360) % 360;
}

function gradosADireccion(grados) {
  const direcciones = ["N","NE","E","SE","S","SW","W","NW"];
  return direcciones[Math.round(grados / 45) % 8];
}

function puntosOrientacion(anguloPlaya, direccionVientoGrados, viento) {
  if (!Number.isFinite(anguloPlaya) || !Number.isFinite(direccionVientoGrados) || viento <= 15) return 0;
  const diferencia = diferenciaAngular(anguloPlaya, direccionVientoGrados);
  const componenteFrontal = Math.cos(diferencia * Math.PI / 180);
  const intensidad = Math.min(1, (viento - 15) / 15);
  return componenteFrontal > 0
    ? Math.round(-5 * componenteFrontal * intensidad)
    : Math.round(3 * Math.abs(componenteFrontal) * intensidad);
}

function esVientoEnContra(anguloPlaya, direccionVientoGrados, viento) {
  if (viento <= 20 || !Number.isFinite(direccionVientoGrados)) return false;
  const diferencia = diferenciaAngular(anguloPlaya, direccionVientoGrados);
  return Math.cos(diferencia * Math.PI / 180) > 0.5;
}

function esVientoFavorable(anguloPlaya, direccionVientoGrados, viento) {
  if (viento <= 20 || !Number.isFinite(direccionVientoGrados)) return false;
  const diferencia = diferenciaAngular(anguloPlaya, direccionVientoGrados);
  return Math.cos(diferencia * Math.PI / 180) < -0.5;
}
function calcularPuntuacion(temperaturaMediaPlaya, viento, vientoMaximo, lluvia, nubosidad, agua, oleaje, anguloPlaya, direccionVientoGrados) {
  // El máximo teórico es 100: se reserva para un día perfecto en todos los factores.
  let puntuacion = 10;
  puntuacion += puntosNubosidad(nubosidad);
  puntuacion += puntosLluvia(lluvia);
  puntuacion += puntosTemperatura(temperaturaMediaPlaya);
  puntuacion += puntosConfortSolar(temperaturaMediaPlaya, viento, lluvia, nubosidad);
  puntuacion += puntosViento(viento);
  puntuacion += puntosVientoMaximo(vientoMaximo);
  puntuacion += puntosOrientacion(anguloPlaya, direccionVientoGrados, viento);
  puntuacion += puntosAgua(agua);
  puntuacion += puntosOleaje(oleaje);
  return Math.max(0, Math.min(100, Math.round(puntuacion)));
}
function inicializarVista() {

    const anchoVisible = Math.min(
        window.innerWidth,
        window.screen?.width ?? window.innerWidth
    );

    const esPantallaMovil =
        anchoVisible <= 768 ||
        window.matchMedia("(max-width: 768px)").matches;

    modoVista = esPantallaMovil ? "tarjetas" : "tabla";

}

function cambiarVista() {

    modoVista =
        modoVista === "tabla"
        ? "tarjetas"
        : "tabla";

    actualizarVista();

}
function actualizarVista() {

    const tabla = document.querySelector(".tabla-scroll");
    const tarjetas = document.getElementById("ranking-mobile");
    const botonVista = document.getElementById("btnVista");
    const botonDetalles = document.getElementById("btnDetalles");

    if (modoVista === "tabla") {

        tabla.style.display = "block";
        tarjetas.style.display = "none";

        botonVista.innerHTML = "🗂️ Ver tarjetas";

        // En tabla mostramos el botón general de detalles
        botonDetalles.style.display = "inline-block";

    } else {

        tabla.style.display = "none";
        tarjetas.style.display = "block";

        botonVista.innerHTML = "📊 Ver tabla";

        // Las tarjetas ya tienen su propio botón de detalles
        botonDetalles.style.display = "none";

    }
}
function obtenerEstado(puntos, nubosidad, anguloPlaya, direccionVientoGrados, viento, vientoMaximo, lluvia, temperatura, agua, oleaje) {
  const vientoEnContra = esVientoEnContra(anguloPlaya, direccionVientoGrados, viento);
  const condicionesExcelentes =
    puntos >= 85 &&
    nubosidad <= 10 &&
    lluvia <= 5 &&
    temperatura >= 24 &&
    temperatura <= 29 &&
    viento <= 10 &&
    vientoMaximo < 25 &&
    agua >= 18 &&
    oleaje < 0.4 &&
    !vientoEnContra;
  if (puntos < 35) return "🔴 Mejor evitar";
  if (puntos < 50) return "🟠 Poco recomendable";
  if (vientoEnContra && nubosidad > 80) return "🟡 Aceptable (muy nublado y viento en contra)";
  if (vientoEnContra && nubosidad > 60) return "🟡 Aceptable (nublado y viento en contra)";
  if (nubosidad > 80) return "🟡 Aceptable (muy nublado)";
  if (nubosidad > 60) return "🟡 Aceptable (nublado)";
  if (vientoEnContra) return puntos >= 70 ? "🟡 Aceptable (viento en contra)" : "🟡 Aceptable";
  if (condicionesExcelentes) return "🟢 Excelente";
  if (puntos >= 70) return "🟢 Buen día de playa";
  return "🟡 Aceptable";
}
function obtenerCielo(nubosidad, predominioNubesAltas = false) {

  if (predominioNubesAltas && nubosidad <= 30) return "🌥️ Nubes altas";

  if (nubosidad <= 10) return "☀️ Despejado";
  if (nubosidad <= 30) return "🌤️ Algunas nubes";
  if (nubosidad <= 60) return "⛅ Parcialmente nublado";
  if (nubosidad <= 80) return "☁️ Nublado";

  return "🌫️ Muy nublado";
}
function generarExplicacion(temperatura, viento, vientoMaximo, direccionVientoGrados, lluvia, agua, anguloPlaya, nubosidad, predominioNubesAltas = false) {
  const mensajes = [];
  if (predominioNubesAltas && nubosidad <= 30) mensajes.push("nubes altas con sol");
  else if (nubosidad <= 10) mensajes.push("cielo despejado");
  else if (nubosidad <= 30) mensajes.push("algunas nubes");
  else if (nubosidad <= 60) mensajes.push("cielo parcialmente nublado");
  else if (nubosidad <= 80) mensajes.push("cielo nublado");
  else mensajes.push("cielo muy nublado");
  if (temperatura >= 25) mensajes.push("temperatura ideal");
  else if (puntosConfortSolar(temperatura, viento, lluvia, nubosidad) > 0) {
    mensajes.push("temperatura suave y agradable al sol");
  }
  if (viento <= 15) mensajes.push("poco viento");
  if (vientoMaximo >= 35) mensajes.push("momentos de viento fuerte");
  else if (vientoMaximo >= 25) mensajes.push("momentos de viento moderado");
  if (lluvia <= 5) mensajes.push("sin lluvia prevista");
  else if (lluvia <= 15) mensajes.push("probabilidad muy baja de lluvia");
  else if (lluvia <= 30) mensajes.push("posibilidad de lluvia");
  else if (lluvia <= 50) mensajes.push("riesgo moderado de lluvia");
  else mensajes.push("riesgo alto de lluvia, condiciones poco aptas para la playa");
  const estadoAgua = obtenerEstadoAgua(agua);
  if (estadoAgua) mensajes.push(estadoAgua);
  if (esVientoEnContra(anguloPlaya, direccionVientoGrados, viento)) mensajes.push("viento fuerte entrando en la playa");
  if (esVientoFavorable(anguloPlaya, direccionVientoGrados, viento)) mensajes.push("viento favorable, sopla hacia el mar");
  return mensajes.join(", ") + ".";
}

function promedioValores(valores) {
  const validos = valores.filter(Number.isFinite);
  if (validos.length === 0) return null;
  const promedio = validos.reduce((total, valor) => total + valor, 0) / validos.length;
  return Number(promedio.toFixed(2));
}

function promedioAngular(direcciones) {
  const validas = direcciones.filter(Number.isFinite);
  if (validas.length === 0) return null;
  const seno = promedioValores(validas.map(valor => Math.sin(valor * Math.PI / 180)));
  const coseno = promedioValores(validas.map(valor => Math.cos(valor * Math.PI / 180)));
  return (Math.atan2(seno, coseno) * 180 / Math.PI + 360) % 360;
}

function promediarSeries(referencias, seccion, campo, promedio = promedioValores) {
  const series = referencias.map(referencia => referencia?.[seccion]?.[campo] || []);
  const longitud = Math.max(0, ...series.map(serie => serie.length));
  return Array.from({ length: longitud }, (_, indice) =>
    promedio(series.map(serie => serie[indice]))
  );
}

function compartirMeteorologiaPorZona(listaPlayas, datosMeteorologicos) {
  const resultado = [...datosMeteorologicos];
  const zonas = new Map();
  listaPlayas.forEach((playa, indice) => {
    if (!playa.zonaMeteorologica) return;
    if (!zonas.has(playa.zonaMeteorologica)) zonas.set(playa.zonaMeteorologica, []);
    zonas.get(playa.zonaMeteorologica).push(indice);
  });

  zonas.forEach(indices => {
    const referencias = indices.map(indice => datosMeteorologicos[indice]).filter(Boolean);
    if (referencias.length < 2) return;
    const base = referencias[0];
    const compartida = {
      ...base,
      daily: {
        ...base.daily,
        temperature_2m_max: promediarSeries(referencias, "daily", "temperature_2m_max")
      },
      hourly: {
        ...base.hourly,
        temperature_2m: promediarSeries(referencias, "hourly", "temperature_2m"),
        precipitation_probability: promediarSeries(referencias, "hourly", "precipitation_probability"),
        wind_speed_10m: promediarSeries(referencias, "hourly", "wind_speed_10m"),
        wind_direction_10m: promediarSeries(referencias, "hourly", "wind_direction_10m", promedioAngular),
        cloud_cover: promediarSeries(referencias, "hourly", "cloud_cover"),
        cloud_cover_low: promediarSeries(referencias, "hourly", "cloud_cover_low"),
        cloud_cover_mid: promediarSeries(referencias, "hourly", "cloud_cover_mid"),
        cloud_cover_high: promediarSeries(referencias, "hourly", "cloud_cover_high"),
        sunshine_duration: promediarSeries(referencias, "hourly", "sunshine_duration"),
        is_day: promediarSeries(referencias, "hourly", "is_day")
      }
    };
    indices.forEach(indice => { resultado[indice] = compartida; });
  });
  return resultado;
}

async function obtenerDatosPlayas(dia, horaInicio = 7, horaFin = 21) {
  if (respuestasPronosticoCache === null) {
    const lotes = dividirEnLotes(playas, TAMANO_LOTE_PRONOSTICO);
    const respuestas = await ejecutarConConcurrencia(
      lotes,
      CONCURRENCIA_PRONOSTICO,
      async lote => {
        const latitudes = lote.map(playa => playa.lat).join(",");
        const longitudes = lote.map(playa => playa.lon).join(",");
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&daily=temperature_2m_max&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,sunshine_duration,is_day&forecast_days=2&timezone=Europe%2FMadrid&cell_selection=nearest`;
        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitudes}&longitude=${longitudes}&hourly=sea_surface_temperature,wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,swell_wave_height,swell_wave_direction&forecast_days=2&timezone=Europe%2FMadrid`;
        const [meteorologia, mar] = await Promise.all([
          solicitarJson(url, { reintentos: 2, tiempoLimite: 20000 }),
          solicitarJson(marineUrl, { reintentos: 2, tiempoLimite: 20000 })
        ]);
        const datosMeteorologicos = Array.isArray(meteorologia) ? meteorologia : [meteorologia];
        const datosMaritimos = Array.isArray(mar) ? mar : [mar];
        if (
          datosMeteorologicos.length !== lote.length ||
          datosMaritimos.length !== lote.length
        ) {
          throw new Error("La respuesta meteorológica está incompleta.");
        }
        return { datosMeteorologicos, datosMaritimos };
      }
    );
    const datosMeteorologicos = respuestas.flatMap(respuesta => respuesta.datosMeteorologicos);
    const datosMaritimos = respuestas.flatMap(respuesta => respuesta.datosMaritimos);
    respuestasPronosticoCache = { datosMeteorologicos, datosMaritimos };
  }

  const { datosMeteorologicos, datosMaritimos } = respuestasPronosticoCache;
  const meteorologiaPorPlaya = compartirMeteorologiaPorZona(playas, datosMeteorologicos);
  return Promise.all(playas.map((playa, indice) =>
    procesarDatosPlaya(playa, meteorologiaPorPlaya[indice], datosMaritimos[indice], dia, horaInicio, horaFin)
  ));
}

async function procesarDatosPlaya(playa, datos, datosMarine, dia, horaInicio = 7, horaFin = 21) {
  const fechaObjetivo = datos.daily.time[dia];
  if (!fechaObjetivo) throw new Error("No hay previsión disponible para el día seleccionado.");
  const registros = datos.hourly.time.map((hora, indice) => ({
    hora,
    temperatura: datos.hourly.temperature_2m[indice],
    lluvia: datos.hourly.precipitation_probability[indice],
    viento: datos.hourly.wind_speed_10m[indice],
    direccionViento: datos.hourly.wind_direction_10m[indice],
    nubosidad: datos.hourly.cloud_cover[indice],
    nubosidadBaja: datos.hourly.cloud_cover_low?.[indice],
    nubosidadMedia: datos.hourly.cloud_cover_mid?.[indice],
    nubosidadAlta: datos.hourly.cloud_cover_high?.[indice],
    duracionSol: datos.hourly.sunshine_duration?.[indice],
    esDeDia: datos.hourly.is_day?.[indice]
  })).filter(registro => {
    const horaLocal = Number(registro.hora.split("T")[1].split(":")[0]);
    const dentroDelHorario = horaLocal >= horaInicio && horaLocal <= horaFin;
    return registro.hora.startsWith(fechaObjetivo) && dentroDelHorario;
  });
  if (registros.length === 0) throw new Error("No hay datos horarios para el día seleccionado.");
  registros.forEach(registro => {
    const configuracionAbrigo = obtenerConfiguracionAbrigo(playa, "viento");
    const factorAbrigo = factorAbrigoDireccional(configuracionAbrigo, registro.direccionViento);
    registro.vientoEnPlaya = registro.viento * factorAbrigo;
  });
  const promedio = campo => registros.reduce((suma, registro) => suma + registro[campo], 0) / registros.length;
  const temperaturaMediaPlaya = promedio("temperatura");
  const { lluvia, lluviaPromedio, lluviaMaxima } = resumirProbabilidadLluvia(registros);
  const { nubosidad, proporcionHorasSoleadas, predominioNubesAltas } = resumirNubosidad(registros);
  const vientoModelo = Math.round(promedio("viento"));
  const viento = Math.round(promedio("vientoEnPlaya"));
  const vientoMaximoModelo = Math.round(Math.max(...registros.map(registro => registro.viento).filter(Number.isFinite)));
  const vientoMaximo = Math.round(Math.max(...registros.map(registro => registro.vientoEnPlaya).filter(Number.isFinite)));
  const direccionVientoGrados = promedioDireccionViento(registros.map(r => r.direccionViento), registros.map(r => r.vientoEnPlaya));
  const direccionViento = Number.isFinite(direccionVientoGrados) ? gradosADireccion(direccionVientoGrados) : "-";
  const temperaturaMaxima = Math.max(...registros.map(registro => registro.temperatura).filter(Number.isFinite));
  const cielo = obtenerCielo(nubosidad, predominioNubesAltas);
  const agua = obtenerTemperaturaAgua(datosMarine, fechaObjetivo, horaInicio, horaFin);
  const oleaje = calcularOleajeEfectivo(playa, datosMarine, fechaObjetivo, horaInicio, horaFin);
  const estadoOleaje = obtenerEstadoOleaje(oleaje);
  const puntuacion = calcularPuntuacion(temperaturaMediaPlaya, viento, vientoMaximo, lluvia, nubosidad, agua, oleaje, playa.anguloAproximado, direccionVientoGrados);
  const estado = obtenerEstado(puntuacion, nubosidad, playa.anguloAproximado, direccionVientoGrados, viento, vientoMaximo, lluvia, temperaturaMediaPlaya, agua, oleaje);
  const explicacion = generarExplicacion(temperaturaMediaPlaya, viento, vientoMaximo, direccionVientoGrados, lluvia, agua, playa.anguloAproximado, nubosidad, predominioNubesAltas);
  return { nombre: playa.nombre, lat: playa.lat, lon: playa.lon, distancia: null, temperaturaMaxima, temperaturaMediaPlaya, viento, vientoMaximo, vientoModelo, vientoMaximoModelo, direccionViento, direccionVientoGrados, lluvia, lluviaPromedio, lluviaMaxima, cielo, agua, estadoOleaje, oleaje, puntuacion, estado, nubosidad, proporcionHorasSoleadas, predominioNubesAltas, explicacion };
}

async function cargarRankingInterno() {

  let resultados;


  const claveCache = `${diaSeleccionado}-${horaInicioSeleccionada}-${horaFinSeleccionada}`;
  if (!datosPlayasCache[claveCache]) {
    datosPlayasCache[claveCache] = await obtenerDatosPlayas(diaSeleccionado, horaInicioSeleccionada, horaFinSeleccionada);
  }
  resultados = [...datosPlayasCache[claveCache]];


  // Calcular todas las rutas en lotes y reutilizar las ya consultadas.
  if(ubicacionUsuario){
    const distancias = await calcularDistanciasCoche(ubicacionUsuario, resultados);
    resultados.forEach((playa, indice) => {
      playa.distancia = distancias[indice];
    });
  }

  if (
    distanciaMaxima !== null &&
    ubicacionUsuario !== null
) {

    resultados = resultados.filter(
        playa =>
            playa.distancia !== null &&
            playa.distancia <= distanciaMaxima
    );

}
  
  ordenarResultados(resultados);

  const tabla = document.getElementById("ranking");
  tabla.innerHTML = "";
  const rankingMobile =
  document.getElementById("ranking-mobile");

rankingMobile.innerHTML="";
  
  resultados.forEach((playa, index) => {

tabla.innerHTML += `
  <tr>
    <td>${index + 1}</td>
    <td>${playa.nombre}</td>
    <td>
    ${
    playa.distancia !== null
    ?
    playa.distancia.toFixed(1) + " km"
    :
    "-"
    }
    </td>
    <td>${playa.cielo}</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">
    ${playa.temperaturaMaxima}°C
    </td>
    <td>${playa.temperaturaMediaPlaya.toFixed(1)}°C</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.viento} km/h estimados en playa (${playa.direccionViento}) · máx. ${playa.vientoMaximo} km/h</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">Riesgo ${playa.lluvia}% · máximo ${playa.lluviaMaxima}% · promedio ${playa.lluviaPromedio}%</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.agua ? playa.agua.toFixed(1) + "°C" : "-"}</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.estadoOleaje}</td>
    <td class="col-estado">${playa.estado}</td>
   <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.puntuacion}</td>
    <td class="col-explicacion">${playa.explicacion}</td>
   </tr>
`;
    const claseValoracion = playa.puntuacion >= 70
      ? "valoracion-buena"
      : playa.puntuacion >= 50
        ? "valoracion-aceptable"
        : playa.puntuacion >= 35
          ? "valoracion-regular"
          : "valoracion-evitar";

    rankingMobile.innerHTML += `

<article class="tarjeta-playa ${claseValoracion}">
  <div class="tarjeta-cabecera">
    <div class="tarjeta-identidad">
      <span class="posicion-ranking" aria-label="Posición ${index + 1}">${index + 1}</span>
      <div>
        <h2>${playa.nombre}</h2>
        <div class="estado">${playa.estado}</div>
      </div>
    </div>
    <div class="puntuacion" aria-label="Puntuación ${playa.puntuacion} sobre 100">
      <span>Puntaje del día</span>
      <strong>${playa.puntuacion}<small>/100</small></strong>
    </div>
  </div>

  <div class="resumen-condiciones">
    <span>🌡️ ${playa.temperaturaMediaPlaya.toFixed(1)}°C</span>
    <span>💨 ${playa.viento} km/h</span>
    <span>🌧️ ${playa.lluvia}%</span>
  </div>

  <div class="tarjeta-contexto">
    <span>${playa.cielo}</span>
    <span>📍 ${
      playa.distancia !== null
        ? playa.distancia.toFixed(1) + " km"
        : "Sin ubicación"
    }</span>
  </div>

  <p class="explicacion">${playa.explicacion}</p>
  <button class="btn-detalles" type="button" aria-expanded="false">
    Ver detalles ▼
  </button>

  <div class="detalles-mobile oculto">
<p>🌡️ Temperatura máxima:
${playa.temperaturaMaxima}°C
</p>
<p>🌡️💧 Agua:
${
playa.agua
?
playa.agua.toFixed(1)+"°C"
:
"-"
}
</p>

<p>💨 ${playa.viento} km/h estimados en playa (${playa.direccionViento}) · máx. ${playa.vientoMaximo} km/h</p>

<p>🌧️ Riesgo estimado: ${playa.lluvia}% · máximo horario: ${playa.lluviaMaxima}% · promedio: ${playa.lluviaPromedio}%</p>

<p>${playa.estadoOleaje}</p>

</div>

</article>

`;
  });
actualizarVisibilidadDetalles();

document.querySelectorAll(".btn-detalles").forEach(boton => {

  boton.addEventListener("click", () => {

    const detalles = boton.nextElementSibling;

    detalles.classList.toggle("oculto");

    const estaOculto = detalles.classList.contains("oculto");
    boton.textContent = estaOculto
      ? "Ver detalles ▼"
      : "Ocultar detalles ▲";
    boton.setAttribute("aria-expanded", String(!estaOculto));

  });

});

}

function actualizarSelectorDia() {
  const botonHoy = document.getElementById("btnHoy");
  const botonManana = document.getElementById("btnManana");
  botonHoy.setAttribute("aria-pressed", String(diaSeleccionado === 0));
  botonManana.setAttribute("aria-pressed", String(diaSeleccionado === 1));
  botonHoy.classList.toggle("activo", diaSeleccionado === 0);
  botonManana.classList.toggle("activo", diaSeleccionado === 1);
}

async function cambiarDia(dia) {
  if (dia === diaSeleccionado) return;
  diaSeleccionado = dia;
  actualizarSelectorDia();
  await cargarRanking();
}

async function cambiarHorario() {
  const inicio = Number(document.getElementById("horaInicio").value);
  const fin = Number(document.getElementById("horaFin").value);
  const resumen = document.getElementById("resumenHorario");
  if (inicio > fin) {
    resumen.textContent = "La hora inicial debe ser anterior a la final.";
    return;
  }
  horaInicioSeleccionada = inicio;
  horaFinSeleccionada = fin;
  resumen.textContent = inicio === 7 && fin === 21
    ? "Todo el rango (07:00–21:00)"
    : `De ${inicio}:00 a ${fin}:00`;
  await cargarRanking();
}

async function cargarRanking() {
  const referenciaDia = diaSeleccionado === 0 ? "hoy" : "mañana";
  const referenciaHorario = horaInicioSeleccionada === 7 && horaFinSeleccionada === 21
    ? ""
    : ` de ${horaInicioSeleccionada}:00 a ${horaFinSeleccionada}:00`;
  mostrarEstado(`Actualizando las condiciones de ${referenciaDia}…`, "info");
  establecerControlesBloqueados(true);
  try {
    await cargarRankingInterno();
    const total = document.querySelectorAll("#ranking tr").length;
    mostrarEstado(total === 0
      ? "No hay playas que coincidan con los filtros seleccionados."
      : `Ranking de ${referenciaDia}${referenciaHorario} actualizado: ${total} playas disponibles.`, "exito");
  } catch (error) {
    console.error(error);
    mostrarEstado("No se pudieron cargar todos los datos. Revisa tu conexión y vuelve a intentarlo.", "error");
  } finally {
    establecerControlesBloqueados(false);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
    inicializarVista();
    actualizarVista();
    actualizarSelectorDia();
    configurarCabecerasOrdenables();
    await cargarRanking();
});
