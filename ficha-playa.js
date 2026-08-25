(() => {
  const scriptActual = document.currentScript?.src || "";
  const raiz = new URL(".", scriptActual || window.location.href);
  window.URL_RAIZ_RECURSOS = raiz.href;

  if (!document.querySelector('link[data-hoytoca-mareas="1"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("mareas-ficha.css?v=1", raiz).href;
    css.dataset.hoytocaMareas = "1";
    document.head.append(css);
  }

  async function ejecutarArchivo(nombre) {
    const url = new URL(nombre, raiz);
    url.searchParams.set("v", "1");
    const respuesta = await fetch(url.href, { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`${nombre} respondió ${respuesta.status}`);
    const codigo = await respuesta.text();
    (0, eval)(`${codigo}\n//# sourceURL=${url.href}`);
  }

  (async () => {
    try {
      await ejecutarArchivo("fotos-propias.js");
      await ejecutarArchivo("ficha-playa-base.js");
      await ejecutarArchivo("cies-servicios.js");
      await ejecutarArchivo("mareas-ficha.js");
    } catch (error) {
      console.error("No se pudo iniciar la ficha de playa.", error);
      const estado = document.getElementById("estadoCondiciones");
      if (estado) {
        estado.textContent = "No se pudieron cargar los datos de la ficha. Recarga la página en unos segundos.";
        estado.classList.add("condiciones-error");
      }
      const actualizacion = document.getElementById("actualizacionCondiciones");
      if (actualizacion) actualizacion.textContent = "Sin actualizar";
    }
  })();
})();
