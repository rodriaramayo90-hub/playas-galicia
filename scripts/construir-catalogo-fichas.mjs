import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const ARCHIVO_APP = resolve(RAIZ, "app.js");
const ARCHIVO_FUENTES = resolve(RAIZ, "data", "fuentes-playas.json");
const ARCHIVO_CURADO = resolve(RAIZ, "data", "playas-detalle-curado.json");
const ARCHIVO_SALIDA = resolve(RAIZ, "data", "playas-detalle.json");

const FECHA_VERIFICACION = "9 de agosto de 2026";
const PROVINCIAS_POR_MUNICIPIO = {
  "Cabanas": "A Coruña", "Fisterra": "A Coruña", "Miño": "A Coruña", "Sada": "A Coruña",
  "Oleiros": "A Coruña", "Arteixo": "A Coruña", "A Coruña": "A Coruña", "Muros": "A Coruña",
  "Carnota": "A Coruña", "Ferrol": "A Coruña", "Cedeira": "A Coruña", "Ribeira": "A Coruña",
  "Valdoviño": "A Coruña", "Muxía": "A Coruña", "Porto do Son": "A Coruña",
  "Ribadeo": "Lugo", "Foz": "Lugo", "Viveiro": "Lugo",
  "Vigo": "Pontevedra", "Moaña": "Pontevedra", "Cangas": "Pontevedra", "Marín": "Pontevedra",
  "Bueu": "Pontevedra", "Vilagarcía de Arousa": "Pontevedra", "Sanxenxo": "Pontevedra",
  "O Grove": "Pontevedra", "O Grove / Sanxenxo": "Pontevedra"
};

const FUENTES_ACTUALES = {
  coruna2025: {
    nombre: "Concello da Coruña · temporada de praias 2025",
    url: "https://www.coruna.gal/seguridadecidada/gl/detalle-de-noticias/o-concello-atendera-a-tempada-de-praias-2025-con-35-socorristas-limpeza-reforzada-e-accions/suceso/1453894253584",
    nota: "Socorrismo y servicios municipales publicados para la temporada 2025."
  },
  arteixo2026: {
    nombre: "Concello de Arteixo · praias",
    url: "https://arteixo.org/servizos/turismo/praias/",
    nota: "Servicios de los arenales con Bandera Azul consultados en agosto de 2026."
  },
  sabon2026: {
    nombre: "Concello de Arteixo · aparcamiento de Sabón",
    url: "https://arteixo.org/novo-aparcadoiro-xunto-ao-porto-exterior-para-facilitar-o-acceso-a-praia-de-sabon/",
    nota: "Aparcamiento gratuito inaugurado en junio de 2026."
  },
  ferrolSanXurxo: {
    nombre: "Concello de Ferrol · San Xurxo",
    url: "https://maps.ferrol.gal/gl/mapa-global/resource/r/san-xurxo",
    nota: "Ficha municipal de servicios consultada en agosto de 2026."
  },
  ferrolDoninos: {
    nombre: "Concello de Ferrol · Doniños",
    url: "https://maps.ferrol.gal/en/nature-in-ferrol/resource/r/doniNos-beach",
    nota: "Ficha municipal de servicios consultada en agosto de 2026."
  },
  vigo2026: {
    nombre: "Concello de Vigo · playas y baño adaptado 2026",
    url: "https://hoxe.vigo.org/movemonos/mabiente_playas_intro.php?lang=cas",
    nota: "Programa municipal de baño adaptado para la temporada 2026."
  },
  sanxenxo: {
    nombre: "Concello de Sanxenxo · Ordenanza de playas",
    url: "https://sanxenxo.es/attachments/article/4158/ORDENANZA%20DE%20PLAYAS%202021.pdf",
    nota: "Normas sobre presencia de animales y zonas ambientalmente sensibles."
  },
  cansGalicia: {
    nombre: "Turismo de Galicia · playas para perros",
    url: "https://blog.turismo.gal/praias-para-cans-en-galicia/",
    nota: "Artículo publicado en 2018; conviene confirmar la vigencia con el ayuntamiento antes de desplazarse."
  },
  corrubedo: {
    nombre: "Turismo de Galicia · Parque Natural de Corrubedo",
    url: "https://www.turismo.gal/que-facer/experiencias-en-plena-natureza/unha-duna-mobil-unica?langId=es_ES",
    nota: "Accesos, itinerarios accesibles y normas del espacio protegido."
  },
  islasAtlanticas: {
    nombre: "MITECO · Parque Nacional de las Islas Atlánticas",
    url: "https://www.miteco.gob.es/es/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/islas-atlanticas/guia-visitante/recomendaciones.html",
    nota: "Normas oficiales de visita al parque nacional."
  },
  cangasPerros: {
    nombre: "Concello de Cangas · ordenanza de uso de las playas",
    url: "https://cangas.gal/sites/default/files/2019-12/ordenanza_praias.pdf",
    nota: "La ordenanza municipal prohíbe la presencia de animales en las playas; las excepciones habilitadas por el Concello son A Chimenea y Laxielas."
  },
  vigoPerros: {
    nombre: "Concello de Vigo · ordenanza de protección y tenencia de animales",
    url: "https://hoxe.vigo.org/pdf/medioambiente/ordenanzaanimais.pdf",
    nota: "El artículo 11 prohíbe la circulación o permanencia de perros y otros animales en las playas del 1 de junio al 30 de septiembre."
  },
  fisterraPerros: {
    nombre: "Concello de Fisterra · estancia de perros en las playas",
    url: "https://concellofisterra.gal/portal_cidadan/noticia/gl/746/n",
    nota: "Decreto municipal publicado en 2019 para Mar de Fóra y Arnela; conviene confirmar su vigencia antes de ir."
  },
  marinPerros: {
    nombre: "Concello de Marín · regulación de perros en las playas",
    url: "https://www.concellodemarin.es/goberno-local-propora-cans-poidan-accede-praia-ribeira-veran/",
    nota: "Información municipal publicada en abril de 2026 que resume los horarios de la ordenanza vigente."
  },
  bueuPerros: {
    nombre: "Concello de Bueu · ordenanza de uso de las playas",
    url: "https://concellodebueu.gal/wp-content/uploads/2017/12/Ordenanza_Municipal_Reguladora_Uso_Disfrute_Praias.pdf",
    nota: "Ordenanza publicada que prohíbe animales en playas y zonas de baño. En mayo de 2026 se aprobó inicialmente una modificación todavía sujeta a tramitación."
  },
  moanaPerros: {
    nombre: "Concello de Moaña · ordenanza de animales",
    url: "https://concellodemoana.org/wp-content/uploads/bsk-pdf-manager/ordenanza_de_animais_domsticos_e_salvaxes_en_cautivide_e_cans_perigosos_272.pdf",
    nota: "El artículo 35 prohíbe animales domésticos en las playas y espacios públicos de acceso del 1 de junio al 30 de septiembre."
  },
  corunaPerros: {
    nombre: "Concello da Coruña · ordenanza de playas 2025",
    url: "https://www.coruna.gal/descarga/1453901627504/Ordenanza-playas-castellano_actual.pdf",
    nota: "Ordenanza en vigor desde octubre de 2025: prohíbe perros y otros animales domésticos del 1 de junio al 30 de septiembre, salvo la playa canina de Bens y áreas autorizadas."
  },
  arteixoPerros: {
    nombre: "Concello de Arteixo · ordenanza de playas 2025",
    url: "https://arteixo.org/wp-content/uploads/2020/12/Publicacion-BOP-Aprobacion-definitiva-modificacion.pdf",
    nota: "El artículo 18 prohíbe animales domésticos en las playas del 1 de junio al 30 de septiembre, sin excepción horaria, salvo espacios específicos habilitados."
  },
  ribadeoPerros: {
    nombre: "Concello de Ribadeo · ordenanza de uso de las playas",
    url: "https://www.ribadeo.gal/wp-content/uploads/Ordenanza-praias.pdf",
    nota: "El artículo 24 prohíbe perros en playas y zonas de baño durante Semana Santa y del 15 de mayo al 15 de septiembre, con excepciones expresas."
  },
  viveiroPerros: {
    nombre: "Concello de Viveiro · ordenanza de policía y buen gobierno",
    url: "https://www.viveiro.es/backoffice/file/odenanza-policia-y-buen-gobierno-2757.pdf",
    nota: "El artículo 15 prohíbe la estancia y circulación de animales por las playas del término municipal."
  },
  furnasPortoSon: {
    nombre: "Concello de Porto do Son · Praia das Furnas",
    url: "https://portodoson.gal/turismo/rutas-e-experiencias/son-eterno/praia-das-furnas/",
    nota: "Ficha turística municipal con descripción, coordenadas, precauciones de baño, surf y pasarela accesible."
  }
};

function extraerPlayas(codigo) {
  const inicio = codigo.indexOf("const playas = [");
  const fin = codigo.indexOf("\n];", inicio);
  if (inicio < 0 || fin < 0) throw new Error("No se encontró el catálogo de playas en app.js.");
  const definicion = codigo.slice(inicio + "const playas = ".length, fin + 2);
  return Function(`"use strict"; return (${definicion});`)();
}

function slugificar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function combinarNoNulos(base, ajuste) {
  if (ajuste === null || ajuste === undefined) return base;
  if (Array.isArray(ajuste)) return ajuste;
  if (typeof ajuste !== "object") return ajuste;
  const resultado = { ...(base && typeof base === "object" && !Array.isArray(base) ? base : {}) };
  for (const [clave, valor] of Object.entries(ajuste)) {
    if (valor === null || valor === undefined || valor === "") continue;
    resultado[clave] = combinarNoNulos(resultado[clave], valor);
  }
  return resultado;
}

function valorConDetalles(valor, ...detalles) {
  if (!valor) return null;
  return [valor, ...detalles.filter(Boolean)].join(" · ");
}

function tipoXunta(valor) {
  if (!valor) return null;
  if (valor === "Praia aberta") return "Playa abierta";
  if (valor === "Praia resgardada") return "Playa resguardada";
  return valor;
}

function arenaXunta(valor) {
  if (!valor) return null;
  const normalizado = valor.toLowerCase();
  if (normalizado === "fina") return "Arena fina";
  if (normalizado === "grosa") return "Arena gruesa";
  return valor;
}

function agregarFuente(playa, fuente) {
  if (!fuente || playa.fuentes.some(item => item.url === fuente.url)) return;
  playa.fuentes.push(fuente);
}

function aplicarFuenteMunicipal(playa, clave) {
  agregarFuente(playa, FUENTES_ACTUALES[clave]);
}

function aplicarAjustesVerificados(playa) {
  const nombre = playa.nombreCatalogo;

  if (playa.municipio === "A Coruña") {
    playa.servicios.socorrista = "Sí, durante la temporada municipal de baño";
    aplicarFuenteMunicipal(playa, "coruna2025");
  }

  if (["Praia de Barrañán", "Praia de Valcovo (Area Grande)", "Playa de Sabón"].includes(nombre)) {
    playa.servicios.parking = "Sí";
    playa.servicios.duchas = "Sí";
    playa.servicios.socorrista = "Sí, en temporada de verano";
    playa.servicios.accesibilidad = "Acceso sencillo, rampas y pasarelas de madera";
    playa.normas.deportesAcuaticos = "Permitidos conforme a la señalización y normativa local";
    aplicarFuenteMunicipal(playa, "arteixo2026");
  }
  if (nombre === "Playa de Sabón") {
    playa.servicios.parking = "Sí, 48 plazas gratuitas; una reservada para movilidad reducida";
    aplicarFuenteMunicipal(playa, "sabon2026");
  }

  if (nombre === "Playa de San Xurxo") {
    Object.assign(playa.servicios, {
      parking: "Sí", duchas: "Sí", socorrista: "Sí, en temporada",
      restaurantes: "Bar y restaurante en el entorno"
    });
    aplicarFuenteMunicipal(playa, "ferrolSanXurxo");
  }
  if (nombre === "Praia de Doniños") {
    Object.assign(playa.servicios, {
      parking: "Sí, en ambos extremos del arenal", accesibilidad: "Acceso adaptado",
      duchas: "Sí", socorrista: "Sí, puesto de auxilio y salvamento",
      chiringuito: "Sí, establecimientos de temporada", restaurantes: "Bares en el entorno"
    });
    aplicarFuenteMunicipal(playa, "ferrolDoninos");
  }

  if (["Praia de Canido", "Praia da Fontaíña"].includes(nombre)) {
    playa.servicios.accesibilidad = "Baño adaptado bajo demanda y sujeto a la planificación municipal de 2026";
    aplicarFuenteMunicipal(playa, "vigo2026");
  }

  if (playa.municipio.includes("Sanxenxo") || nombre === "Praia da Lanzada") {
    const sensibles = ["Praia de Major", "Praia da Lanzada", "Praia de Montalvo"];
    playa.normas.perros = sensibles.includes(nombre)
      ? "Prohibidos del 15 de marzo al final de la temporada estival; fuera de ese periodo rige la ordenanza municipal"
      : "Prohibidos durante la temporada de baño y también fuera de ella cuando haya personas usando el arenal, salvo zonas caninas autorizadas";
    aplicarFuenteMunicipal(playa, "sanxenxo");
  }

  if (nombre === "Praia de Cesantes") {
    playa.normas.perros = "Existe un tramo canino de unos 150 m en Os Asteleiros; confirma la vigencia municipal antes de ir";
    aplicarFuenteMunicipal(playa, "cansGalicia");
  }
  if (nombre === "Praia de Arealonga" && playa.municipio === "Redondela") {
    playa.normas.perros = "Zona canina en una cala próxima, a unos 100 m; desaparece con la pleamar. Confirma la vigencia municipal";
    aplicarFuenteMunicipal(playa, "cansGalicia");
  }

  if (["Praia de Vilar", "Praia da Ladeira (Dunas de Corrubedo)"].includes(nombre)) {
    playa.servicios.accesibilidad = "El parque dispone de itinerarios accesibles; confirma el acceso concreto al arenal";
    playa.normas.accesoVehiculos = "Acceso únicamente por las vías y aparcamientos habilitados";
    aplicarFuenteMunicipal(playa, "corrubedo");
  }

  if (nombre === "Playa de Rodas (Islas Cíes)") {
    playa.normas.perros = "No se permite desembarcar animales domésticos, salvo perros guía";
    playa.normas.barbacoasFuego = "Prohibido encender fuego";
    playa.normas.accesoVehiculos = "Sin acceso de vehículos particulares; llegada en barco";
    playa.servicios.transportePublico = "Acceso marítimo mediante navieras autorizadas";
    aplicarFuenteMunicipal(playa, "islasAtlanticas");
  }

  if (playa.municipio === "Cangas") {
    playa.normas.perros = "Prohibida la presencia de animales en las playas; las zonas caninas municipales habilitadas son A Chimenea y Laxielas";
    aplicarFuenteMunicipal(playa, "cangasPerros");
  }

  if (playa.municipio === "Vigo") {
    playa.normas.perros = "Prohibidos del 1 de junio al 30 de septiembre, salvo espacios expresamente habilitados";
    aplicarFuenteMunicipal(playa, "vigoPerros");
  }

  if (playa.municipio === "Fisterra" && ["Playa de Mar de Fóra", "Playa de Arnela"].includes(nombre)) {
    playa.normas.perros = "Permitidos entre el 1 de junio y el 30 de septiembre según el decreto municipal publicado en 2019; confirma su vigencia antes de ir";
    aplicarFuenteMunicipal(playa, "fisterraPerros");
  }

  if (playa.municipio === "Marín") {
    playa.normas.perros = "Prohibidos todo el día del 15 de junio al 15 de septiembre; del 1 de abril al 16 de junio y del 16 al 30 de septiembre, prohibidos de 12:00 a 20:00";
    aplicarFuenteMunicipal(playa, "marinPerros");
  }

  if (playa.municipio === "Bueu") {
    playa.normas.perros = "La ordenanza publicada prohíbe animales en playas y zonas de baño; existe una modificación aprobada inicialmente en mayo de 2026, por lo que conviene confirmar la norma vigente";
    aplicarFuenteMunicipal(playa, "bueuPerros");
  }

  if (playa.municipio === "Moaña") {
    playa.normas.perros = "Prohibidos en las playas y sus espacios públicos de acceso del 1 de junio al 30 de septiembre";
    aplicarFuenteMunicipal(playa, "moanaPerros");
  }

  if (playa.municipio === "A Coruña") {
    playa.normas.perros = "Prohibidos del 1 de junio al 30 de septiembre; la excepción municipal es la playa canina de Bens y las áreas expresamente autorizadas";
    aplicarFuenteMunicipal(playa, "corunaPerros");
  }

  if (playa.municipio === "Arteixo") {
    playa.normas.perros = "Prohibidos del 1 de junio al 30 de septiembre, sin excepción horaria, salvo espacios expresamente habilitados por el Concello";
    aplicarFuenteMunicipal(playa, "arteixoPerros");
  }

  if (playa.municipio === "Ribadeo") {
    playa.normas.perros = "Prohibidos durante Semana Santa y del 15 de mayo al 15 de septiembre; se permite circular por senderos habilitados del entorno con correa";
    aplicarFuenteMunicipal(playa, "ribadeoPerros");
  }

  if (playa.municipio === "Viveiro") {
    playa.normas.perros = "Prohibida la estancia y circulación de animales por las playas del municipio";
    aplicarFuenteMunicipal(playa, "viveiroPerros");
  }

  if (nombre === "Praia das Furnas" && playa.municipio === "Porto do Son") {
    playa.descripcion = "Playa conocida por las piscinas naturales formadas en las rocas de pizarra de punta Pedras Negras. El mar y el viento suelen ser intensos, por lo que es frecuentada para practicar surf y exige especial precaución durante el baño.";
    playa.servicios.accesibilidad = "Una pasarela accesible recorre el largo de la playa";
    playa.normas.deportesAcuaticos = "Lugar frecuentado para surf, windsurf, kitesurf y bodyboard";
    playa.bano.oleajeHabitual = "Mar bravo; extremar las precauciones";
    aplicarFuenteMunicipal(playa, "furnasPortoSon");
  }

  // Las normas del parque nacional son más restrictivas que la ordenanza general de Vigo.
  if (nombre === "Playa de Rodas (Islas Cíes)") {
    playa.normas.perros = "No se permite desembarcar animales domésticos, salvo perros guía";
    aplicarFuenteMunicipal(playa, "islasAtlanticas");
  }
}

function construirFicha(playaApp, fuentes, curada, slug) {
  const miteco = fuentes.miteco[playaApp.nombre] || null;
  const xunta = fuentes.xunta2026[playaApp.nombre] || null;
  const provincia = playaApp.provincia || xunta?.provincia || miteco?.provincia
    || PROVINCIAS_POR_MUNICIPIO[playaApp.municipio] || null;

  const ficha = {
    slug,
    nombreCatalogo: playaApp.nombre,
    nombre: playaApp.nombre,
    municipio: playaApp.municipio,
    provincia,
    lat: playaApp.lat,
    lon: playaApp.lon,
    descripcion: miteco?.descripcion
      || `${playaApp.nombre} se encuentra en ${playaApp.municipio}${provincia ? `, provincia de ${provincia}` : ""}. La ficha reúne los datos disponibles y las condiciones meteorológicas calculadas por Hoy Toca Playa.`,
    fotoPrincipal: null,
    caracteristicas: {
      tipo: tipoXunta(xunta?.tipo) || null,
      composicion: arenaXunta(xunta?.arena) || miteco?.composicion || null,
      longitud: xunta?.longitud ? `${Number(xunta.longitud).toLocaleString("es-ES")} m` : miteco?.longitud || null,
      anchura: miteco?.anchura || null,
      entorno: miteco?.entorno || null,
      forma: null,
      orientacion: playaApp.orientacion || null,
      exposicion: playaApp.nivelAbrigo ? `Nivel de abrigo usado por el ranking: ${playaApp.nivelAbrigo}` : null
    },
    servicios: {
      parking: miteco ? valorConDetalles(miteco.aparcamiento, miteco.tipoAparcamiento, miteco.plazasAparcamiento) : null,
      accesibilidad: miteco ? valorConDetalles(miteco.accesoDiscapacidad, miteco.detalleAccesibilidad) : null,
      duchas: miteco?.duchas || null,
      aseos: miteco?.aseos || null,
      socorrista: miteco ? valorConDetalles(miteco.auxilioVigilancia, miteco.detalleAuxilio) : null,
      chiringuito: null,
      restaurantes: null,
      transportePublico: miteco ? valorConDetalles(miteco.autobus, miteco.detalleAutobus) : null
    },
    normas: {
      perros: null,
      nudismo: miteco?.nudismo || null,
      deportesAcuaticos: miteco?.zonaSurf ? `Zona de surf: ${miteco.zonaSurf}` : null,
      barbacoasFuego: null,
      accesoVehiculos: miteco?.formaAcceso || null
    },
    marea: {
      dependencia: null, superficiePleamar: null, accesoCondicionado: null,
      riesgoAislamiento: null, recomendacion: null
    },
    bano: {
      entradaAgua: null,
      fondo: miteco?.composicion || null,
      oleajeHabitual: miteco?.condicionesBano || null,
      corrientes: null, ninos: null, profundidad: null
    },
    practica: {
      temporadaBano: null,
      fuente: null,
      ultimaVerificacion: FECHA_VERIFICACION,
      notaVigencia: miteco
        ? "Los servicios procedentes de la Guía de Playas son datos de inventario publicados en 2018; el servicio indica última edición en 2024. Confirma los servicios estacionales y las normas locales antes de ir."
        : "Solo se muestran datos respaldados por las fuentes consultadas; los campos no confirmados permanecen como información no disponible."
    },
    fuentes: []
  };

  if (miteco) agregarFuente(ficha, {
    nombre: fuentes.fuentes.miteco.nombre,
    url: fuentes.fuentes.miteco.url,
    nota: fuentes.fuentes.miteco.alcance
  });
  if (xunta) agregarFuente(ficha, {
    nombre: fuentes.fuentes.xunta2026.nombre,
    url: fuentes.fuentes.xunta2026.url,
    nota: fuentes.fuentes.xunta2026.alcance
  });

  aplicarAjustesVerificados(ficha);
  const resultado = combinarNoNulos(ficha, curada);
  resultado.fuentes = ficha.fuentes;
  resultado.practica.fuente = resultado.fuentes.length
    ? resultado.fuentes.map(item => item.nombre).join(" · ")
    : null;
  return resultado;
}

export async function construirCatalogo({ escribir = true } = {}) {
  const [codigoApp, contenidoFuentes, contenidoCurado] = await Promise.all([
    readFile(ARCHIVO_APP, "utf8"),
    readFile(ARCHIVO_FUENTES, "utf8"),
    readFile(ARCHIVO_CURADO, "utf8")
  ]);
  const playasApp = extraerPlayas(codigoApp);
  const fuentes = JSON.parse(contenidoFuentes);
  const curadas = JSON.parse(contenidoCurado).playas;
  const curadasPorNombre = new Map(curadas.map(playa => [playa.nombreCatalogo, playa]));

  const slugsUsados = new Set();
  const playas = playasApp.map(playaApp => {
    const curada = curadasPorNombre.get(playaApp.nombre);
    let slug = curada?.slug || slugificar(playaApp.nombre);
    if (slugsUsados.has(slug)) slug = `${slug}-${slugificar(playaApp.municipio)}`;
    let candidato = slug;
    let numero = 2;
    while (slugsUsados.has(candidato)) candidato = `${slug}-${numero++}`;
    slug = candidato;
    slugsUsados.add(slug);
    return construirFicha(playaApp, fuentes, curada, slug);
  });

  const catalogo = {
    version: 2,
    generado: FECHA_VERIFICACION,
    total: playas.length,
    playas
  };
  if (escribir) await writeFile(ARCHIVO_SALIDA, `${JSON.stringify(catalogo, null, 2)}\n`, "utf8");
  return catalogo;
}

if (import.meta.url === `file:///${process.argv[1]?.replaceAll("\\", "/")}`) {
  const catalogo = await construirCatalogo();
  console.log(`Construido catálogo de ${catalogo.playas.length} fichas.`);
}

