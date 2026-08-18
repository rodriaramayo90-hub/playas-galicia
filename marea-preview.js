(() => {
  const slug = document.body?.dataset?.playaSlug;
  if (!slug) return;

  const CONFIG_PREVIEW = {
    "playa-nino-do-corvo": {
      idPorto: 3,
      portoReferencia: "Vigo",
      dependencia: "Alta",
      riesgoAislamiento: "Bajo si se permanece en la zona de acceso",
      recomendacion: "Consulta la marea antes de ir: Niño do Corvo es un arenal estrecho y con pleamar queda bastante menos espacio de playa."
    }
  };

  const configuracion = CONFIG_PREVIEW[slug];
  if (!configuracion) return;

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

  function prepararPanel() {
    const panel = document.getElementById("marea");
    const lista = document.getElementById("listaMarea");
    const aviso = document.getElementById("recomendacionMarea");
    if (!panel || !lista || !aviso) return false;

    const titulo = panel.querySelector("h2");
    if (titulo) titulo.textContent = "Información de mareas";

    lista.classList.remove("tres-columnas");
    lista.classList.add("cuatro-columnas", "marea-dinamica");
    lista.innerHTML = `
      <div><dt>🌊 Pleamar</dt><dd id="mareaPleamar" class="dato-cargando-marea">Consultando…</dd></div>
      <div><dt>↘ Bajamar</dt><dd id="mareaBajamar" class="dato-cargando-marea">Consultando…</dd></div>
      <div><dt>Dependencia de la marea</dt><dd>${configuracion.dependencia}</dd></div>
      <div><dt>Riesgo de aislamiento</dt><dd>${configuracion.riesgoAislamiento}</dd></div>`;

    aviso.textContent = configuracion.recomendacion;

    let fuente = panel.querySelector(".marea-fuente");
    if (!fuente) {
      fuente = document.createElement("p");
      fuente.className = "marea-fuente";
      aviso.insertAdjacentElement("afterend", fuente);
    }
    fuente.innerHTML = `Horarios de hoy: <a href="https://www.meteogalicia.gal/web/predicion/mareas-e-luas" target="_blank" rel="noopener noreferrer">MeteoGalicia · Xunta de Galicia</a> · puerto de referencia ${configuracion.portoReferencia}.`;
    return true;
  }

  function mostrarMareas(mareas = []) {
    const pleamares = mareas.filter(marea => marea.tipo === "pleamar").map(marea => marea.hora);
    const bajamares = mareas.filter(marea => marea.tipo === "bajamar").map(marea => marea.hora);
    const pleamar = document.getElementById("mareaPleamar");
    const bajamar = document.getElementById("mareaBajamar");
    if (!pleamar || !bajamar) return;
    pleamar.textContent = pleamares.length ? pleamares.join(" · ") : "Sin dato";
    bajamar.textContent = bajamares.length ? bajamares.join(" · ") : "Sin dato";
    pleamar.classList.remove("dato-cargando-marea");
    bajamar.classList.remove("dato-cargando-marea");
  }

  function mostrarNoDisponible() {
    for (const id of ["mareaPleamar", "mareaBajamar"]) {
      const elemento = document.getElementById(id);
      if (!elemento) continue;
      elemento.textContent = "No disponible";
      elemento.classList.remove("dato-cargando-marea");
    }
  }

  async function cargarMareas() {
    if (!prepararPanel()) return;
    try {
      const base = typeof URL_BASE_FICHA !== "undefined" ? URL_BASE_FICHA : new URL(".", window.location.href);
      const url = new URL("data/mareas.json", base);
      url.searchParams.set("v", String(Math.floor(Date.now() / 3600000)));
      const respuesta = await fetch(url.href, { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`mareas.json respondió ${respuesta.status}`);
      const datos = await respuesta.json();
      const puerto = datos?.dias?.[fechaIsoMadrid()]?.[String(configuracion.idPorto)];
      if (!puerto?.mareas?.length) throw new Error("No hay mareas para el puerto de referencia");
      mostrarMareas(puerto.mareas);
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
