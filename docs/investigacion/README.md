# Revisión de información adicional · 15 de septiembre de 2026

Se incorporan 116 campos antes vacíos en 65 fichas. Se consultaron búsquedas por playa y directorios municipales; los resultados de búsqueda son candidatos, no pruebas de que un negocio corresponda a esa playa. Solo las fuentes de `data/informacion-verificada.json` sustentan las incorporaciones.

Cada incorporación conserva su fuente y fecha. Los horarios, temporadas y continuidad comercial pueden cambiar; la consulta no equivale a confirmación telefónica de apertura. No se interpreta la falta de resultados como ausencia de servicio. Para normas se exige una fuente oficial aplicable al lugar.

Tanxil: PéNaAuga y Restaurante Tanxil están documentados en el directorio de Rianxo; no se incorporó la afirmación sobre perros de la captura por falta de confirmación municipal.

`campos-completados-2026-09-15.json` enumera los cambios efectivos. `pendientes-2026-09-15.json` enumera los huecos del catálogo base: algunos datos de mareas se resuelven mediante el suplemento ya existente de la web. No implica que todas esas casillas estén vacías en pantalla.

La revisión no completa todos los huecos. Los resultados insuficientes o ambiguos permanecen pendientes. El suplemento se aplica también en el navegador para conservar las incorporaciones si se regenera el catálogo, y nunca sustituye un valor existente distinto.

Comprobación: `node --test tests/informacion-verificada.test.cjs` y `node --check ficha-playa-base.js`.
