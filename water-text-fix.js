// Ajuste de copy para la descripción de temperatura del agua.
// Se mantiene exactamente la misma lógica y los mismos umbrales.
if (typeof obtenerEstadoAgua === "function") {
  obtenerEstadoAgua = function (agua) {
    if (!agua) return null;
    if (agua < 14) return "agua congelada";
    if (agua < 18) return "agua muy fría";
    if (agua <= 21) return "agua fría al principio, luego agradable";
    if (agua <= 25) return "agua agradable";
    return "agua cálida";
  };
}
