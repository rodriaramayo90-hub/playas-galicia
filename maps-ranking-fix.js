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

    const parametros = new URLSearchParams({
      api: "1",
      destination: destino
    });

    return `https://www.google.com/maps/dir/?${parametros.toString()}`;
  };

  window.crearEnlaceGoogleMaps = crearUrlComoLlegar;

  if (window.HoyTocaPlaya) {
    window.HoyTocaPlaya.crearEnlaceGoogleMaps = crearUrlComoLlegar;
  }

  // En producción usamos siempre la URL canónica limpia de cada ficha
  // (sin /index.html). En htmlpreview mantenemos index.html porque el visor
  // necesita la ruta física del archivo para poder abrir la ficha.
  const crearEnlaceFichaLimpio = slug => {
    const rutaLimpia = `playas/${slug}/`;
    if (typeof window === "undefined" || window.location?.hostname !== "htmlpreview.github.io") {
      return rutaLimpia;
    }

    const rutaPreview = `playas/${slug}/index.html`;
    const fuente = decodeURIComponent(window.location.search.slice(1)).split("#")[0];
    if (!fuente.includes("github.com/") || !fuente.endsWith("/index.html")) return rutaPreview;
    const raizFuente = fuente.slice(0, fuente.lastIndexOf("/") + 1);
    return `${window.location.origin}${window.location.pathname}?${raizFuente}${rutaPreview}`;
  };

  window.crearEnlaceFicha = crearEnlaceFichaLimpio;
  // La función original de app.js es una vinculación global en scripts clásicos;
  // esta asignación hace que el ranking use la versión limpia al renderizar enlaces.
  try {
    crearEnlaceFicha = crearEnlaceFichaLimpio;
  } catch (_) {
    // Si el navegador no expone la vinculación global, window sigue cubriendo el caso normal.
  }

  if (window.HoyTocaPlaya) {
    window.HoyTocaPlaya.crearEnlaceFicha = crearEnlaceFichaLimpio;
  }

  // En escritorio, al pulsar "Buscar" espera a que termine la actualización
  // y desplaza la página hasta el inicio de la tabla, dejando visible el puesto 1.
  window.addEventListener("DOMContentLoaded", () => {
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

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // La tabla tiene su propio scroll vertical. Lo reiniciamos para que
            // la primera fila no quede escondida detrás de la cabecera sticky.
            tablaScroll.scrollTop = 0;

            // Desplazamos solo la página (no una fila dentro del contenedor).
            const margenSuperior = 12;
            const destinoY = window.scrollY + tablaScroll.getBoundingClientRect().top - margenSuperior;
            window.scrollTo({
              top: Math.max(0, destinoY),
              behavior: "smooth"
            });
          });
        });
      });

      observador.observe(estadoCarga, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-tipo"]
      });
    });
  });
})();
