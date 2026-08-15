const URL_BASE_FICHA = typeof URL_RAIZ_RECURSOS !== "undefined" && URL_RAIZ_RECURSOS
  ? new URL(URL_RAIZ_RECURSOS)
  : new URL(".", document.currentScript?.src || window.location?.href || "https://hoytocaplaya.com/");
const NO_DISPONIBLE = "Información no disponible";

// Mantiene en las fichas la misma descripción de temperatura del agua que el ranking.
if (typeof obtenerEstadoAgua === "function") {
  obtenerEstadoAgua = function (agua) {
    if (!agua) return null;
    if (agua < 14) return "agua congelada";
    if (agua < 18) return "agua muy fría";
    if (agua < 19) return "agua fría";
    if (agua <= 21) return "agua fría al principio, luego agradable";
    if (agua <= 25) return "agua agradable";
    return "agua cálida";
  };
}

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

const ALIASES_GOOGLE_MAPS = {
  "playa-de-sada": "Praia de Sada, Sada, A Coruña, Galicia",
  "praia-de-compostela": "Compostela, Vilagarcía de Arousa, Pontevedra, Galicia"
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

function renderizarFuentes(fuentes = []) {
  const lista = document.getElementById("fuentesConsultadas");
  if (!Array.isArray(fuentes) || fuentes.length === 0) {
    lista.innerHTML = `<li class="dato-no-disponible">${NO_DISPONIBLE}</li>`;
    return;
  }
  lista.replaceChildren(...fuentes.map(fuente => {
    const elemento = document.createElement("li");
    const enlace = document.createElement("a");
    enlace.href = fuente.url;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = fuente.nombre;
    elemento.append(enlace);
    if (fuente.nota) {
      const nota = document.createElement("small");
      nota.textContent = fuente.nota;
      elemento.append(nota);
    }
    return elemento;
  }));
}

function obtenerDestinoMaps(playa) {
  return playa.destinoMaps
    || ALIASES_GOOGLE_MAPS[playa.slug]
    || `${playa.nombre}, ${playa.municipio}, ${playa.provincia || "Galicia"}, Galicia`;
}

function crearUrlMaps(playa) {
  const parametros = new URLSearchParams({ api: "1", query: obtenerDestinoMaps(playa) });
  if (playa.googlePlaceId) parametros.set("query_place_id", playa.googlePlaceId);
  return `https://www.google.com/maps/search/?${parametros.toString()}`;
}

function crearUrlComoLlegar(playa) {
  const parametros = new URLSearchParams({ api: "1", destination: obtenerDestinoMaps(playa) });
  if (playa.googlePlaceId) parametros.set("destination_place_id", playa.googlePlaceId);
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
  document.getElementById("comoLlegar").href = crearUrlComoLlegar(playa);
  document.getElementById("abrirMapa").href = crearUrlMaps(playa);
}

async function cargarDescripcionesAprobadas() {
  const archivos = [1, 2, 3, 4, 5].map(numero =>
    fetch(new URL(`data/descripciones-seo-${numero}.json?v=1`, URL_BASE_FICHA)).then(respuesta => {
      if (!respuesta.ok) throw new Error(`No se pudo cargar descripciones-seo-${numero}.json`);
      return respuesta.json();
    })
  );
  const bloques = await Promise.all(archivos);
  const mapa = new Map();
  bloques.forEach(bloque => {
    (bloque.d || []).forEach(([nombre, municipio, texto]) => mapa.set(`${nombre}||${municipio}`, texto));
  });
  return mapa;
}

async function cargarFotosSeleccionadas() {
  const bloques = await Promise.all([1, 2, 3, 4].map(numero =>
    fetch(new URL(`data/fotos-wikimedia-${numero}.json?v=2`, URL_BASE_FICHA)).then(respuesta => {
      if (!respuesta.ok) throw new Error(`No se pudo cargar fotos-wikimedia-${numero}.json`);
      return respuesta.json();
    })
  ));
  return Object.assign({}, ...bloques);
}

function aplicarDescripcionAprobada(playa, descripciones) {
  const clave = `${playa.nombreCatalogo || playa.nombre}||${playa.municipio}`;
  const texto = descripciones.get(clave);
  if (texto) playa.descripcion = texto;
}

function aplicarFotoSeleccionada(playa, fotos) {
  const clave = `${playa.nombreCatalogo || playa.nombre}||${playa.municipio}`;
  const seleccion = fotos[clave];
  if (!seleccion) return;
  const [archivo, fuente] = seleccion;
  playa.fotoPrincipal = {
    url: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(archivo)}?width=1600`,
    autor: "ver ficha original",
    licencia: "ver licencia",
    fuente
  };
}

function aplicarAjustesLocales(playa) {
  if (playa.slug !== "playa-nino-do-corvo") return;
  playa.marea = {
    dependencia: "Alta",
    superficiePleamar: "El arenal se reduce mucho con la marea alta",
    accesoCondicionado: "Conviene visitarla con margen respecto a la pleamar",
    riesgoAislamiento: "Bajo si se permanece en la zona de acceso",
    recomendacion: "Consulta la marea antes de ir: Niño do Corvo es un arenal estrecho y con pleamar queda bastante menos espacio de playa."
  };
}

function renderizarDatosEstaticos(playa) {
  const tituloResumen = document.querySelector("#resumen h2");
  if (tituloResumen) tituloResumen.textContent = `¿Cómo es ${playa.nombre}?`;
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
    notaVigencia: playa.practica?.notaVigencia,
    ultimaVerificacion: playa.practica?.ultimaVerificacion
  }, {
    municipio: "Municipio", provincia: "Provincia", coordenadas: "Coordenadas",
    temporadaBano: "Temporada de baño", notaVigencia: "Vigencia de los datos",
    ultimaVerificacion: "Última verificación"
  });
  renderizarFuentes(playa.fuentes);
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
        <small>Revisaremos este enlace antes de publicar.</small></div>`;
    }, { once: true });
  }
}

function renderizarCondiciones(condiciones) {
  document.getElementById("estadoCondiciones").hidden = true;
  document.getElementById("condicionesContenido").hidden = false;
  document.getElementById("puntuacionPlaya").textContent = Math.round(condiciones.puntuacion);
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
  document.getElementById("actualizacionCondiciones").textContent =
    `Consultado: ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

async function iniciarFicha() {
  adaptarEnlacesAlPreview();
  const slug = document.body.dataset.playaSlug;
  try {
    const [respuesta, descripciones, fotos] = await Promise.all([
      fetch(new URL("data/playas-detalle.json?v=4", URL_BASE_FICHA)),
      cargarDescripcionesAprobadas(),
      cargarFotosSeleccionadas()
    ]);
    if (!respuesta.ok) throw new Error("No se pudieron cargar los datos estáticos.");
    const catalogo = await respuesta.json();
    const playa = catalogo.playas.find(item => item.slug === slug);
    if (!playa) throw new Error("La ficha solicitada no existe.");
    aplicarDescripcionAprobada(playa, descripciones);
    aplicarFotoSeleccionada(playa, fotos);
    aplicarAjustesLocales(playa);
    renderizarDatosEstaticos(playa);

    if (!window.HoyTocaPlaya?.obtenerCondicionesPlaya) throw new Error("El módulo meteorológico no está disponible.");
    const condiciones = await window.HoyTocaPlaya.obtenerCondicionesPlaya(playa.nombreCatalogo, 0, 7, 22, playa.municipio);
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
