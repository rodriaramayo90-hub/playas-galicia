let ubicacionUsuario = null;
let distanciaMaxima = null;

let datosPlayasCache = null;
let detallesVisibles = false;
let modo = "dia";

function cambiarDistancia(valor){

  if(valor === ""){
    distanciaMaxima = null;
  }
  else{
    distanciaMaxima = Number(valor);
  }

  cargarRanking();

}
function toggleDetalles(){

  detallesVisibles = !detallesVisibles;

  actualizarVisibilidadDetalles();

}
function cambiarModo(nuevoModo){

    modo = nuevoModo;

    document
        .getElementById("btnDia")
        .classList
        .toggle("activo", modo==="dia");

    document
        .getElementById("btnArdora")
        .classList
        .toggle("activo", modo==="ardora");

    cargarRanking();

}
const playas = [
  {
    nombre: "Playa de la Magdalena",
    municipio: "Cabanas",
    lat: 43.426,
    lon: -8.165,
    orientacion: "N"
  },
  {
    nombre: "Playa de Miño",
    municipio: "Miño",
    lat: 43.348,
    lon: -8.207,
    orientacion: "N"
  },
  {
    nombre: "Playa de Perbes",
    municipio: "Miño",
    lat: 43.364,
    lon: -8.186,
    orientacion: "N"
  },
  {
    nombre: "Playa de Sada",
    municipio: "Sada",
    lat: 43.356,
    lon: -8.258,
    orientacion: "NE"
  },
  {
    nombre: "Playa de Mera",
    municipio: "Oleiros",
    lat: 43.367,
    lon: -8.380,
    orientacion: "NE"
  },
  {
    nombre: "Playa de Sabón",
    municipio: "Arteixo",
    lat: 43.307,
    lon: -8.511,
    orientacion: "NW"
  },
    {
    nombre: "Playa de Orzán",
    municipio: "A Coruña",
    lat: 43.370,
    lon: -8.406,
    orientacion: "NW"
  },
  {
    nombre: "Playa de las Lapas",
    municipio: "A Coruña",
    lat: 43.382,
    lon: -8.405,
    orientacion: "W"
  },
  {
    nombre: "Playa de Louro",
    municipio: "Muros",
    lat: 42.771,
    lon: -9.065,
    orientacion: "NW"
  },
  {
    nombre: "Playa de Carnota",
    municipio: "Carnota",
    lat: 42.826,
    lon: -9.087,
    orientacion: "NW"
  },
  {
    nombre: "Playa de San Xurxo",
    municipio: "Ferrol",
    lat: 43.548,
    lon: -8.319,
    orientacion: "NW"
  },
  {
    nombre: "Playa de Sonreiras",
    municipio: "Cedeira",
    lat: 43.661,
    lon: -8.057,
    orientacion: "NW"
  },
  {
    nombre: "Playa de las Dunas de Corrubedo",
    municipio: "Ribeira",
    lat: 42.565,
    lon: -9.069,
    orientacion: "NW"
  },
  {
    nombre: "Playa de Samil",
    municipio: "Vigo",
    lat: 42.207,
    lon: -8.786,
    orientacion: "SW"
  },
  {
    nombre: "Playa de Bao",
    municipio: "Vigo",
    lat: 42.200,
    lon: -8.790,
    orientacion: "SW"
  },
  {
    nombre: "Playa Niño do Corvo",
    municipio: "Moaña",
    lat: 42.278,
    lon: -8.742,
    orientacion: "S"
  },
  {
    nombre: "Playa do Con",
    municipio: "Moaña",
    lat: 42.285,
    lon: -8.729,
    orientacion: "S"
  },
  {
    nombre: "Praia Borna",
    municipio: "Moaña",
    lat: 42.290,
    lon: -8.704,
    orientacion: "S"
  },
  {
    nombre: "Praia Viño",
    municipio: "Cangas",
    lat: 42.257,
    lon: -8.849,
    orientacion: "S"
  },
  {
    nombre: "Playa de Limens",
    municipio: "Cangas",
    lat: 42.261,
    lon: -8.816,
    orientacion: "S"
  },
  {
    nombre: "Playa de Lapaman",
    municipio: "Marín",
    lat: 42.336,
    lon: -8.783,
    orientacion: "W"
  },
  {
    nombre: "Playa de Mogor",
    municipio: "Marín",
    lat: 42.393,
    lon: -8.722,
    orientacion: "W"
  },
  {
    nombre: "Playa de Portocelo",
    municipio: "Marín",
    lat: 42.400,
    lon: -8.713,
    orientacion: "W"
  },
  {
    nombre: "Playa de Rodas (Islas Cíes)",
    municipio: "Vigo",
    lat: 42.220,
    lon: -8.900,
    orientacion: "SW"
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
    `${lon1},${lat1};${lon2},${lat2}` +
    `?overview=false`;

  const respuesta = await fetch(url);
  const datos = await respuesta.json();

  if (
    !datos.routes ||
    datos.routes.length === 0
  ) {
    return null;
  }

  return datos.routes[0].distance / 1000;
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
    alert("Tu dispositivo no permite ubicación");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    posicion => {

      ubicacionUsuario = {
      lat: posicion.coords.latitude,
      lon: posicion.coords.longitude
      };


     // Forzamos recalcular distancias
    ubicacionUsuario = {
  lat: posicion.coords.latitude,
  lon: posicion.coords.longitude
};


cargarRanking();

    },
    error => {
      alert("No se pudo obtener tu ubicación");
    }
  );
}


async function buscarCodigoPostal(codigo) {

  const url =
  `https://nominatim.openstreetmap.org/search?format=json&postalcode=${codigo}&country=Spain`;

  const respuesta = await fetch(url);
  const datos = await respuesta.json();


  if(datos.length === 0){
    alert("Código postal no encontrado");
    return;
  }


  ubicacionUsuario = {
  lat: parseFloat(datos[0].lat),
  lon: parseFloat(datos[0].lon)
};


// Forzamos recalcular distancias
ubicacionUsuario = {
  lat: parseFloat(datos[0].lat),
  lon: parseFloat(datos[0].lon)
};


cargarRanking();

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
function puntosNubosidad(nubosidad) {

  if (nubosidad <= 10) return 25;   // despejado
  if (nubosidad <= 25) return 15;   // pocas nubes
  if (nubosidad <= 40) return 5;    // intervalos nubosos
  if (nubosidad <= 60) return -15;  // nuboso
  if (nubosidad <= 80) return -35;  // muy nuboso

  return -50;                       // cubierto
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

function obtenerNombreFaseLunar(fase){

    if(fase < 0.03)
        return "🌑 Luna nueva";

    if(fase < 0.22)
        return "🌒 Creciente";

    if(fase < 0.28)
        return "🌓 Cuarto creciente";

    if(fase < 0.47)
        return "🌔 Gibosa creciente";

    if(fase < 0.53)
        return "🌕 Luna llena";

    if(fase < 0.72)
        return "🌖 Gibosa menguante";

    if(fase < 0.78)
        return "🌗 Cuarto menguante";

    return "🌘 Menguante";
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

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(puntuacion)
    )
  );
}

function calcularPuntuacionArdora(
    nubosidad,
    lluvia,
    faseLunar
){

    let puntos = 100;

    // Nubes
    puntos -= nubosidad * 0.7;

    // Lluvia
    puntos -= lluvia * 0.5;

    // Luna

    puntos -= faseLunar * 40;

    return Math.max(
        0,
        Math.min(100, Math.round(puntos))
    );

}
function obtenerEstado(puntos, nubosidad) {

  // Mucha nube impide una valoración alta
  if (nubosidad > 80)
    return "🟡 Aceptable (muy nublado)";

  if (nubosidad > 60)
    return "🟡 Aceptable (nublado)";


  // Días realmente buenos
  if (puntos >= 85)
    return "🟢 Excelente";


  // Nuevo estado para días buenos pero con nubes
  if (puntos >= 70)
    return "🟢 Buen día de playa con algo de nubes";


  if (puntos >= 50)
    return "🟡 Aceptable";


  return "🔴 Mejor evitar";
}

function obtenerEstadoArdora(puntos){

    if(puntos>=85)
        return "🟢 Condiciones excelentes";

    if(puntos>=70)
        return "🟢 Muy buenas";

    if(puntos>=50)
        return "🟡 Posibles";

    return "🔴 Muy difíciles";
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

function generarExplicacionArdora(
    nubosidad,
    lluvia,
    fase
){

    let mensajes=[];

    if(nubosidad<20)
        mensajes.push("cielo muy despejado");
    else if(nubosidad<50)
        mensajes.push("algo de nubosidad");
    else
        mensajes.push("demasiadas nubes");

    if(lluvia<20)
        mensajes.push("escasa probabilidad de lluvia");
    else
        mensajes.push("riesgo de lluvia");

    mensajes.push(obtenerNombreFaseLunar(fase));

    return mensajes.join(", ") + ".";
}

async function obtenerDatosPlaya(playa) {

const url =
`https://api.open-meteo.com/v1/forecast?latitude=${playa.lat}&longitude=${playa.lon}&daily=temperature_2m_max,wind_direction_10m_dominant,moon_phase&hourly=temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover&forecast_days=1&timezone=Europe%2FMadrid`;
const marineUrl =
  `https://marine-api.open-meteo.com/v1/marine?latitude=${playa.lat}&longitude=${playa.lon}&hourly=sea_surface_temperature,wave_height&forecast_days=1`;
  const [respuesta, respuestaMarine] = await Promise.all([
  fetch(url),
  fetch(marineUrl)
]);

const [datos, datosMarine] = await Promise.all([
  respuesta.json(),
  respuestaMarine.json()
]);

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
  const faseLunar = datos.daily.moon_phase[0];
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

  const estado = obtenerEstado(
  puntuacion,
  nubosidad
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

async function cargarRanking() {

  let resultados;


  // Primera carga: obtener clima y datos del mar
  if(datosPlayasCache === null){

   resultados = await Promise.all(
  playas.map(playa =>
    obtenerDatosPlaya(playa)
  )
);

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

  if(distanciaMaxima !== null){

  const filtrados = resultados.filter(
    playa =>
      playa.distancia !== null &&
      playa.distancia <= distanciaMaxima
  );

  resultados.length = 0;

  resultados.push(...filtrados);

}
  
  resultados.sort(
    (a, b) => b.puntuacion - a.puntuacion
  );

  const tabla = document.getElementById("ranking");
  tabla.innerHTML = "";
  
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
  });
actualizarVisibilidadDetalles();
}

cargarRanking();
