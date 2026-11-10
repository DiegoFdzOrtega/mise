/* =========================================================
   app.js — Arranque y navegación de "Mise"
   ---------------------------------------------------------
   1. Router: lee el #hash de la URL (#sala, #mesa/ID…) y
      dibuja la pantalla, solo si el rol del usuario la permite.
   2. Un único "escuchador" de clics para todos los botones
      con data-accion, que comprueba los permisos.
   3. Refresco automático (cocina y sala), bloqueo por
      inactividad y sincronización entre pestañas.
   ========================================================= */

// Menú: [vista, icono, texto]
const MENU = [
  ['panel', '◧', 'Panel'], ['sala', '▦', 'Sala'], ['cocina', '♨', 'Cocina'],
  ['inventario', '▤', 'Inventario'], ['pedidos', '⇄', 'Pedidos'], ['escandallos', '€', 'Carta y costes'],
  ['appcc', '°', 'APPCC'], ['alergenos', '⚠', 'Alérgenos'], ['mermas', '♻', 'Mermas'],
  ['informes', '▥', 'Informes'], ['usuarios', '☺', 'Usuarios'], ['ajustes', '⚙', 'Ajustes']
];

function vistaActual() {
  const [vista, param] = location.hash.replace('#', '').split('/');
  return { vista: vista || '', param: param || null };
}

function pintarMenu(vista) {
  const { listos, cola } = contadoresSala();
  const contador = { sala: listos, cocina: cola };
  const activa = vista === 'mesa' ? 'sala' : vista;
  $('#menu-enlaces').innerHTML = MENU.filter(([v]) => Auth.puedeVer(v)).map(([v, ico, txt]) => `
    <a href="#${v}" class="${v === activa ? 'activo' : ''}"><span class="ico">${ico}</span><span>${txt}</span>
      ${contador[v] ? `<span class="burbuja">${contador[v]}</span>` : ''}</a>`).join('');
}

function pintarBarra(u) {
  $('#barra-sup').innerHTML = `
    <span class="barra-negocio">${esc(D().negocio.nombre)}</span>
    <span class="barra-usuario">${avatar(u)}<span><b>${esc(u.nombre)}</b><small>${esc(ROLES[u.rol].nombre)}</small></span></span>
    <button class="btn btn-peque" data-accion="salir" title="Bloquear y cambiar de usuario">⏻ Cambiar usuario</button>`;
}

function pintar() {
  const u = Auth.usuario();
  document.body.classList.toggle('sin-sesion', !u);
  if (!u) {
    $('#menu-enlaces').innerHTML = '';
    $('#barra-sup').innerHTML = '';
    $('#contenido').innerHTML = pantallaLogin();
    document.title = 'Entrar · Mise';
    return;
  }

  let { vista, param } = vistaActual();
  const permitida = vista === 'mesa' ? Auth.puedeVer('sala') : Auth.puedeVer(vista);
  if (!Vistas[vista] || !permitida) {
    vista = Auth.inicio(); param = null;
    history.replaceState(null, '', '#' + vista);
  }
  estadoUI.mesa = vista === 'mesa' ? param : null;

  $('#contenido').innerHTML = Vistas[vista](param);
  pintarMenu(vista);
  pintarBarra(u);
  document.title = `${NOMBRES_VISTA[vista] || 'Mesa'} · Mise`;
}

// Repinta sin mover el scroll (para el refresco automático)
function repintarSuave() {
  if ($('#dialogo').open) return;
  const foco = document.activeElement;
  if (foco && ['INPUT', 'TEXTAREA', 'SELECT'].includes(foco.tagName)) return;
  const y = window.scrollY;
  pintar();
  window.scrollTo(0, y);
}

function iniciar() {
  Datos.cargar();
  configurarDialogo();

  // Todos los botones con data-accion pasan por aquí
  document.body.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-accion]');
    if (!boton || boton.closest('dialog')) return;
    const accion = boton.dataset.accion;
    const libres = ['elegir-usuario', 'tecla'];
    if (!libres.includes(accion) && !Auth.usuario()) return pintar();
    const permiso = PERMISO_ACCION[accion];
    if (permiso && !Auth.puede(permiso)) return avisar('Tu usuario no tiene permiso para hacer esto.');
    const fn = Acciones[accion];
    if (fn) fn(boton.dataset.id, boton);
  });

  // Teclado físico en la pantalla del PIN
  document.addEventListener('keydown', (e) => {
    if (Auth.usuario() || !login.seleccionado) return;
    if (/^\d$/.test(e.key)) pulsarTecla(e.key);
    else if (e.key === 'Backspace') pulsarTecla('borrar');
    else if (e.key === 'Enter') pulsarTecla('ok');
  });

  // Buscador del inventario (sin perder el foco al repintar)
  $('#contenido').addEventListener('input', (e) => {
    if (e.target.id === 'busqueda') {
      estadoUI.busqueda = e.target.value;
      const pos = e.target.selectionStart;
      pintar();
      const nuevo = $('#busqueda');
      nuevo.focus(); nuevo.setSelectionRange(pos, pos);
    }
  });

  // Restaurar copia de seguridad
  $('#contenido').addEventListener('change', (e) => {
    if (e.target.id !== 'importar' || !e.target.files[0]) return;
    e.target.files[0].text().then(texto => {
      try { Datos.importar(texto); avisar('Copia restaurada'); pintar(); }
      catch (err) { avisar(err.message || 'Archivo no válido'); }
    });
  });

  // Cualquier toque cuenta como actividad (para el bloqueo automático)
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => Auth.actividad(), { passive: true }));

  // Cada 15 s: bloqueo por inactividad y refresco de las pantallas "en directo"
  setInterval(() => {
    if (Auth.usuario() && Auth.caducada()) {
      Auth.salir(); pintar(); avisar('Sesión bloqueada por inactividad');
      return;
    }
    if (!Auth.usuario() && Auth.segundosBloqueo()) return pintar();
    const { vista } = vistaActual();
    if (Auth.usuario() && ['cocina', 'sala', 'mesa', 'panel'].includes(vista)) repintarSuave();
  }, 15000);

  // Otra pestaña ha cambiado los datos (p. ej. camarero en una, cocina en otra)
  window.addEventListener('storage', (e) => {
    if (e.key === 'mise.datos') { Datos.recargar(); repintarSuave(); }
  });

  window.addEventListener('hashchange', () => { pintar(); window.scrollTo(0, 0); });
  pintar();

  // PWA: el service worker permite usarla sin conexión (solo funciona servida por http/https)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW no registrado', err));
  }
}

document.addEventListener('DOMContentLoaded', iniciar);
