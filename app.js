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
  }
];

function puntosTemperatura(temp) {
  if (temp < 18) return -30;
  if (temp < 22) return -10;
  if (temp < 25) return 10;
  if (temp <= 28) return 25;
  return 20;
}

function puntosViento(viento) {
  if (viento <= 10) return 25;
  if (viento <= 20) return 10;
  if (viento <= 30) return -10;
  return -30;
}

function puntosLluvia(lluvia) {
  if (lluvia <= 10) return 20;
  if (lluvia <= 30) return 10;
  if (lluvia <= 50) return -10;
  return -40;
}

function puntosAgua(agua) {
  if (!agua) return 0;
  if (agua < 16) return -15;
  if (agua < 18) return -5;
  if (agua < 20) return 5;
  return 10;
}
function puntosOleaje(oleaje) {

  if (oleaje === null) return 0;

  if (oleaje < 0.5) return 15;
  if (oleaje < 1) return 10;
  if (oleaje < 1.5) return 0;
  if (oleaje < 2) return -10;

  return -25;
}
function gradosADireccion(grados) {
  const direcciones = ["N","NE","E","SE","S","SW","W","NW"];
  return direcciones[Math.round(grados / 45) % 8];
}

function puntosOrientacion(orientacion, direccionViento) {

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

  // viento entrando directamente a la playa
  if (orientacion === direccionViento) {
    return -20;
  }

  // viento desde tierra hacia mar
  if (opuestas[orientacion] === direccionViento) {
    return 10;
  }

  return 0;
}

function calcularPuntuacion(
  temperatura,
  viento,
  lluvia,
  agua,
  oleaje,
  orientacion,
  direccionViento
) {
  let puntuacion = 50;

  puntuacion += puntosTemperatura(temperatura);
  puntuacion += puntosViento(viento);
  puntuacion += puntosLluvia(lluvia);
  puntuacion += puntosOleaje(oleaje);
  puntuacion += puntosAgua(agua);
  puntuacion += puntosOrientacion(
    orientacion,
    direccionViento
  );

  return Math.max(0, Math.min(100, Math.round(puntuacion)));
}

function obtenerEstado(puntos) {
  if (puntos >= 85) return "🟢 Excelente";
  if (puntos >= 70) return "🟢 Muy buena";
  if (puntos >= 50) return "🟡 Aceptable";
  return "🔴 Mejor evitar";
}

function generarExplicacion(
  temperatura,
  viento,
  direccionViento,
  lluvia,
  agua,
  orientacion
) {

  let mensajes = [];

  if (temperatura >= 25)
    mensajes.push("temperatura ideal");

  if (viento <= 15)
    mensajes.push("poco viento");

  if (lluvia <= 10)
    mensajes.push("muy poca probabilidad de lluvia");

  if (agua >= 19)
    mensajes.push("agua agradable");

  if (orientacion === direccionViento)
    mensajes.push("el viento entra directamente en la playa");

  return mensajes.join(", ") + ".";
}

async function obtenerDatosPlaya(playa) {

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${playa.lat}&longitude=${playa.lon}&daily=temperature_2m_max,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&hourly=sea_surface_temperature&forecast_days=1`;
const marineUrl =
  `https://marine-api.open-meteo.com/v1/marine?latitude=${playa.lat}&longitude=${playa.lon}&hourly=sea_surface_temperature,wave_height&forecast_days=1`;
  const respuesta = await fetch(url);
  const datos = await respuesta.json();
  const respuestaMarine = await fetch(marineUrl);
const datosMarine = await respuestaMarine.json();

  const temperatura = datos.daily.temperature_2m_max[0];
  const lluvia = datos.daily.precipitation_probability_max[0];
  const viento = datos.daily.wind_speed_10m_max[0];
  const direccionVientoGrados =
    datos.daily.wind_direction_10m_dominant[0];

  const direccionViento =
    gradosADireccion(direccionVientoGrados);

const agua =
  datosMarine.hourly?.sea_surface_temperature?.[12] ?? null;

const oleaje =
  datosMarine.hourly?.wave_height?.[12] ?? null;

const puntuacion = calcularPuntuacion(
  temperatura,
  viento,
  lluvia,
  agua,
  oleaje,
  playa.orientacion,
  direccionViento
);

  const estado = obtenerEstado(puntuacion);

  const explicacion = generarExplicacion(
    temperatura,
    viento,
    direccionViento,
    lluvia,
    agua,
    playa.orientacion
  );

  return {
    nombre: playa.nombre,
    temperatura,
    viento,
    direccionViento,
    lluvia,
    agua,
    oleaje,
    puntuacion,
    estado,
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
        <td>${playa.temperatura}°C</td>
        <td>${playa.viento} km/h (${playa.direccionViento})</td>
        <td>${playa.lluvia}%</td>
        <td>${playa.agua ?? "-"}</td>
        <td>${playa.estado}</td>
        <td>${playa.puntuacion}</td>
        <td>${playa.explicacion}</td>
      </tr>
    `;
  });

}

cargarRanking();
