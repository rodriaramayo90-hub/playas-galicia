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

  function fechaMadrid() {
    const partes = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).formatToParts(new Date());
    const mapa = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    return `${mapa.day}/${mapa.month}/${mapa.year}`;
  }

  function extraerBloquePuerto(nodo) {
    if (!nodo) return null;
    if (Array.isArray(nodo)) {
      for (const elemento of nodo) {
        const encontrado = extraerBloquePuerto(elemento);
        if (encontrado) return encontrado;
      }
      return null;
    }
    if (typeof nodo !== "object") return null;
    if (Array.isArray(nodo.listaMareas)) return nodo;
    for (const valor of Object.values(nodo)) {
      const encontrado = extraerBloquePuerto(valor);
      if (encontrado) return encontrado;
    }
    return null;
  }

  function clasificarMareas(lista = []) {
    const pleamares = [];
    const bajamares = [];
    lista.forEach(marea => {
      const hora = marea.hora || (typeof marea.data === "string" ? marea.data.slice(11, 16) : null);
      if (!hora) return;
      const tipo = String(marea.tipoMarea || "").toLowerCase();
      const idTipo = Number(marea.idTipoMarea);
      if (idTipo === 1 || tipo.includes("preamar") || tipo.includes("pleamar")) pleamares.push(hora);
      if (idTipo === 0 || tipo.includes("baixamar") || tipo.includes("bajamar")) bajamares.push(hora);
    });
    return { pleamares, bajamares };
  }

  function prepararPanel() {
    const panel = document.getElementById("marea");
    const lista = document.getElementById("listaMarea");
    const aviso = document.getElementById("recomendacionMarea");
    if (!panel || !lista || !aviso) return null;

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

    return { lista, aviso, fuente };
  }

  async function cargarMareas() {
    prepararPanel();
    const pleamar = document.getElementById("mareaPleamar");
    const bajamar = document.getElementById("mareaBajamar");
    if (!pleamar || !bajamar) return;

    const url = new URL("https://servizos.meteogalicia.gal/mgrss/predicion/mareas/jsonMareas.action");
    url.searchParams.set("data", fechaMadrid());
    url.searchParams.set("idPorto", String(configuracion.idPorto));

    try {
      const respuesta = await fetch(url.href, { mode: "cors", cache: "no-store" });
      if (!respuesta.ok) throw new Error(`MeteoGalicia respondió ${respuesta.status}`);
      const datos = await respuesta.json();
      const bloque = extraerBloquePuerto(datos);
      if (!bloque) throw new Error("Formato de mareas no reconocido");
      const { pleamares, bajamares } = clasificarMareas(bloque.listaMareas);

      pleamar.textContent = pleamares.length ? pleamares.join(" · ") : "Sin dato";
      bajamar.textContent = bajamares.length ? bajamares.join(" · ") : "Sin dato";
      pleamar.classList.remove("dato-cargando-marea");
      bajamar.classList.remove("dato-cargando-marea");
    } catch (error) {
      console.warn("No se pudieron cargar las mareas de MeteoGalicia en el preview.", error);
      pleamar.textContent = "No disponible";
      bajamar.textContent = "No disponible";
      pleamar.classList.remove("dato-cargando-marea");
      bajamar.classList.remove("dato-cargando-marea");
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
