let modoVista = "";
let columnaOrden = "puntuacion";
let direccionOrden = "desc";
let ubicacionUsuario = null;
let distanciaMaxima = null;

let datosPlayasCache = null;
let detallesVisibles = false;

function mostrarEstado(mensaje, tipo = "info") {
  const estado = document.getElementById("estadoCarga");
  if (!estado) return;
  estado.textContent = mensaje;
  estado.dataset.tipo = tipo;
}

function establecerControlesBloqueados(bloqueados) {
  document.querySelectorAll(".filtros button, .filtros input").forEach(control => {
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
const playas = [
  {
    nombre: "Playa de la Magdalena",
    municipio: "Cabanas",
    lat: 43.417042,
    lon: -8.174374,
    orientacion: "S",
    anguloAproximado: 175
  },
  {
    nombre: "Playa de Langosteira",
    municipio: "Fisterra",
    lat: 42.920567,
    lon: -9.257438,
    orientacion: "E",
    anguloAproximado: 70
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
    anguloAproximado: 140
  },
  {
    nombre: "Playa A Ribeira / O Corbeiro",
    municipio: "Fisterra",
    lat: 42.906,
    lon: -9.263,
    orientacion: "E",
    anguloAproximado: 95
  },
  {
    nombre: "Playa de Miño",
    municipio: "Miño",
    lat: 43.359563,
    lon: -8.211869,
    orientacion: "NW",
    anguloAproximado: 320
  },
  {
    nombre: "Playa de Perbes",
    municipio: "Miño",
    lat: 43.376525,
    lon: -8.215169,
    orientacion: "NW",
    anguloAproximado: 325
  },
  {
    nombre: "Playa de Sada",
    municipio: "Sada",
    lat: 43.352235,
    lon: -8.251879,
    orientacion: "SE",
    anguloAproximado: 140
  },
  {
    nombre: "Playa de Mera",
    municipio: "Oleiros",
    lat: 43.380657,
    lon: -8.3386,
    orientacion: "NE",
    anguloAproximado: 40
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
    anguloAproximado: 315
  },
  {
    nombre: "Playa de las Lapas",
    municipio: "A Coruña",
    lat: 43.382,
    lon: -8.405,
    orientacion: "NE",
    anguloAproximado: 45
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
    anguloAproximado: 190
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
    anguloAproximado: 315
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
    anguloAproximado: 270
  },
  {
    nombre: "Praia do Vao",
    municipio: "Vigo",
    lat: 42.198063,
    lon: -8.793113,
    orientacion: "SW",
    anguloAproximado: 240
  },
  {
    nombre: "Playa Niño do Corvo",
    municipio: "Moaña",
    lat: 42.265138,
    lon: -8.753091,
    orientacion: "S",
    anguloAproximado: 180
  },
  {
    nombre: "Playa do Con",
    municipio: "Moaña",
    lat: 42.270666,
    lon: -8.741197,
    orientacion: "S",
    anguloAproximado: 180
  },
  {
    nombre: "Praia Borna",
    municipio: "Moaña",
    lat: 42.281156,
    lon: -8.698295,
    orientacion: "S",
    anguloAproximado: 180
  },
  {
    nombre: "Praia Viño",
    municipio: "Cangas",
    lat: 42.2601,
    lon: -8.84433,
    orientacion: "S",
    anguloAproximado: 180
  },
  {
    nombre: "Playa de Limens",
    municipio: "Cangas",
    lat: 42.261,
    lon: -8.816,
    orientacion: "S",
    anguloAproximado: 180
  },
  {
    nombre: "Playa de Lapaman",
    municipio: "Marín",
    lat: 42.342207,
    lon: -8.753497,
    orientacion: "S",
    anguloAproximado: 180
  },
  {
    nombre: "Playa de Mogor",
    municipio: "Marín",
    lat: 42.385548,
    lon: -8.720692,
    orientacion: "SE",
    anguloAproximado: 135
  },
  {
    nombre: "Playa de Portocelo",
    municipio: "Marín",
    lat: 42.390275,
    lon: -8.714898,
    orientacion: "SE",
    anguloAproximado: 135
  },
  {
    nombre: "Playa de Rodas (Islas Cíes)",
    municipio: "Vigo",
    lat: 42.222202,
    lon: -8.901842,
    orientacion: "E",
    anguloAproximado: 90
  }
];

async function calcularDistanciaCoche(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${lon1},${lat1};${lon2},${lat2}?overview=false`;

  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) return null;

    const datos = await respuesta.json();
    if (!datos.routes || datos.routes.length === 0) return null;

    return datos.routes[0].distance / 1000;
  } catch (error) {
    console.warn("No se pudo calcular una distancia por carretera", error);
    return null;
  }
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

function puntosLluvia(lluvia) {

  if (lluvia <= 5) return 25;
  if (lluvia <= 15) return 20;
  if (lluvia <= 30) return 10;
  if (lluvia <= 50) return -10;

  return -25;
}

function puntosAgua(agua) {

  if (!agua) return 0;

  if (agua < 16) return -7;
  if (agua < 18) return -3;
  if (agua < 20) return 3;

  return 7;
}
function puntosNubosidad(nubosidad){

  if (nubosidad <= 10) return 25;
  if (nubosidad <= 25) return 18;
  if (nubosidad <= 40) return 10;
  if (nubosidad <= 60) return -5;
  if (nubosidad <= 80) return -15;

  return -25;
}
function puntosOleaje(oleaje) {

  if (!oleaje) return 0;

  if (oleaje < 0.5) return 3;
  if (oleaje < 1) return 2;
  if (oleaje < 1.5) return 0;
  if (oleaje < 2) return -2;

  return -3;
}

function obtenerEstadoOleaje(oleaje) {

  if (!oleaje)
    return "-";

  if (oleaje < 0.5)
    return "🌊 Mar calmo";

  if (oleaje < 1)
    return "🌊 Algunas olas";

  if (oleaje < 2)
    return "🌊 Muchas olas";

  return "🌊 Temporal";
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
function gradosADireccion(grados) {
  const direcciones = ["N","NE","E","SE","S","SW","W","NW"];
  return direcciones[Math.round(grados / 45) % 8];
}

function puntosOrientacion(
  orientacion,
  direccionViento,
  viento
) {

  const opuestas = {
    N: "S",
    NE: "SW",
    E: "W",
    SE: "NW",
    S: "N",
    SW: "NE",
    W: "E",
    NW: "SE"
  };

  // Si el viento es flojo, la orientación no influye
  if (viento <= 20) {
    return 0;
  }

  if (orientacion === direccionViento) {
    return -5;
  }

  if (opuestas[orientacion] === direccionViento) {
    return 5;
  }

  return 0;
}
function calcularPuntuacion(
  temperaturaMediaPlaya,
  viento,
  lluvia,
  nubosidad,
  agua,
  oleaje,
  orientacion,
  direccionViento
) {

  let puntuacion = 40;

  puntuacion += puntosNubosidad(nubosidad);
  puntuacion += puntosLluvia(lluvia);
  puntuacion += puntosTemperatura(temperaturaMediaPlaya);
  puntuacion += puntosViento(viento);
  puntuacion += puntosOrientacion(
    orientacion,
    direccionViento,
    viento
  );
  puntuacion += puntosAgua(agua);
  puntuacion += puntosOleaje(oleaje);

  console.log({
    base: 40,
    nubosidad: puntosNubosidad(nubosidad),
    lluvia: puntosLluvia(lluvia),
    temperatura: puntosTemperatura(temperaturaMediaPlaya),
    viento: puntosViento(viento),
    orientacion: puntosOrientacion(
      orientacion,
      direccionViento,
      viento
    ),
    agua: puntosAgua(agua),
    oleaje: puntosOleaje(oleaje),
    total: puntuacion
  });

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(puntuacion)
    )
  );
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
function obtenerEstado(
  puntos,
  nubosidad,
  orientacion,
  direccionViento,
  viento
) {

  const vientoEnContra =
    viento > 20 &&
    orientacion === direccionViento;

  // Muy mala puntuación
  if (puntos < 20)
    return "🔴 Mejor evitar";

  // Mucha nubosidad + viento en contra
  if (vientoEnContra && nubosidad > 80)
    return "🟡 Aceptable (muy nublado y viento en contra)";

  if (vientoEnContra && nubosidad > 60)
    return "🟡 Aceptable (nublado y viento en contra)";

  // Solo nubosidad
  if (nubosidad > 80)
    return "🟡 Aceptable (muy nublado)";

  if (nubosidad > 60)
    return "🟡 Aceptable (nublado)";

  // Viento en contra pero cielo aceptable
  if (vientoEnContra) {

    if (puntos >= 70)
      return "🟡 Aceptable (viento en contra)";

    return "🟡 Aceptable";
  }

  // Sin viento en contra
  if (puntos >= 85)
    return "🟢 Excelente";

  if (puntos >= 70)
    return "🟢 Buen día de playa";

  return "🟡 Aceptable";
}
function obtenerCielo(nubosidad) {

  if (nubosidad <= 10) return "☀️ Despejado";
  if (nubosidad <= 30) return "🌤️ Algunas nubes";
  if (nubosidad <= 60) return "⛅ Parcialmente nublado";
  if (nubosidad <= 80) return "☁️ Nublado";

  return "🌫️ Muy nublado";
}
function generarExplicacion(
  temperatura,
  viento,
  direccionViento,
  lluvia,
  agua,
  orientacion,
  nubosidad
) {

  let mensajes = [];

if (nubosidad <= 10)
    mensajes.push("cielo despejado");

else if (nubosidad <= 30)
    mensajes.push("algunas nubes");

else if (nubosidad <= 60)
    mensajes.push("cielo parcialmente nublado");

else if (nubosidad <= 80)
    mensajes.push("cielo nublado");

else
    mensajes.push("cielo muy nublado");


  if (temperatura >= 25)
    mensajes.push("temperatura ideal");

  if (viento <= 15)
    mensajes.push("poco viento");

if (lluvia <= 10)
    mensajes.push("muy baja probabilidad de lluvia");

else if (lluvia <= 30)
    mensajes.push("baja probabilidad de lluvia");

else if (lluvia <= 60)
    mensajes.push("posibilidad de lluvia");

else
    mensajes.push("riesgo alto de lluvia");

const estadoAgua = obtenerEstadoAgua(agua);

if (estadoAgua)
    mensajes.push(estadoAgua);
const opuestas = {
  N: "S",
  NE: "SW",
  E: "W",
  SE: "NW",
  S: "N",
  SW: "NE",
  W: "E",
  NW: "SE"
};

if (
  orientacion === direccionViento &&
  viento > 20
)
  mensajes.push(
    "viento fuerte entrando directamente en la playa"
  );

if (
  opuestas[orientacion] === direccionViento &&
  viento > 20
)
  mensajes.push(
    "viento favorable, sopla hacia el mar"
  );

  return mensajes.join(", ") + ".";
}

async function obtenerDatosPlayas() {
  const latitudes = playas.map(playa => playa.lat).join(",");
  const longitudes = playas.map(playa => playa.lon).join(",");

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&daily=temperature_2m_max,wind_direction_10m_dominant&hourly=temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover&forecast_days=1&timezone=Europe%2FMadrid`;

  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${latitudes}&longitude=${longitudes}&hourly=sea_surface_temperature,wave_height&forecast_days=1&timezone=Europe%2FMadrid`;

  const [respuesta, respuestaMarine] = await Promise.all([
    fetch(url),
    fetch(marineUrl)
  ]);

  if (!respuesta.ok || !respuestaMarine.ok) {
    throw new Error("No se pudieron consultar las condiciones meteorológicas.");
  }

  const [respuestaMeteorologica, respuestaMaritima] = await Promise.all([
    respuesta.json(),
    respuestaMarine.json()
  ]);

  const datosMeteorologicos = Array.isArray(respuestaMeteorologica)
    ? respuestaMeteorologica
    : [respuestaMeteorologica];

  const datosMaritimos = Array.isArray(respuestaMaritima)
    ? respuestaMaritima
    : [respuestaMaritima];

  if (
    datosMeteorologicos.length !== playas.length ||
    datosMaritimos.length !== playas.length
  ) {
    throw new Error("La respuesta meteorológica está incompleta.");
  }

  return Promise.all(
    playas.map((playa, indice) =>
      procesarDatosPlaya(
        playa,
        datosMeteorologicos[indice],
        datosMaritimos[indice]
      )
    )
  );
}

async function procesarDatosPlaya(playa, datos, datosMarine) {

const horas = datos.hourly.time;
const temperaturas = datos.hourly.temperature_2m;
const probabilidadesLluvia = datos.hourly.precipitation_probability;
const velocidadesViento = datos.hourly.wind_speed_10m;
const nubosidades = datos.hourly.cloud_cover;
  
const temperaturasPlaya = horas
  .map((hora, indice) => ({
    hora,
    temperatura: temperaturas[indice]
  }))
  .filter(registro => {
    const horaLocal = parseInt(
      registro.hora.split("T")[1].split(":")[0]
    );

    return horaLocal >= 11 && horaLocal <= 20;
  });

const temperaturaMediaPlaya =
  temperaturasPlaya.reduce(
    (suma, registro) => suma + registro.temperatura,
    0
  ) / temperaturasPlaya.length;
  const lluviaPlaya = horas
  .map((hora, indice) => ({
    hora,
    lluvia: probabilidadesLluvia[indice]
  }))
  .filter(registro => {
    const horaLocal = parseInt(
      registro.hora.split("T")[1].split(":")[0]
    );

    return horaLocal >= 11 && horaLocal <= 20;
  });

const lluviaMediaPlaya =
  lluviaPlaya.reduce(
    (suma, registro) => suma + registro.lluvia,
    0
  ) / lluviaPlaya.length;
  
  const vientoPlaya = horas
  .map((hora, indice) => ({
    hora,
    viento: velocidadesViento[indice]
  }))
  .filter(registro => {

    const horaLocal = parseInt(
      registro.hora.split("T")[1].split(":")[0]
    );

    return horaLocal >= 11 && horaLocal <= 20;
  });


const vientoMedioPlaya =
  vientoPlaya.reduce(
    (suma, registro) => suma + registro.viento,
    0
  ) / vientoPlaya.length;
  const nubosidadPlaya = horas
  .map((hora, indice) => ({
    hora,
    nubosidad: nubosidades[indice]
  }))
  .filter(registro => {

    const horaLocal = parseInt(
      registro.hora.split("T")[1].split(":")[0]
    );

    return horaLocal >= 11 && horaLocal <= 20;
  });


const nubosidadMediaPlaya =
  nubosidadPlaya.reduce(
    (suma, registro) => suma + registro.nubosidad,
    0
  ) / nubosidadPlaya.length;
  
  const temperaturaMaxima = datos.daily.temperature_2m_max[0];
  const lluvia = Math.round(lluviaMediaPlaya);
  const nubosidad = Math.round(nubosidadMediaPlaya);
  const viento = Math.round(vientoMedioPlaya);
  const direccionVientoGrados =
    datos.daily.wind_direction_10m_dominant[0];

  const direccionViento =
    gradosADireccion(direccionVientoGrados);
  
  const cielo = obtenerCielo(nubosidad);

const agua =
  datosMarine.hourly?.sea_surface_temperature?.[12] ?? null;

const oleaje =
  datosMarine.hourly?.wave_height?.[12] ?? null;
  
const estadoOleaje =
  obtenerEstadoOleaje(oleaje);
  
const puntuacion = calcularPuntuacion(
  temperaturaMediaPlaya,
  viento,
  lluvia,
  nubosidad,
  agua,
  oleaje,
  playa.orientacion,
  direccionViento
);

console.log(playa.nombre);

console.log({
  temperatura: temperaturaMediaPlaya,
  viento,
  lluvia,
  nubosidad,
  agua,
  oleaje,
  puntuacion
});  
  
  const estado = obtenerEstado(
  puntuacion,
  nubosidad,
  playa.orientacion,
  direccionViento,
  viento
);

 const explicacion = generarExplicacion(
    temperaturaMediaPlaya,
    viento,
    direccionViento,
    lluvia,
    agua,
    playa.orientacion,
    nubosidad
);

let distancia = null;

if (ubicacionUsuario) {

  distancia = await calcularDistanciaCoche(
    ubicacionUsuario.lat,
    ubicacionUsuario.lon,
    playa.lat,
    playa.lon
  );

}
  
return {
  nombre: playa.nombre,
  lat: playa.lat,
  lon: playa.lon,
  distancia,
  temperaturaMaxima,
  temperaturaMediaPlaya,
  viento,
  direccionViento,
  lluvia,
  cielo,
  agua,
  estadoOleaje,
  puntuacion,
  estado,
  nubosidad,
  explicacion
};
}

async function cargarRankingInterno() {

  let resultados;


  // Primera carga: obtener clima y datos del mar
  if(datosPlayasCache === null){

   resultados = await obtenerDatosPlayas();

    datosPlayasCache = resultados;

  }

  else {

    resultados = [...datosPlayasCache];

  }


  // Recalcular distancias si hay ubicación
  if(ubicacionUsuario){

    await Promise.all(
  resultados.map(async playa => {

    playa.distancia =
      await calcularDistanciaCoche(
        ubicacionUsuario.lat,
        ubicacionUsuario.lon,
        playa.lat,
        playa.lon
      );

  })
);

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
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.viento} km/h (${playa.direccionViento})</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.lluvia}%</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.agua ? playa.agua.toFixed(1) + "°C" : "-"}</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.estadoOleaje}</td>
    <td class="col-estado">${playa.estado}</td>
   <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.puntuacion}</td>
    <td class="col-explicacion">${playa.explicacion}</td>
   </tr>
`;
    rankingMobile.innerHTML += `

<div class="tarjeta-playa">

<h2>
🏖️ ${playa.nombre}
</h2>

<div class="estado">
${playa.estado}
</div>

<p>📍 ${
playa.distancia!==null
?
playa.distancia.toFixed(1)+" km"
:
"-"
}</p>

<p>${playa.cielo}</p>

<p>🌡️ Temperatura: ${playa.temperaturaMediaPlaya.toFixed(1)}°C</p>


<div class="puntuacion">
⭐ ${playa.puntuacion}/100
</div>
<p>
${playa.explicacion}
</p>
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

<p>💨 ${playa.viento} km/h (${playa.direccionViento})</p>

<p>🌧️ ${playa.lluvia}%</p>

<p>${playa.estadoOleaje}</p>

</div>

</div>

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

async function cargarRanking() {
  mostrarEstado("Actualizando las condiciones de las playas…", "info");
  establecerControlesBloqueados(true);

  try {
    await cargarRankingInterno();
    const total = document.querySelectorAll("#ranking tr").length;
    mostrarEstado(
      total === 0
        ? "No hay playas que coincidan con los filtros seleccionados."
        : `Ranking actualizado: ${total} playas disponibles.`,
      "exito"
    );
  } catch (error) {
    console.error(error);
    mostrarEstado(
      "No se pudieron cargar todos los datos. Revisa tu conexión y vuelve a intentarlo.",
      "error"
    );
  } finally {
    establecerControlesBloqueados(false);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
    inicializarVista();
    actualizarVista();
    configurarCabecerasOrdenables();
    await cargarRanking();
});
