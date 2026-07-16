let ubicacionUsuario = null;
let distanciaMaxima = null;

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
    nombre: "Playa de Rodas (Islas Cíes)",
    municipio: "Vigo",
    lat: 42.220,
    lon: -8.900,
    orientacion: "SW"
  }
];

function calcularDistancia(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return R * c;
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

      cargarRanking();

    },
    error => {
      alert("No se pudo obtener tu ubicación");
    }
  );
}


async function buscarCodigoPostal(codigo) {

  const url =
  `https://nominatim.openstreetmap.org/search?format=json&q=${codigo}, España`;

  const respuesta = await fetch(url);
  const datos = await respuesta.json();


  if(datos.length === 0){
    alert("No encontrado");
    return;
  }


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

async function obtenerDatosPlaya(playa) {

const url =
  `https://api.open-meteo.com/v1/forecast?latitude=${playa.lat}&longitude=${playa.lon}&daily=temperature_2m_max,wind_direction_10m_dominant&hourly=temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover&forecast_days=1&timezone=Europe%2FMadrid`;
const marineUrl =
  `https://marine-api.open-meteo.com/v1/marine?latitude=${playa.lat}&longitude=${playa.lon}&hourly=sea_surface_temperature,wave_height&forecast_days=1`;
  const respuesta = await fetch(url);
  const datos = await respuesta.json();
  const respuestaMarine = await fetch(marineUrl);
const datosMarine = await respuestaMarine.json();

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

if(ubicacionUsuario){

  distancia = calcularDistancia(
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

  const resultados = [];

  for (const playa of playas) {
    resultados.push(
      await obtenerDatosPlaya(playa)
    );
  }

  if(distanciaMaxima){

  resultados.splice(
    0,
    resultados.length,
    ...resultados.filter(
      playa => playa.distancia <= distanciaMaxima
    )
  );

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
    playa.distancia
    ?
    playa.distancia.toFixed(1)+" km"
    :
    "-"
    }
    </td>
    <td>${playa.cielo}</td>
    <td>${playa.temperaturaMaxima}°C</td>
    <td>${playa.temperaturaMediaPlaya.toFixed(1)}°C</td>
    <td>${playa.viento} km/h (${playa.direccionViento})</td>
    <td>${playa.lluvia}%</td>
    <td>${playa.agua ? playa.agua.toFixed(1) + "°C" : "-"}</td>
    <td>${playa.estadoOleaje}</td>
    <td>${playa.estado}</td>
    <td>${playa.puntuacion}</td>
    <td>${playa.explicacion}</td>
   </tr>
`;
  });

}

cargarRanking();
