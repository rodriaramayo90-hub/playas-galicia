let modoVista = "";
let columnaOrden = "puntuacion";
let direccionOrden = "desc";
let ubicacionUsuario = null;
let distanciaMaxima = null;

let datosPlayasCache = {};
let respuestasPronosticoCache = null;
let diaSeleccionado = 0;
let detallesVisibles = false;

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
// Ángulo aproximado de apertura al mar: 0° = N, 90° = E, 180° = S, 270° = W.
// Las fórmulas actuales siguen utilizando `orientacion`; este valor queda preparado para refinarlas.
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
  },
  {
    nombre: "Praia de Compostela",
    municipio: "Vilagarcía de Arousa",
    lat: 42.607669,
    lon: -8.768775,
    orientacion: "W",
    anguloAproximado: 270
  },
  {
    nombre: "Playa de San Amaro",
    municipio: "A Coruña",
    lat: 43.38175,
    lon: -8.39671,
    orientacion: "NE",
    anguloAproximado: 45
  },
  {
    nombre: "Playa de Riazor",
    municipio: "A Coruña",
    lat: 43.36915,
    lon: -8.41138,
    orientacion: "NW",
    anguloAproximado: 330
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
    anguloAproximado: 0
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
    anguloAproximado: 190
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
    anguloAproximado: 180
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
    anguloAproximado: 225
  },
  {
    nombre: "Praia de Canelas",
    municipio: "Sanxenxo",
    lat: 42.38927,
    lon: -8.83183,
    orientacion: "S",
    anguloAproximado: 200
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
function diferenciaAngular(anguloA, anguloB) {
  const diferencia = Math.abs(anguloA - anguloB) % 360;
  return diferencia > 180 ? 360 - diferencia : diferencia;
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

function calcularOleajeEfectivo(playa, datosMarine, fechaObjetivo) {
  const horas = datosMarine.hourly?.time ?? [];
  const valores = [];

  horas.forEach((hora, indice) => {
    const horaLocal = Number(hora.split("T")[1]?.split(":")[0]);
    if (!hora.startsWith(fechaObjetivo) || horaLocal < 11 || horaLocal > 20) return;

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
    valores.push(alturaTotal * factorExposicion * factorPeriodo);
  });

  if (valores.length === 0) return null;
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

function obtenerTemperaturaAgua(datosMarine, fechaObjetivo) {
  const valores = (datosMarine.hourly?.time ?? []).map((hora, indice) => ({
    hora,
    valor: datosMarine.hourly?.sea_surface_temperature?.[indice]
  })).filter(registro => {
    const horaLocal = Number(registro.hora.split("T")[1]?.split(":")[0]);
    return registro.hora.startsWith(fechaObjetivo) && horaLocal >= 11 && horaLocal <= 20 && Number.isFinite(registro.valor);
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
function obtenerCielo(nubosidad) {

  if (nubosidad <= 10) return "☀️ Despejado";
  if (nubosidad <= 30) return "🌤️ Algunas nubes";
  if (nubosidad <= 60) return "⛅ Parcialmente nublado";
  if (nubosidad <= 80) return "☁️ Nublado";

  return "🌫️ Muy nublado";
}
function generarExplicacion(temperatura, viento, vientoMaximo, direccionVientoGrados, lluvia, agua, anguloPlaya, nubosidad) {
  const mensajes = [];
  if (nubosidad <= 10) mensajes.push("cielo despejado");
  else if (nubosidad <= 30) mensajes.push("algunas nubes");
  else if (nubosidad <= 60) mensajes.push("cielo parcialmente nublado");
  else if (nubosidad <= 80) mensajes.push("cielo nublado");
  else mensajes.push("cielo muy nublado");
  if (temperatura >= 25) mensajes.push("temperatura ideal");
  if (viento <= 15) mensajes.push("poco viento");
  if (vientoMaximo >= 35) mensajes.push("momentos de viento fuerte");
  else if (vientoMaximo >= 25) mensajes.push("momentos de viento moderado");
  if (lluvia <= 5) mensajes.push("sin lluvia prevista");
  else if (lluvia <= 15) mensajes.push("probabilidad muy baja de lluvia");
  else if (lluvia <= 30) mensajes.push("posibilidad de lluvia");
  else if (lluvia <= 50) mensajes.push("riesgo moderado de lluvia, penaliza el día de playa");
  else mensajes.push("riesgo alto de lluvia, condiciones poco aptas para la playa");
  const estadoAgua = obtenerEstadoAgua(agua);
  if (estadoAgua) mensajes.push(estadoAgua);
  if (esVientoEnContra(anguloPlaya, direccionVientoGrados, viento)) mensajes.push("viento fuerte entrando en la playa");
  if (esVientoFavorable(anguloPlaya, direccionVientoGrados, viento)) mensajes.push("viento favorable, sopla hacia el mar");
  return mensajes.join(", ") + ".";
}

async function obtenerDatosPlayas(dia) {
  if (respuestasPronosticoCache === null) {
    const latitudes = playas.map(playa => playa.lat).join(",");
    const longitudes = playas.map(playa => playa.lon).join(",");
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&daily=temperature_2m_max&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,cloud_cover&forecast_days=2&timezone=Europe%2FMadrid&cell_selection=nearest`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitudes}&longitude=${longitudes}&hourly=sea_surface_temperature,wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,swell_wave_height,swell_wave_direction&forecast_days=2&timezone=Europe%2FMadrid`;
    const [respuesta, respuestaMarine] = await Promise.all([fetch(url), fetch(marineUrl)]);
    if (!respuesta.ok || !respuestaMarine.ok) throw new Error("No se pudieron consultar las condiciones meteorológicas.");
    const [meteorologia, mar] = await Promise.all([respuesta.json(), respuestaMarine.json()]);
    const datosMeteorologicos = Array.isArray(meteorologia) ? meteorologia : [meteorologia];
    const datosMaritimos = Array.isArray(mar) ? mar : [mar];
    if (datosMeteorologicos.length !== playas.length || datosMaritimos.length !== playas.length) throw new Error("La respuesta meteorológica está incompleta.");
    respuestasPronosticoCache = { datosMeteorologicos, datosMaritimos };
  }

  const { datosMeteorologicos, datosMaritimos } = respuestasPronosticoCache;
  return Promise.all(playas.map((playa, indice) =>
    procesarDatosPlaya(playa, datosMeteorologicos[indice], datosMaritimos[indice], dia)
  ));
}

async function procesarDatosPlaya(playa, datos, datosMarine, dia) {
  const fechaObjetivo = datos.daily.time[dia];
  if (!fechaObjetivo) throw new Error("No hay previsión disponible para el día seleccionado.");
  const registros = datos.hourly.time.map((hora, indice) => ({
    hora,
    temperatura: datos.hourly.temperature_2m[indice],
    lluvia: datos.hourly.precipitation_probability[indice],
    viento: datos.hourly.wind_speed_10m[indice],
    direccionViento: datos.hourly.wind_direction_10m[indice],
    nubosidad: datos.hourly.cloud_cover[indice]
  })).filter(registro => {
    const horaLocal = Number(registro.hora.split("T")[1].split(":")[0]);
    return registro.hora.startsWith(fechaObjetivo) && horaLocal >= 11 && horaLocal <= 20;
  });
  if (registros.length === 0) throw new Error("No hay datos horarios para el día seleccionado.");
  const promedio = campo => registros.reduce((suma, registro) => suma + registro[campo], 0) / registros.length;
  const temperaturaMediaPlaya = promedio("temperatura");
  const lluvia = Math.round(promedio("lluvia"));
  const nubosidad = Math.round(promedio("nubosidad"));
  const viento = Math.round(promedio("viento"));
  const vientoMaximo = Math.round(Math.max(...registros.map(registro => registro.viento).filter(Number.isFinite)));
  const direccionVientoGrados = promedioDireccionViento(registros.map(r => r.direccionViento), registros.map(r => r.viento));
  const direccionViento = Number.isFinite(direccionVientoGrados) ? gradosADireccion(direccionVientoGrados) : "-";
  const temperaturaMaxima = datos.daily.temperature_2m_max[dia];
  const cielo = obtenerCielo(nubosidad);
  const agua = obtenerTemperaturaAgua(datosMarine, fechaObjetivo);
  const oleaje = calcularOleajeEfectivo(playa, datosMarine, fechaObjetivo);
  const estadoOleaje = obtenerEstadoOleaje(oleaje);
  const puntuacion = calcularPuntuacion(temperaturaMediaPlaya, viento, vientoMaximo, lluvia, nubosidad, agua, oleaje, playa.anguloAproximado, direccionVientoGrados);
  const estado = obtenerEstado(puntuacion, nubosidad, playa.anguloAproximado, direccionVientoGrados, viento, vientoMaximo, lluvia, temperaturaMediaPlaya, agua, oleaje);
  const explicacion = generarExplicacion(temperaturaMediaPlaya, viento, vientoMaximo, direccionVientoGrados, lluvia, agua, playa.anguloAproximado, nubosidad);
  let distancia = null;
  if (ubicacionUsuario) distancia = await calcularDistanciaCoche(ubicacionUsuario.lat, ubicacionUsuario.lon, playa.lat, playa.lon);
  return { nombre: playa.nombre, lat: playa.lat, lon: playa.lon, distancia, temperaturaMaxima, temperaturaMediaPlaya, viento, vientoMaximo, direccionViento, direccionVientoGrados, lluvia, cielo, agua, estadoOleaje, oleaje, puntuacion, estado, nubosidad, explicacion };
}

async function cargarRankingInterno() {

  let resultados;


  if (!datosPlayasCache[diaSeleccionado]) {
    datosPlayasCache[diaSeleccionado] = await obtenerDatosPlayas(diaSeleccionado);
  }
  resultados = [...datosPlayasCache[diaSeleccionado]];


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
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.viento} km/h (${playa.direccionViento}) · máx. ${playa.vientoMaximo} km/h</td>
    <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.lluvia}%</td>
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

<p>💨 ${playa.viento} km/h (${playa.direccionViento}) · máx. ${playa.vientoMaximo} km/h</p>

<p>🌧️ ${playa.lluvia}%</p>

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

async function cargarRanking() {
  const referenciaDia = diaSeleccionado === 0 ? "hoy" : "mañana";
  mostrarEstado(`Actualizando las condiciones de ${referenciaDia}…`, "info");
  establecerControlesBloqueados(true);
  try {
    await cargarRankingInterno();
    const total = document.querySelectorAll("#ranking tr").length;
    mostrarEstado(total === 0
      ? "No hay playas que coincidan con los filtros seleccionados."
      : `Ranking de ${referenciaDia} actualizado: ${total} playas disponibles.`, "exito");
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

