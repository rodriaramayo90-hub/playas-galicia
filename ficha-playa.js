(() => {
  const scriptActual = document.currentScript?.src || "";
  let raiz;

  try {
    raiz = new URL(".", scriptActual || window.location.href);
  } catch {
    raiz = new URL("https://cdn.jsdelivr.net/gh/rodriaramayo90-hub/playas-galicia@preview-mareas-dinamicas/");
  }

  // HTMLPreview sirve los recursos de la rama mediante jsDelivr. Fijamos una raíz
  // estable para que el código base y los JSON compartidos no dependan de la URL
  // visible del wrapper htmlpreview.github.io.
  if (raiz.hostname === "htmlpreview.github.io") {
    raiz = new URL("https://cdn.jsdelivr.net/gh/rodriaramayo90-hub/playas-galicia@preview-mareas-dinamicas/");
  }
  window.URL_RAIZ_RECURSOS = raiz.href;

  if (!document.querySelector('link[data-hoytoca-mareas="1"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("mareas-ficha.css?v=3", raiz).href;
    css.dataset.hoytocaMareas = "1";
    document.head.append(css);
  }

  async function ejecutarArchivo(nombre) {
    const url = new URL(nombre, raiz);
    url.searchParams.set("preview", String(Date.now()));
    const respuesta = await fetch(url.href, { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`${nombre} respondió ${respuesta.status}`);
    const codigo = await respuesta.text();
    (0, eval)(`${codigo}\n//# sourceURL=${url.href}`);
  }

  (async () => {
    try {
      await ejecutarArchivo("ficha-playa-base.js");
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
