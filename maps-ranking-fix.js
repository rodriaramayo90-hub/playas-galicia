(() => {
  const destinosEspeciales = {
    "Playa de Sada||Sada": "Praia de Sada, Sada, A Coruña, Galicia",
    "Praia de Compostela||Vilagarcía de Arousa": "Compostela, Vilagarcía de Arousa, Pontevedra, Galicia"
  };

  const crearUrlComoLlegar = playa => {
    const clave = `${playa.nombre}||${playa.municipio}`;
    const destino = destinosEspeciales[clave]
      || playa.destinoMaps
      || `${playa.nombre}, ${playa.municipio}, Galicia`;
    const parametros = new URLSearchParams({ api: "1", destination: destino });
    return `https://www.google.com/maps/dir/?${parametros.toString()}`;
  };

  window.crearEnlaceGoogleMaps = crearUrlComoLlegar;
  if (window.HoyTocaPlaya) window.HoyTocaPlaya.crearEnlaceGoogleMaps = crearUrlComoLlegar;

  const crearEnlaceFichaLimpio = slug => {
    const rutaLimpia = `playas/${slug}/`;
    if (typeof window === "undefined" || window.location?.hostname !== "htmlpreview.github.io") return rutaLimpia;
    const rutaPreview = `playas/${slug}/index.html`;
    const fuente = decodeURIComponent(window.location.search.slice(1)).split("#")[0];
    if (!fuente.includes("github.com/") || !fuente.endsWith("/index.html")) return rutaPreview;
    const raizFuente = fuente.slice(0, fuente.lastIndexOf("/") + 1);
    return `${window.location.origin}${window.location.pathname}?${raizFuente}${rutaPreview}`;
  };

  window.crearEnlaceFicha = crearEnlaceFichaLimpio;
  try { crearEnlaceFicha = crearEnlaceFichaLimpio; } catch (_) {}
  if (window.HoyTocaPlaya) window.HoyTocaPlaya.crearEnlaceFicha = crearEnlaceFichaLimpio;

  const limpiarEnlacesFichas = raiz => {
    if (window.location?.hostname === "htmlpreview.github.io") return;
    const scope = raiz && raiz.querySelectorAll ? raiz : document;
    scope.querySelectorAll('a[href*="/playas/"][href$="/index.html"], a[href^="playas/"][href$="/index.html"]').forEach(enlace => {
      enlace.setAttribute("href", enlace.getAttribute("href").replace(/\/index\.html$/, "/"));
    });
  };

  window.addEventListener("DOMContentLoaded", () => {
    limpiarEnlacesFichas(document);
    const ranking = document.getElementById("ranking");
    const rankingMobile = document.getElementById("ranking-mobile");
    [ranking, rankingMobile].filter(Boolean).forEach(contenedor => {
      new MutationObserver(() => limpiarEnlacesFichas(contenedor)).observe(contenedor, { childList: true, subtree: true });
    });

    document.addEventListener("click", evento => {
      if (window.location?.hostname === "htmlpreview.github.io") return;
      const enlace = evento.target.closest?.('a[href*="/playas/"][href$="/index.html"], a[href^="playas/"][href$="/index.html"]');
      if (enlace) enlace.setAttribute("href", enlace.getAttribute("href").replace(/\/index\.html$/, "/"));
    }, true);

    const botonBuscar = document.querySelector(".btn-buscar");
    const estadoCarga = document.getElementById("estadoCarga");
    const tablaScroll = document.querySelector(".tabla-scroll");
    if (!botonBuscar || !estadoCarga || !tablaScroll) return;

    botonBuscar.addEventListener("click", () => {
      if (!window.matchMedia("(min-width: 769px)").matches) return;
      const observador = new MutationObserver(() => {
        const tipo = estadoCarga.dataset.tipo;
        if (tipo !== "exito" && tipo !== "error") return;
        observador.disconnect();
        if (tipo !== "exito") return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          tablaScroll.scrollTop = 0;
          const destinoY = window.scrollY + tablaScroll.getBoundingClientRect().top - 12;
          window.scrollTo({ top: Math.max(0, destinoY), behavior: "smooth" });
        }));
      });
      observador.observe(estadoCarga, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["data-tipo"] });
    });
  });
})();
