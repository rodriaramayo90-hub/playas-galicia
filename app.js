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
  indicador.textContent = `ğŸ“ Distancias desde: ${origen}`;
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

    // Para nÃºmeros
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
// Ãngulo aproximado de apertura al mar: 0Â° = N, 90Â° = E, 180Â° = S, 270Â° = W.
// Las fÃ³rmulas actuales siguen utilizando `orientacion`; este valor queda preparado para refinarlas.
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
    nombre: "Playa de Mar de FÃ³ra",
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
    nombre: "Playa de TalÃ³n",
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
    nombre: "Playa de SardiÃ±eiro",
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
    nombre: "Playa de MiÃ±o",
    municipio: "MiÃ±o",
    lat: 43.359563,
    lon: -8.211869,
    orientacion: "NW",
    anguloAproximado: 320,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "mino_perbes"
  },
  {
    nombre: "Playa de Perbes",
    municipio: "MiÃ±o",
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
    nombre: "Playa de SabÃ³n",
    municipio: "Arteixo",
    lat: 43.329662,
    lon: -8.50887,
    orientacion: "NW",
    anguloAproximado: 310
  },
  {
    nombre: "Playa de OrzÃ¡n",
    municipio: "A CoruÃ±a",
    lat: 43.37,
    lon: -8.406,
    orientacion: "NW",
    anguloAproximado: 315,
    zonaMeteorologica: "coruna_urbana"
  },
  {
    nombre: "Playa de las Lapas",
    municipio: "A CoruÃ±a",
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
    nombre: "Playa NiÃ±o do Corvo",
    municipio: "MoaÃ±a",
    lat: 42.265138,
    lon: -8.753091,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "alto",
    zonaMeteorologica: "moana"
  },
  {
    nombre: "Playa do Con",
    municipio: "MoaÃ±a",
    lat: 42.270666,
    lon: -8.741197,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "alto",
    zonaMeteorologica: "moana"
  },
  {
    nombre: "Praia Borna",
    municipio: "MoaÃ±a",
    lat: 42.281156,
    lon: -8.698295,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "alto",
    zonaMeteorologica: "moana"
  },
  {
    nombre: "Praia ViÃ±o",
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
    municipio: "MarÃ­n",
    lat: 42.342207,
    lon: -8.753497,
    orientacion: "S",
    anguloAproximado: 180,
    nivelAbrigo: "moderado",
    zonaMeteorologica: "marin"
  },
  {
    nombre: "Playa de Mogor",
    municipio: "MarÃ­n",
    lat: 42.385548,
    lon: -8.720692,
    orientacion: "SE",
    anguloAproximado: 135,
    nivelAbrigo: "alto",
    zonaMeteorologica: "marin"
  },
  {
    nombre: "Playa de Portocelo",
    municipio: "MarÃ­n",
    lat: 42.390275,
    lon: -8.714898,
    orientacion: "SE",
    anguloAproximado: 135,
    nivelAbrigo: "alto",
    zonaMeteorologica: "marin"
  },
  {
    nombre: "Playa de Rodas (Islas CÃ­es)",
    municipio: "Vigo",
    lat: 42.222202,
    lon: -8.901842,
    orientacion: "E",
    anguloAproximado: 90,
    nivelAbrigo: "alto"
  },
  {
    nombre: "Praia de Compostela",
    municipio: "VilagarcÃ­a de Arousa",
    lat: 42.607669,
    lon: -8.768775,
    orientacion: "W",
    anguloAproximado: 270,
    nivelAbrigo: "muyAlto"
  },
  {
    nombre: "Playa de San Amaro",
    municipio: "A CoruÃ±a",
    lat: 43.38175,
    lon: -8.39671,
    orientacion: "NE",
    anguloAproximado: 45,
    zonaMeteorologica: "coruna_urbana",
    // Cala urbana protegida por la costa y el entorno construido. La apertura
    // principal queda hacia el NE; viento y mar de otros sectores llegan muy
    // atenuados a la zona de baÃ±o.
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
    municipio: "A CoruÃ±a",
    lat: 43.36915,
    lon: -8.41138,
    orientacion: "NW",
    anguloAproximado: 330,
    nivelAbrigo: "alto",
    zonaMeteorologica: "coruna_urbana"
  },
  {
    nombre: "Praia de DoniÃ±os",
    municipio: "Ferrol",
    lat: 43.503311,
    lon: -8.318419,
    orientacion: "W",
    anguloAproximado: 280
  },
  {
    nombre: "Praia da Frouxeira",
    municipio: "ValdoviÃ±o",
    lat: 43.61247,
    lon: -8.16695,
    orientacion: "NW",
    anguloAproximado: 315
  },
  {
    nombre: "Praia de PantÃ­n",
    municipio: "ValdoviÃ±o",
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
    nombre: "Praia de NemiÃ±a",
    municipio: "MuxÃ­a",
    lat: 43.00751,
    lon: -9.26165,
    orientacion: "W",
    anguloAproximado: 270
  },
  {
    nombre: "Praia de LariÃ±o",
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
        throw new Error(`El servicio respondiÃ³ con ${respuesta.status}`);
      }
      return await respuesta.json();
    } catch (error) {
      ultimoEr÷}|¶‰Ëkºwµç}Í5•Ñ•½É½±½¥½Ítì4(€½¹ÍĞé½¹…Ì€ô¹•Ü5…À ¤ì4(€±¥ÍÑ…A±…å…Ì¹™½É…  ¡Á±…å„°¥¹‘¥”¤€ôøì4(€€€¥˜€ …Á±…å„¹é½¹…5•Ñ•½É½±½¥„¤É•ÑÕÉ¸ì4(€€€¥˜€ …é½¹…Ì¹¡…Ì¡Á±…å„¹é½¹…5•Ñ•½É½±½¥„¤¤é½¹…Ì¹Í•Ğ¡Á±…å„¹é½¹…5•Ñ•½É½±½¥„°mt¤ì4(€€€é½¹…Ì¹•Ğ¡Á±…å„¹é½¹…5•Ñ•½É½±½¥„¤¹ÁÕÍ ¡¥¹‘¥”¤ì4(€ô¤ì4(4(€é½¹…Ì¹™½É… ¡¥¹‘¥•Ì€ôøì4(€€€½¹ÍĞÉ•™•É•¹¥…Ì€ô¥¹‘¥•Ì¹µ…À¡¥¹‘¥”€ôø‘…Ñ½Í5•Ñ•½É½±½¥½Ím¥¹‘¥•t¤¹™¥±Ñ•È¡	½½±•…¸¤ì4(€€€¥˜€¡É•™•É•¹¥…Ì¹±•¹Ñ €ğ€È¤É•ÑÕÉ¸ì4(€€€½¹ÍĞ‰…Í”€ôÉ•™•É•¹¥…ÍlÁtì4(€€€½¹ÍĞ½µÁ…ÉÑ¥‘„€ôì4(€€€€€€¸¸¹‰…Í”°4(€€€€€‘…¥±äèì4(€€€€€€€€¸¸¹‰…Í”¹‘…¥±ä°4(€€€€€€€Ñ•µÁ•É…ÑÕÉ•|Éµ}µ…àèÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰‘…¥±äˆ°€‰Ñ•µÁ•É…ÑÕÉ•|Éµ}µ…àˆ¤4(€€€€€ô°4(€€€€€¡½ÕÉ±äèì4(€€€€€€€€¸¸¹‰…Í”¹¡½ÕÉ±ä°4(€€€€€€€Ñ•µÁ•É…ÑÕÉ•|É´èÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰Ñ•µÁ•É…ÑÕÉ•|É´ˆ¤°4(€€€€€€€ÁÉ•¥Á¥Ñ…Ñ¥½¹}ÁÉ½‰…‰¥±¥ÑäèÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰ÁÉ•¥Á¥Ñ…Ñ¥½¹}ÁÉ½‰…‰¥±¥Ñäˆ¤°4(€€€€€€€İ¥¹‘}ÍÁ••‘|ÄÁ´èÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰İ¥¹‘}ÍÁ••‘|ÄÁ´ˆ¤°4(€€€€€€€İ¥¹‘}‘¥É•Ñ¥½¹|ÄÁ´èÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰İ¥¹‘}‘¥É•Ñ¥½¹|ÄÁ´ˆ°ÁÉ½µ•‘¥½¹Õ±…È¤°4(€€€€€€€±½Õ‘}½Ù•ÈèÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰±½Õ‘}½Ù•Èˆ¤°4(€€€€€€€±½Õ‘}½Ù•É}±½ÜèÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰±½Õ‘}½Ù•É}±½Üˆ¤°4(€€€€€€€±½Õ‘}½Ù•É}µ¥èÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰±½Õ‘}½Ù•É}µ¥ˆ¤°4(€€€€€€€±½Õ‘}½Ù•É}¡¥ èÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰±½Õ‘}½Ù•É}¡¥ ˆ¤°4(€€€€€€€ÍÕ¹Í¡¥¹•}‘ÕÉ…Ñ¥½¸èÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰ÍÕ¹Í¡¥¹•}‘ÕÉ…Ñ¥½¸ˆ¤°4(€€€€€€€¥Í}‘…äèÁÉ½µ•‘¥…ÉM•É¥•Ì¡É•™•É•¹¥…Ì°€‰¡½ÕÉ±äˆ°€‰¥Í}‘…äˆ¤4(€€€€€ô4(€€€ôì4(€€€¥¹‘¥•Ì¹™½É… ¡¥¹‘¥”€ôøìÉ•ÍÕ±Ñ…‘½m¥¹‘¥•t€ô½µÁ…ÉÑ¥‘„ìô¤ì4(€ô¤ì4(€É•ÑÕÉ¸É•ÍÕ±Ñ…‘¼ì4)ô4(4)…Íå¹Œ™Õ¹Ñ¥½¸½‰Ñ•¹•É…Ñ½ÍA±…å…Ì¡‘¥„°¡½É…%¹¥¥¼€ô€Ü°¡½É…¥¸€ô€ÈÄ¤ì4(€¥˜€¡É•ÍÁÕ•ÍÑ…ÍAÉ½¹½ÍÑ¥½…¡”€ôôô¹Õ±°¤ì4(€€€½¹ÍĞ±½Ñ•Ì€ô‘¥Ù¥‘¥É¹1½Ñ•Ì¡Á±…å…Ì°Q59=}1=Q}AI=9=MQ%<¤ì4(€€€½¹ÍĞÉ•ÍÁÕ•ÍÑ…Ì€ô…İ…¥Ğ•©•ÕÑ…É½¹½¹ÕÉÉ•¹¥„ 4(€€€€€±½Ñ•Ì°4(€€€€€=9UII9%}AI=9=MQ%<°4(€€€€€…Íå¹Œ±½Ñ”€ôøì4(€€€€€€€½¹ÍĞ±…Ñ¥ÑÕ‘•Ì€ô±½Ñ”¹µ…À¡Á±…å„€ôøÁ±…å„¹±…Ğ¤¹©½¥¸ ˆ°ˆ¤ì4(€€€€€€€½¹ÍĞ±½¹¥ÑÕ‘•Ì€ô±½Ñ”¹µ…À¡Á±…å„€ôøÁ±…å„¹±½¸¤¹©½¥¸ ˆ°ˆ¤ì4(€€€€€€€½¹ÍĞÕÉ°€ô¡ÑÑÁÌè¼½…Á¤¹½Á•¸µµ•Ñ•¼¹½´½ØÄ½™½É•…ÍĞı±…Ñ¥ÑÕ‘”ô‘í±…Ñ¥ÑÕ‘•Íô™±½¹¥ÑÕ‘”ô‘í±½¹¥ÑÕ‘•Íô™‘…¥±äõÑ•µÁ•É…ÑÕÉ•|Éµ}µ…à™¡½ÕÉ±äõÑ•µÁ•É…ÑÕÉ•|É´±ÁÉ•¥Á¥Ñ…Ñ¥½¹}ÁÉ½‰…‰¥±¥Ñä±İ¥¹‘}ÍÁ••‘|ÄÁ´±İ¥¹‘}‘¥É•Ñ¥½¹|ÄÁ´±±½Õ‘}½Ù•È±±½Õ‘}½Ù•É}±½Ü±±½Õ‘}½Ù•É}µ¥±±½Õ‘}½Ù•É}¡¥ ±ÍÕ¹Í¡¥¹•}‘ÕÉ…Ñ¥½¸±¥Í}‘…ä™™½É•…ÍÑ}‘…åÌôÈ™Ñ¥µ•é½¹”õÕÉ½Á””É5…‘É¥™•±±}Í•±•Ñ¥½¸õ¹•…É•ÍÑ€ì4(€€€€€€€½¹ÍĞµ…É¥¹•UÉ°€ô¡ÑÑÁÌè¼½µ…É¥¹”µ…Á¤¹½Á•¸µµ•Ñ•¼¹½´½ØÄ½µ…É¥¹”ı±…Ñ¥ÑÕ‘”ô‘í±…Ñ¥ÑÕ‘•Íô™±½¹¥ÑÕ‘”ô‘í±½¹¥ÑÕ‘•Íô™¡½ÕÉ±äõÍ•…}ÍÕÉ™…•}Ñ•µÁ•É…ÑÕÉ”±İ…Ù•}¡•¥¡Ğ±İ…Ù•}‘¥É•Ñ¥½¸±İ…Ù•}Á•É¥½±İ¥¹‘}İ…Ù•}¡•¥¡Ğ±İ¥¹‘}İ…Ù•}‘¥É•Ñ¥½¸±Íİ•±±}İ…Ù•}¡•¥¡Ğ±Íİ•±±}İ…Ù•}‘¥É•Ñ¥½¸™™½É•…ÍÑ}‘…åÌôÈ™Ñ¥µ•é½¹”õÕÉ½Á””É5…‘É¥‘€ì4(€€€€€€€½¹ÍĞmµ•Ñ•½É½±½¥„°µ…Ét€ô…İ…¥ĞAÉ½µ¥Í”¹…±°¡l4(€€€€€€€€€Í½±¥¥Ñ…É)Í½¸¡ÕÉ°°ìÉ•¥¹Ñ•¹Ñ½Ìè€È°Ñ¥•µÁ½1¥µ¥Ñ”è€ÈÀÀÀÀô¤°4(€€€€€€€€€Í½±¥¥Ñ…É)Í½¸¡µ…É¥¹•UÉ°°ìÉ•¥¹Ñ•¹Ñ½Ìè€È°Ñ¥•µÁ½1¥µ¥Ñ”è€ÈÀÀÀÀô¤4(€€€€€€€t¤ì4(€€€€€€€½¹ÍĞ‘…Ñ½Í5•Ñ•½É½±½¥½Ì€ôÉÉ…ä¹¥ÍÉÉ…ä¡µ•Ñ•½É½±½¥„¤€üµ•Ñ•½É½±½¥„€èmµ•Ñ•½É½±½¥…tì4(€€€€€€€½¹ÍĞ‘…Ñ½Í5…É¥Ñ¥µ½Ì€ôÉÉ…ä¹¥ÍÉÉ…ä¡µ…È¤€üµ…È€èmµ…Étì4(€€€€€€€¥˜€ 4(€€€€€€€€€‘…Ñ½Í5•Ñ•½É½±½¥½Ì¹±•¹Ñ €„ôô±½Ñ”¹±•¹Ñ ñğ4(€€€€€€€€€‘…Ñ½Í5…É¥Ñ¥µ½Ì¹±•¹Ñ €„ôô±½Ñ”¹±•¹Ñ 4(€€€€€€€€¤ì4(€€€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰1„É•ÍÁÕ•ÍÑ„µ•Ñ•½É½³Í¥„•ÍÓ„¥¹½µÁ±•Ñ„¸ˆ¤ì4(€€€€€€€ô4(€€€€€€€É•ÑÕÉ¸ì‘…Ñ½Í5•Ñ•½É½±½¥½Ì°‘…Ñ½Í5…É¥Ñ¥µ½Ìôì4(€€€€€ô4(€€€€¤ì4(€€€½¹ÍĞ‘…Ñ½Í5•Ñ•½É½±½¥½Ì€ôÉ•ÍÁÕ•ÍÑ…Ì¹™±…Ñ5…À¡É•ÍÁÕ•ÍÑ„€ôøÉ•ÍÁÕ•ÍÑ„¹‘…Ñ½Í5•Ñ•½É½±½¥½Ì¤ì4(€€€½¹ÍĞ‘…Ñ½Í5…É¥Ñ¥µ½Ì€ôÉ•ÍÁÕ•ÍÑ…Ì¹™±…Ñ5…À¡É•ÍÁÕ•ÍÑ„€ôøÉ•ÍÁÕ•ÍÑ„¹‘…Ñ½Í5…É¥Ñ¥µ½Ì¤ì4(€€€É•ÍÁÕ•ÍÑ…ÍAÉ½¹½ÍÑ¥½…¡”€ôì‘…Ñ½Í5•Ñ•½É½±½¥½Ì°‘…Ñ½Í5…É¥Ñ¥µ½Ìôì4(€ô4(4(€½¹ÍĞì‘…Ñ½Í5•Ñ•½É½±½¥½Ì°‘…Ñ½Í5…É¥Ñ¥µ½Ìô€ôÉ•ÍÁÕ•ÍÑ…ÍAÉ½¹½ÍÑ¥½…¡”ì4(€½¹ÍĞµ•Ñ•½É½±½¥…A½ÉA±…å„€ô½µÁ…ÉÑ¥É5•Ñ•½É½±½¥…A½Éi½¹„¡Á±…å…Ì°‘…Ñ½Í5•Ñ•½É½±½¥½Ì¤ì4(€É•ÑÕÉ¸AÉ½µ¥Í”¹…±°¡Á±…å…Ì¹µ…À ¡Á±…å„°¥¹‘¥”¤€ôø4(€€€ÁÉ½•Í…É…Ñ½ÍA±…å„¡Á±…å„°µ•Ñ•½É½±½¥…A½ÉA±…å…m¥¹‘¥•t°‘…Ñ½Í5…É¥Ñ¥µ½Ím¥¹‘¥•t°‘¥„°¡½É…%¹¥¥¼°¡½É…¥¸¤4(€€¤¤ì4)ô4(4)…Íå¹Œ™Õ¹Ñ¥½¸ÁÉ½•Í…É…Ñ½ÍA±…å„¡Á±…å„°‘…Ñ½Ì°‘…Ñ½Í5…É¥¹”°‘¥„°¡½É…%¹¥¥¼€ô€Ü°¡½É…¥¸€ô€ÈÄ¤ì4(€½¹ÍĞ™•¡…=‰©•Ñ¥Ù¼€ô‘…Ñ½Ì¹‘…¥±ä¹Ñ¥µ•m‘¥…tì4(€¥˜€ …™•¡…=‰©•Ñ¥Ù¼¤Ñ¡É½Ü¹•ÜÉÉ½È ‰9¼¡…äÁÉ•Ù¥Í§Í¸‘¥ÍÁ½¹¥‰±”Á…É„•°“µ„Í•±•¥½¹…‘¼¸ˆ¤ì4(€½¹ÍĞÉ•¥ÍÑÉ½Ì€ô‘…Ñ½Ì¹¡½ÕÉ±ä¹Ñ¥µ”¹µ…À ¡¡½É„°¥¹‘¥”¤€ôø€¡ì4(€€€¡½É„°4(€€€Ñ•µÁ•É…ÑÕÉ„è‘…Ñ½Ì¹¡½ÕÉ±ä¹Ñ•µÁ•É…ÑÕÉ•|Éµm¥¹‘¥•t°4(€€€±±ÕÙ¥„è‘…Ñ½Ì¹¡½ÕÉ±ä¹ÁÉ•¥Á¥Ñ…Ñ¥½¹}ÁÉ½‰…‰¥±¥Ñåm¥¹‘¥•t°4(€€€Ù¥•¹Ñ¼è‘…Ñ½Ì¹¡½ÕÉ±ä¹İ¥¹‘}ÍÁ••‘|ÄÁµm¥¹‘¥•t°4(€€€‘¥É•¥½¹Y¥•¹Ñ¼è‘…Ñ½Ì¹¡½ÕÉ±ä¹İ¥¹‘}‘¥É•Ñ¥½¹|ÄÁµm¥¹‘¥•t°4(€€€¹Õ‰½Í¥‘…è‘…Ñ½Ì¹¡½ÕÉ±ä¹±½Õ‘}½Ù•Ém¥¹‘¥•t°4(€€€¹Õ‰½Í¥‘…‘	…©„è‘…Ñ½Ì¹¡½ÕÉ±ä¹±½Õ‘}½Ù•É}±½Üü¹m¥¹‘¥•t°4(€€€¹Õ‰½Í¥‘…‘5•‘¥„è‘…Ñ½Ì¹¡½ÕÉ±ä¹±½Õ‘}½Ù•É}µ¥ü¹m¥¹‘¥•t°4(€€€¹Õ‰½Í¥‘…‘±Ñ„è‘…Ñ½Ì¹¡½ÕÉ±ä¹±½Õ‘}½Ù•É}¡¥ ü¹m¥¹‘¥•t°4(€€€‘ÕÉ…¥½¹M½°è‘…Ñ½Ì¹¡½ÕÉ±ä¹ÍÕ¹Í¡¥¹•}‘ÕÉ…Ñ¥½¸ü¹m¥¹‘¥•t°4(€€€•Í•¥„è‘…Ñ½Ì¹¡½ÕÉ±ä¹¥Í}‘…äü¹m¥¹‘¥•t4(€ô¤¤¹™¥±Ñ•È¡É•¥ÍÑÉ¼€ôøì4(€€€½¹ÍĞ¡½É…1½…°€ô9Õµ‰•È¡É•¥ÍÑÉ¼¹¡½É„¹ÍÁ±¥Ğ ‰Pˆ¥lÅt¹ÍÁ±¥Ğ ˆèˆ¥lÁt¤ì4(€€€½¹ÍĞ‘•¹ÑÉ½•±!½É…É¥¼€ô¡½É…1½…°€øô¡½É…%¹¥¥¼€˜˜¡½É…1½…°€ğô¡½É…¥¸ì4(€€€É•ÑÕÉ¸É•¥ÍÑÉ¼¹¡½É„¹ÍÑ…ÉÑÍ]¥Ñ ¡™•¡…=‰©•Ñ¥Ù¼¤€˜˜‘•¹ÑÉ½•±!½É…É¥¼ì4(€ô¤ì4(€¥˜€¡É•¥ÍÑÉ½Ì¹±•¹Ñ €ôôô€À¤Ñ¡É½Ü¹•ÜÉÉ½È ‰9¼¡…ä‘…Ñ½Ì¡½É…É¥½ÌÁ…É„•°“µ„Í•±•¥½¹…‘¼¸ˆ¤ì4(€É•¥ÍÑÉ½Ì¹™½É… ¡É•¥ÍÑÉ¼€ôøì4(€€€½¹ÍĞ½¹™¥ÕÉ…¥½¹‰É¥¼€ô½‰Ñ•¹•É½¹™¥ÕÉ…¥½¹‰É¥¼¡Á±…å„°€‰Ù¥•¹Ñ¼ˆ¤ì4(€€€½¹ÍĞ™…Ñ½É‰É¥¼€ô™…Ñ½É‰É¥½¥É•¥½¹…°¡½¹™¥ÕÉ…¥½¹‰É¥¼°É•¥ÍÑÉ¼¹‘¥É•¥½¹Y¥•¹Ñ¼¤ì4(€€€É•¥ÍÑÉ¼¹Ù¥•¹Ñ½¹A±…å„€ôÉ•¥ÍÑÉ¼¹Ù¥•¹Ñ¼€¨™…Ñ½É‰É¥¼ì4(€ô¤ì4(€½¹ÍĞÁÉ½µ•‘¥¼€ô…µÁ¼€ôøÉ•¥ÍÑÉ½Ì¹É•‘Õ” ¡ÍÕµ„°É•¥ÍÑÉ¼¤€ôøÍÕµ„€¬É•¥ÍÑÉ½m…µÁ½t°€À¤€¼É•¥ÍÑÉ½Ì¹±•¹Ñ ì4(€½¹ÍĞÑ•µÁ•É…ÑÕÉ…5•‘¥…A±…å„€ôÁÉ½µ•‘¥¼ ‰Ñ•µÁ•É…ÑÕÉ„ˆ¤ì4(€½¹ÍĞì±±ÕÙ¥„°±±ÕÙ¥…AÉ½µ•‘¥¼°±±ÕÙ¥…5…á¥µ„ô€ôÉ•ÍÕµ¥ÉAÉ½‰…‰¥±¥‘…‘1±ÕÙ¥„¡É•¥ÍÑÉ½Ì¤ì4(€½¹ÍĞì¹Õ‰½Í¥‘…°ÁÉ½Á½É¥½¹!½É…ÍM½±•…‘…Ì°ÁÉ•‘½µ¥¹¥½9Õ‰•Í±Ñ…Ìô€ôÉ•ÍÕµ¥É9Õ‰½Í¥‘…¡É•¥ÍÑÉ½Ì¤ì4(€½¹ÍĞÙ¥•¹Ñ½5½‘•±¼€ô5…Ñ ¹É½Õ¹¡ÁÉ½µ•‘¥¼ ‰Ù¥•¹Ñ¼ˆ¤¤ì4(€½¹ÍĞÙ¥•¹Ñ¼€ô5…Ñ ¹É½Õ¹¡ÁÉ½µ•‘¥¼ ‰Ù¥•¹Ñ½¹A±…å„ˆ¤¤ì4(€½¹ÍĞÙ¥•¹Ñ½5…á¥µ½5½‘•±¼€ô5…Ñ ¹É½Õ¹¡5…Ñ ¹µ…à ¸¸¹É•¥ÍÑÉ½Ì¹µ…À¡É•¥ÍÑÉ¼€ôøÉ•¥ÍÑÉ¼¹Ù¥•¹Ñ¼¤¹™¥±Ñ•È¡9Õµ‰•È¹¥Í¥¹¥Ñ”¤¤¤ì4(€½¹ÍĞÙ¥•¹Ñ½5…á¥µ¼€ô5…Ñ ¹É½Õ¹¡5…Ñ ¹µ…à ¸¸¹É•¥ÍÑÉ½Ì¹µ…À¡É•¥ÍÑÉ¼€ôøÉ•¥ÍÑÉ¼¹Ù¥•¹Ñ½¹A±…å„¤¹™¥±Ñ•È¡9Õµ‰•È¹¥Í¥¹¥Ñ”¤¤¤ì4(€½¹ÍĞ‘¥É•¥½¹Y¥•¹Ñ½É…‘½Ì€ôÁÉ½µ•‘¥½¥É•¥½¹Y¥•¹Ñ¼¡É•¥ÍÑÉ½Ì¹µ…À¡È€ôøÈ¹‘¥É•¥½¹Y¥•¹Ñ¼¤°É•¥ÍÑÉ½Ì¹µ…À¡È€ôøÈ¹Ù¥•¹Ñ½¹A±…å„¤¤ì4(€½¹ÍĞ‘¥É•¥½¹Y¥•¹Ñ¼€ô9Õµ‰•È¹¥Í¥¹¥Ñ”¡‘¥É•¥½¹Y¥•¹Ñ½É…‘½Ì¤€üÉ…‘½Í¥É•¥½¸¡‘¥É•¥½¹Y¥•¹Ñ½É…‘½Ì¤€è€ˆ´ˆì4(€½¹ÍĞÑ•µÁ•É…ÑÕÉ…5…á¥µ„€ô5…Ñ ¹µ…à ¸¸¹É•¥ÍÑÉ½Ì¹µ…À¡É•¥ÍÑÉ¼€ôøÉ•¥ÍÑÉ¼¹Ñ•µÁ•É…ÑÕÉ„¤¹™¥±Ñ•È¡9Õµ‰•È¹¥Í¥¹¥Ñ”¤¤ì4(€½¹ÍĞ¥•±¼€ô½‰Ñ•¹•É¥•±¼¡¹Õ‰½Í¥‘…°ÁÉ•‘½µ¥¹¥½9Õ‰•Í±Ñ…Ì¤ì4(€½¹ÍĞ…Õ„€ô½‰Ñ•¹•ÉQ•µÁ•É…ÑÕÉ…Õ„¡‘…Ñ½Í5…É¥¹”°™•¡…=‰©•Ñ¥Ù¼°¡½É…%¹¥¥¼°¡½É…¥¸¤ì4(€½¹ÍĞ½±•…©”€ô…±Õ±…É=±•…©•™•Ñ¥Ù¼¡Á±…å„°‘…Ñ½Í5…É¥¹”°™•¡…=‰©•Ñ¥Ù¼°¡½É…%¹¥¥¼°¡½É…¥¸¤ì4(€½¹ÍĞ•ÍÑ…‘½=±•…©”€ô½‰Ñ•¹•ÉÍÑ…‘½=±•…©”¡½±•…©”¤ì4(€½¹ÍĞÁÕ¹ÑÕ…¥½¸€ô…±Õ±…ÉAÕ¹ÑÕ…¥½¸¡Ñ•µÁ•É…ÑÕÉ…5•‘¥…A±…å„°Ù¥•¹Ñ¼°Ù¥•¹Ñ½5…á¥µ¼°±±ÕÙ¥„°¹Õ‰½Í¥‘…°…Õ„°½±•…©”°Á±…å„¹…¹Õ±½ÁÉ½á¥µ…‘¼°‘¥É•¥½¹Y¥•¹Ñ½É…‘½Ì¤ì4(€½¹ÍĞ•ÍÑ…‘¼€ô½‰Ñ•¹•ÉÍÑ…‘¼¡ÁÕ¹ÑÕ…¥½¸°¹Õ‰½Í¥‘…°Á±…å„¹…¹Õ±½ÁÉ½á¥µ…‘¼°‘¥É•¥½¹Y¥•¹Ñ½É…‘½Ì°Ù¥•¹Ñ¼°Ù¥•¹Ñ½5…á¥µ¼°±±ÕÙ¥„°Ñ•µÁ•É…ÑÕÉ…5•‘¥…A±…å„°…Õ„°½±•…©”¤ì4(€½¹ÍĞ•áÁ±¥…¥½¸€ô•¹•É…ÉáÁ±¥…¥½¸¡Ñ•µÁ•É…ÑÕÉ…5•‘¥…A±…å„°Ù¥•¹Ñ¼°Ù¥•¹Ñ½5…á¥µ¼°‘¥É•¥½¹Y¥•¹Ñ½É…‘½Ì°±±ÕÙ¥„°…Õ„°Á±…å„¹…¹Õ±½ÁÉ½á¥µ…‘¼°¹Õ‰½Í¥‘…°ÁÉ•‘½µ¥¹¥½9Õ‰•Í±Ñ…Ì¤ì4(€É•ÑÕÉ¸ì¹½µ‰É”èÁ±…å„¹¹½µ‰É”°±…ĞèÁ±…å„¹±…Ğ°±½¸èÁ±…å„¹±½¸°‘¥ÍÑ…¹¥„è¹Õ±°°Ñ•µÁ•É…ÑÕÉ…5…á¥µ„°Ñ•µÁ•É…ÑÕÉ…5•‘¥…A±…å„°Ù¥•¹Ñ¼°Ù¥•¹Ñ½5…á¥µ¼°Ù¥•¹Ñ½5½‘•±¼°Ù¥•¹Ñ½5…á¥µ½5½‘•±¼°‘¥É•¥½¹Y¥•¹Ñ¼°‘¥É•¥½¹Y¥•¹Ñ½É…‘½Ì°±±ÕÙ¥„°±±ÕÙ¥…AÉ½µ•‘¥¼°±±ÕÙ¥…5…á¥µ„°¥•±¼°…Õ„°•ÍÑ…‘½=±•…©”°½±•…©”°ÁÕ¹ÑÕ…¥½¸°•ÍÑ…‘¼°¹Õ‰½Í¥‘…°ÁÉ½Á½É¥½¹!½É…ÍM½±•…‘…Ì°ÁÉ•‘½µ¥¹¥½9Õ‰•Í±Ñ…Ì°•áÁ±¥…¥½¸ôì4)ô4(4)…Íå¹Œ™Õ¹Ñ¥½¸…É…ÉI…¹­¥¹%¹Ñ•É¹¼ ¤ì4(4(€±•ĞÉ•ÍÕ±Ñ…‘½Ìì4(4(4(€½¹ÍĞ±…Ù•…¡”€ô€‘í‘¥…M•±•¥½¹…‘½ô´‘í¡½É…%¹¥¥½M•±•¥½¹…‘…ô´‘í¡½É…¥¹M•±•¥½¹…‘…õ€ì4(€¥˜€ …‘…Ñ½ÍA±…å…Í…¡•m±…Ù•…¡•t¤ì4(€€€‘…Ñ½ÍA±…å…Í…¡•m±…Ù•…¡•t€ô…İ…¥Ğ½‰Ñ•¹•É…Ñ½ÍA±…å…Ì¡‘¥…M•±•¥½¹…‘¼°¡½É…%¹¥¥½M•±•¥½¹…‘„°¡½É…¥¹M•±•¥½¹…‘„¤ì4(€ô4(€É•ÍÕ±Ñ…‘½Ì€ôl¸¸¹‘…Ñ½ÍA±…å…Í…¡•m±…Ù•…¡•utì4(4(4(€€¼¼…±Õ±…ÈÑ½‘…Ì±…ÌÉÕÑ…Ì•¸±½Ñ•ÌäÉ•ÕÑ¥±¥é…È±…Ìå„½¹ÍÕ±Ñ…‘…Ì¸4(€¥˜¡Õ‰¥…¥½¹UÍÕ…É¥¼¥ì4(€€€½¹ÍĞ‘¥ÍÑ…¹¥…Ì€ô…İ…¥Ğ…±Õ±…É¥ÍÑ…¹¥…Í½¡”¡Õ‰¥…¥½¹UÍÕ…É¥¼°É•ÍÕ±Ñ…‘½Ì¤ì4(€€€É•ÍÕ±Ñ…‘½Ì¹™½É…  ¡Á±…å„°¥¹‘¥”¤€ôøì4(€€€€€Á±…å„¹‘¥ÍÑ…¹¥„€ô‘¥ÍÑ…¹¥…Ím¥¹‘¥•tì4(€€€ô¤ì4(€ô4(4(€¥˜€ 4(€€€‘¥ÍÑ…¹¥…5…á¥µ„€„ôô¹Õ±°€˜˜4(€€€Õ‰¥…¥½¹UÍÕ…É¥¼€„ôô¹Õ±°4(¤ì4(4(€€€É•ÍÕ±Ñ…‘½Ì€ôÉ•ÍÕ±Ñ…‘½Ì¹™¥±Ñ•È 4(€€€€€€€Á±…å„€ôø4(€€€€€€€€€€€Á±…å„¹‘¥ÍÑ…¹¥„€„ôô¹Õ±°€˜˜4(€€€€€€€€€€€Á±…å„¹‘¥ÍÑ…¹¥„€ğô‘¥ÍÑ…¹¥…5…á¥µ„4(€€€€¤ì4(4)ô4(€€4(€½É‘•¹…ÉI•ÍÕ±Ñ…‘½Ì¡É•ÍÕ±Ñ…‘½Ì¤ì4(4(€½¹ÍĞÑ…‰±„€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰É…¹­¥¹œˆ¤ì4(€Ñ…‰±„¹¥¹¹•É!Q50€ô€ˆˆì4(€½¹ÍĞÉ…¹­¥¹5½‰¥±”€ô4(€‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰É…¹­¥¹œµµ½‰¥±”ˆ¤ì4(4)É…¹­¥¹5½‰¥±”¹¥¹¹•É!Q50ôˆˆì4(€€4(€É•ÍÕ±Ñ…‘½Ì¹™½É…  ¡Á±…å„°¥¹‘•à¤€ôøì4(4)Ñ…‰±„¹¥¹¹•É!Q50€¬ô€4(€€ñÑÈø4(€€€€ñÑø‘í¥¹‘•à€¬€Åôğ½Ñø4(€€€€ñÑø‘íÁ±…å„¹¹½µ‰É•ôğ½Ñø4(€€€€ñÑø4(€€€€‘ì4(€€€Á±…å„¹‘¥ÍÑ…¹¥„€„ôô¹Õ±°4(€€€€ü4(€€€Á±…å„¹‘¥ÍÑ…¹¥„¹Ñ½¥á• Ä¤€¬€ˆ­´ˆ4(€€€€è4(€€€€ˆ´ˆ4(€€€ô4(€€€€ğ½Ñø4(€€€€ñÑø‘íÁ±…å„¹¥•±½ôğ½Ñø4(€€€€ñÑ±…ÍÌô‰‘•Ñ…±±”€‘í‘•Ñ…±±•ÍY¥Í¥‰±•Ì€ü€œœ€è€½Õ±Ñ¼ôˆø4(€€€€‘íÁ±…å„¹Ñ•µÁ•É…ÑÕÉ…5…á¥µ…÷
Á4(€€€€ğ½Ñø4(€€€€ñÑø‘íÁ±…å„¹Ñ•µÁ•É…ÑÕÉ…5•‘¥…A±…å„¹Ñ½¥á• Ä¥÷
Áğ½Ñø4(€€€€ñÑ±…ÍÌô‰‘•Ñ…±±”€‘í‘•Ñ…±±•ÍY¥Í¥‰±•Ì€ü€œœ€è€½Õ±Ñ¼ôˆø‘íÁ±…å„¹Ù¥•¹Ñ½ô­´½ •ÍÑ¥µ…‘½Ì•¸Á±…å„€ ‘íÁ±…å„¹‘¥É•¥½¹Y¥•¹Ñ½ô¤ƒ
Ü·…à¸€‘íÁ±…å„¹Ù¥•¹Ñ½5…á¥µ½ô­´½ ğ½Ñø4(€€€€ñÑ±…ÍÌô‰‘•Ñ…±±”€‘í‘•Ñ…±±•ÍY¥Í¥‰±•Ì€ü€œœ€è€½Õ±Ñ¼ôˆùI¥•Í¼€‘íÁ±…å„¹±±ÕÙ¥…ô”ƒ
Ü·…á¥µ¼€‘íÁ±…å„¹±±ÕÙ¥…5…á¥µ…ô”ƒ
ÜÁÉ½µ•‘¥¼€‘íÁ±…å„¹±±ÕÙ¥…AÉ½µ•‘¥½ô”ğ½Ñø4(€€€€ñÑ±…ÍÌô‰‘•Ñ…±±”€‘í‘•Ñ…±±•ÍY¥Í¥‰±•Ì€ü€œœ€è€½Õ±Ñ¼ôˆø‘íÁ±…å„¹…Õ„€üÁ±…å„¹…Õ„¹Ñ½¥á• Ä¤€¬€‹
Áˆ€è€ˆ´‰ôğ½Ñø4(€€€€ñÑ±…ÍÌô‰‘•Ñ…±±”€‘í‘•Ñ…±±•ÍY¥Í¥‰±•Ì€ü€œœ€è€½Õ±Ñ¼ôˆø‘íÁ±…å„¹•ÍÑ…‘½=±•…©•ôğ½Ñø4(€€€€ñÑ±…ÍÌô‰½°µ•ÍÑ…‘¼ˆø‘íÁ±…å„¹•ÍÑ…‘½ôğ½Ñø4(€€€ñÑ±…ÍÌô‰‘•Ñ…±±”€‘í‘•Ñ…±±•ÍY¥Í¥‰±•Ì€ü€œœ€è€½Õ±Ñ¼ôˆø‘íÁ±…å„¹ÁÕ¹ÑÕ…¥½¹ôğ½Ñø4(€€€€ñÑ±…ÍÌô‰½°µ•áÁ±¥…¥½¸ˆø‘íÁ±…å„¹•áÁ±¥…¥½¹ôğ½Ñø4(€€€ğ½ÑÈø4)€ì4(€€€½¹ÍĞ±…Í•Y…±½É…¥½¸€ôÁ±…å„¹ÁÕ¹ÑÕ…¥½¸€øô€ÜÀ4(€€€€€€ü€‰Ù…±½É…¥½¸µ‰Õ•¹„ˆ4(€€€€€€èÁ±…å„¹ÁÕ¹ÑÕ…¥½¸€øô€ÔÀ4(€€€€€€€€ü€‰Ù…±½É…¥½¸µ…•ÁÑ…‰±”ˆ4(€€€€€€€€èÁ±…å„¹ÁÕ¹ÑÕ…¥½¸€øô€ÌÔ4(€€€€€€€€€€ü€‰Ù…±½É…¥½¸µÉ•Õ±…Èˆ4(€€€€€€€€€€è€‰Ù…±½É…¥½¸µ•Ù¥Ñ…Èˆì4(4(€€€É…¹­¥¹5½‰¥±”¹¥¹¹•É!Q50€¬ô€4(4(ñ…ÉÑ¥±”±…ÍÌô‰Ñ…É©•Ñ„µÁ±…å„€‘í±…Í•Y…±½É…¥½¹ôˆø4(€€ñ‘¥Ø±…ÍÌô‰Ñ…É©•Ñ„µ…‰••É„ˆø4(€€€€ñ‘¥Ø±…ÍÌô‰Ñ…É©•Ñ„µ¥‘•¹Ñ¥‘…ˆø4(€€€€€€ñÍÁ…¸±…ÍÌô‰Á½Í¥¥½¸µÉ…¹­¥¹œˆ…É¥„µ±…‰•°ô‰A½Í¥§Í¸€‘í¥¹‘•à€¬€Åôˆø‘í¥¹‘•à€¬€Åôğ½ÍÁ…¸ø4(€€€€€€ñ‘¥Øø4(€€€€€€€€ñ Èø‘íÁ±…å„¹¹½µ‰É•ôğ½ Èø4(€€€€€€€€ñ‘¥Ø±…ÍÌô‰•ÍÑ…‘¼ˆø‘íÁ±…å„¹•ÍÑ…‘½ôğ½‘¥Øø4(€€€€€€ğ½‘¥Øø4(€€€€ğ½‘¥Øø4(€€€€ñ‘¥Ø±…ÍÌô‰ÁÕ¹ÑÕ…¥½¸ˆ…É¥„µ±…‰•°ô‰AÕ¹ÑÕ…§Í¸€‘íÁ±…å„¹ÁÕ¹ÑÕ…¥½¹ôÍ½‰É”€ÄÀÀˆø4(€€€€€€ñÍÁ…¸ùAÕ¹Ñ…©”‘•°“µ„ğ½ÍÁ…¸ø4(€€€€€€ñÍÑÉ½¹œø‘íÁ±…å„¹ÁÕ¹ÑÕ…¥½¹ôñÍµ…±°ø¼ÄÀÀğ½Íµ…±°øğ½ÍÑÉ½¹œø4(€€€€ğ½‘¥Øø4(€€ğ½‘¥Øø4(4(€€ñ‘¥Ø±…ÍÌô‰É•ÍÕµ•¸µ½¹‘¥¥½¹•Ìˆø4(€€€€ñÍÁ…¸ûÂ~2‡¾â<€‘íÁ±…å„¹Ñ•µÁ•É…ÑÕÉ…5•‘¥…A±…å„¹Ñ½¥á• Ä¥÷
Áğ½ÍÁ…¸ø4(€€€€ñÍÁ…¸ûÂ~J €‘íÁ±…å„¹Ù¥•¹Ñ½ô­´½ ğ½ÍÁ…¸ø4(€€€€ñÍÁ…¸ûÂ~2Ÿ¾â<€‘íÁ±…å„¹±±ÕÙ¥…ô”ğ½ÍÁ…¸ø4(€€ğ½‘¥Øø4(4(€€ñ‘¥Ø±…ÍÌô‰Ñ…É©•Ñ„µ½¹Ñ•áÑ¼ˆø4(€€€€ñÍÁ…¸ø‘íÁ±…å„¹¥•±½ôğ½ÍÁ…¸ø4(€€€€ñÍÁ…¸ûÂ~N4€‘ì4(€€€€€Á±…å„¹‘¥ÍÑ…¹¥„€„ôô¹Õ±°4(€€€€€€€€üÁ±…å„¹‘¥ÍÑ…¹¥„¹Ñ½¥á• Ä¤€¬€ˆ­´ˆ4(€€€€€€€€è€‰M¥¸Õ‰¥…§Í¸ˆ4(€€€ôğ½ÍÁ…¸ø4(€€ğ½‘¥Øø4(4(€€ñÀ±…ÍÌô‰•áÁ±¥…¥½¸ˆø‘íÁ±…å„¹•áÁ±¥…¥½¹ôğ½Àø4(€€ñ‰ÕÑÑ½¸±…ÍÌô‰‰Ñ¸µ‘•Ñ…±±•ÌˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ…É¥„µ•áÁ…¹‘•ô‰™…±Í”ˆø4(€€€Y•È‘•Ñ…±±•ÌƒŠZğ4(€€ğ½‰ÕÑÑ½¸ø4(4(€€ñ‘¥Ø±…ÍÌô‰‘•Ñ…±±•Ìµµ½‰¥±”½Õ±Ñ¼ˆø4(ñÀûÂ~2‡¾â<Q•µÁ•É…ÑÕÉ„·…á¥µ„è4(‘íÁ±…å„¹Ñ•µÁ•É…ÑÕÉ…5…á¥µ…÷
Á4(ğ½Àø4(ñÀûÂ~2‡¾â?Â~JœÕ„è4(‘ì4)Á±…å„¹…Õ„4(ü4)Á±…å„¹…Õ„¹Ñ½¥á• Ä¤¬‹
Áˆ4(è4(ˆ´ˆ4)ô4(ğ½Àø4(4(ñÀûÂ~J €‘íÁ±…å„¹Ù¥•¹Ñ½ô­´½ •ÍÑ¥µ…‘½Ì•¸Á±…å„€ ‘íÁ±…å„¹‘¥É•¥½¹Y¥•¹Ñ½ô¤ƒ
Ü·…à¸€‘íÁ±…å„¹Ù¥•¹Ñ½5…á¥µ½ô­´½ ğ½Àø4(4(ñÀûÂ~2Ÿ¾â<I¥•Í¼•ÍÑ¥µ…‘¼è€‘íÁ±…å„¹±±ÕÙ¥…ô”ƒ
Ü·…á¥µ¼¡½É…É¥¼è€‘íÁ±…å„¹±±ÕÙ¥…5…á¥µ…ô”ƒ
ÜÁÉ½µ•‘¥¼è€‘íÁ±…å„¹±±ÕÙ¥…AÉ½µ•‘¥½ô”ğ½Àø4(4(ñÀø‘íÁ±…å„¹•ÍÑ…‘½=±•…©•ôğ½Àø4(4(ğ½‘¥Øø4(4(ğ½…ÉÑ¥±”ø4(4)€ì4(€ô¤ì4)…ÑÕ…±¥é…ÉY¥Í¥‰¥±¥‘…‘•Ñ…±±•Ì ¤ì4(4)‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ˆ¹‰Ñ¸µ‘•Ñ…±±•Ìˆ¤¹™½É… ¡‰½Ñ½¸€ôøì4(4(€‰½Ñ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°€ ¤€ôøì4(4(€€€½¹ÍĞ‘•Ñ…±±•Ì€ô‰½Ñ½¸¹¹•áÑ±•µ•¹ÑM¥‰±¥¹œì4(4(€€€‘•Ñ…±±•Ì¹±…ÍÍ1¥ÍĞ¹Ñ½±” ‰½Õ±Ñ¼ˆ¤ì4(4(€€€½¹ÍĞ•ÍÑ…=Õ±Ñ¼€ô‘•Ñ…±±•Ì¹±…ÍÍ1¥ÍĞ¹½¹Ñ…¥¹Ì ‰½Õ±Ñ¼ˆ¤ì4(€€€‰½Ñ½¸¹Ñ•áÑ½¹Ñ•¹Ğ€ô•ÍÑ…=Õ±Ñ¼4(€€€€€€ü€‰Y•È‘•Ñ…±±•ÌƒŠZğˆ4(€€€€€€è€‰=Õ±Ñ…È‘•Ñ…±±•ÌƒŠZÈˆì4(€€€‰½Ñ½¸¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µ•áÁ…¹‘•ˆ°MÑÉ¥¹œ …•ÍÑ…=Õ±Ñ¼¤¤ì4(4(€ô¤ì4(4)ô¤ì4(4)ô4(4)™Õ¹Ñ¥½¸…ÑÕ…±¥é…ÉM•±•Ñ½É¥„ ¤ì4(€½¹ÍĞ‰½Ñ½¹!½ä€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰‰Ñ¹!½äˆ¤ì4(€½¹ÍĞ‰½Ñ½¹5…¹…¹„€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰‰Ñ¹5…¹…¹„ˆ¤ì4(€‰½Ñ½¹!½ä¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µÁÉ•ÍÍ•ˆ°MÑÉ¥¹œ¡‘¥…M•±•¥½¹…‘¼€ôôô€À¤¤ì4(€‰½Ñ½¹5…¹…¹„¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µÁÉ•ÍÍ•ˆ°MÑÉ¥¹œ¡‘¥…M•±•¥½¹…‘¼€ôôô€Ä¤¤ì4(€‰½Ñ½¹!½ä¹±…ÍÍ1¥ÍĞ¹Ñ½±” ‰…Ñ¥Ù¼ˆ°‘¥…M•±•¥½¹…‘¼€ôôô€À¤ì4(€‰½Ñ½¹5…¹…¹„¹±…ÍÍ1¥ÍĞ¹Ñ½±” ‰…Ñ¥Ù¼ˆ°‘¥…M•±•¥½¹…‘¼€ôôô€Ä¤ì4)ô4(4)…Íå¹Œ™Õ¹Ñ¥½¸…µ‰¥…É¥„¡‘¥„¤ì4(€¥˜€¡‘¥„€ôôô‘¥…M•±•¥½¹…‘¼¤É•ÑÕÉ¸ì4(€‘¥…M•±•¥½¹…‘¼€ô‘¥„ì4(€…ÑÕ…±¥é…ÉM•±•Ñ½É¥„ ¤ì4(€…İ…¥Ğ…É…ÉI…¹­¥¹œ ¤ì4)ô4(4)…Íå¹Œ™Õ¹Ñ¥½¸…µ‰¥…É!½É…É¥¼ ¤ì4(€½¹ÍĞ¥¹¥¥¼€ô9Õµ‰•È¡‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰¡½É…%¹¥¥¼ˆ¤¹Ù…±Õ”¤ì4(€½¹ÍĞ™¥¸€ô9Õµ‰•È¡‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰¡½É…¥¸ˆ¤¹Ù…±Õ”¤ì4(€½¹ÍĞÉ•ÍÕµ•¸€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰É•ÍÕµ•¹!½É…É¥¼ˆ¤ì4(€¥˜€¡¥¹¥¥¼€ø™¥¸¤ì4(€€€É•ÍÕµ•¸¹Ñ•áÑ½¹Ñ•¹Ğ€ô€‰1„¡½É„¥¹¥¥…°‘•‰”Í•È…¹Ñ•É¥½È„±„™¥¹…°¸ˆì4(€€€É•ÑÕÉ¸ì4(€ô4(€¡½É…%¹¥¥½M•±•¥½¹…‘„€ô¥¹¥¥¼ì4(€¡½É…¥¹M•±•¥½¹…‘„€ô™¥¸ì4(€É•ÍÕµ•¸¹Ñ•áÑ½¹Ñ•¹Ğ€ô¥¹¥¥¼€ôôô€Ü€˜˜™¥¸€ôôô€ÈÄ4(€€€€ü€‰Q½‘¼•°É…¹¼€ ÀÜèÀÃŠLÈÄèÀÀ¤ˆ4(€€€€è”€‘í¥¹¥¥½ôèÀÀ„€‘í™¥¹ôèÀÁ€ì4(€…İ…¥Ğ…É…ÉI…¹­¥¹œ ¤ì4)ô4(4)…Íå¹Œ™Õ¹Ñ¥½¸…É…ÉI…¹­¥¹œ ¤ì4(€½¹ÍĞÉ•™•É•¹¥…¥„€ô‘¥…M•±•¥½¹…‘¼€ôôô€À€ü€‰¡½äˆ€è€‰µ‡Å…¹„ˆì4(€½¹ÍĞÉ•™•É•¹¥…!½É…É¥¼€ô¡½É…%¹¥¥½M•±•¥½¹…‘„€ôôô€Ü€˜˜¡½É…¥¹M•±•¥½¹…‘„€ôôô€ÈÄ4(€€€€ü€ˆˆ4(€€€€è€‘”€‘í¡½É…%¹¥¥½M•±•¥½¹…‘…ôèÀÀ„€‘í¡½É…¥¹M•±•¥½¹…‘…ôèÀÁ€ì4(€µ½ÍÑÉ…ÉÍÑ…‘¼¡ÑÕ…±¥é…¹‘¼±…Ì½¹‘¥¥½¹•Ì‘”€‘íÉ•™•É•¹¥…¥…÷Š™€°€‰¥¹™¼ˆ¤ì4(€•ÍÑ…‰±••É½¹ÑÉ½±•Í	±½ÅÕ•…‘½Ì¡ÑÉÕ”¤ì4(€ÑÉäì4(€€€…İ…¥Ğ…É…ÉI…¹­¥¹%¹Ñ•É¹¼ ¤ì4(€€€½¹ÍĞÑ½Ñ…°€ô‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ˆÉ…¹­¥¹œÑÈˆ¤¹±•¹Ñ ì4(€€€µ½ÍÑÉ…ÉÍÑ…‘¼¡Ñ½Ñ…°€ôôô€À4(€€€€€€ü€‰9¼¡…äÁ±…å…ÌÅÕ”½¥¹¥‘…¸½¸±½Ì™¥±ÑÉ½ÌÍ•±•¥½¹…‘½Ì¸ˆ4(€€€€€€èI…¹­¥¹œ‘”€‘íÉ•™•É•¹¥…¥…ô‘íÉ•™•É•¹¥…!½É…É¥½ô…ÑÕ…±¥é…‘¼è€‘íÑ½Ñ…±ôÁ±…å…Ì‘¥ÍÁ½¹¥‰±•Ì¹€°€‰•á¥Ñ¼ˆ¤ì4(€ô…Ñ €¡•ÉÉ½È¤ì4(€€€½¹Í½±”¹•ÉÉ½È¡•ÉÉ½È¤ì4(€€€µ½ÍÑÉ…ÉÍÑ…‘¼ ‰9¼Í”ÁÕ‘¥•É½¸…É…ÈÑ½‘½Ì±½Ì‘…Ñ½Ì¸I•Ù¥Í„ÑÔ½¹•á§Í¸äÙÕ•±Ù”„¥¹Ñ•¹Ñ…É±¼¸ˆ°€‰•ÉÉ½Èˆ¤ì4(€ô™¥¹…±±äì4(€€€•ÍÑ…‰±••É½¹ÑÉ½±•Í	±½ÅÕ•…‘½Ì¡™…±Í”¤ì4(€ô4)ô4(4)İ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰=5½¹Ñ•¹Ñ1½…‘•ˆ°…Íå¹Œ€ ¤€ôøì4(€€€¥¹¥¥…±¥é…ÉY¥ÍÑ„ ¤ì4(€€€…ÑÕ…±¥é…ÉY¥ÍÑ„ ¤ì4(€€€…ÑÕ…±¥é…ÉM•±•Ñ½É¥„ ¤ì4(€€€½¹™¥ÕÉ…É…‰••É…Í=É‘•¹…‰±•Ì ¤ì4(€€€…İ…¥Ğ…É…ÉI…¹­¥¹œ ¤ì4)ô¤ì4