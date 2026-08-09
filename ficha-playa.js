const URL_BASE_FICHA = new URL(".", document.currentScript?.src || window.location?.href || "https://hoytocaplaya.com/");
const NO_DISPONIBLE = "Información no disponible";

const etiquetas = {
  caracteristicas: {
    tipo: "🏖️ Tipo de playa", composicion: "◫ Composición", longitud: "↔ Longitud",
    anchura: "↔ Anchura", entorno: "⛰️ Entorno", forma: "⌁ Forma",
    orientacion: "🧭 Orientación", exposicion: "◭ Exposición"
  },
  servicios: {
    parking: "🚗 Parking", accesibilidad: "♿ Accesibilidad", duchas: "🚿 Duchas",
    aseos: "🚻 Aseos", socorrista: "🛟 Socorrista", chiringuito: "🥤 Chiringuito",
    restaurantes: "🍴 Restaurantes cercanos", transportePublico: "🚌 Transporte público"
  },
  normas: {
    perros: "🐕 Perros", nudismo: "Normas sobre nudismo", deportesAcuaticos: "🏄 Deportes acuáticos",
    barbacoasFuego: "🔥 Barbacoas / fuego", accesoVehiculos: "🚙 Acceso de vehículos"
  },
  marea: {
    dependencia: "🌊 Dependencia", superficiePleamar: "Superficie en pleamar",
    accesoCondicionado: "Acceso condicionado", riesgoAislamiento: "Riesgo de aislamiento"
  },
  bano: {
    entradaAgua: "Entrada al agua", fondo: "Fondo", oleajeHabitual: "Oleaje habitual",
    corrientes: "Corrientes", ninos: "Adecuada para niños", profundidad: "Profundidad"
  }
};

function valorVisible(valor) {
  if (valor === null || valor === undefined || valor === "") return NO_DISPONIBLE;
  if (valor === true) return "Sí";
  if (valor === false) return "No";
  return String(valor);
}

function renderizarLista(id, datos, nombres, clase = "") {
  const contenedor = document.getElementById(id);
  contenedor.innerHTML = Object.entries(nombres).map(([clave, etiqueta]) => {
    const valor = valorVisible(datos?.[clave]);
    const noDisponible = valor === NO_DISPONIBLE ? "dato-no-disponible" : "";
    return `<div class="${clase}"><dt>${etiqueta}</dt><dd class="${noDisponible}">${valor}</dd></div>`;
  }).join("");
}

function crearUrlMaps(playa) {
  const parametros = new URLSearchParams({
    api: "1",
    destination: `${playa.lat},${playa.lon}`,
    travelmode: "driving",
    dir_action: "navigate"
  });
  return `https://www.google.com/maps/dir/?${parametros.toString()}`;
}

function configurarMapa(playa) {
  const margenLon = 0.025;
  const margenLat = 0.015;
  const bbox = [playa.lon - margenLon, playa.lat - margenLat, playa.lon + margenLon, playa.lat + margenLat].join(",");
  document.getElementById("mapaPlaya").src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${playa.lat}%2C${playa.lon}`;
  document.getElementById("coordenadasPlaya").textContent = `${playa.lat.toFixed(6)}, ${playa.lon.toFixed(6)}`;
  const urlMaps = crearUrlMaps(playa);
  document.getElementById("comoLlegar").href = urlMaps;
  document.getElementById("abrirMapa").href = urlMaps;
}

function renderizarDatosEstaticos(playa) {
  document.getElementById("descripcionPlaya").textContent = valorVisible(playa.descripcion);
  renderizarLista("listaCaracteristicas", playa.caracteristicas, etiquetas.caracteristicas);
  renderizarLista("listaServicios", playa.servicios, etiquetas.servicios);
  renderizarLista("listaNormas", playa.normas, etiquetas.normas);
  renderizarLista("listaMarea", playa.marea, etiquetas.marea);
  renderizarLista("listaBano", playa.bano, etiquetas.bano);
  renderizarLista("listaPractica", {
    municipio: playa.municipio,
    provincia: playa.provincia,
    coordenadas: `${playa.lat.toFixed(6)}, ${playa.lon.toFixed(6)}`,
    temporadaBano: playa.practica?.temporadaBano,
    fuente: playa.practica?.fuente,
    ultimaVerificacion: playa.practica?.ultimaVerificacion
  }, {
    municipio: "Municipio", provincia: "Provincia", coordenadas: "Coordenadas",
    temporadaBano: "Temporada de baño", fuente: "Fuente", ultimaVerificacion: "Última verificación"
  });
  document.getElementById("recomendacionMarea").textContent = valorVisible(playa.marea?.recomendacion);
  configurarMapa(playa);

  if (playa.fotoPrincipal?.url) {
    const foto = playa.fotoPrincipal;
    const contenedorFoto = document.getElementById("fotoPrincipal");
    contenedorFoto.innerHTML = `
      <img src="${foto.url}" alt="Vista de ${playa.nombre}" fetchpriority="high">
      <a class="credito-foto" href="${foto.fuente}" target="_blank" rel="noopener noreferrer">
        Foto: ${foto.autor} · ${foto.licencia}
      </a>`;
    contenedorFoto.querySelector("img").addEventListener("error", () => {
      contenedorFoto.innerHTML = `<div class="foto-placeholder" role="img" aria-label="La fotografía no pudo cargarse">
        <span aria-hidden="true">🏖️</span><strong>La fotografía no pudo cargarse</strong>
        <small>Comprueba la conexión e inténtalo de nuevo.</small></div>`;
    }, { once: true });
  }
  if (Array.isArray(playa.fotos) && playa.fotos.length) {
    document.getElementById("galeriaPlaya").className = "galeria-playa";
    document.getElementById("galeriaPlaya").innerHTML = playa.fotos.map((foto, indice) =>
      `<img src="${foto}" alt="${playa.nombre}, fotografía ${indice + 1}" loading="lazy">`
    ).join("");
  }
}

function renderizarCondiciones(condiciones) {
  document.getElementById("estadoCondiciones").hidden = true;
  document.getElementById("condicionesContenido").hidden = false;
  document.getElementById("puntuacionPlaya").textContent = condiciones.puntuacion;
  document.getElementById("estadoPlaya").textContent = condiciones.estado;
  document.getElementById("explicacionPlaya").textContent = condiciones.explicacion;
  document.getElementById("temperaturaPlaya").textContent = `${condiciones.temperaturaMediaPlaya.toFixed(1)} °C`;
  document.getElementById("vientoPlaya").textContent = `${condiciones.viento} km/h · ${condiciones.direccionViento}`;
  document.getElementById("lluviaPlaya").textContent = `${condiciones.lluvia}%`;
  const estadoOleaje = (condiciones.estadoOleaje || "").replace(/^[^\p{L}\p{N}]+/u, "");
  document.getElementById("oleajePlaya").textContent = Number.isFinite(condiciones.oleaje)
    ? `${condiciones.oleaje.toFixed(1)} m · ${estadoOleaje}`
    : condiciones.estadoOleaje || NO_DISPONIBLE;
  document.getElementById("aguaPlaya").textContent = Number.isFinite(condiciones.agua)
    ? `${condiciones.agua.toFixed(1)} °C`
    : NO_DISPONIBLE;
  document.getElementById("actualizacionCondiciones").textContent = `Consultado: ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

async function iniciarFicha() {
  const slug = document.body.dataset.playaSlug;
  try {
    const respuesta = await fetch(new URL("data/playas-detalle.json", URL_BASE_FICHA));
    if (!respuesta.ok) throw new Error("No se pudieron cargar los datos estáticos.");
    const catalogo = await respuesta.json();
    const playa = catalogo.playas.find(item => item.slug === slug);
    if (!playa) throw new Error("La ficha solicitada no existe.");
    renderizarDatosEstaticos(playa);

    if (!window.HoyTocaPlaya?.obtenerCondicionesPlaya) throw new Error("El módulo meteorológico no está disponible.");
    const condiciones = await window.HoyTocaPlaya.obtenerCondicionesPlaya(playa.nombreCatalogo, 0, 7, 21);
    renderizarCondiciones(condiciones);
  } catch (error) {
    console.error(error);
    const estado = document.getElementById("estadoCondiciones");
    estado.textContent = "No se pudieron cargar las condiciones actuales. Inténtalo de nuevo en unos minutos.";
    estado.classList.add("condiciones-error");
    document.getElementById("actualizacionCondiciones").textContent = "Sin actualizar";
  }
}

iniciarFicha();

