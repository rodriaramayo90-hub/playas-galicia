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

async function obtenerDatosPlaya(playa) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${playa.lat}&longitude=${playa.lon}&daily=temperature_2m_max,precipitation_probability_max,wind_speed_10m_max&forecast_days=1`;

  const respuesta = await fetch(url);
  const datos = await respuesta.json();

  const temperatura = datos.daily.temperature_2m_max[0];
  const lluvia = datos.daily.precipitation_probability_max[0];
  const viento = datos.daily.wind_speed_10m_max[0];

  let puntuacion = 100;

  puntuacion += temperatura;
  puntuacion -= lluvia;
  puntuacion -= viento;

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
