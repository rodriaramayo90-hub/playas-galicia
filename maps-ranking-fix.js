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
})();
