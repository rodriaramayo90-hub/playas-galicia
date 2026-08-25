(() => {
  const fotosPropias = {
    "praia-de-figueiras-islas-cies": {
      archivo: "imagenes/playas/praia-de-figueiras-islas-cies.webp",
      alt: "Praia de Figueiras, Islas Cíes"
    },
    "praia-de-nosa-senora-islas-cies": {
      archivo: "imagenes/playas/praia-de-nosa-senora-islas-cies.webp",
      alt: "Praia de Nosa Señora, Islas Cíes"
    },
    "playa-de-rodas-islas-cies": {
      archivo: "imagenes/playas/playa-de-rodas-islas-cies.webp",
      alt: "Praia de Rodas, Islas Cíes"
    }
  };

  const foto = fotosPropias[document.body?.dataset?.playaSlug];
  const contenedor = document.getElementById("fotoPrincipal");
  if (!foto || !contenedor) return;

  const url = new URL(foto.archivo, window.URL_RAIZ_RECURSOS || window.location.href).href;

  function aplicarFotoPropia() {
    const actual = contenedor.querySelector('img[data-foto-propia="1"]');
    if (actual?.src === url) return;

    const imagen = document.createElement("img");
    imagen.src = url;
    imagen.alt = foto.alt;
    imagen.fetchPriority = "high";
    imagen.dataset.fotoPropia = "1";
    contenedor.replaceChildren(imagen);
  }

  const observador = new MutationObserver(() => {
    if (!contenedor.querySelector('img[data-foto-propia="1"]')) aplicarFotoPropia();
  });
  observador.observe(contenedor, { childList: true });
  aplicarFotoPropia();

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.content = url;
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage) twitterImage.content = url;
})();
