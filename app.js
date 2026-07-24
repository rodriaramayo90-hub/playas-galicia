let ubicacionUsuario = null;
let distanciaMaxima = null;

let datosPlayasCache = null;
let detallesVisibles = false;
let modo = "dia";

function cambiarDistancia(valor) {
  if (valor === "") {
    distanciaMaxima = null;
  } else {
    distanciaMaxima = Number(valor);
  }
  cargarRanking();
}

function toggleDetalles() {
  detallesVisibles = !detallesVisibles;
  actualizarVisibilidadDetalles();
}

function cambiarModo(nuevoModo) {
  modo = nuevoModo;

  const btnDia = document.getElementById("btnDia");
  const btnArdora = document.getElementById("btnArdora");

  if (btnDia) btnDia.classList.toggle("activo", modo === "dia");
  if (btnArdora) btnArdora.classList.toggle("activo", modo === "ardora");

  cargarRanking();
}

const playas = [
  { nombre: "Playa de la Magdalena", municipio: "Cabanas", lat: 43.426, lon: -8.165, orientacion: "N" },
  { nombre: "Playa de Miño", municipio: "Miño", lat: 43.348, lon: -8.207, orientacion: "N" },
  { nombre: "Playa de Perbes", municipio: "Miño", lat: 43.364, lon: -8.186, orientacion: "N" },
  { nombre: "Playa de Sada", municipio: "Sada", lat: 43.356, lon: -8.258, orientacion: "NE" },
  { nombre: "Playa de Mera", municipio: "Oleiros", lat: 43.367, lon: -8.380, orientacion: "NE" },
  { nombre: "Playa de Sabón", municipio: "Arteixo", lat: 43.307, lon: -8.511, orientacion: "NW" },
  { nombre: "Playa de Orzán", municipio: "A Coruña", lat: 43.370, lon: -8.406, orientacion: "NW" },
  { nombre: "Playa de las Lapas", municipio: "A Coruña", lat: 43.382, lon: -8.405, orientacion: "W" },
  { nombre: "Playa de Louro", municipio: "Muros", lat: 42.771, lon: -9.065, orientacion: "NW" },
  { nombre: "Playa de Carnota", municipio: "Carnota", lat: 42.826, lon: -9.087, orientacion: "NW" },
  { nombre: "Playa de San Xurxo", municipio: "Ferrol", lat: 43.548, lon: -8.319, orientacion: "NW" },
  { nombre: "Playa de Sonreiras", municipio: "Cedeira", lat: 43.661, lon: -8.057, orientacion: "NW" },
  { nombre: "Playa de las Dunas de Corrubedo", municipio: "Ribeira", lat: 42.565, lon: -9.069, orientacion: "NW" },
  { nombre: "Playa de Samil", municipio: "Vigo", lat: 42.207, lon: -8.786, orientacion: "SW" },
  { nombre: "Playa de Bao", municipio: "Vigo", lat: 42.200, lon: -8.790, orientacion: "SW" },
  { nombre: "Playa Niño do Corvo", municipio: "Moaña", lat: 42.278, lon: -8.742, orientacion: "S" },
  { nombre: "Playa do Con", municipio: "Moaña", lat: 42.285, lon: -8.729, orientacion: "S" },
  { nombre: "Praia Borna", municipio: "Moaña", lat: 42.290, lon: -8.704, orientacion: "S" },
  { nombre: "Praia Viño", municipio: "Cangas", lat: 42.257, lon: -8.849, orientacion: "S" },
  { nombre: "Playa de Limens", municipio: "Cangas", lat: 42.261, lon: -8.816, orientacion: "S" },
  { nombre: "Playa de Lapaman", municipio: "Marín", lat: 42.336, lon: -8.783, orientacion: "W" },
  { nombre: "Playa de Mogor", municipio: "Marín", lat: 42.393, lon: -8.722, orientacion: "W" },
  { nombre: "Playa de Portocelo", municipio: "Marín", lat: 42.400, lon: -8.713, orientacion: "W" },
  { nombre: "Playa de Rodas (Islas Cíes)", municipio: "Vigo", lat: 42.220, lon: -8.900, orientacion: "SW" }
];

async function calcularDistanciaCoche(lat1, lon1, lat2, lon2) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon2},${lat2};${lon1},${lat1}?overview=false`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) return null;
    const datos = await respuesta.json();

    if (!datos.routes || datos.routes.length === 0) return null;
    return datos.routes[0].distance / 1000;
  } catch (e) {
    return null;
  }
}

function actualizarVisibilidadDetalles() {
  document.querySelectorAll(".detalle").forEach(elemento => {
    if (detallesVisibles) {
      elemento.classList.remove("oculto");
    } else {
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
      cargarRanking();
    },
    error => {
      alert("No se pudo obtener tu ubicación");
    }
  );
}

async function buscarCodigoPostal(codigo) {
  if (!codigo) return;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${codigo}&country=Spain`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (!datos || datos.length === 0) {
      alert("Código postal no encontrado");
      return;
    }

    ubicacionUsuario = {
      lat: parseFloat(datos[0].lat),
      lon: parseFloat(datos[0].lon)
    };

    cargarRanking();
  } catch (e) {
    alert("Error al buscar el código postal");
  }
}

function puntosTemperatura(temp) {
  if (temp < 16) return -20;
  if (temp < 18) return -12;
  if (temp < 20) return -4;
  if (temp < 22) return 4;
  if (temp < 24) return 12;
  return 20;
}

function puntosViento(viento) {
  if (viento <= 10) return 8;
  if (viento <= 20) return 4;
  if (viento <= 30) return -4;
  return -8;
}

function puntosLluvia(lluvia) {
  if (lluvia <= 5) return 25;
  if (lluvia <= 15) return 20;
  if (lluvia <= 30) return 10;
  return -25;
}

function puntosAgua(agua) {
  if (agua === null || agua === undefined) return 0;
  if (agua < 16) return -7;
  if (agua < 18) return -3;
  return 7;
}

function puntosNubosidad(nubosidad) {
  if (nubosidad <= 25) return 15;
  if (nubosidad <= 60) return -15;
  return -50;
}

function puntosOleaje(oleaje) {
  if (oleaje === null || oleaje === undefined) return 0;
  if (oleaje < 1) return 2;
  if (oleaje < 2) return -2;
  return -3;
}

function obtenerEstadoOleaje(oleaje) {
  if (oleaje === null || oleaje === undefined) return "-";
  if (oleaje < 0.5) return "🌊 Mar calmo";
  if (oleaje < 1) return "🌊 Algunas olas";
  if (oleaje < 2) return "🌊 Muchas olas";
  return "🌊 Temporal";
}

function obtenerNombreFaseLunar(fase) {
  if (fase < 0.03 || fase > 0.97) return "🌑 Luna nueva";
  if (fase < 0.25) return "🌒 Creciente";
  if (fase < 0.53) return "🌕 Luna llena";
  return "🌘 Menguante";
}

function obtenerEstadoAgua(agua) {
  if (agua === null || agua === undefined) return null;
  if (agua < 16) return "agua fría";
  if (agua <= 21) return "agua fresquita metible";
  return "agua agradable";
}

function gradosADireccion(grados) {
  const direcciones = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return direcciones[Math.round(grados / 45) % 8];
}

function puntosOrientacion(orientacion, direccionViento, viento) {
  const opuestas = { N: "S", NE: "SW", E: "W", SE: "NW", S: "N", SW: "NE", W: "E", NW: "SE" };
  if (viento <= 20) return 0;
  if (orientacion === direccionViento) return -5;
  if (opuestas[orientacion] === direccionViento) return 5;
  return 0;
}

function calcularPuntuacion(temperatura, viento, lluvia, nubosidad, agua, oleaje, orientacion, direccionViento) {
  let puntuacion = 40;
  puntuacion += puntosNubosidad(nubosidad);
  puntuacion += puntosLluvia(lluvia);
  puntuacion += puntosTemperatura(temperatura);
  puntuacion += puntosViento(viento);
  puntuacion += puntosOrientacion(orientacion, direccionViento, viento);
  puntuacion += puntosAgua(agua);
  puntuacion += puntosOleaje(oleaje);

  return Math.max(0, Math.min(100, Math.round(puntuacion)));
}

function calcularPuntuacionArdora(nubosidad, lluvia, faseLunar) {
  let puntos = 100;
  puntos -= nubosidad * 0.7;
  puntos -= lluvia * 0.5;
  puntos -= faseLunar * 40;
  return Math.max(0, Math.min(100, Math.round(puntos)));
}

function obtenerEstado(puntos, nubosidad) {
  if (nubosidad > 80) return "🟡 Aceptable (muy nublado)";
  if (puntos >= 85) return "🟢 Excelente";
  if (puntos >= 70) return "🟢 Buen día de playa";
  if (puntos >= 50) return "🟡 Aceptable";
  return "🔴 Mejor evitar";
}

function obtenerEstadoArdora(puntos) {
  if (puntos >= 85) return "🟢 Condiciones excelentes";
  if (puntos >= 70) return "🟢 Muy buenas";
  if (puntos >= 50) return "🟡 Posibles";
  return "🔴 Muy difíciles";
}

function obtenerCielo(nubosidad) {
  if (nubosidad <= 10) return "☀️ Despejado";
  if (nubosidad <= 30) return "🌤️ Algunas nubes";
  if (nubosidad <= 60) return "⛅ Parcialmente nublado";
  return "☁️ Nublado";
}

function generarExplicacion(temperatura, viento, direccionViento, lluvia, agua, orientacion, nubosidad) {
  let mensajes = [];
  if (nubosidad <= 30) mensajes.push("buen cielo");
  else mensajes.push("cielo algo nublado");

  if (viento <= 15) mensajes.push("poco viento");
  if (lluvia <= 10) mensajes.push("sin lluvia");

  const estadoAgua = obtenerEstadoAgua(agua);
  if (estadoAgua) mensajes.push(estadoAgua);

  return mensajes.join(", ") + ".";
}

function generarExplicacionArdora(nubosidad, lluvia, fase) {
  return `${nubosidad < 30 ? 'Cielo despejado' : 'Nubes presentes'}, ${obtenerNombreFaseLunar(fase)}.`;
}

// Carga masiva de todas las playas para evitar rate-limits y parámetros erróneos
async function obtenerTodosLosDatos() {
  const lats = playas.map(p => p.lat).join(",");
  const lons = playas.map(p => p.lon).join(",");

  // 1. Predicción atmosférica (sin moon_phase)
  const urlMeteo = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=temperature_2m_max,wind_direction_10m_dominant&hourly=temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover&forecast_days=1&timezone=auto`;
  
  // 2. Datos astronómicos (para la fase lunar)
  const urlAstro = `https://api.open-meteo.com/v1/astronomy?latitude=${lats}&longitude=${lons}&daily=moon_phase&forecast_days=1&timezone=auto`;
  
  // 3. Datos de mar
  const urlMarine = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&hourly=sea_surface_temperature,wave_height&forecast_days=1`;

  try {
    const [resMeteo, resAstro, resMarine] = await Promise.all([
      fetch(urlMeteo).then(r => r.ok ? r.json() : null),
      fetch(urlAstro).then(r => r.ok ? r.json() : null),
      fetch(urlMarine).then(r => r.ok ? r.json() : null)
    ]);

    if (!resMeteo) {
      console.error("Error crítico cargando Open-Meteo");
      return [];
    }

    // Adaptar si la respuesta viene como array (múltiples puntos) o como objeto único (si fuese 1 sola playa)
    const datosMeteoArray = Array.isArray(resMeteo) ? resMeteo : [resMeteo];
    const datosAstroArray = resAstro ? (Array.isArray(resAstro) ? resAstro : [resAstro]) : [];
    const datosMarineArray = resMarine ? (Array.isArray(resMarine) ? resMarine : [resMarine]) : [];

    return playas.map((playa, idx) => {
      const datos = datosMeteoArray[idx] || {};
      const datosAstro = datosAstroArray[idx] || {};
      const datosMarine = datosMarineArray[idx] || {};

      const horas = datos.hourly?.time || [];
      const temperaturas = datos.hourly?.temperature_2m || [];
      const probabilidadesLluvia = datos.hourly?.precipitation_probability || [];
      const velocidadesViento = datos.hourly?.wind_speed_10m || [];
      const nubosidades = datos.hourly?.cloud_cover || [];

      const registrosPlaya = horas
        .map((hora, indice) => ({
          horaLocal: new Date(hora).getHours(),
          temperatura: temperaturas[indice] ?? 0,
          lluvia: probabilidadesLluvia[indice] ?? 0,
          viento: velocidadesViento[indice] ?? 0,
          nubosidad: nubosidades[indice] ?? 0
        }))
        .filter(reg => reg.horaLocal >= 11 && reg.horaLocal <= 20);

      const datosValidos = registrosPlaya.length > 0 ? registrosPlaya : horas.map((_, i) => ({
        temperatura: temperaturas[i] ?? 0,
        lluvia: probabilidadesLluvia[i] ?? 0,
        viento: velocidadesViento[i] ?? 0,
        nubosidad: nubosidades[i] ?? 0
      }));

      const totalRegistros = datosValidos.length || 1;
      const temperaturaMediaPlaya = datosValidos.reduce((sum, r) => sum + r.temperatura, 0) / totalRegistros;
      const lluviaMediaPlaya = datosValidos.reduce((sum, r) => sum + r.lluvia, 0) / totalRegistros;
      const vientoMedioPlaya = datosValidos.reduce((sum, r) => sum + r.viento, 0) / totalRegistros;
      const nubosidadMediaPlaya = datosValidos.reduce((sum, r) => sum + r.nubosidad, 0) / totalRegistros;

      const tempMaxRaw = datos.daily?.temperature_2m_max?.[0];
      const temperaturaMaxima = (tempMaxRaw !== null && tempMaxRaw !== undefined) ? tempMaxRaw : temperaturaMediaPlaya;

      const faseLunar = datosAstro.daily?.moon_phase?.[0] ?? 0;
      const lluvia = Math.round(lluviaMediaPlaya);
      const nubosidad = Math.round(nubosidadMediaPlaya);
      const viento = Math.round(vientoMedioPlaya);
      const direccionVientoGrados = datos.daily?.wind_direction_10m_dominant?.[0] ?? 0;

      const direccionViento = gradosADireccion(direccionVientoGrados);
      const cielo = obtenerCielo(nubosidad);

      const agua = datosMarine.hourly?.sea_surface_temperature?.[12] ?? null;
      const oleaje = datosMarine.hourly?.wave_height?.[12] ?? null;
      const estadoOleaje = obtenerEstadoOleaje(oleaje);

      const puntuacion = calcularPuntuacion(temperaturaMediaPlaya, viento, lluvia, nubosidad, agua, oleaje, playa.orientacion, direccionViento);
      const estado = obtenerEstado(puntuacion, nubosidad);
      const explicacion = generarExplicacion(temperaturaMediaPlaya, viento, direccionViento, lluvia, agua, playa.orientacion, nubosidad);

      const puntuacionArdora = calcularPuntuacionArdora(nubosidad, lluvia, faseLunar);
      const estadoArdora = obtenerEstadoArdora(puntuacionArdora);
      const explicacionArdora = generarExplicacionArdora(nubosidad, lluvia, faseLunar);

      return {
        nombre: playa.nombre,
        lat: playa.lat,
        lon: playa.lon,
        distancia: null,
        temperaturaMaxima: Number(temperaturaMaxima) || 0,
        temperaturaMediaPlaya: Number(temperaturaMediaPlaya) || 0,
        viento,
        direccionViento,
        lluvia,
        cielo,
        agua,
        estadoOleaje,
        puntuacion,
        estado,
        explicacion,
        faseLunar,
        puntuacionArdora,
        estadoArdora,
        explicacionArdora,
        nubosidad
      };
    });
  } catch (err) {
    console.error("Error al procesar los datos de las playas:", err);
    return [];
  }
}

async function cargarRanking() {
  const tabla = document.getElementById("ranking");

  try {
    if (datosPlayasCache === null) {
      if (tabla) tabla.innerHTML = `<tr><td colspan="13" style="text-align:center;">Cargando datos meteorológicos...</td></tr>`;
      datosPlayasCache = await obtenerTodosLosDatos();
    }

    let resultados = JSON.parse(JSON.stringify(datosPlayasCache));

    if (ubicacionUsuario) {
      await Promise.all(
        resultados.map(async playa => {
          playa.distancia = await calcularDistanciaCoche(
            ubicacionUsuario.lat,
            ubicacionUsuario.lon,
            playa.lat,
            playa.lon
          );
        })
      );
    }

    if (distanciaMaxima !== null && ubicacionUsuario) {
      resultados = resultados.filter(
        playa => playa.distancia !== null && playa.distancia <= distanciaMaxima
      );
    }

    if (modo === "dia") {
      resultados.sort((a, b) => b.puntuacion - a.puntuacion);
    } else {
      resultados.sort((a, b) => b.puntuacionArdora - a.puntuacionArdora);
    }

    if (!tabla) return;
    tabla.innerHTML = "";

    if (resultados.length === 0) {
      tabla.innerHTML = `<tr><td colspan="13" style="text-align:center;">No hay datos disponibles o no hay playas dentro de la distancia seleccionada.</td></tr>`;
      return;
    }

    resultados.forEach((playa, index) => {
      const tempMax = typeof playa.temperaturaMaxima === "number" ? playa.temperaturaMaxima : 0;
      const tempMedia = typeof playa.temperaturaMediaPlaya === "number" ? playa.temperaturaMediaPlaya : 0;

      const tempMaxTxt = tempMax.toFixed(1);
      const tempMediaTxt = tempMedia.toFixed(1);
      const aguaTxt = playa.agua !== null && playa.agua !== undefined ? playa.agua.toFixed(1) + "°C" : "-";
      const distTxt = playa.distancia !== null && playa.distancia !== undefined ? playa.distancia.toFixed(1) + " km" : "-";

      tabla.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${playa.nombre}</td>
          <td>${distTxt}</td>
          <td>${playa.cielo}</td>
          <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${tempMaxTxt}°C</td>
          <td>${tempMediaTxt}°C</td>
          <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.viento} km/h (${playa.direccionViento})</td>
          <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.lluvia}%</td>
          <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${aguaTxt}</td>
          <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${playa.estadoOleaje}</td>
          <td class="col-estado">${modo === "dia" ? playa.estado : playa.estadoArdora}</td>
          <td class="detalle ${detallesVisibles ? '' : 'oculto'}">${modo === "dia" ? playa.puntuacion : playa.puntuacionArdora}</td>
          <td class="col-explicacion">${modo === "dia" ? playa.explicacion : playa.explicacionArdora}</td>
        </tr>
      `;
    });

    actualizarVisibilidadDetalles();

  } catch (error) {
    console.error("Error al cargar el ranking de playas:", error);
    if (tabla) {
      tabla.innerHTML = `<tr><td colspan="13" style="text-align:center; color: red;">Error al consultar el tiempo en las playas. Inténtalo de nuevo más tarde.</td></tr>`;
    }
  }
}

cargarRanking();
