// Praia de Areacova: alta local añadida tras verificar que no estaba en el catálogo del ranking.
if (typeof playas !== "undefined" && !playas.some(p => p.nombre === "Praia de Areacova" && p.municipio === "Cangas")) {
  playas.push({
    nombre: "Praia de Areacova",
    municipio: "Cangas",
    provincia: "Pontevedra",
    lat: 42.287894,
    lon: -8.820833,
    orientacion: "SE",
    anguloAproximado: 140,
    nivelAbrigo: "alto",
    zonaMeteorologica: "aldan",
    destinoMaps: "Praia de Areacova, Aldán, Cangas, Galicia"
  });
  if (window.HoyTocaPlayaIndiceFichas) {
    window.HoyTocaPlayaIndiceFichas["Praia de Areacova||Cangas"] = "praia-de-areacova";
  }
  // app.js ya puede haber iniciado una primera carga; repetimos para incorporar la nueva playa.
  if (typeof cargarRanking === "function") cargarRanking();
}
