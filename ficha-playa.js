(() => {
  const previewScriptUrl = document.currentScript?.src || window.location.href;
  const previewRoot = new URL('.', previewScriptUrl);

  const cargarOriginal = () => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/rodriaramayo90-hub/playas-galicia@84c3c92bec18876603364215c46b24d4ea535858/ficha-playa.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  async function aplicarFotoSeleccionada() {
    try {
      const bloques = await Promise.all([1, 2, 3, 4].map(n =>
        fetch(new URL(`data/fotos-wikimedia-${n}.json`, previewRoot)).then(r => {
          if (!r.ok) throw new Error(`No se pudo cargar fotos-wikimedia-${n}.json`);
          return r.json();
        })
      ));
      const fotos = Object.assign({}, ...bloques);
      const ficha = window.HoyTocaPlayaFicha;
      if (!ficha) return;
      const clave = `${ficha.nombreCatalogo || ficha.nombre}||${ficha.municipio}`;
      const seleccion = fotos[clave];
      if (!seleccion) return;

      const [archivo, pagina] = seleccion;
      const imagen = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(archivo).replace(/%2F/g, '/')}?width=1600`;
      const contenedor = document.getElementById('fotoPrincipal');
      if (!contenedor) return;
      contenedor.innerHTML = `
        <img src="${imagen}" alt="Vista de ${ficha.nombre}" fetchpriority="high">
        <a class="credito-foto" href="${pagina}" target="_blank" rel="noopener noreferrer">
          Foto seleccionada · Wikimedia Commons · ver autor y licencia
        </a>`;
      contenedor.querySelector('img')?.addEventListener('error', () => {
        contenedor.innerHTML = `<div class="foto-placeholder" role="img" aria-label="La fotografía no pudo cargarse">
          <span aria-hidden="true">🏖️</span><strong>La fotografía no pudo cargarse</strong>
          <small>Revisaremos este enlace antes de publicar.</small></div>`;
      }, { once: true });
    } catch (error) {
      console.error('Preview Wikimedia:', error);
    }
  }

  cargarOriginal()
    .then(() => setTimeout(aplicarFotoSeleccionada, 800))
    .catch(error => console.error('No se pudo cargar ficha-playa.js original:', error));
})();
