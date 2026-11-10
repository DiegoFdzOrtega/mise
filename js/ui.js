/* =========================================================
   ui.js — Utilidades de interfaz de "Mise"
   ---------------------------------------------------------
   Funciones pequeñas que usan todas las pantallas:
   selección de elementos, avisos, formularios en <dialog>,
   tarjetas de datos y gráficos de barras.
   ========================================================= */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

// Evita que un texto escrito por el usuario rompa el HTML (seguridad XSS)
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const D = () => Datos.estado; // atajo al estado actual

/* ---------------- Avisos (mensajes cortos abajo) ---------------- */
let temporizadorAviso;
function avisar(texto) {
  const el = $('#aviso');
  el.textContent = texto;
  el.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove('visible'), 2600);
}

/* ---------------- Formulario genérico en <dialog> ---------------- */
let alGuardarActual = null;

function abrirFormulario({ titulo, campos, valores = {}, alGuardar }) {
  $('#dialogo-titulo').textContent = titulo;
  $('#dialogo-cuerpo').innerHTML = campos.map(c => htmlCampo(c, valores[c.nombre])).join('');
  alGuardarActual = alGuardar;
  $('#dialogo').showModal();
  const primero = $('#dialogo-cuerpo input, #dialogo-cuerpo select');
  if (primero) primero.focus();
}

function htmlCampo(c, valor) {
  const req = c.obligatorio ? 'required' : '';
  const v = valor ?? c.defecto ?? '';
  const ayuda = c.ayuda ? `<small class="ayuda">${esc(c.ayuda)}</small>` : '';
  switch (c.tipo) {
    case 'select':
      return `<label>${esc(c.etiqueta)}
        <select name="${c.nombre}" ${req}>
          ${c.opciones.map(o => {
            const [val, txt] = Array.isArray(o) ? o : [o, o];
            return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(txt)}</option>`;
          }).join('')}
        </select>${ayuda}</label>`;
    case 'checks':
      return `<fieldset><legend>${esc(c.etiqueta)}</legend><div class="checks">
        ${c.opciones.map(o => `<label class="check"><input type="checkbox" name="${c.nombre}" value="${esc(o)}"
          ${(v || []).includes(o) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}
        </div>${ayuda}</fieldset>`;
    case 'textarea':
      return `<label>${esc(c.etiqueta)}<textarea name="${c.nombre}" rows="3" ${req}>${esc(v)}</textarea>${ayuda}</label>`;
    case 'lineas':
      return htmlEditorLineas(c, v || []);
    default:
      return `<label>${esc(c.etiqueta)}
        <input type="${c.tipo || 'text'}" name="${c.nombre}" value="${esc(v)}" ${req} ${c.soloLectura ? 'readonly' : ''}
          ${c.patron ? `pattern="${c.patron}"` : ''} ${c.modo ? `inputmode="${c.modo}"` : ''} ${c.max ? `maxlength="${c.max}"` : ''}
          ${c.paso ? `step="${c.paso}"` : ''} ${c.min !== undefined ? `min="${c.min}"` : ''}>${ayuda}</label>`;
  }
}

// Editor de líneas del escandallo (ingrediente + cantidad)
function htmlEditorLineas(c, lineas) {
  const opciones = D().ingredientes
    .slice().sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map(i => [i.id, `${i.nombre} (${i.unidad})`]);
  const fila = (l = {}) => `<div class="linea">
      <select name="ingId">${opciones.map(([id, t]) => `<option value="${id}" ${id === l.ingId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
      <input type="number" name="cantidad" step="0.001" min="0" value="${l.cantidad ?? ''}" placeholder="Cantidad" required>
      <button type="button" class="btn-icono" data-quitar-linea aria-label="Quitar">✕</button>
    </div>`;
  return `<fieldset><legend>${esc(c.etiqueta)}</legend>
    <div class="lineas" data-plantilla="${esc(fila())}">${(lineas.length ? lineas : [{}]).map(fila).join('')}</div>
    <button type="button" class="btn btn-peque" data-anadir-linea>+ Añadir ingrediente</button>
    <small class="ayuda">Cantidad por ración, en la unidad del ingrediente.</small></fieldset>`;
}

// Lee los valores del formulario y los convierte a su tipo
function leerFormulario() {
  const form = $('#form-dialogo');
  const res = {};
  $$('#dialogo-cuerpo [name]', form).forEach(el => {
    if (el.closest('.linea')) return; // las líneas se leen aparte
    if (el.type === 'checkbox') {
      res[el.name] = res[el.name] || [];
      if (el.checked) res[el.name].push(el.value);
    } else if (el.type === 'number') {
      res[el.name] = el.value === '' ? 0 : parseFloat(el.value);
    } else {
      res[el.name] = el.value.trim();
    }
  });
  const filas = $$('.linea', form);
  if (filas.length) {
    res.lineas = filas
      .map(f => ({ ingId: $('[name=ingId]', f).value, cantidad: parseFloat($('[name=cantidad]', f).value) || 0 }))
      .filter(l => l.ingId && l.cantidad > 0);
  }
  return res;
}

function configurarDialogo() {
  const dlg = $('#dialogo');
  $('#form-dialogo').addEventListener('submit', (e) => {
    e.preventDefault();
    if (alGuardarActual) {
      const ok = alGuardarActual(leerFormulario());
      if (ok === false) return; // la validación pidió no cerrar
    }
    dlg.close();
    pintar();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-cerrar]')) dlg.close();
    if (e.target.closest('[data-anadir-linea]')) {
      const cont = $('.lineas', dlg);
      cont.insertAdjacentHTML('beforeend', cont.dataset.plantilla);
    }
    if (e.target.closest('[data-quitar-linea]')) {
      const filas = $$('.linea', dlg);
      if (filas.length > 1) e.target.closest('.linea').remove();
    }
  });
}

/* ---------------- Pequeños componentes HTML ---------------- */
const cabecera = (titulo, subtitulo, acciones = '') => `
  <header class="cabecera">
    <div><h1>${titulo}</h1><p>${subtitulo}</p></div>
    <div class="acciones">${acciones}</div>
  </header>`;

const kpi = (etiqueta, valor, extra = '', clase = '') => `
  <div class="kpi ${clase}"><span>${etiqueta}</span><strong>${valor}</strong><small>${extra}</small></div>`;

const chips = (lista, clase = '') => lista.length
  ? lista.map(a => `<span class="chip ${clase}">${esc(a)}</span>`).join('')
  : '<span class="tenue">Sin alérgenos</span>';

// Gráfico de barras horizontal hecho solo con HTML + CSS
function barras(objeto, formato = fmt.euro, claseFn = () => '') {
  const filas = Object.entries(objeto).sort((a, b) => b[1] - a[1]);
  if (!filas.length) return '<p class="tenue">Sin datos todavía.</p>';
  const max = Math.max(...filas.map(f => f[1])) || 1;
  return `<div class="barras">${filas.map(([k, v]) => `
    <div class="barra ${claseFn(k, v)}">
      <span class="barra-etq">${esc(k)}</span>
      <span class="barra-pista"><span style="width:${(v / max * 100).toFixed(1)}%"></span></span>
      <span class="barra-val">${formato(v)}</span>
    </div>`).join('')}</div>`;
}

function claseFoodCost(fc) {
  const obj = D().negocio.objetivoFoodCost;
  if (fc <= obj) return 'bien';
  if (fc <= obj + 5) return 'medio';
  return 'mal';
}

function confirmar(texto) { return window.confirm(texto); }

// Copia al portapapeles (con plan B para navegadores antiguos o file://)
function copiarTexto(texto) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
  const t = Object.assign(document.createElement('textarea'), { value: texto });
  document.body.append(t); t.select(); document.execCommand('copy'); t.remove();
  return Promise.resolve();
}

function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Registro global de pantallas y acciones: cada archivo vistas-*.js añade las suyas */
const Vistas = {};
const Acciones = {};
const estadoUI = { filtroInv: 'todos', busqueda: '', categoriaSala: '', periodoInformes: 7 };

// Pequeños atajos para pintar solo lo que el usuario tiene permitido
const si = (condicion, html) => condicion ? html : '';
const puede = (permiso) => Auth.puede(permiso);

// Orden lógico de la carta, como en un restaurante
const ORDEN_CATEGORIAS = ['Entrantes', 'Arroces', 'Pescados', 'Carnes', 'Postres', 'Bebidas'];
function ordenCategorias(platos) {
  const cats = [...new Set(platos.map(p => p.categoria || 'Otros'))];
  const pos = (c) => { const i = ORDEN_CATEGORIAS.indexOf(c); return i === -1 ? 99 : i; };
  return cats.sort((a, b) => pos(a) - pos(b) || a.localeCompare(b));
}
function ordenarPorCategoria(platos) {
  const orden = ordenCategorias(platos);
  return platos.slice().sort((a, b) => orden.indexOf(a.categoria || 'Otros') - orden.indexOf(b.categoria || 'Otros') || a.nombre.localeCompare(b.nombre));
}

// Iniciales para los avatares ("Laura Martí" → "LM")
const iniciales = (nombre) => nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
const avatar = (u, clase = '') => `<span class="avatar ${clase}" style="--c:${esc(u.color)}">${esc(iniciales(u.nombre))}</span>`;

// Hora "HH:MM" de una fecha ISO
const hora = (iso) => iso ? iso.slice(11, 16) : '';
