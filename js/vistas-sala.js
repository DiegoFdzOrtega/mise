/* =========================================================
   vistas-sala.js — Sala (camareros) y pantalla de cocina
   ---------------------------------------------------------
   Flujo de una comanda:
   borrador → (enviar) → pendiente → preparando → listo → servido
   - Las bebidas no pasan por cocina: se sirven desde barra.
   - Al enviar a cocina se descuenta el stock según el escandallo.
   - Si la mesa tiene alergias, avisa al pedir y lo marca en cocina.
   ========================================================= */

const ESTADOS_LINEA = {
  borrador: 'Sin enviar', pendiente: 'En cola', preparando: 'Preparando', listo: '¡Listo!', servido: 'Servido'
};

const esBebida = (platoId) => (D().platos.find(p => p.id === platoId)?.categoria === 'Bebidas');
const comandaAbierta = (mesaId) => D().comandas.find(c => c.mesaId === mesaId && c.estado === 'abierta');
const nombreUsuario = (id) => D().usuarios.find(u => u.id === id)?.nombre || '—';

// Avisos para el menú lateral (números rojos)
function contadoresSala() {
  const abiertas = D().comandas.filter(c => c.estado === 'abierta');
  const listos = abiertas.reduce((t, c) => t + c.lineas.filter(l => l.estado === 'listo').length, 0);
  const cola = abiertas.reduce((t, c) => t + c.lineas.filter(l => l.estado === 'pendiente').length, 0);
  return { listos, cola };
}

// Color según los minutos que lleva esperando
const claseEspera = (min) => min >= 20 ? 'mal' : min >= 10 ? 'medio' : 'bien';

Object.assign(Vistas, {
  /* ---------- SALA: plano de mesas ---------- */
  sala() {
    const { mesas, comandas } = D();
    const abiertas = comandas.filter(c => c.estado === 'abierta');
    const ocupadas = abiertas.length;
    const enMesa = abiertas.reduce((t, c) => t + Calc.totalComanda(c), 0);
    const comensales = abiertas.reduce((t, c) => t + c.comensales, 0);
    const zonas = [...new Set(mesas.map(m => m.zona))];

    return cabecera('Sala', 'Toca una mesa para abrirla o ver su comanda',
        si(puede('gestionMesas'), `<button class="btn" data-accion="nueva-mesa">+ Mesa</button>`))
      + `<section class="kpis">
          ${kpi('Mesas ocupadas', `${ocupadas} / ${mesas.length}`, `${comensales} comensales`)}
          ${kpi('Platos listos para servir', contadoresSala().listos, 'recoger en el pase', contadoresSala().listos ? 'aviso' : 'ok')}
          ${kpi('En mesas abiertas', fmt.euro(enMesa), 'pendiente de cobro')}
        </section>
        ${zonas.map(z => `<h2 class="mt">${esc(z)}</h2>
          <section class="plano">${mesas.filter(m => m.zona === z).map(m => {
            const c = abiertas.find(x => x.mesaId === m.id);
            if (!c) return `<button class="mesa libre" data-accion="abrir-mesa" data-id="${m.id}">
                <b>${esc(m.nombre)}</b><small>Libre · ${m.plazas} plazas</small></button>`;
            const listos = c.lineas.filter(l => l.estado === 'listo').length;
            const sinEnviar = c.lineas.filter(l => l.estado === 'borrador').length;
            const min = Calc.minutosDesde(c.abierta);
            return `<a class="mesa ocupada ${listos ? 'con-listos' : ''}" href="#mesa/${c.id}">
                <b>${esc(m.nombre)}</b>
                <small>${c.comensales} pax · ${min} min · ${esc(nombreUsuario(c.camareroId).split(' ')[0])}</small>
                <strong>${fmt.euro(Calc.totalComanda(c))}</strong>
                ${listos ? `<span class="etiqueta-mesa listo">${listos} listo(s) para servir</span>` : ''}
                ${sinEnviar ? `<span class="etiqueta-mesa borrador">${sinEnviar} sin enviar</span>` : ''}
                ${c.alergias.length ? `<span class="etiqueta-mesa alergia">⚠ ${esc(c.alergias.join(', '))}</span>` : ''}
              </a>`;
          }).join('')}</section>`).join('')}`;
  },

  /* ---------- MESA: comanda de una mesa ---------- */
  mesa(id) {
    const { platos, ingredientes, mesas } = D();
    const c = D().comandas.find(x => x.id === id);
    if (!c || c.estado !== 'abierta') return cabecera('Mesa cerrada', 'Esta comanda ya no está abierta', '<a class="btn" href="#sala">← Volver a sala</a>');
    const mesa = mesas.find(m => m.id === c.mesaId);
    const categorias = ordenCategorias(platos);
    const cat = categorias.includes(estadoUI.categoriaSala) ? estadoUI.categoriaSala : categorias[0];

    const botonesCarta = ordenarPorCategoria(platos).filter(p => p.categoria === cat).map(p => {
      const raciones = Calc.racionesDisponibles(p, ingredientes);
      const sinStock = p.agotado || raciones <= 0;
      const choca = Calc.alergenosPlato(p, ingredientes).filter(a => c.alergias.includes(a));
      return `<button class="plato-boton ${sinStock ? 'sin-stock' : ''} ${choca.length ? 'choca' : ''}" data-accion="anadir-plato" data-id="${p.id}" ${sinStock ? 'disabled' : ''}>
          <b>${esc(p.nombre)}</b>
          <span>${fmt.euro(p.pvp)}</span>
          <small>${p.agotado ? 'AGOTADO' : raciones <= 0 ? 'Sin stock' : raciones <= 5 ? `Quedan ${raciones}` : ''}${choca.length ? ` ⚠ ${esc(choca.join(', '))}` : ''}</small>
        </button>`;
    }).join('');

    const grupo = (titulo, lineas, extra = '') => lineas.length ? `
      <div class="grupo-ticket"><h3>${titulo}${extra}</h3>
        ${lineas.map(l => `<div class="linea-ticket estado-${l.estado}">
          <div class="lt-nombre">
            ${l.estado === 'borrador'
              ? `<span class="cantidad-ctrl"><button data-accion="cambiar-cantidad" data-id="${l.id}" data-valor="-1" aria-label="Menos">−</button><b>${l.cantidad}</b><button data-accion="cambiar-cantidad" data-id="${l.id}" data-valor="1" aria-label="Más">+</button></span>`
              : `<b class="cant">${l.cantidad}×</b>`}
            <span>${esc(l.nombre)}${l.nota ? `<small class="nota">✎ ${esc(l.nota)}</small>` : ''}</span>
          </div>
          <div class="lt-derecha">
            ${l.estado === 'borrador' ? `<button class="btn-icono" data-accion="nota-linea" data-id="${l.id}" aria-label="Nota" title="Añadir nota para cocina">✎</button>` : `<span class="badge estado ${l.estado}">${ESTADOS_LINEA[l.estado]}</span>`}
            ${l.estado === 'listo' ? `<button class="btn btn-peque btn-primario" data-accion="servir-linea" data-id="${l.id}">Servir</button>` : ''}
            <span class="num">${fmt.euro(l.precio * l.cantidad)}</span>
          </div>
        </div>`).join('')}
      </div>` : '';

    const borrador = c.lineas.filter(l => l.estado === 'borrador');
    const listos = c.lineas.filter(l => l.estado === 'listo');
    const enCocina = c.lineas.filter(l => ['pendiente', 'preparando'].includes(l.estado));
    const servidos = c.lineas.filter(l => l.estado === 'servido');
    const total = Calc.totalComanda(c);
    const base = total / (1 + D().negocio.iva / 100);

    return cabecera(esc(mesa?.nombre || 'Mesa'),
        `${c.comensales} comensales · abierta a las ${hora(c.abierta)} · atiende ${esc(nombreUsuario(c.camareroId))}`,
        `<a class="btn" href="#sala">← Sala</a>
         <button class="btn" data-accion="comensales-mesa" data-id="${c.id}">Comensales</button>
         <button class="btn ${c.alergias.length ? 'btn-alerta' : ''}" data-accion="alergias-mesa" data-id="${c.id}">⚠ Alergias${c.alergias.length ? ` (${c.alergias.length})` : ''}</button>`)
      + (c.alergias.length ? `<div class="banda-alergia">⚠ Mesa con alergia o intolerancia a: <b>${esc(c.alergias.join(', '))}</b>. Los platos que los contienen aparecen marcados.</div>` : '')
      + `<section class="comanda">
          <div class="carta-sala">
            <div class="segmentado desplazable">${categorias.map(k => `<button data-accion="categoria-sala" data-valor="${esc(k)}" class="${k === cat ? 'activo' : ''}">${esc(k)}</button>`).join('')}</div>
            <div class="rejilla-platos">${botonesCarta}</div>
          </div>
          <aside class="ticket tarjeta">
            ${grupo('Sin enviar', borrador)}
            ${borrador.length ? `<button class="btn btn-primario btn-ancho" data-accion="enviar-cocina" data-id="${c.id}">Enviar comanda (${borrador.reduce((t, l) => t + l.cantidad, 0)})</button>` : ''}
            ${grupo('Listos para servir', listos, listos.length > 1 ? ` <button class="btn btn-peque" data-accion="servir-todo" data-id="${c.id}">Servir todo</button>` : '')}
            ${grupo('En cocina', enCocina)}
            ${grupo('Servido', servidos)}
            ${!c.lineas.length ? '<p class="tenue centro">Comanda vacía. Toca los platos de la carta para añadirlos.</p>' : ''}
            <div class="ticket-total">
              ${borrador.length ? `<div class="aviso-borrador"><span>Sin enviar (no cuenta aún)</span><span>${fmt.euro(borrador.reduce((t, l) => t + l.precio * l.cantidad, 0))}</span></div>` : ''}
              <div><span>Base imponible</span><span>${fmt.euro(base)}</span></div>
              <div><span>IVA ${D().negocio.iva} %</span><span>${fmt.euro(total - base)}</span></div>
              <div class="grande"><span>Total</span><b>${fmt.euro(total)}</b></div>
            </div>
            <div class="fila-botones">
              ${si(puede('cobrar'), `<button class="btn btn-primario btn-ancho" data-accion="cobrar-mesa" data-id="${c.id}" ${total <= 0 ? 'disabled' : ''}>Cobrar ${fmt.euro(total)}</button>`)}
              ${c.lineas.every(l => l.estado === 'borrador') ? `<button class="btn btn-fantasma" data-accion="anular-mesa" data-id="${c.id}">Liberar mesa</button>` : ''}
            </div>
          </aside>
        </section>`;
  },

  /* ---------- COCINA: pantalla de comandas (KDS) ---------- */
  cocina() {
    const { comandas, mesas, platos, ingredientes } = D();
    const abiertas = comandas.filter(c => c.estado === 'abierta');
    // Un "ticket" = las líneas de una mesa que están en el mismo estado
    const tickets = (estado) => abiertas.map(c => {
      const lineas = c.lineas.filter(l => l.estado === estado && !esBebida(l.platoId));
      if (!lineas.length) return null;
      const desde = lineas.map(l => l.enviada).sort()[0];
      return { c, lineas, desde, min: Calc.minutosDesde(desde) };
    }).filter(Boolean).sort((a, b) => a.desde.localeCompare(b.desde));

    const columna = (estado, titulo, boton, accion) => {
      const lista = tickets(estado);
      return `<div class="kds-col">
        <h2>${titulo} <span class="contador">${lista.length}</span></h2>
        ${lista.map(t => {
          const mesa = mesas.find(m => m.id === t.c.mesaId);
          return `<article class="kds-ticket espera-${estado === 'listo' ? 'bien' : claseEspera(t.min)}">
            <header><b>${esc(mesa?.nombre || '?')}</b><span>${t.c.comensales} pax · ${esc(nombreUsuario(t.c.camareroId).split(' ')[0])}</span><strong>${t.min}′</strong></header>
            ${t.c.alergias.length ? `<div class="kds-alergia">⚠ ALERGIA: ${esc(t.c.alergias.join(', ').toUpperCase())}</div>` : ''}
            <ul>${t.lineas.map(l => `<li><b>${l.cantidad}×</b> ${esc(l.nombre)}${l.nota ? `<small>✎ ${esc(l.nota)}</small>` : ''}</li>`).join('')}</ul>
            ${boton ? `<button class="btn btn-ancho ${estado === 'preparando' ? 'btn-primario' : ''}" data-accion="${accion}" data-id="${t.c.id}" data-valor="${estado}">${boton}</button>` : `<small class="tenue">Esperando a que sala lo recoja</small>`}
          </article>`;
        }).join('') || '<p class="tenue">Nada por aquí.</p>'}
      </div>`;
    };

    const agotados = platos.filter(p => p.agotado);
    const pocos = platos.filter(p => !p.agotado && p.categoria !== 'Bebidas' && Calc.racionesDisponibles(p, ingredientes) <= 3);

    return cabecera('Cocina', `Comandas en directo · se actualiza sola · ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        `<a class="btn" href="#escandallos">Agotar plato</a>`)
      + ((agotados.length || pocos.length) ? `<div class="barra-herramientas">
          ${agotados.map(p => `<span class="chip chip-agotado">AGOTADO · ${esc(p.nombre)}</span>`).join('')}
          ${pocos.map(p => `<span class="chip chip-pocos">Quedan ${Calc.racionesDisponibles(p, ingredientes)} · ${esc(p.nombre)}</span>`).join('')}
        </div>` : '')
      + `<section class="kds">
          ${columna('pendiente', 'En cola', 'Empezar', 'empezar-ticket')}
          ${columna('preparando', 'Preparando', 'Listo para servir ✓', 'listo-ticket')}
          ${columna('listo', 'En el pase', '', '')}
        </section>`;
  }
});

/* ---------- Acciones de sala y cocina ---------- */
function lineaDe(id) {
  for (const c of D().comandas) {
    const l = c.lineas.find(x => x.id === id);
    if (l) return { c, l };
  }
  return {};
}

Object.assign(Acciones, {
  'categoria-sala': (_, b) => { estadoUI.categoriaSala = b.dataset.valor; pintar(); },

  'abrir-mesa': (mesaId) => {
    const mesa = D().mesas.find(m => m.id === mesaId);
    const ya = comandaAbierta(mesaId);
    if (ya) { location.hash = 'mesa/' + ya.id; return; }
    abrirFormulario({
      titulo: `Abrir ${mesa.nombre}`,
      campos: [
        { nombre: 'comensales', etiqueta: 'Comensales', tipo: 'number', paso: '1', min: 1, obligatorio: true },
        { nombre: 'alergias', etiqueta: '¿Alguna alergia o intolerancia en la mesa?', tipo: 'checks', opciones: ALERGENOS }
      ],
      valores: { comensales: Math.min(2, mesa.plazas), alergias: [] },
      alGuardar: (v) => {
        if (v.comensales < 1) { avisar('Indica cuántos comensales son.'); return false; }
        const c = Datos.insertar('comandas', {
          mesaId, camareroId: Auth.usuario().id, comensales: v.comensales, alergias: v.alergias || [],
          abierta: ahoraISO(), cerrada: '', estado: 'abierta', formaPago: '', total: 0, lineas: []
        });
        estadoUI.categoriaSala = '';
        setTimeout(() => { location.hash = 'mesa/' + c.id; });
      }
    });
  },

  'anadir-plato': (platoId) => {
    const c = D().comandas.find(x => x.id === estadoUI.mesa);
    const p = D().platos.find(x => x.id === platoId);
    if (!c || !p) return;
    const choca = Calc.alergenosPlato(p, D().ingredientes).filter(a => c.alergias.includes(a));
    if (choca.length && !confirmar(`⚠ ${p.nombre} contiene ${choca.join(', ')} y en esta mesa hay alergia.\n\n¿Añadirlo igualmente? (pon una nota para cocina)`)) return;
    const igual = c.lineas.find(l => l.platoId === platoId && l.estado === 'borrador' && !l.nota);
    if (igual) igual.cantidad++;
    else c.lineas.push({ id: Datos.nuevoId(), platoId, nombre: p.nombre, precio: p.pvp, cantidad: 1, nota: '', estado: 'borrador', enviada: '' });
    Datos.guardar();
    pintar();
  },

  'cambiar-cantidad': (lineaId, b) => {
    const { c, l } = lineaDe(lineaId);
    if (!l || l.estado !== 'borrador') return;
    l.cantidad += Number(b.dataset.valor);
    if (l.cantidad <= 0) c.lineas = c.lineas.filter(x => x.id !== lineaId);
    Datos.guardar();
    pintar();
  },

  'nota-linea': (lineaId) => {
    const { l } = lineaDe(lineaId);
    abrirFormulario({
      titulo: `Nota para cocina · ${l.nombre}`,
      campos: [{ nombre: 'nota', etiqueta: 'Nota', ayuda: 'Ej.: sin cebolla, poco hecho, para compartir, sacar después del arroz…' }],
      valores: { nota: l.nota },
      alGuardar: (v) => { l.nota = v.nota; Datos.guardar(); }
    });
  },

  'enviar-cocina': (comandaId) => {
    const { ingredientes } = D();
    const c = D().comandas.find(x => x.id === comandaId);
    const borrador = c.lineas.filter(l => l.estado === 'borrador');
    const ahora = ahoraISO();
    borrador.forEach(l => {
      // Descontar del stock lo que lleva el plato
      const p = D().platos.find(x => x.id === l.platoId);
      p?.lineas.forEach(e => {
        const ing = Calc.ingrediente(ingredientes, e.ingId);
        if (ing) ing.stock = Math.max(0, +(ing.stock - e.cantidad * l.cantidad).toFixed(3));
      });
      l.enviada = ahora;
      l.estado = esBebida(l.platoId) ? 'servido' : 'pendiente';
    });
    Datos.guardar();
    const aCocina = borrador.filter(l => l.estado === 'pendiente').length;
    avisar(aCocina ? `Comanda enviada: ${aCocina} plato(s) a cocina` : 'Bebidas anotadas');
    pintar();
  },

  'servir-linea': (lineaId) => {
    const { l } = lineaDe(lineaId);
    if (l) { l.estado = 'servido'; Datos.guardar(); pintar(); }
  },
  'servir-todo': (comandaId) => {
    const c = D().comandas.find(x => x.id === comandaId);
    c.lineas.filter(l => l.estado === 'listo').forEach(l => { l.estado = 'servido'; });
    Datos.guardar(); pintar();
  },

  'comensales-mesa': (comandaId) => {
    const c = D().comandas.find(x => x.id === comandaId);
    abrirFormulario({
      titulo: 'Comensales', campos: [{ nombre: 'comensales', etiqueta: 'Número de comensales', tipo: 'number', paso: '1', min: 1 }],
      valores: c, alGuardar: (v) => { c.comensales = Math.max(1, v.comensales); Datos.guardar(); }
    });
  },
  'alergias-mesa': (comandaId) => {
    const c = D().comandas.find(x => x.id === comandaId);
    abrirFormulario({
      titulo: 'Alergias e intolerancias de la mesa',
      campos: [{ nombre: 'alergias', etiqueta: 'Marca las que haya en la mesa', tipo: 'checks', opciones: ALERGENOS, ayuda: 'Cocina lo verá en grande en cada ticket de esta mesa.' }],
      valores: c, alGuardar: (v) => { c.alergias = v.alergias || []; Datos.guardar(); avisar('Alergias guardadas'); }
    });
  },
  'anular-mesa': (comandaId) => {
    if (!confirmar('¿Liberar la mesa? Se borrará la comanda (no se ha enviado nada).')) return;
    Datos.borrar('comandas', comandaId);
    location.hash = 'sala';
  },

  'cobrar-mesa': (comandaId) => {
    const c = D().comandas.find(x => x.id === comandaId);
    const total = Calc.totalComanda(c);
    const pendientes = c.lineas.filter(l => ['pendiente', 'preparando'].includes(l.estado)).length;
    abrirFormulario({
      titulo: `Cobrar ${fmt.euro(total)}`,
      campos: [
        { nombre: 'formaPago', etiqueta: 'Forma de pago', tipo: 'select', opciones: ['Tarjeta', 'Efectivo', 'Bizum'] },
        { nombre: 'entregado', etiqueta: 'Entregado (solo efectivo, para calcular el cambio)', tipo: 'number', paso: '0.01', min: 0 }
      ],
      valores: { formaPago: 'Tarjeta' },
      alGuardar: (v) => {
        if (pendientes && !confirmar(`Aún hay ${pendientes} plato(s) en cocina. ¿Cobrar igualmente?`)) return false;
        if (v.formaPago === 'Efectivo' && v.entregado && v.entregado < total) { avisar('El importe entregado es menor que el total.'); return false; }
        c.lineas = c.lineas.filter(l => l.estado !== 'borrador');
        Object.assign(c, { estado: 'cerrada', cerrada: ahoraISO(), formaPago: v.formaPago, total: +total.toFixed(2) });
        Datos.guardar();
        const cambio = v.formaPago === 'Efectivo' && v.entregado ? ` · Cambio: ${fmt.euro(v.entregado - total)}` : '';
        avisar(`Cobrado ${fmt.euro(total)} (${v.formaPago})${cambio}`);
        setTimeout(() => { location.hash = 'sala'; });
      }
    });
  },

  'empezar-ticket': (comandaId) => cambiarEstadoTicket(comandaId, 'pendiente', 'preparando'),
  'listo-ticket': (comandaId) => cambiarEstadoTicket(comandaId, 'preparando', 'listo'),

  'nueva-mesa': () => abrirFormulario({
    titulo: 'Nueva mesa',
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true, ayuda: 'Ej.: Mesa 9, Barra 1' },
      { nombre: 'zona', etiqueta: 'Zona', obligatorio: true },
      { nombre: 'plazas', etiqueta: 'Plazas', tipo: 'number', paso: '1', min: 1 }
    ],
    valores: { zona: 'Salón', plazas: 4 },
    alGuardar: (v) => { Datos.insertar('mesas', v); avisar('Mesa añadida'); }
  })
});

function cambiarEstadoTicket(comandaId, de, a) {
  const c = D().comandas.find(x => x.id === comandaId);
  if (!c) return;
  c.lineas.filter(l => l.estado === de && !esBebida(l.platoId)).forEach(l => { l.estado = a; });
  Datos.guardar();
  pintar();
}
