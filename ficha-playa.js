(() => {
  const srcActual = document.currentScript?.src || window.location.href;
  const raiz = new URL(".", srcActual);

  window.HoyTocaPlayaMareasIntegradas = true;

  if (!document.querySelector('link[data-hoytoca-mareas="1"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("mareas-ficha.css?v=2", raiz).href;
    css.dataset.hoytocaMareas = "1";
    document.head.append(css);
  }

  const core = document.createElement("script");
  core.src = new URL("ficha-playa-base.js?v=8", raiz).href;
  core.async = false;
  core.onload = () => {
    if (document.querySelector('script[data-hoytoca-mareas="1"]')) return;
    const mareas = document.createElement("script");
    mareas.src = new URL("mareas-ficha.js?v=2", raiz).href;
    mareas.async = false;
    mareas.dataset.hoytocaMareas = "1";
    document.body.append(mareas);
  };
  document.body.append(core);
})();
