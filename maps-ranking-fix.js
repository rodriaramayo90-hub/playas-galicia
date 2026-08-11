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

  // En escritorio, al pulsar "Buscar" espera a que termine la actualización
  // y lleva suavemente al usuario a la primera fila visible del ranking.
  window.addEventListener("DOMContentLoaded", () => {
    const botonBuscar = document.querySelector(".btn-buscar");
    const estadoCarga = document.getElementById("estadoCarga");
    if (!botonBuscar || !estadoCarga) return;

    botonBuscar.addEventListener("click", () => {
      if (!window.matchMedia("(min-width: 769px)").matches) return;

      const observador = new MutationObserver(() => {
        const tipo = estadoCarga.dataset.tipo;
        if (tipo !== "exito" && tipo !== "error") return;

        observador.disconnect();
        if (tipo !== "exito") return;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const primeraFila = Array.from(document.querySelectorAll("#ranking tr"))
              .find(fila => !fila.hidden);
            const destino = primeraFila || document.querySelector(".tabla-scroll");
            destino?.scrollIntoView({ behavior: "smooth", block: "start" });
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
