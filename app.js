const playas = [
  {
    nombre: "Playa de la Magdalena",
    municipio: "Cabanas",
    lat: 43.426,
    lon: -8.165
  },
  {
    nombre: "Playa de Miño",
    municipio: "Miño",
    lat: 43.348,
    lon: -8.207
  },
  {
    nombre: "Playa de Perbes",
    municipio: "Miño",
    lat: 43.364,
    lon: -8.186
  },
  {
    nombre: "Playa de Sada",
    municipio: "Sada",
    lat: 43.356,
    lon: -8.258
  },
  {
    nombre: "Playa de Mera",
    municipio: "Oleiros",
    lat: 43.367,
    lon: -8.380
  },
  {
    nombre: "Playa de Sabón",
    municipio: "Arteixo",
    lat: 43.307,
    lon: -8.511
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

function calcularPuntuacion(temperatura, viento, lluvia) {
  let puntuacion = 50;

  puntuacion += puntosTemperatura(temperatura);
  puntuacion += puntosViento(viento);
  puntuacion += puntosLluvia(lluvia);

  // Limitar la puntuación entre 0 y 100
  puntuacion = Math.max(0, Math.min(100, puntuacion));

  return Math.round(puntuacion);
}
async function obtenerDatosPlaya(playa) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${playa.lat}&longitude=${playa.lon}&daily=temperature_2m_max,precipitation_probability_max,wind_speed_10m_max&forecast_days=1`;

  const respuesta = await fetch(url);
  const datos = await respuesta.json();

  const temperatura = datos.daily.temperature_2m_max[0];
  const lluvia = datos.daily.precipitation_probability_max[0];
  const viento = datos.daily.wind_speed_10m_max[0];

const puntuacion = calcularPuntuacion(
  temperatura,
  viento,
  lluvia
);

  return {
    nombre: playa.nombre,
    municipio: playa.municipio,
    temperatura,
    lluvia,
    viento,
    puntuacion: Math.round(puntuacion)
  };
}

async function cargarRanking() {
  const resultados = [];

  for (const playa of playas) {
    const datos = await obtenerDatosPlaya(playa);
    resultados.push(datos);
  }

  resultados.sort((a, b) => b.puntuacion - a.puntuacion);

  const tabla = document.getElementById("ranking");
  tabla.innerHTML = "";

  resultados.forEach((playa, index) => {
    tabla.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${playa.nombre}</td>
        <td>${playa.temperatura}°C</td>
        <td>${playa.viento} km/h</td>
        <td>${playa.lluvia}%</td>
        <td>${playa.puntuacion}</td>
      </tr>
    `;
  });
}

cargarRanking();
