(() => {
  const MEDIA_QUERY = '(max-width: 600px)';

  function inyectarEstilos() {
    if (document.getElementById('estilos-portada-movil')) return;
    const style = document.createElement('style');
    style.id = 'estilos-portada-movil';
    style.textContent = `
      .btn-filtros-movil,
      .titulo-ranking-movil { display: none; }

      @media (max-width: 600px) {
        body { padding-top: 8px; }
        .cabecera { margin-bottom: 8px; }
        .logo-lockup-v2 { width: min(100%, 430px); grid-template-columns: 23% 77%; }
        .logo-lema-v2 { width: 82%; margin-top: 0; }
        .filtros { gap: 12px; margin-bottom: 10px; padding: 14px; align-items: stretch; }
        .filtros .selector-dia { order: 1; }
        .filtros .grupo-buscador-playa { order: 2; }
        .filtros .btn-filtros-movil { order: 3; }
        .filtros .grupo-horario { order: 4; }
        .filtros .btn-ubicacion { order: 5; }
        .filtros .grupo-filtro:not(.grupo-buscador-playa):not(.grupo-horario) { order: 6; }

        .btn-filtros-movil {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border: 1px solid rgba(11,114,133,.35);
          border-radius: 12px;
          background: rgba(222,245,250,.88);
          color: #0b5f70;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .filtros:not(.filtros-movil-abiertos) .grupo-horario,
        .filtros:not(.filtros-movil-abiertos) .btn-ubicacion,
        .filtros:not(.filtros-movil-abiertos) .grupo-filtro:not(.grupo-buscador-playa):not(.grupo-horario) {
          display: none;
        }

        .grupo-buscador-playa small { display: none; }
        #estadoCarga { margin-top: 2px; margin-bottom: 6px; font-weight: 600; }
        .titulo-ranking-movil { display: block; margin: 8px 2px 12px; color: #17394d; font-size: 1.25rem; font-weight: 800; }
        #ranking-mobile .tarjeta-playa:first-child { margin-top: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function actualizarTituloRanking(titulo) {
    const manana = document.getElementById('btnManana');
    const esManana = manana?.getAttribute('aria-pressed') === 'true';
    titulo.textContent = esManana ? '🏆 Mejores playas para mañana' : '🏆 Mejores playas para hoy';
  }

  function iniciar() {
    inyectarEstilos();

    const filtros = document.querySelector('.filtros');
    const buscador = document.querySelector('.grupo-buscador-playa');
    const rankingMobile = document.getElementById('ranking-mobile');
    if (!filtros || !buscador || !rankingMobile) return;

    if (!document.getElementById('btnFiltrosMovil')) {
      const boton = document.createElement('button');
      boton.id = 'btnFiltrosMovil';
      boton.className = 'btn-filtros-movil';
      boton.type = 'button';
      boton.setAttribute('aria-expanded', 'false');
      boton.innerHTML = '<span>⚙️ Personalizar búsqueda</span><span aria-hidden="true">⌄</span>';
      buscador.insertAdjacentElement('afterend', boton);

      boton.addEventListener('click', () => {
        const abierto = filtros.classList.toggle('filtros-movil-abiertos');
        boton.setAttribute('aria-expanded', String(abierto));
        boton.lastElementChild.textContent = abierto ? '⌃' : '⌄';
      });
    }

    let titulo = document.querySelector('.titulo-ranking-movil');
    if (!titulo) {
      titulo = document.createElement('div');
      titulo.className = 'titulo-ranking-movil';
      rankingMobile.insertAdjacentElement('beforebegin', titulo);
    }
    actualizarTituloRanking(titulo);

    ['btnHoy', 'btnManana'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        setTimeout(() => actualizarTituloRanking(titulo), 0);
      });
    });

    const media = window.matchMedia(MEDIA_QUERY);
    const ajustarEstado = () => {
      if (!media.matches) filtros.classList.remove('filtros-movil-abiertos');
    };
    media.addEventListener?.('change', ajustarEstado);
    ajustarEstado();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();
