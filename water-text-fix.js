// Ajuste de copy para la descripción de temperatura del agua.
if (typeof obtenerEstadoAgua === "function") {
  obtenerEstadoAgua = function (agua) {
    if (!agua) return null;
    if (agua < 14) return "agua congelada";
    if (agua < 18) return "agua muy fría";
    if (agua < 19) return "agua fría";
    if (agua <= 21) return "agua fría al principio, luego agradable";
    if (agua <= 25) return "agua agradable";
    return "agua cálida";
  };
}

// Curva continua de temperatura. Mantiene diferencias entre playas sin
// infravalorar una tarde claramente veraniega: 26–28 °C es el rango óptimo.
puntosTemperatura = function puntosTemperaturaContinua(temp) {
  if (!Number.isFinite(temp)) return 0;
  const puntos = [
    [14, -12], [16, -8], [18, -4], [20, 0], [22, 4], [23, 8],
    [24, 12], [25, 16], [26, 18], [27, 20], [28, 20], [29, 19],
    [30, 18], [31, 16], [32, 14], [34, 9], [36, 3]
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

// Curva continua para la temperatura del agua. Evita saltos bruscos de varios
// puntos por una décima de grado, algo especialmente importante porque la SST
// es una estimación de modelo y no una medición exacta en la orilla.
puntosAgua = function puntosAguaContinua(agua) {
  if (!Number.isFinite(agua)) return 0;

  const puntos = [
    [14, -6],
    [15, -5],
    [16, -4],
    [17, -2],
    [18, 0],
    [19, 2],
    [20, 4],
    [21, 5],
    [22, 6]
  ];

  if (agua <= puntos[0][0]) return puntos[0][1];
  if (agua >= puntos[puntos.length - 1][0]) return puntos[puntos.length - 1][1];

  for (let i = 0; i < puntos.length - 1; i += 1) {
    const [t1, p1] = puntos[i];
    const [t2, p2] = puntos[i + 1];
    if (agua >= t1 && agua <= t2) {
      const proporcion = (agua - t1) / (t2 - t1);
      return p1 + (p2 - p1) * proporcion;
    }
  }

  return 0;
};

// El abrigo direccional ya reduce la velocidad efectiva cuando el viento llega
// desde tierra. Por eso la orientación solo penaliza viento que entra por la
// apertura de la playa: no añade puntos extra por viento offshore y evita así
// premiar dos veces una misma situación de abrigo.
puntosOrientacion = function puntosOrientacionSinDobleBonus(
  anguloPlaya,
  direccionVientoGrados,
  viento
) {
  if (!Number.isFinite(anguloPlaya) || !Number.isFinite(direccionVientoGrados) || viento <= 15) return 0;
  const diferencia = diferenciaAngular(anguloPlaya, direccionVientoGrados);
  const componenteFrontal = Math.cos(diferencia * Math.PI / 180);
  if (componenteFrontal <= 0) return 0;
  const intensidad = Math.min(1, (viento - 15) / 15);
  return Math.round(-5 * componenteFrontal * intensidad);
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

// La categoría sigue una jerarquía clara por puntuación:
// 85–100 Excelente, 70–84 Buen día, 50–69 Aceptable,
// 35–49 Poco recomendable y 0–34 Mejor evitar.
obtenerEstado = function obtenerEstadoCoherente(
  puntos,
  nubosidad,
  anguloPlaya,
  direccionVientoGrados,
  viento,
  vientoMaximo,
  lluvia,
  temperatura,
  agua,
  oleaje
) {
  const vientoEnContra = esVientoEnContra(anguloPlaya, direccionVientoGrados, viento);

  if (puntos < 35) return "🔴 Mejor evitar";
  if (puntos < 50) return "🟠 Poco recomendable";

  if (vientoEnContra && nubosidad > 80) return "🟡 Aceptable (muy nublado y viento en contra)";
  if (vientoEnContra && nubosidad > 60) return "🟡 Aceptable (nublado y viento en contra)";
  if (nubosidad > 80) return "🟡 Aceptable (muy nublado)";
  if (nubosidad > 60) return "🟡 Aceptable (nublado)";
  if (vientoEnContra) return "🟡 Aceptable (viento en contra)";

  if (puntos >= 85) return "🟢 Excelente";
  if (puntos >= 70) return "🟢 Buen día de playa";
  return "🟡 Aceptable";
};

ajustarPuntuacionACategoria = function ajustarPuntuacionSinTope84(puntos, estado) {
  if (estado.includes("Mejor evitar")) return Math.min(puntos, 34);
  if (estado.includes("Poco recomendable")) return Math.min(puntos, 49);
  if (estado.includes("Aceptable")) return Math.min(puntos, 69);
  return puntos;
};

// Clasificación textual del viento pensada para la experiencia real en playa.
// Mantiene el cálculo de puntos existente; solo corrige cómo se describe el viento.
if (typeof generarExplicacion === "function") {
  const generarExplicacionOriginalViento = generarExplicacion;

  generarExplicacion = function generarExplicacionConVientoCorregido(...args) {
    const textoOriginal = generarExplicacionOriginalViento(...args);
    const viento = args[1];
    if (typeof textoOriginal !== "string" || !Number.isFinite(viento)) return textoOriginal;

    let etiquetaViento;
    if (viento <= 7) etiquetaViento = "casi sin viento";
    else if (viento <= 12) etiquetaViento = "brisa suave";
    else if (viento <= 18) etiquetaViento = "viento moderado";
    else if (viento <= 25) etiquetaViento = "algo ventoso";
    else etiquetaViento = "ventoso";

    const textoNormalizado = textoOriginal.replace(
      "viento favorable, sopla hacia el mar",
      "viento de tierra hacia el mar"
    );
    const frases = textoNormalizado.replace(/\.$/, "").split(", ").filter(Boolean);
    const etiquetasAnteriores = new Set([
      "poco viento",
      "casi sin viento",
      "brisa suave",
      "viento moderado",
      "algo ventoso",
      "ventoso"
    ]);

    const frasesLimpias = frases.filter(frase => !etiquetasAnteriores.has(frase));
    const frasesLluvia = new Set([
      "sin lluvia prevista",
      "probabilidad muy baja de lluvia",
      "posibilidad de lluvia",
      "riesgo moderado de lluvia",
      "riesgo alto de lluvia"
    ]);

    const indiceLluvia = frasesLimpias.findIndex(frase => frasesLluvia.has(frase));
    if (indiceLluvia >= 0) frasesLimpias.splice(indiceLluvia, 0, etiquetaViento);
    else frasesLimpias.push(etiquetaViento);

    return frasesLimpias.join(", ") + ".";
  };
}

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
