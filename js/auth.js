/* =========================================================
   auth.js — Usuarios, roles, permisos e inicio de sesión
   ---------------------------------------------------------
   - Cada persona entra con su PIN de 4 cifras (como en un TPV).
   - El PIN no se guarda: se guarda su hash SHA-256 con "sal"
     (un texto aleatorio distinto para cada usuario).
   - La sesión es por pestaña (sessionStorage) y se bloquea
     sola tras unos minutos sin usarla.
   - Tras 5 PIN incorrectos se bloquea el acceso 30 segundos.
   ========================================================= */

// Qué pantallas ve cada rol (la primera es su pantalla de inicio)
const ROLES = {
  admin: {
    nombre: 'Administrador',
    descripcion: 'Dueño o gerente. Acceso total: ventas, usuarios y ajustes.',
    vistas: ['panel', 'sala', 'cocina', 'inventario', 'pedidos', 'escandallos', 'appcc', 'alergenos', 'mermas', 'informes', 'usuarios', 'ajustes']
  },
  jefe: {
    nombre: 'Jefe de cocina',
    descripcion: 'Gestiona la cocina: carta, costes, stock, pedidos y APPCC.',
    vistas: ['panel', 'cocina', 'inventario', 'pedidos', 'escandallos', 'appcc', 'alergenos', 'mermas', 'informes']
  },
  cocinero: {
    nombre: 'Cocinero/a',
    descripcion: 'Prepara las comandas, registra temperaturas y mermas.',
    vistas: ['cocina', 'inventario', 'appcc', 'mermas', 'alergenos']
  },
  camarero: {
    nombre: 'Camarero/a',
    descripcion: 'Atiende las mesas, toma comandas y cobra.',
    vistas: ['sala', 'alergenos']
  }
};

// Qué puede HACER cada rol (además de qué pantallas ve)
const PERMISOS = {
  costes: ['admin', 'jefe'],
  ventas: ['admin'],
  editarInventario: ['admin', 'jefe'],
  moverStock: ['admin', 'jefe', 'cocinero'],
  editarCarta: ['admin', 'jefe'],
  agotar: ['admin', 'jefe', 'cocinero'],
  gestionAppcc: ['admin', 'jefe'],
  registrarAppcc: ['admin', 'jefe', 'cocinero'],
  borrarRegistros: ['admin'],
  mermas: ['admin', 'jefe', 'cocinero'],
  borrarMermas: ['admin', 'jefe'],
  pedidos: ['admin', 'jefe'],
  comandas: ['admin', 'camarero'],
  cobrar: ['admin', 'camarero'],
  cocina: ['admin', 'jefe', 'cocinero'],
  gestionMesas: ['admin'],
  usuarios: ['admin'],
  ajustes: ['admin'],
  firmarComoOtro: ['admin', 'jefe']
};

// Cada acción (botón) exige un permiso. Las que no aparecen las puede usar cualquiera con sesión.
const PERMISO_ACCION = {
  'nuevo-ingrediente': 'editarInventario', 'editar-ingrediente': 'editarInventario', 'borrar-ingrediente': 'editarInventario',
  'mover-stock': 'moverStock',
  'nuevo-plato': 'editarCarta', 'editar-plato': 'editarCarta', 'borrar-plato': 'editarCarta',
  'alternar-agotado': 'agotar',
  'nueva-camara': 'gestionAppcc', 'borrar-camara': 'gestionAppcc',
  'nuevo-registro': 'registrarAppcc', 'borrar-registro': 'borrarRegistros',
  'nueva-merma': 'mermas', 'borrar-merma': 'borrarMermas',
  'copiar-pedido': 'pedidos', 'recibir-pedido': 'pedidos', 'nuevo-proveedor': 'pedidos', 'editar-proveedor': 'pedidos', 'borrar-proveedor': 'pedidos',
  'abrir-mesa': 'comandas', 'anadir-plato': 'comandas', 'cambiar-cantidad': 'comandas', 'nota-linea': 'comandas',
  'enviar-cocina': 'comandas', 'servir-linea': 'comandas', 'servir-todo': 'comandas', 'alergias-mesa': 'comandas',
  'comensales-mesa': 'comandas', 'anular-mesa': 'comandas',
  'cobrar-mesa': 'cobrar',
  'empezar-ticket': 'cocina', 'listo-ticket': 'cocina',
  'nueva-mesa': 'gestionMesas', 'borrar-mesa': 'gestionMesas',
  'nuevo-usuario': 'usuarios', 'editar-usuario': 'usuarios', 'pin-usuario': 'usuarios', 'alternar-usuario': 'usuarios',
  'editar-negocio': 'ajustes', 'exportar': 'ajustes', 'reiniciar': 'ajustes', 'exportar-ventas': 'ventas'
};

const Auth = (() => {
  const CLAVE_SESION = 'mise.sesion';
  const MAX_INTENTOS = 5;
  let fallos = 0;
  let bloqueadoHasta = 0;

  function sesion() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE_SESION)); } catch { return null; }
  }

  function usuario() {
    const s = sesion();
    if (!s) return null;
    const u = D().usuarios.find(x => x.id === s.id && x.activo);
    return u || null;
  }

  function puede(permiso) {
    const u = usuario();
    return !!u && (PERMISOS[permiso] || []).includes(u.rol);
  }

  function puedeVer(vista) {
    const u = usuario();
    return !!u && ROLES[u.rol].vistas.includes(vista);
  }

  function inicio() {
    const u = usuario();
    return u ? ROLES[u.rol].vistas[0] : null;
  }

  // Devuelve true si el PIN es correcto
  function entrar(id, pin) {
    if (Date.now() < bloqueadoHasta) return false;
    const u = D().usuarios.find(x => x.id === id && x.activo);
    if (u && sha256(u.sal + pin) === u.pinHash) {
      fallos = 0;
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ id: u.id, ultimo: Date.now() }));
      Datos.actualizar('usuarios', u.id, { ultimoAcceso: ahoraISO() });
      return true;
    }
    fallos++;
    if (fallos >= MAX_INTENTOS) { bloqueadoHasta = Date.now() + 30000; fallos = 0; }
    return false;
  }

  function segundosBloqueo() {
    return Math.max(0, Math.ceil((bloqueadoHasta - Date.now()) / 1000));
  }

  function salir() {
    sessionStorage.removeItem(CLAVE_SESION);
  }

  // Marca actividad (para el bloqueo automático)
  function actividad() {
    const s = sesion();
    if (s && Date.now() - s.ultimo > 5000) {
      s.ultimo = Date.now();
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(s));
    }
  }

  // ¿Ha pasado demasiado tiempo sin usar la app?
  function caducada() {
    const s = sesion();
    const minutos = D().negocio.bloqueoMinutos || 15;
    return !!s && Date.now() - s.ultimo > minutos * 60000;
  }

  function cambiarPin(id, pin) {
    const sal = Math.random().toString(36).slice(2, 10);
    Datos.actualizar('usuarios', id, { sal, pinHash: sha256(sal + pin) });
  }

  return { usuario, puede, puedeVer, inicio, entrar, salir, actividad, caducada, cambiarPin, segundosBloqueo };
})();

/* =========================================================
   Pantalla de acceso
   ========================================================= */
const login = { seleccionado: null, pin: '', error: '' };

function pantallaLogin() {
  const { usuarios, negocio } = D();
  const activos = usuarios.filter(u => u.activo);
  const sel = activos.find(u => u.id === login.seleccionado);
  const bloqueo = Auth.segundosBloqueo();

  const tarjetas = activos.map(u => `
    <button class="usuario-login ${u.id === login.seleccionado ? 'activo' : ''}" data-accion="elegir-usuario" data-id="${u.id}">
      ${avatar(u, 'grande')}
      <b>${esc(u.nombre)}</b>
      <small>${esc(ROLES[u.rol].nombre)}</small>
    </button>`).join('');

  const teclado = sel ? `
    <div class="pin-caja">
      <p>Hola, <b>${esc(sel.nombre.split(' ')[0])}</b>. Introduce tu PIN</p>
      <div class="pin-puntos ${login.error ? 'error' : ''}">${[0, 1, 2, 3].map(i => `<span class="${i < login.pin.length ? 'lleno' : ''}"></span>`).join('')}</div>
      <p class="pin-error" role="alert">${bloqueo ? `Demasiados intentos. Espera ${bloqueo} s.` : esc(login.error)}</p>
      <div class="teclado">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'ok'].map(t => t === 'borrar'
          ? '<button data-accion="tecla" data-valor="borrar" aria-label="Borrar">⌫</button>'
          : t === 'ok' ? '<button data-accion="tecla" data-valor="ok" class="ok" aria-label="Entrar">→</button>'
          : `<button data-accion="tecla" data-valor="${t}">${t}</button>`).join('')}
      </div>
    </div>` : '<p class="tenue centro pin-caja vacio">Toca tu nombre para entrar</p>';

  return `
    <section class="login">
      <div class="login-marca">
        <img src="img/icono.svg" alt="" width="64" height="64">
        <h1>Mise</h1>
        <p>Tu cocina, en su sitio</p>
        <span class="login-negocio">${esc(negocio.nombre)} · ${esc(negocio.localidad || '')}</span>
      </div>
      <div class="login-cuerpo">
        <h2>¿Quién eres?</h2>
        <div class="usuarios-login">${tarjetas}</div>
        ${teclado}
        <details class="demo">
          <summary>Modo demostración: ver los PIN</summary>
          <table class="tabla mini">${activos.map(u => `<tr><td>${esc(u.nombre)}</td><td>${esc(ROLES[u.rol].nombre)}</td>
            <td class="num"><code>${({ 'Diego Fernández': '1111', 'Laura Martí': '2222', 'Marcos Soler': '3333', 'Aitana Ruiz': '4444', 'Sergio Gómez': '5555', 'Nerea Blasco': '6666' })[u.nombre] || '—'}</code></td></tr>`).join('')}</table>
          <p class="tenue">En un restaurante real esta ayuda no aparece: cada persona conoce solo su PIN.</p>
        </details>
      </div>
    </section>`;
}

function pulsarTecla(t) {
  if (!login.seleccionado || Auth.segundosBloqueo()) return;
  login.error = '';
  if (t === 'borrar') login.pin = login.pin.slice(0, -1);
  else if (t === 'ok') return comprobarPin();
  else if (login.pin.length < 4) login.pin += t;
  if (login.pin.length === 4) return comprobarPin();
  pintar();
}

function comprobarPin() {
  if (Auth.entrar(login.seleccionado, login.pin)) {
    const u = Auth.usuario();
    Object.assign(login, { seleccionado: null, pin: '', error: '' });
    location.hash = Auth.inicio();
    pintar();
    avisar(`Hola, ${u.nombre.split(' ')[0]} 👋`);
  } else {
    login.pin = '';
    login.error = 'PIN incorrecto';
    pintar();
  }
}

Object.assign(Acciones, {
  'elegir-usuario': (id) => { Object.assign(login, { seleccionado: id, pin: '', error: '' }); pintar(); },
  'tecla': (_, boton) => pulsarTecla(boton.dataset.valor),
  'salir': () => {
    Auth.salir();
    estadoUI.mesa = null;
    pintar();
  }
});
