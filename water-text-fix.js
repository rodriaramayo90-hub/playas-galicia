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

// PREVIEW LIMPIO: solo cambia la curva de temperatura, elimina el tope de 84
// y mantiene decimales internamente para ordenar. No usa observers ni scripts extra.
puntosTemperatura = function puntosTemperaturaContinua(temp) {
  if (!Number.isFinite(temp)) return 0;
  const puntos = [
    [14, -12], [16, -8], [18, -4], [20, 0], [23, 6], [25, 10],
    [27, 14], [28, 16], [29, 17], [30, 18], [31, 18], [32, 17],
    [34, 14], [36, 10]
  ];

  if (temp <= puntos[0][0]) return puntos[0][1] + (temp - puntos[0][0]) * 2;
  if (temp >= puntos[puntos.length - 1][0]) {
    return Math.max(0, puntos[puntos.length - 1][1] - (temp - puntos[puntos.length - 1][0]) * 2);
  }

  for (let i = 0; i < puntos.length - 1; i += 1) {
    const [t1, p1] = puntos[i];
    const [t2, p2] = puntos[i + 1];
    if (temp >= t1 && temp <= t2) {
      const proporcion = (temp - t1) / (t2 - t1);
      return p1 + (p2 - p1) * proporcion;
    }
  }
  return 0;
};

calcularPuntuacion = function calcularPuntuacionContinua(
  temperaturaMediaPlaya,
  viento,
  vientoMaximo,
  lluvia,
  nubosidad,
  agua,
  oleaje,
  anguloPlaya,
  direccionVientoGrados
) {
  let puntuacion = 10;
  puntuacion += puntosNubosidad(nubosidad);
  puntuacion += puntosLluvia(lluvia);
  puntuacion += puntosTemperatura(temperaturaMediaPlaya);
  puntuacion += puntosConfortSolar(temperaturaMediaPlaya, viento, lluvia, nubosidad);
  puntuacion += puntosViento(viento);
  puntuacion += puntosVientoMaximo(vientoMaximo);
  puntuacion += puntosOrientacion(anguloPlaya, direccionVientoGrados, viento);
  puntuacion += puntosAgua(agua);
  puntuacion += puntosOleaje(oleaje);
  return Number(Math.max(0, Math.min(100, puntuacion)).toFixed(2));
};

ajustarPuntuacionACategoria = function ajustarPuntuacionSinTope84(puntos, estado) {
  if (estado.includes("Mejor evitar")) return Math.min(puntos, 34);
  if (estado.includes("Poco recomendable")) return Math.min(puntos, 49);
  if (estado.includes("Aceptable")) return Math.min(puntos, 69);
  return puntos;
};

function redondearPuntajesVisiblesPreview() {
  document.querySelectorAll("#ranking tr td:nth-child(12)").forEach(celda => {
    const valor = Number(celda.textContent.trim().replace(",", "."));
    if (Number.isFinite(valor)) celda.textContent = String(Math.round(valor));
  });

  document.querySelectorAll("#ranking-mobile .puntuacion strong").forEach(elemento => {
    const valor = parseFloat(elemento.textContent.replace(",", "."));
    if (!Number.isFinite(valor)) return;
    elemento.innerHTML = `${Math.round(valor)}<small>/100</small>`;
  });
}

const cargarRankingOriginalPreview = cargarRanking;
cargarRanking = async function cargarRankingPreview(...args) {
  const resultado = await cargarRankingOriginalPreview.apply(this, args);
  redondearPuntajesVisiblesPreview();
  return resultado;
};
