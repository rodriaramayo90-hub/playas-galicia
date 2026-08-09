const URL_BASE_FICHA = new URL(".", document.currentScript?.src || window.location?.href || "https://hoytocaplaya.com/");
const NO_DISPONIBLE = "InformaciÃ³n no disponible";

const etiquetas = {
  caracteristicas: {
    tipo: "ðŸ–ï¸ Tipo de playa", composicion: "â—« ComposiciÃ³n", longitud: "â†” Longitud",
    anchura: "â†” Anchura", entorno: "â›°ï¸ Entorno", forma: "âŒ Forma",
    orientacion: "ðŸ§­ OrientaciÃ³n", exposicion: "â—­ ExposiciÃ³n"
  },
  servicios: {
    parking: "ðŸš— Parking", accesibilidad: "â™¿ Accesibilidad", duchas: "ðŸš¿ Duchas",
    aseos: "ðŸš» Aseos", socorrista: "ðŸ›Ÿ Socorrista", chiringuito: "ðŸ¥¤ Chiringuito",
    restaurantes: "ðŸ´ Restaurantes cercanos", transportePublico: "ðŸšŒ Transporte pÃºblico"
  },
  normas: {
    perros: "ðŸ• Perros", nudismo: "Normas sobre nudismo", deportesAcuaticos: "ðŸ„ Deportes acuÃ¡ticos",
    barbacoasFuego: "ðŸ”¥ Barbacoas / fuego", accesoVehiculos: "ðŸš™ Acceso de vehÃ­culos"
  },
  marea: {
    dependencia: "ðŸŒŠ Dependencia", superficiePleamar: "Superficie en pleamar",
    accesoCondicionado: "Acceso condicionado", riesgoAislamiento: "Riesgo de aislamiento"
  },
  bano: {
    entradaAgua: "Entrada al agua", fondo: "Fondo", oleajeHabitual: "Oleaje habitual",
    corrientes: "Corrientes", ninos: "Adecuada para niÃ±os", profundidad: "Profundidad"
  }
};

function valorVisible(valor) {
  if (valor === null || valor === undefined || valor === "") return NO_DISPONIBLE;
  if (valor === true) return "SÃ­";
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

function adaptarEnlacesAlPreview() {
  if (window.location.hostname !== "htmlpreview.github.io") return;
  const fuente = decodeURIComponent(window.location.search.slice(1)).split("#")[0];
  if (!fuente.includes("/playas/")) return;
  const raizFuente = `${fuente.split("/playas/")[0]}/index.html`;
  document.querySelectorAll('a[href="../../"], a[href^="../../#"]').forEach(enlace => {
    const hash = enlace.getAttribute("href").includes("#") ? enlace.getAttribute("href").split("#")[1] : "";
    enlace.href = `${window.location.origin}${window.location.pathname}?${raizFuente}${hash ? `#${hash}` : ""}`;
  });
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
    temporadaBano: "Temporada de baÃ±o", fuente: "Fuente", ultimaVerificacion: "Ãšltima verificaciÃ³n"
  });
  document.getElementById("recomendacionMarea").textContent = valorVisible(playa.marea?.recomendacion);
  configurarMapa(playa);

  if (playa.fotoPrincipal?.url) {
    const foto = playa.fotoPrincipal;
    const contenedorFoto = document.getElementById("fotoPrincipal");
    contenedorFoto.innerHTML = `
      <img src="${foto.url}" alt="Vista de ${playa.nombre}" fetchpriority="high">
      <a class="credito-foto" href="${foto.fuente}" target="_blank" rel="noopener noreferrer">
        Foto: ${foto.autor} Â· ${foto.licencia}
      </a>`;
    contenedorFoto.querySelector("img").addEventListener("error", () => {
      contenedorFoto.innerHTML = `<div class="foto-placeholder" role="img" aria-label="La fotografÃ­a no pudo cargarse">
        <span aria-hidden="true">ðŸ–ï¸</span><strong>La fotografÃ­a no pudo cargarse</strong>
        <small>Comprueba la conexiÃ³n e intÃ©ntalo de nuevo.</small></div>`;
    }, { once: true });
  }
}

function renderizarCondiciones(condiciones) {
  document.getElementById("estadoCondiciones").hidden = true;
  document.getElementById("condicionesContenido").hidden = false;
  document.getElementById("puntuacionPlaya").textContent = condiciones.puntuacion;
  document.getElementById("estadoPlaya").textContent = condiciones.estado;
  document.getElementById("explicacionPlaya").textContent = condiciones.explicacion;
  document.getElementById("temperaturaPlaya").textContent = `${condiciones.temperaturaMediaPlaya.toFixed(1)} Â°C`;
  document.getElementById("vientoPlaya").textContent = `${condiciones.viento} km/h Â· ${condiciones.direccionViento}`;
  document.getElementById("lluviaPlaya").textContent = `${condiciones.lluvia}%`;
  const estadoOleaje = (condiciones.estadoOleaje || "").replace(/^[^\p{L}\p{N}]+/u, "");
  document.getElementById("oleajePlaya").textContent = Number.isFinite(condiciones.oleaje)
    ? `${condiciones.oleaje.toFixed(1)} m Â· ${estadoOleaje}`
    : condiciones.estadoOleaje || NO_DISPONIBLE;
  document.getElementById("aguaPlaya").textContent = Number.isFinite(condiciones.agua)
    ? `${condiciones.agua.toFixed(1)} Â°C`
    : NO_DISPONIBLE;
  document.getElementById("actualizacionCondiciones").textContent = `Consultado: ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

async function iniciarFicha() {
  adaptarEnlacesAlPreview();
  const slug = document.body.dataset.playaSlug;
  try {
    const respuesta = await fetch(new URL("data/playas-detalle.json?v=2", URL_BASE_FICHA));
    if (!respuesta.ok) throw new Error("No se pudieron cargar los datos estÃ¡ticos.");
    const catalogo = await respuesta.json();
    const playa = catalogo.playas.find(item => item.slug === slug);
    if (!playa) throw new Error("La ficha solicitada no existe.");
    renderizarDatosEstaticos(playa);

    if (!window.HoyTocaPlaya?.obtenerCondicionesPlaya) throw new Error("El mÃ³dulo meteorolÃ³gico no estÃ¡ disponible.");
    const condiciones = await window.HoyTocaPlaya.obtenerCondicionesPlaya(playa.nombreCatalogo, 0, 7, 22);
    renderizarCondiciones(condiciones);
  } catch (error) {
    console.error(error);
    const estado = document.getElementById("estadoCondiciones");
    estado.textContent = "No se pudieron cargar las condiciones actuales. IntÃ©ntalo de nuevo en unos minutos.";
    estado.classList.add("condiciones-error");
    document.getElementById("actualizacionCondiciones").textContent = "Sin actualizar";
  }
}

iniciarFicha();

