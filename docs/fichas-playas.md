# Fichas individuales de playa

Las 150 fichas se construyen con una sola plantilla y cuatro capas separadas:

- `data/fuentes-playas.json`: datos importados de fuentes oficiales y su correspondencia con el catálogo.
- `data/playas-detalle-curado.json`: ajustes manuales comprobados de las fichas de demostración.
- `data/playas-detalle.json`: catálogo consolidado generado; no debe editarse a mano.
- `app.js`: previsión y puntuación dinámica, compartidas con el ranking.
- `plantillas/ficha-playa.html`: estructura visual y metadatos SEO.

Las páginas de `playas/<slug>/index.html` y `data/indice-fichas.js` son archivos generados. No deben editarse a mano.

## Añadir una playa

1. Añadir la playa al catálogo de `app.js`.
2. Añadir o verificar sus fuentes en `data/fuentes-playas.json`; los datos desconocidos deben quedar como `null`.
3. Si necesita un ajuste manual comprobado, incorporarlo en `scripts/construir-catalogo-fichas.mjs` o en el archivo curado.
4. Ejecutar `node scripts/generar-fichas-playas.mjs`.
5. Ejecutar `node tests/fichas-playas.test.cjs`.

El generador crea automáticamente el slug, el índice que enlaza el ranking, la URL amigable, los metadatos únicos, los datos estructurados y el `sitemap.xml`.

## Vigencia y fuentes

Los datos de inventario de MITECO cubren servicios y características de 148 playas. Cada ficha muestra una advertencia de vigencia porque los servicios estacionales pueden cambiar. Las normas municipales recientes se mantienen como ajustes separados y siempre incluyen un enlace a la fuente. Si no existe una fuente fiable, la interfaz conserva “Información no disponible”.

