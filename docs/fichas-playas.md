# Fichas individuales de playa

Las fichas se construyen con una sola plantilla y tres capas separadas:

- `data/playas-detalle.json`: información estática comprobada de cada playa.
- `app.js`: previsión y puntuación dinámica, compartidas con el ranking.
- `plantillas/ficha-playa.html`: estructura visual y metadatos SEO.

Las páginas de `playas/<slug>/index.html` son archivos generados. No deben editarse a mano.

## Añadir una playa

1. Añadir `slugFicha` a la playa correspondiente en `app.js`.
2. Añadir su ficha en `data/playas-detalle.json`. Los datos desconocidos deben quedar como `null`.
3. Ejecutar `node scripts/generar-fichas-playas.mjs`.
4. Ejecutar `node --test tests/fichas-playas.test.cjs`.

El generador crea la URL amigable, los metadatos únicos, los datos estructurados y actualiza `sitemap.xml`.

