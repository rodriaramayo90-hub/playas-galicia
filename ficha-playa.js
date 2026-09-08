(() => {
  const scriptActual = document.currentScript?.src || "";
  const raiz = new URL(".", scriptActual || window.location.href);
  window.URL_RAIZ_RECURSOS = raiz.href;

  function leerEntero(parametros, nombre) {
    const valor = parametros.get(nombre);
    if (valor === null || valor === "") return null;
    const numero = Number(valor);
    return Number.isInteger(numero) ? numero : null;
  }

  function obtenerContextoFicha() {
    let consulta = window.location.search.slice(1);
    if (window.location.hostname === "htmlpreview.github.io") {
      const fuente = decodeURIComponent(consulta).split("#")[0];
      const indiceParametros = fuente.lastIndexOf("?");
      consulta = indiceParametros >= 0 ? fuente.slice(indiceParametros + 1) : "";
    }

    const parametros = new URLSearchParams(consulta);
    const dia = leerEntero(parametros, "dia");
    const desde = leerEntero(parametros, "desde");
    const hasta = leerEntero(parametros, "hasta");
    const contextoValido =
      (dia === 0 || dia === 1) &&
      desde !== null && hasta !== null &&
      desde >= 7 && desde <= 22 &&
      hasta >= 7 && hasta <= 22 &&
      desde <= hasta;

    return contextoValido
      ? { dia, desde, hasta }
      : { dia: 0, desde: 11, hasta: 20 };
  }

  const contextoFicha = obtenerContextoFicha();

  function aplicarContextoVisual() {
    const referenciaDia = contextoFicha.dia === 1 ? "mañana" : "hoy";
    const titulo = document.getElementById("tituloCondiciones");
    if (titulo) titulo.textContent = `Condiciones para ${referenciaDia}`;

    const enlaceRanking = document.querySelector(".enlace-ranking");
    if (enlaceRanking) {
      const parametros = new URLSearchParams({
        dia: String(contextoFicha.dia),
        desde: String(contextoFicha.desde),
        hasta: String(contextoFicha.hasta)
      });
      enlaceRanking.textContent = `Ver ranking de ${referenciaDia} →`;
      enlaceRanking.href = `../../?${parametros.toString()}`;
    }

    const estado = document.getElementById("estadoCondiciones");
    if (estado) estado.textContent = "Consultando las condiciones previstas…";

    const actualizacion = document.getElementById("actualizacionCondiciones");
    if (actualizacion) {
      const horario = `${contextoFicha.desde}:00–${contextoFicha.hasta}:00`;
      const observador = new MutationObserver(() => {
        if (!actualizacion.textContent.startsWith("Consultado:")) return;
        if (actualizacion.textContent.includes(horario)) return;
        observador.disconnect();
        actualizacion.textContent = `${actualizacion.textContent} · ${horario}`;
      });
      observador.observe(actualizacion, { childList: true, characterData: true, subtree: true });
    }
  }

  aplicarContextoVisual();

  if (window.HoyTocaPlaya?.obtenerCondicionesPlaya) {
    const obtenerCondicionesOriginal = window.HoyTocaPlaya.obtenerCondicionesPlaya;
    window.HoyTocaPlaya.obtenerCondicionesPlaya = function (nombre, _dia, _desde, _hasta, municipio) {
      return obtenerCondicionesOriginal(
        nombre,
        contextoFicha.dia,
        contextoFicha.desde,
        contextoFicha.hasta,
        municipio
      );
    };
  }

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
