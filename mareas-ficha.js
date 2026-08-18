(() => {
  const ficha = window.HoyTocaPlayaFicha;
  const slug = document.body?.dataset?.playaSlug || ficha?.slug;
  if (!slug || !ficha) return;

  const NO_DISPONIBLE = "Información no disponible";
  const CONFIG_LOCAL = {
    "playa-nino-do-corvo": {
      dependencia: "Alta",
      riesgoAislamiento: "Bajo si se permanece en la zona de acceso",
      recomendacion: "Consulta la marea antes de ir: Niño do Corvo es un arenal estrecho y con pleamar queda bastante menos espacio de playa."
    }
  };
  const configuracionLocal = CONFIG_LOCAL[slug] || {};

  function fechaIsoMadrid() {
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const mapa = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    return `${mapa.year}-${mapa.month}-${mapa.day}`;
  }

  function valorDisponible(...valores) {
    return valores.find(valor => valor !== null && valor !== undefined && String(valor).trim() !== "") ?? NO_DISPONIBLE;
  }

  function distanciaKm(lat1, lon1, lat2, lon2) {
    const rad = grados => grados * Math.PI / 180;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function seleccionarPuertoMasCercano(puertos) {
    const lat = Number(ficha.lat);
    const lon = Number(ficha.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return puertos
      .filter(puerto => Number.isFinite(Number(puerto.lat)) && Number.isFinite(Number(puerto.lon)))
      .map(puerto => ({
        puerto,
        distancia: distanciaKm(lat, lon, Number(puerto.lat), Number(puerto.lon))
      }))
      .sort((a, b) => a.distancia - b.distancia)[0]?.puerto || null;
  }

  function prepararPanel() {
    const panel = document.getElementById("marea");
    const lista = document.getElementById("listaMarea");
    const aviso = document.getElementById("recomendacionMarea");
    if (!panel || !lista || !aviso) return false;

    const dependencia = valorDisponible(configuracionLocal.dependencia, ficha.marea?.dependencia);
    const riesgo = valorDisponible(configuracionLocal.riesgoAislamiento, ficha.marea?.riesgoAislamiento);
    const recomendacion = valorDisponible(
      configuracionLocal.recomendacion,
      ficha.marea?.recomendacion,
      "Consulta los horarios de pleamar y bajamar para planificar tu visita."
    );

    const titulo = panel.querySelector("h2");
    if (titulo) titulo.textContent = "Información de mareas";

    lista.classList.remove("tres-columnas");
    lista.classList.add("cuatro-columnas", "marea-dinamica");
    lista.innerHTML = `
      <div><dt>🌊 Pleamar</dt><dd id="mareaPleamar" class="dato-cargando-marea">Consultando…</dd></div>
      <div><dt>↘ Bajamar</dt><dd id="mareaBajamar" class="dato-cargando-marea">Consultando…</dd></div>
      <div><dt>Dependencia de la marea</dt><dd class="${dependencia === NO_DISPONIBLE ? "dato-no-disponible" : ""}">${dependencia}</dd></div>
      <div><dt>Riesgo de aislamiento</dt><dd class="${riesgo === NO_DISPONIBLE ? "dato-no-disponible" : ""}">${riesgo}</dd></div>`;

    aviso.textContent = recomendacion;

    let fuente = panel.querySelector(".marea-fuente");
    if (!fuente) {
      fuente = document.createElement("p");
      fuente.className = "marea-fuente";
      aviso.insertAdjacentElement("afterend", fuente);
    }
    fuente.textContent = "Consultando puerto de referencia de MeteoGalicia…";
    return true;
  }

  function mostrarMareas(puerto) {
    const mareas = puerto?.mareas || [];
    const pleamares = mareas.filter(marea => marea.tipo === "pleamar").map(marea => marea.hora);
    const bajamares = mareas.filter(marea => marea.tipo === "bajamar").map(marea => marea.hora);
    const pleamar = document.getElementById("mareaPleamar");
    const bajamar = document.getElementById("mareaBajamar");
    if (!pleamar || !bajamar) return;

    pleamar.textContent = pleamares.length ? pleamares.join(" · ") : "Sin dato";
    bajamar.textContent = bajamares.length ? bajamares.join(" · ") : "Sin dato";
    pleamar.classList.remove("dato-cargando-marea");
    bajamar.classList.remove("dato-cargando-marea");

    const fuente = document.querySelector("#marea .marea-fuente");
    if (fuente) {
      fuente.innerHTML = `Horarios de hoy: <a href="https://www.meteogalicia.gal/web/predicion/mareas-e-luas" target="_blank" rel="noopener noreferrer">MeteoGalicia · Xunta de Galicia</a> · puerto de referencia ${puerto.nombre}.`;
    }
  }

  function mostrarNoDisponible() {
    for (const id of ["mareaPleamar", "mareaBajamar"]) {
      const elemento = document.getElementById(id);
      if (!elemento) continue;
      elemento.textContent = "No disponible";
      elemento.classList.remove("dato-cargando-marea");
    }
    const fuente = document.querySelector("#marea .marea-fuente");
    if (fuente) fuente.textContent = "No se pudieron cargar los horarios de mareas en este momento.";
  }

  async function cargarMareas() {
    if (!prepararPanel()) return;
    try {
      const base = typeof URL_BASE_FICHA !== "undefined"
        ? URL_BASE_FICHA
        : new URL("../../", document.currentScript?.src || window.location.href);
      const url = new URL("data/mareas.json", base);
      url.searchParams.set("v", String(Math.floor(Date.now() / 3600000)));
      const respuesta = await fetch(url.href, { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`mareas.json respondió ${respuesta.status}`);

      const datos = await respuesta.json();
      const puertos = Object.values(datos?.dias?.[fechaIsoMadrid()] || {});
      const puerto = seleccionarPuertoMasCercano(puertos);
      if (!puerto?.mareas?.length) throw new Error("No hay un puerto de referencia disponible");
      mostrarMareas(puerto);
    } catch (error) {
      console.warn("No se pudieron cargar las mareas compartidas.", error);
      mostrarNoDisponible();
    }
  }

  const observador = new MutationObserver(() => {
    const lista = document.getElementById("listaMarea");
    if (!lista || !lista.children.length) return;
    observador.disconnect();
    cargarMareas();
  });

  const listaInicial = document.getElementById("listaMarea");
  if (listaInicial?.children?.length) cargarMareas();
  else observador.observe(document.documentElement, { childList: true, subtree: true });
})();
