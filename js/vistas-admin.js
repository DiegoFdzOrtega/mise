/* =========================================================
   vistas-admin.js — Panel, informes, usuarios y ajustes
   ========================================================= */

// Gráfico de columnas vertical (ventas por día) hecho con HTML + CSS
function columnas(datos, formato = fmt.euro) {
  const max = Math.max(...datos.map(d => d.valor), 1);
  return `<div class="columnas">${datos.map(d => `
    <div class="columna ${d.clase || ''}" title="${esc(d.titulo || d.etiqueta)}: ${formato(d.valor)}">
      <span class="columna-valor">${d.valor ? formato(d.valor) : ''}</span>
      <span class="columna-barra" style="height:${(d.valor / max * 100).toFixed(1)}%"></span>
      <span class="columna-etq">${esc(d.etiqueta)}</span>
    </div>`).join('')}</div>`;
}

// Ventas agrupadas por día de los últimos n días
function ventasPorDia(comandas, dias) {
  const res = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const iso = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const valor = comandas.filter(c => c.estado === 'cerrada' && c.cerrada.slice(0, 10) === iso).reduce((t, c) => t + c.total, 0);
    const cerrado = d.getDay() === 1;
    res.push({
      etiqueta: d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2) + ' ' + d.getDate(),
      titulo: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + (cerrado ? ' (cerrado)' : ''),
      valor, clase: cerrado ? 'cerrado' : i === 0 ? 'hoy' : ''
    });
  }
  return res;
}

Object.assign(Vistas, {
  /* ---------- PANEL ---------- */
  panel() {
    const { ingredientes, platos, registros, mermas, camaras, negocio, comandas, proveedores, mesas } = D();
    const u = Auth.usuario();
    const bajoMinimo = ingredientes.filter(i => i.stock < i.minimo);
    const caducan = ingredientes.filter(i => Calc.estadoCaducidad(i.caducidad) !== 'ok');
    const comida = platos.filter(p => p.categoria !== 'Bebidas');
    const fcs = comida.map(p => Calc.foodCost(p, ingredientes, negocio.iva));
    const fcMedio = fcs.length ? fcs.reduce((a, b) => a + b, 0) / fcs.length : 0;
    const merma30 = Calc.mermasRecientes(mermas, 30);
    const costeMerma30 = merma30.reduce((t, m) => t + Calc.costeMerma(m, ingredientes), 0);
    const pedidos = Calc.pedidosSugeridos(ingredientes, proveedores);
    const abiertas = comandas.filter(c => c.estado === 'abierta');
    const { cola } = contadoresSala();

    // Registros APPCC pendientes: mañana a partir de las 10:00 y tarde a partir de las 19:00
    const hoy = hoyISO();
    const horaActual = new Date().getHours();
    const turnos = [];
    if (horaActual >= 10) turnos.push(['mañana', h => h < 14]);
    if (horaActual >= 19) turnos.push(['tarde', h => h >= 14]);
    const sinRegistro = [];
    turnos.forEach(([nombre, enTurno]) => camaras.forEach(c => {
      if (!registros.some(r => r.camaraId === c.id && r.fecha.slice(0, 10) === hoy && enTurno(+r.fecha.slice(11, 13)))) sinRegistro.push({ c, turno: nombre });
    }));
    const fueraRango = registros.filter(r => {
      const c = camaras.find(x => x.id === r.camaraId);
      return c && !Calc.temperaturaCorrecta(c.tipo, r.temperatura) && Calc.diasHasta(r.fecha.slice(0, 10)) >= -7;
    });

    const alertas = [
      ...caducan.map(i => ({ tipo: 'mal', texto: `<b>${esc(i.nombre)}</b> ${Calc.estadoCaducidad(i.caducidad) === 'caducado' ? 'está caducado' : 'caduca ' + (Calc.diasHasta(i.caducidad) === 0 ? 'hoy' : 'en ' + Calc.diasHasta(i.caducidad) + ' día(s)')}`, ir: 'inventario' })),
      ...platos.filter(p => p.agotado).map(p => ({ tipo: 'mal', texto: `<b>${esc(p.nombre)}</b> está marcado como agotado`, ir: 'escandallos' })),
      ...pedidos.map(g => ({ tipo: 'medio', texto: `Pedido pendiente a <b>${esc(g.proveedor.nombre)}</b>: ${g.lineas.length} producto(s) · antes de las ${esc(g.proveedor.pedidoAntes)}`, ir: 'pedidos' })),
      ...sinRegistro.map(({ c, turno }) => ({ tipo: 'medio', texto: `Falta el registro de temperatura de ${turno} en <b>${esc(c.nombre)}</b>`, ir: 'appcc' })),
      ...comida.filter(p => Calc.foodCost(p, ingredientes, negocio.iva) > negocio.objetivoFoodCost + 5)
        .map(p => ({ tipo: 'medio', texto: `<b>${esc(p.nombre)}</b> tiene un food cost de ${fmt.pct(Calc.foodCost(p, ingredientes, negocio.iva))}`, ir: 'escandallos' }))
    ];

    const fechaTexto = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const saludo = `${fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1)} · hola, ${esc(u.nombre.split(' ')[0])}`;

    // KPIs: el administrador ve el negocio; el jefe de cocina, la cocina
    let kpis;
    let grafico;
    if (puede('ventas')) {
      const hoyV = Calc.ventas(comandas, 0);
      const semana = Calc.ventas(comandas, 6);
      const factHoy = hoyV.reduce((t, c) => t + c.total, 0);
      const factSemana = semana.reduce((t, c) => t + c.total, 0);
      const paxSemana = semana.reduce((t, c) => t + c.comensales, 0);
      const enMesa = abiertas.reduce((t, c) => t + Calc.totalComanda(c), 0);
      kpis = `${kpi('Ventas hoy', fmt.euro(factHoy), `+ ${fmt.euro(enMesa)} en mesas abiertas`)}
        ${kpi('Últimos 7 días', fmt.euro(factSemana), `${paxSemana} comensales`)}
        ${kpi('Ticket medio', fmt.euro(paxSemana ? factSemana / paxSemana : 0), 'por comensal, 7 días')}
        ${kpi('Sala ahora', `${abiertas.length} / ${mesas.length}`, `${cola} plato(s) en cola de cocina`, cola ? 'aviso' : '')}
        ${kpi('Food cost medio', fmt.pct(fcMedio), `objetivo ${negocio.objetivoFoodCost} %`, fcMedio <= negocio.objetivoFoodCost ? 'ok' : 'aviso')}
        ${kpi('APPCC fuera de rango', fueraRango.length, 'últimos 7 días', fueraRango.length ? 'peligro' : 'ok')}`;
      grafico = `<h2>Ventas de los últimos 14 días</h2>${columnas(ventasPorDia(comandas, 14))}
        <p class="tenue">Los lunes el restaurante cierra. <a href="#informes">Ver informes completos →</a></p>`;
    } else {
      const fcPorPlato = Object.fromEntries(comida.map(p => [p.nombre, Calc.foodCost(p, ingredientes, negocio.iva)]).sort((a, b) => b[1] - a[1]).slice(0, 8));
      kpis = `${kpi('En cola de cocina', cola, 'platos por empezar', cola ? 'aviso' : 'ok')}
        ${kpi('Bajo mínimo', bajoMinimo.length, `${pedidos.length} pedido(s) por hacer`, bajoMinimo.length ? 'aviso' : '')}
        ${kpi('Caducan ≤ 2 días', caducan.length, 'usar primero', caducan.length ? 'peligro' : '')}
        ${kpi('Food cost medio', fmt.pct(fcMedio), `objetivo ${negocio.objetivoFoodCost} %`, fcMedio <= negocio.objetivoFoodCost ? 'ok' : 'aviso')}
        ${kpi('Mermas 30 días', fmt.euro(costeMerma30), `${merma30.length} registros`)}
        ${kpi('APPCC fuera de rango', fueraRango.length, 'últimos 7 días', fueraRango.length ? 'peligro' : 'ok')}`;
      grafico = `<h2>Platos con más food cost</h2>${barras(fcPorPlato, fmt.pct, (k, v) => claseFoodCost(v))}`;
    }

    return cabecera(esc(negocio.nombre), saludo)
      + `<section class="kpis">${kpis}</section>
        <section class="rejilla-2">
          <article class="tarjeta">
            <h2>Avisos <span class="contador">${alertas.length}</span></h2>
            ${alertas.length ? `<ul class="alertas">${alertas.map(a => `<li class="${a.tipo}"><a href="#${a.ir}">${a.texto}</a></li>`).join('')}</ul>`
              : '<p class="tenue">Todo en orden. ¡Buen servicio!</p>'}
          </article>
          <article class="tarjeta">${grafico}</article>
        </section>`;
  },

  /* ---------- INFORMES ---------- */
  informes() {
    const { comandas, platos, ingredientes, mermas, negocio, usuarios } = D();
    const dias = estadoUI.periodoInformes;
    const ventas = Calc.ventas(comandas, dias - 1);
    const facturacion = ventas.reduce((t, c) => t + c.total, 0);
    const base = facturacion / (1 + negocio.iva / 100);
    const pax = ventas.reduce((t, c) => t + c.comensales, 0);
    const coste = Calc.costeVendido(ventas, platos, ingredientes);
    const fcReal = base ? coste / base * 100 : 0;
    const costeMermas = Calc.mermasRecientes(mermas, dias).reduce((t, m) => t + Calc.costeMerma(m, ingredientes), 0);
    const verCostes = puede('costes');

    // Platos más vendidos
    const porPlato = {};
    ventas.forEach(c => c.lineas.forEach(l => {
      const x = porPlato[l.platoId] || (porPlato[l.platoId] = { nombre: l.nombre, uds: 0, importe: 0 });
      x.uds += l.cantidad; x.importe += l.cantidad * l.precio;
    }));
    const ranking = Object.entries(porPlato).map(([id, x]) => {
      const p = platos.find(pp => pp.id === id);
      const costeU = p ? Calc.costePlato(p, ingredientes) : 0;
      return { ...x, categoria: p?.categoria || '', margen: x.importe / (1 + negocio.iva / 100) - costeU * x.uds };
    }).sort((a, b) => b.importe - a.importe);

    const porCategoria = {};
    ranking.forEach(r => { porCategoria[r.categoria || 'Otros'] = (porCategoria[r.categoria || 'Otros'] || 0) + r.importe; });
    const porCamarero = Calc.agruparSuma(ventas, 'camareroId', c => c.total);
    const porCamareroNombre = Object.fromEntries(Object.entries(porCamarero).map(([id, v]) => [usuarios.find(u => u.id === id)?.nombre || '—', v]));
    const porPago = Calc.agruparSuma(ventas, 'formaPago', c => c.total);

    return cabecera('Informes', `Resultados de los últimos ${dias} días`,
        `<div class="segmentado">${[7, 14, 28].map(n => `<button data-accion="periodo-informes" data-valor="${n}" class="${n === dias ? 'activo' : ''}">${n} días</button>`).join('')}</div>
         ${si(puede('ventas'), `<button class="btn" data-accion="exportar-ventas">Descargar CSV</button>`)}`)
      + `<section class="kpis">
          ${kpi('Facturación', fmt.euro(facturacion), `${fmt.euro(base)} sin IVA`)}
          ${kpi('Mesas atendidas', ventas.length, `${pax} comensales`)}
          ${kpi('Ticket medio', fmt.euro(pax ? facturacion / pax : 0), 'por comensal')}
          ${si(verCostes, kpi('Food cost real', fmt.pct(fcReal), `coste ${fmt.euro(coste)}`, fcReal <= negocio.objetivoFoodCost ? 'ok' : 'aviso'))}
          ${si(verCostes, kpi('Margen bruto', fmt.euro(base - coste), 'ventas sin IVA − materia prima'))}
          ${si(verCostes, kpi('Mermas', fmt.euro(costeMermas), base ? `${fmt.pct(costeMermas / base * 100)} de las ventas` : ''))}
        </section>
        <article class="tarjeta"><h2>Ventas por día</h2>${columnas(ventasPorDia(comandas, dias))}</article>
        <section class="rejilla-2 mt">
          <article class="tarjeta"><h2>Platos más vendidos</h2>
            <div class="tabla-envoltorio"><table class="tabla mini">
              <thead><tr><th>#</th><th>Plato</th><th class="num">Uds.</th><th class="num">Ventas</th>${si(verCostes, '<th class="num">Margen</th>')}</tr></thead>
              <tbody>${ranking.slice(0, 12).map((r, i) => `<tr><td class="tenue">${i + 1}</td><td>${esc(r.nombre)}<br><small class="tenue">${esc(r.categoria)}</small></td>
                <td class="num">${r.uds}</td><td class="num">${fmt.euro(r.importe)}</td>${si(verCostes, `<td class="num">${fmt.euro(r.margen)}</td>`)}</tr>`).join('') || '<tr><td colspan="5" class="tenue">Sin ventas en este periodo.</td></tr>'}</tbody>
            </table></div>
          </article>
          <article class="tarjeta">
            <h2>Ventas por categoría</h2>${barras(porCategoria)}
            <h2 class="mt">Ventas por camarero</h2>${barras(porCamareroNombre)}
            <h2 class="mt">Formas de pago</h2>${barras(porPago)}
          </article>
        </section>`;
  },

  /* ---------- USUARIOS ---------- */
  usuarios() {
    const { usuarios } = D();
    const yo = Auth.usuario();
    return cabecera('Usuarios', 'Quién puede entrar y qué puede hacer cada uno',
        `<button class="btn btn-primario" data-accion="nuevo-usuario">+ Usuario</button>`)
      + `<div class="tabla-envoltorio"><table class="tabla">
          <thead><tr><th>Persona</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead>
          <tbody>${usuarios.map(u => `<tr class="${u.activo ? '' : 'inactivo'}">
            <td><span class="persona">${avatar(u)}<b>${esc(u.nombre)}</b>${u.id === yo.id ? ' <small class="tenue">(tú)</small>' : ''}</span></td>
            <td data-t="Rol">${esc(ROLES[u.rol].nombre)}</td>
            <td data-t="Estado"><span class="badge ${u.activo ? 'ok' : 'caducado'}">${u.activo ? 'Activo' : 'Desactivado'}</span></td>
            <td data-t="Último acceso">${u.ultimoAcceso ? fmt.fechaHora(u.ultimoAcceso) : '<span class="tenue">Nunca</span>'}</td>
            <td class="acciones-fila">
              <button class="btn btn-peque" data-accion="pin-usuario" data-id="${u.id}">Cambiar PIN</button>
              <button class="btn-icono" data-accion="editar-usuario" data-id="${u.id}" aria-label="Editar">✎</button>
              ${u.id !== yo.id ? `<button class="btn btn-peque btn-fantasma" data-accion="alternar-usuario" data-id="${u.id}">${u.activo ? 'Desactivar' : 'Activar'}</button>` : ''}
            </td></tr>`).join('')}</tbody>
        </table></div>
        <h2 class="mt">Qué puede hacer cada rol</h2>
        <section class="rejilla-cartas">${Object.entries(ROLES).map(([k, r]) => `
          <article class="tarjeta rol"><h3>${esc(r.nombre)}</h3><p class="tenue">${esc(r.descripcion)}</p>
            <div>${r.vistas.map(v => `<span class="chip">${esc(NOMBRES_VISTA[v] || v)}</span>`).join('')}</div>
            <small class="tenue">${usuarios.filter(u => u.rol === k && u.activo).length} persona(s)</small>
          </article>`).join('')}</section>`;
  },

  /* ---------- AJUSTES ---------- */
  ajustes() {
    const { negocio } = D();
    return cabecera('Ajustes', 'Datos del negocio, seguridad y copias de seguridad')
      + `<section class="rejilla-2">
          <article class="tarjeta"><h2>Negocio</h2>
            <dl class="datos">
              <div><dt>Nombre</dt><dd>${esc(negocio.nombre)}</dd></div>
              <div><dt>Localidad</dt><dd>${esc(negocio.localidad || '—')}</dd></div>
              <div><dt>CIF</dt><dd>${esc(negocio.cif || '—')}</dd></div>
              <div><dt>IVA en carta</dt><dd>${negocio.iva} %</dd></div>
              <div><dt>Food cost objetivo</dt><dd>${negocio.objetivoFoodCost} %</dd></div>
              <div><dt>Bloqueo automático</dt><dd>${negocio.bloqueoMinutos} min sin uso</dd></div>
            </dl>
            <button class="btn" data-accion="editar-negocio">Editar</button>
          </article>
          <article class="tarjeta"><h2>Copia de seguridad</h2>
            <p class="tenue">Los datos se guardan en este dispositivo. Descarga una copia para no perderlos o para pasarlos a otro equipo.</p>
            <div class="fila-botones">
              <button class="btn btn-primario" data-accion="exportar">Descargar copia (.json)</button>
              <label class="btn">Restaurar copia<input type="file" id="importar" accept=".json,application/json" hidden></label>
              <button class="btn btn-fantasma" data-accion="reiniciar">Volver a datos de ejemplo</button>
            </div>
          </article>
          <article class="tarjeta"><h2>Varios dispositivos a la vez</h2>
            <p class="tenue">Abre Mise en otra pestaña o ventana (por ejemplo, una como camarero y otra como cocina): los cambios aparecen al momento en las dos. En la versión con servidor funciona igual entre tablets y móviles distintos.</p>
          </article>
        </section>`;
  }
});

const NOMBRES_VISTA = {
  panel: 'Panel', sala: 'Sala', cocina: 'Cocina', inventario: 'Inventario', pedidos: 'Pedidos', escandallos: 'Carta y costes',
  appcc: 'APPCC', alergenos: 'Alérgenos', mermas: 'Mermas', informes: 'Informes', usuarios: 'Usuarios', ajustes: 'Ajustes'
};

const camposUsuario = (nuevo) => [
  { nombre: 'nombre', etiqueta: 'Nombre y apellido', obligatorio: true },
  { nombre: 'rol', etiqueta: 'Rol', tipo: 'select', opciones: Object.entries(ROLES).map(([k, r]) => [k, `${r.nombre} · ${r.descripcion}`]) },
  ...(nuevo ? [{ nombre: 'pin', etiqueta: 'PIN de 4 cifras', tipo: 'password', obligatorio: true, patron: '\\d{4}', modo: 'numeric', max: 4, ayuda: 'Se guarda cifrado: nadie podrá verlo después, ni el administrador.' }] : [])
];

const COLORES = ['#ff6a2b', '#ffb347', '#5cc98b', '#4fb3d9', '#b98cf5', '#f57fb0', '#e8d35a', '#7fd6c2'];
const adminsActivos = () => D().usuarios.filter(u => u.rol === 'admin' && u.activo);

Object.assign(Acciones, {
  'periodo-informes': (_, b) => { estadoUI.periodoInformes = Number(b.dataset.valor); pintar(); },

  'nuevo-usuario': () => abrirFormulario({
    titulo: 'Nuevo usuario', campos: camposUsuario(true), valores: { rol: 'camarero' },
    alGuardar: (v) => {
      if (!/^\d{4}$/.test(v.pin)) { avisar('El PIN tiene que tener 4 números.'); return false; }
      const u = Datos.crearUsuario({ nombre: v.nombre, rol: v.rol, pin: v.pin, color: COLORES[D().usuarios.length % COLORES.length] });
      D().usuarios.push(u); Datos.guardar();
      avisar(`${v.nombre} ya puede entrar con su PIN`);
    }
  }),
  'editar-usuario': (id) => {
    const u = D().usuarios.find(x => x.id === id);
    abrirFormulario({
      titulo: 'Editar usuario', campos: camposUsuario(false), valores: u,
      alGuardar: (v) => {
        if (u.rol === 'admin' && v.rol !== 'admin' && adminsActivos().length <= 1) { avisar('Tiene que quedar al menos un administrador.'); return false; }
        Datos.actualizar('usuarios', id, { nombre: v.nombre, rol: v.rol });
        avisar('Usuario actualizado');
      }
    });
  },
  'pin-usuario': (id) => {
    const u = D().usuarios.find(x => x.id === id);
    abrirFormulario({
      titulo: `Nuevo PIN para ${u.nombre}`,
      campos: [{ nombre: 'pin', etiqueta: 'PIN de 4 cifras', tipo: 'password', obligatorio: true, patron: '\\d{4}', modo: 'numeric', max: 4 }],
      alGuardar: (v) => {
        if (!/^\d{4}$/.test(v.pin)) { avisar('El PIN tiene que tener 4 números.'); return false; }
        Auth.cambiarPin(id, v.pin); avisar('PIN cambiado');
      }
    });
  },
  'alternar-usuario': (id) => {
    const u = D().usuarios.find(x => x.id === id);
    if (u.activo && u.rol === 'admin' && adminsActivos().length <= 1) return avisar('Tiene que quedar al menos un administrador.');
    if (u.activo && !confirmar(`¿Desactivar a ${u.nombre}? Ya no podrá entrar, pero se conserva todo lo que registró.`)) return;
    Datos.actualizar('usuarios', id, { activo: !u.activo });
    pintar();
  },

  'editar-negocio': () => abrirFormulario({
    titulo: 'Datos del negocio',
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre del restaurante', obligatorio: true },
      { nombre: 'localidad', etiqueta: 'Localidad' },
      { nombre: 'cif', etiqueta: 'CIF' },
      { nombre: 'iva', etiqueta: 'IVA aplicado en carta (%)', tipo: 'number', paso: '1', min: 0 },
      { nombre: 'objetivoFoodCost', etiqueta: 'Food cost objetivo (%)', tipo: 'number', paso: '1', min: 1, ayuda: 'Lo habitual en restauración está entre el 25 y el 35 %.' },
      { nombre: 'bloqueoMinutos', etiqueta: 'Bloquear tras … minutos sin uso', tipo: 'number', paso: '1', min: 1 }
    ],
    valores: D().negocio,
    alGuardar: (v) => { Object.assign(D().negocio, v); Datos.guardar(); avisar('Ajustes guardados'); }
  }),
  'exportar': () => {
    descargar(`mise-copia-${hoyISO()}.json`, Datos.exportar(), 'application/json');
  },
  'exportar-ventas': () => {
    const { comandas, mesas, usuarios } = D();
    const filas = [['fecha_cierre', 'mesa', 'camarero', 'comensales', 'forma_pago', 'total', 'platos']];
    comandas.filter(c => c.estado === 'cerrada').sort((a, b) => a.cerrada.localeCompare(b.cerrada)).forEach(c => {
      filas.push([c.cerrada.replace('T', ' '), mesas.find(m => m.id === c.mesaId)?.nombre || '', usuarios.find(u => u.id === c.camareroId)?.nombre || '',
        c.comensales, c.formaPago, String(c.total).replace('.', ','), c.lineas.map(l => `${l.cantidad}x ${l.nombre}`).join(' | ')]);
    });
    const csv = filas.map(f => f.map(x => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    descargar('ventas.csv', '﻿' + csv, 'text/csv;charset=utf-8');
  },
  'reiniciar': () => {
    if (confirmar('Se borrarán tus datos y se cargarán los de ejemplo. ¿Seguro?')) { Datos.reiniciar(); Auth.salir(); avisar('Datos de ejemplo cargados'); pintar(); }
  }
});
