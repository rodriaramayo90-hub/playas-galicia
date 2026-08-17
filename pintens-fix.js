// Correcciones verificadas in situ para la ficha de Praia de Pinténs.
(() => {
  let intentos = 0;
  const aplicar = () => {
    intentos += 1;
    const descripcion = document.getElementById("descripcionPlaya");
    const servicios = document.getElementById("listaServicios");
    if (!descripcion || !servicios) return;

    const textoCamping = "La playa está situada justo debajo de un camping.";
    if (descripcion.textContent && descripcion.textContent !== "Información no disponible" && !descripcion.textContent.includes(textoCamping)) {
      descripcion.textContent = `${descripcion.textContent} ${textoCamping}`;
    }

    servicios.querySelectorAll("div").forEach(fila => {
      const etiqueta = fila.querySelector("dt")?.textContent || "";
      const valor = fila.querySelector("dd");
      if (valor && etiqueta.includes("Restaurantes cercanos")) {
        valor.textContent = "Sí · Restaurante justo encima de la playa; para comer conviene reservar previamente";
        valor.classList.remove("dato-no-disponible");
      }
    });

    if (intentos < 20 && descripcion.textContent === "Información no disponible") setTimeout(aplicar, 250);
  };
  setTimeout(aplicar, 50);
})();
