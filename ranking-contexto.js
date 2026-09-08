(() => {
  function leerEntero(parametros, nombre) {
    const valor = parametros.get(nombre);
    if (valor === null || valor === "") return null;
    const numero = Number(valor);
    return Number.isInteger(numero) ? numero : null;
  }

  function contextoDesdeUrl() {
    const parametros = new URLSearchParams(window.location.search);
    const dia = leerEntero(parametros, "dia");
    const desde = leerEntero(parametros, "desde");
    const hasta = leerEntero(parametros, "hasta");

    if (dia !== 0 && dia !== 1) return null;
    if (desde === null || hasta === null) return null;
    if (desde < 7 || desde > 22 || hasta < 7 || hasta > 22 || desde > hasta) return null;

    return { dia, desde, hasta };
  }

  function aplicarContextoInicial() {
    const contexto = contextoDesdeUrl();
    if (!contexto) return;

    diaSeleccionado = contexto.dia;
    horaInicioSeleccionada = contexto.desde;
    horaFinSeleccionada = contexto.hasta;

    const inicio = document.getElementById("horaInicio");
    const fin = document.getElementById("horaFin");
    const resumen = document.getElementById("resumenHorario");
    if (inicio) inicio.value = String(contexto.desde);
    if (fin) fin.value = String(contexto.hasta);
    if (resumen) resumen.textContent = `De ${contexto.desde}:00 a ${contexto.hasta}:00`;
  }

  function parametrosContextoActual() {
    return new URLSearchParams({
      dia: String(diaSeleccionado),
      desde: String(horaInicioSeleccionada),
      hasta: String(horaFinSeleccionada)
    }).toString();
  }

  crearEnlaceFicha = function (slug) {
    const parametros = parametrosContextoActual();
    const ruta = `playas/${slug}/index.html?${parametros}`;

    if (window.location?.hostname !== "htmlpreview.github.io") return ruta;

    const fuente = decodeURIComponent(window.location.search.slice(1)).split("#")[0];
    if (!fuente.includes("github.com/") || !fuente.includes("/index.html")) return ruta;
    const raizFuente = fuente.slice(0, fuente.lastIndexOf("/") + 1);
    return `${window.location.origin}${window.location.pathname}?${raizFuente}${ruta}`;
  };

  aplicarContextoInicial();
})();
