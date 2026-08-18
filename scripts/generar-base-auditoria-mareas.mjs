import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const detalle = JSON.parse(await readFile('data/playas-detalle.json', 'utf8'));
const indiceTexto = await readFile('data/indice-fichas.js', 'utf8');
const indice = [...indiceTexto.matchAll(/"([^"]+)\|\|([^"]+)":\s*"([^"]+)"/g)].map(m => ({ nombre: m[1], municipio: m[2], slug: m[3] }));
const porSlug = new Map((detalle.playas || []).map(p => [p.slug, p]));

const esc = v => {
  const s = v === null || v === undefined ? '' : String(v);
  return `"${s.replaceAll('"', '""')}"`;
};

const cabecera = [
  'n','nombre','municipio','slug','descripcion','longitud','anchura','tipo','entorno',
  'dependencia_actual','superficie_pleamar_actual','acceso_condicionado_actual','riesgo_aislamiento_actual','recomendacion_actual','ficha_detalle'
];
const filas = indice.map((item, i) => {
  const p = porSlug.get(item.slug);
  return [
    i + 1, item.nombre, item.municipio, item.slug, p?.descripcion, p?.caracteristicas?.longitud,
    p?.caracteristicas?.anchura, p?.caracteristicas?.tipo, p?.caracteristicas?.entorno,
    p?.marea?.dependencia, p?.marea?.superficiePleamar, p?.marea?.accesoCondicionado,
    p?.marea?.riesgoAislamiento, p?.marea?.recomendacion, p ? 'sí' : 'no'
  ].map(esc).join(',');
});

await mkdir(dirname('data/auditoria-mareas-base.csv'), { recursive: true });
await writeFile('data/auditoria-mareas-base.csv', `${cabecera.join(',')}\n${filas.join('\n')}\n`, 'utf8');
console.log(`Base creada: ${indice.length} playas del índice; ${(detalle.playas || []).length} fichas de detalle.`);
