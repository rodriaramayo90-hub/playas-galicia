(() => {
  const catalogo = () => window.HoyTocaPlaya?.playas || [];

  function normalizar(valor) {
    return (valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function obtenerSlug(elemento) {
    const enlace = elemento.querySelector('.enlace-ficha-playa[href*="playas/"]');
    if (!enlace) return null;
    const href = enlace.getAttribute("href") || "";
    const coincidencia = href.match(/playas\/([^/]+)\//);
    return coincidencia?.[1] || null;
  }

  function encontrarPlaya(elemento) {
    const nombre = elemento.querySelector("h2, .nombre-playa-tabla .enlace-ficha-playa, .nombre-playa-tabla span")?.textContent?.trim();
    if (!nombre) return null;

    const slug = obtenerSlug(elemento);
    if (slug) {
      const porSlug = catalogo().find(playa => playa.slugFicha === slug);
      if (porSlug) return porSlug;
    }

    const coincidencias = catalogo().filter(playa => normalizar(playa.nombre) === normalizar(nombre));
    return coincidencias.length === 1 ? coincidencias[0] : coincidencias[0] || null;
  }

  function crearIconoUbicacion() {
    const envoltorio = document.createElement("span");
    envoltorio.className = "municipio-pin";
    envoltorio.setAttribute("aria-hidden", "true");
    envoltorio.innerHTML = `
      <svg viewBox="0 0 24 30" focusable="false" aria-hidden="true">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 8.8 12 18 12 18s12-9.2 12-18C24 5.37 18.63 0 12 0Z" fill="currentColor"/>
        <circle cx="12" cy="12" r="4.3" fill="white"/>
      </svg>`;
    return envoltorio;
  }

  function decorarTarjeta(tarjeta) {
    const playa = encontrarPlaya(tarjeta);
    if (!playa?.municipio) return;

    tarjeta.dataset.municipio = playa.municipio;

    let municipio = tarjeta.querySelector(".municipio-playa");
    if (!municipio) {
      municipio = document.createElement("div");
      municipio.className = "municipio-playa";
      const titulo = tarjeta.querySelector(".titulo-playa-con-maps");
      titulo?.insertAdjacentElement("afterend", municipio);
    }

    municipio.replaceChildren();
    municipio.appendChild(crearIconoUbicacion());
    const texto = document.createElement("span");
    texto.textContent = playa.municipio;
    municipio.appendChild(texto);
  }

  function decorarFila(fila) {
    const playa = encontrarPlaya(fila);
    if (playa?.municipio) fila.dataset.municipio = playa.municipio;
  }

  function decorarRanking() {
    document.querySelectorAll("#ranking-mobile .tarjeta-playa").forEach(decorarTarjeta);
    document.querySelectorAll("#ranking tr").forEach(decorarFila);
  }

  const estilo = document.createElement("style");
  estilo.textContent = `
    .municipio-playa {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 3px;
      margin-bottom: 2px;
      color: #55707c;
      font-size: 0.8rem;
      font-weight: 600;
      line-height: 1.2;
    }
    .municipio-pin {
      display: inline-flex;
      flex: 0 0 auto;
      width: 12px;
      height: 15px;
      color: #0b9298;
    }
    .municipio-pin svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;
  document.head.appendChild(estilo);

  const ranking = document.getElementById("ranking");
  const rankingMobile = document.getElementById("ranking-mobile");
  if (!ranking || !rankingMobile) return;

  const observador = new MutationObserver(decorarRanking);
  observador.observe(ranking, { childList: true });
  observador.observe(rankingMobile, { childList: true });
  decorarRanking();
})();
