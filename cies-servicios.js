(() => {
  const PLAYAS_CIES = new Set([
    "playa-de-rodas-islas-cies",
    "praia-de-nosa-senora-islas-cies",
    "praia-de-figueiras-islas-cies"
  ]);

  const slug = document.body?.dataset?.playaSlug;
  if (!PLAYAS_CIES.has(slug)) return;

  const SERVICIOS = {
    "Duchas": "No en las playas · Hay ducha en un vestuario; el agua caliente se paga con monedas de 0,10 €",
    "Chiringuito": "No",
    "Restaurantes cercanos": "Sí · Restaurante Rodas · Restaurante Tapería Illas Cíes · Bar Restaurante Serafín · Bocatería Begoña"
  };

  const FUENTE_RESTAURANTES = "https://www.piratasdenabia.com/islas-cies/restaurantes/";

  function actualizarServicios() {
    const lista = document.getElementById("listaServicios");
    if (!lista || !lista.children.length) return false;

    lista.querySelectorAll("div").forEach(fila => {
      const etiqueta = fila.querySelector("dt")?.textContent || "";
      const valor = fila.querySelector("dd");
      if (!valor) return;

      for (const [clave, texto] of Object.entries(SERVICIOS)) {
        if (!etiqueta.includes(clave)) continue;
        valor.textContent = texto;
        valor.classList.remove("dato-no-disponible");
        break;
      }
    });

    const fuentes = document.getElementById("fuentesConsultadas");
    if (fuentes && !fuentes.querySelector(`a[href="${FUENTE_RESTAURANTES}"]`)) {
      const elemento = document.createElement("li");
      const enlace = document.createElement("a");
      enlace.href = FUENTE_RESTAURANTES;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      enlace.textContent = "Piratas de Nabia · Restaurantes en las Islas Cíes";
      elemento.append(enlace);

      const nota = document.createElement("small");
      nota.textContent = "Referencia para los establecimientos de restauración disponibles en las Islas Cíes.";
      elemento.append(nota);
      fuentes.append(elemento);
    }

    return true;
  }

  const observador = new MutationObserver(() => {
    if (actualizarServicios()) observador.disconnect();
  });

  if (!actualizarServicios()) {
    observador.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
