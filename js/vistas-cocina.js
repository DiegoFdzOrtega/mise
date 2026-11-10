/* =========================================================
   vistas-cocina.js — Pantallas de gestión de cocina
   Inventario, pedidos, carta y costes (escandallos), APPCC,
   alérgenos y mermas.
   ========================================================= */

Object.assign(Vistas, {
  /* ---------- INVENTARIO ---------- */
  inventario() {
    const { ingredientes } = D();
    const filtro = estadoUI.filtroInv;
    const texto = estadoUI.busqueda.toLowerCase();
    const lista = ingredientes
      .filter(i => i.nombre.toLowerCase().includes(texto))
      .filter(i => filtro === 'todos'
        || (filtro === 'minimo' && i.stock < i.minimo)
        || (filtro === 'caduca' && Calc.estadoCaducidad(i.caducidad) !== 'ok'))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const badgeCad = (i) => {
      const e = Calc.estadoCaducidad(i.caducidad);
      const txt = e === 'caducado' ? 'Caducado' : fmt.fecha(i.caducidad);
      return `<span class="badge ${e}">${txt}</span>`;
    };

    const costes = puede('costes');
    return cabecera('Inventario', costes ? 'Stock, precios de compra y caducidades' : 'Stock y caducidades',
        si(puede('editarInventario'), `<button class="btn btn-primario" data-accion="nuevo-ingrediente">+ Ingrediente</button>`))
      + `<div class="barra-herramientas">
          <input type="search" id="busqueda" placeholder="Buscar ingrediente…" value="${esc(estadoUI.busqueda)}">
          <div class="segmentado">
            ${[['todos', 'Todos'], ['minimo', 'Bajo mínimo'], ['caduca', 'Caducan']].map(([k, t]) =>
              `<button data-accion="filtro-inv" data-valor="${k}" class="${filtro === k ? 'activo' : ''}">${t}</button>`).join('')}
          </div>
        </div>
        <div class="tabla-envoltorio"><table class="tabla">
          <thead><tr><th>Ingrediente</th><th class="num">Stock</th><th class="num">Mínimo</th>${si(costes, '<th class="num">Precio</th><th class="num">Valor</th>')}
            <th>Caducidad</th><th>Alérgenos</th><th></th></tr></thead>
          <tbody>
          ${lista.map(i => `<tr class="${i.stock < i.minimo ? 'fila-aviso' : ''}">
              <td><b>${esc(i.nombre)}</b><br><small class="tenue">${esc(D().proveedores.find(p => p.id === i.proveedorId)?.nombre || 'Sin proveedor')}</small></td>
              <td data-t="Stock" class="num">${fmt.num(i.stock)} ${i.unidad}</td>
              <td data-t="Mínimo" class="num">${fmt.num(i.minimo)} ${i.unidad}</td>
              ${si(costes, `<td data-t="Precio" class="num">${fmt.euro(i.precio)}/${i.unidad}</td>
              <td data-t="Valor" class="num">${fmt.euro(i.precio * i.stock)}</td>`)}
              <td data-t="Caducidad">${badgeCad(i)}</td>
              <td data-t="Alérgenos">${chips(i.alergenos, 'chip-alergeno')}</td>
              <td class="acciones-fila">
                ${si(puede('moverStock'), `<button class="btn btn-peque" data-accion="mover-stock" data-id="${i.id}">± Stock</button>`)}
                ${si(puede('editarInventario'), `<button class="btn-icono" data-accion="editar-ingrediente" data-id="${i.id}" aria-label="Editar">✎</button>
                <button class="btn-icono" data-accion="borrar-ingrediente" data-id="${i.id}" aria-label="Borrar">🗑</button>`)}
              </td>
            </tr>`).join('') || `<tr><td colspan="8" class="tenue">No hay ingredientes con ese filtro.</td></tr>`}
          </tbody>
        </table></div>`;
  },

  /* ---------- ESCANDALLOS ---------- */
  escandallos() {
    const { platos, ingredientes, negocio } = D();
    const cat = estadoUI.categoriaCarta || 'Todas';
    const categorias = ['Todas', ...ordenCategorias(platos)];
    const lista = ordenarPorCategoria(platos).filter(p => cat === 'Todas' || p.categoria === cat);
    return cabecera('Carta y costes', `Escandallo de cada plato · IVA ${negocio.iva} % · objetivo food cost ${negocio.objetivoFoodCost} %`,
        si(puede('editarCarta'), `<button class="btn btn-primario" data-accion="nuevo-plato">+ Plato</button>`))
      + `<div class="barra-herramientas"><div class="segmentado desplazable">
          ${categorias.map(c => `<button data-accion="filtro-carta" data-valor="${esc(c)}" class="${c === cat ? 'activo' : ''}">${esc(c)}</button>`).join('')}
        </div></div>
        <section class="rejilla-cartas">${lista.map(p => {
          const coste = Calc.costePlato(p, ingredientes);
          const fc = Calc.foodCost(p, ingredientes, negocio.iva);
          const margen = p.pvp / (1 + negocio.iva / 100) - coste;
          const recomendado = Calc.pvpRecomendado(p, ingredientes, negocio.objetivoFoodCost, negocio.iva);
          const raciones = Calc.racionesDisponibles(p, ingredientes);
          return `<article class="tarjeta plato ${p.agotado ? 'agotado' : ''}">
            <header><div><small>${esc(p.categoria || 'Sin categoría')} · ${p.agotado ? '<b class="txt-mal">AGOTADO</b>' : `quedan ${raciones} raciones`}</small><h3>${esc(p.nombre)}</h3></div>
              <span class="fc ${claseFoodCost(fc)}">${fmt.pct(fc)}</span></header>
            <dl class="datos">
              <div><dt>PVP</dt><dd>${fmt.euro(p.pvp)}</dd></div>
              <div><dt>Coste</dt><dd>${fmt.euro(coste)}</dd></div>
              <div><dt>Margen bruto</dt><dd>${fmt.euro(margen)}</dd></div>
              <div><dt>PVP para ${negocio.objetivoFoodCost} %</dt><dd>${fmt.euro(recomendado)}</dd></div>
            </dl>
            <details><summary>${p.lineas.length} ingredientes</summary>
              <table class="tabla mini">${p.lineas.map(l => {
                const ing = Calc.ingrediente(ingredientes, l.ingId);
                if (!ing) return '';
                return `<tr><td>${esc(ing.nombre)}</td><td class="num">${fmt.num(l.cantidad, 3)} ${ing.unidad}</td><td class="num">${fmt.euro(ing.precio * l.cantidad)}</td></tr>`;
              }).join('')}</table>
            </details>
            <div class="chips">${chips(Calc.alergenosPlato(p, ingredientes), 'chip-alergeno')}</div>
            <footer>
              ${si(puede('editarCarta'), `<button class="btn btn-peque" data-accion="editar-plato" data-id="${p.id}">Editar</button>`)}
              <button class="btn btn-peque" data-accion="alternar-agotado" data-id="${p.id}">${p.agotado ? 'Volver a ofrecer' : 'Marcar agotado'}</button>
              ${si(puede('editarCarta'), `<button class="btn btn-peque btn-fantasma" data-accion="borrar-plato" data-id="${p.id}">Borrar</button>`)}
            </footer>
          </article>`;
        }).join('') || '<p class="tenue">Aún no hay platos.</p>'}</section>`;
  },

  /* ---------- APPCC ---------- */
  appcc() {
    const { camaras, registros } = D();
    const ordenados = registros.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
    return cabecera('APPCC · Temperaturas', 'Registro diario de cámaras frigoríficas y congeladores',
        `<button class="btn" data-accion="exportar-appcc">Descargar CSV</button>
         ${si(puede('gestionAppcc'), `<button class="btn" data-accion="nueva-camara">+ Cámara</button>`)}
         <button class="btn btn-primario" data-accion="nuevo-registro">Registrar temperatura</button>`)
      + `<section class="rejilla-cartas">${camaras.map(c => {
          const ult = ordenados.find(r => r.camaraId === c.id);
          const ok = ult ? Calc.temperaturaCorrecta(c.tipo, ult.temperatura) : null;
          return `<article class="tarjeta camara ${ok === false ? 'mal' : ok ? 'bien' : ''}">
            <small>${c.tipo === 'congelacion' ? 'Congelación' : 'Refrigeración'} · ${Calc.RANGOS[c.tipo].texto}</small>
            <h3>${esc(c.nombre)}</h3>
            <strong class="temp">${ult ? fmt.num(ult.temperatura, 1) + ' °C' : '—'}</strong>
            <small>${ult ? 'Última: ' + fmt.fechaHora(ult.fecha) + ' · ' + esc(ult.responsable) : 'Sin registros'}</small>
            <footer>
              <button class="btn btn-peque" data-accion="nuevo-registro" data-camara="${c.id}">Registrar</button>
              ${si(puede('gestionAppcc'), `<button class="btn btn-peque btn-fantasma" data-accion="borrar-camara" data-id="${c.id}">Quitar</button>`)}
            </footer>
          </article>`;
        }).join('')}</section>
        <h2 class="mt">Historial</h2>
        <div class="tabla-envoltorio"><table class="tabla">
          <thead><tr><th>Fecha</th><th>Cámara</th><th class="num">Temperatura</th><th>Estado</th><th>Responsable</th><th>Acción correctora</th><th></th></tr></thead>
          <tbody>${ordenados.slice(0, estadoUI.limiteAppcc || 60).map(r => {
            const c = camaras.find(x => x.id === r.camaraId);
            const ok = c ? Calc.temperaturaCorrecta(c.tipo, r.temperatura) : true;
            return `<tr class="${ok ? '' : 'fila-peligro'}">
              <td data-t="Fecha">${fmt.fechaHora(r.fecha)}</td>
              <td data-t="Cámara">${esc(c ? c.nombre : '(eliminada)')}</td>
              <td data-t="Temperatura" class="num">${fmt.num(r.temperatura, 1)} °C</td>
              <td data-t="Estado"><span class="badge ${ok ? 'ok' : 'caducado'}">${ok ? 'Correcta' : 'Fuera de rango'}</span></td>
              <td data-t="Responsable">${esc(r.responsable)}</td>
              <td data-t="Acción">${esc(r.accion) || '<span class="tenue">—</span>'}</td>
              <td class="acciones-fila">${si(puede('borrarRegistros'), `<button class="btn-icono" data-accion="borrar-registro" data-id="${r.id}" aria-label="Borrar">🗑</button>`)}</td>
            </tr>`;
          }).join('') || '<tr><td colspan="7" class="tenue">Sin registros.</td></tr>'}</tbody>
        </table></div>
        ${si(ordenados.length > (estadoUI.limiteAppcc || 60), `<p class="centro mt"><button class="btn" data-accion="mas-appcc">Ver más registros (${ordenados.length} en total)</button></p>`)}`;
  },

  /* ---------- ALÉRGENOS ---------- */
  alergenos() {
    const { platos, ingredientes, negocio } = D();
    const ordenados = ordenarPorCategoria(platos);
    return cabecera('Carta de alérgenos', 'Consulta para el cliente · se calcula sola con los ingredientes de cada plato',
        `<button class="btn btn-primario" data-accion="imprimir">Imprimir carta</button>`)
      + `<div class="solo-impresion"><h1>${esc(negocio.nombre)} · Información de alérgenos</h1>
          <p>Reglamento (UE) 1169/2011. Consulte a nuestro personal ante cualquier duda.</p></div>
        <div class="tabla-envoltorio"><table class="tabla matriz">
          <thead><tr><th>Plato</th>${ALERGENOS.map(a => `<th><span class="vertical">${a}</span></th>`).join('')}</tr></thead>
          <tbody>${ordenados.map(p => {
            const lista = Calc.alergenosPlato(p, ingredientes);
            return `<tr><td><b>${esc(p.nombre)}</b><br><small class="tenue">${esc(p.categoria || '')}</small></td>
              ${ALERGENOS.map(a => `<td class="celda ${lista.includes(a) ? 'si' : ''}" title="${a}">${lista.includes(a) ? '●' : ''}</td>`).join('')}</tr>`;
          }).join('')}</tbody>
        </table></div>
        ${si(puede('editarInventario'), '<p class="tenue mt no-imprimir">Para cambiar los alérgenos, edita los ingredientes en Inventario: todos los platos que los usan se actualizan solos.</p>')}`;
  },

  /* ---------- MERMAS ---------- */
  mermas() {
    const { mermas, ingredientes } = D();
    const recientes = Calc.mermasRecientes(mermas, 30);
    const coste = recientes.reduce((t, m) => t + Calc.costeMerma(m, ingredientes), 0);
    const aprovechado = recientes.filter(m => m.destino !== 'Basura');
    const pctAprov = recientes.length ? aprovechado.length / recientes.length * 100 : 0;
    const porDestino = Calc.agruparSuma(recientes, 'destino', m => Calc.costeMerma(m, ingredientes));
    const porIng = Calc.agruparSuma(recientes, 'ingId', m => Calc.costeMerma(m, ingredientes));
    const peor = Object.entries(porIng).sort((a, b) => b[1] - a[1])[0];
    const nombrePeor = peor ? (Calc.ingrediente(ingredientes, peor[0])?.nombre || '—') : '—';

    return cabecera('Mermas y desperdicio', 'Plan de prevención del desperdicio alimentario (Ley 1/2025)',
        `<button class="btn btn-primario" data-accion="nueva-merma">+ Registrar merma</button>`)
      + `<section class="kpis">
          ${kpi('Coste 30 días', fmt.euro(coste), `${recientes.length} registros`)}
          ${kpi('Aprovechado', fmt.pct(pctAprov), 'no acaba en la basura', pctAprov >= 60 ? 'ok' : 'aviso')}
          ${kpi('Más desperdiciado', esc(nombrePeor), peor ? fmt.euro(peor[1]) : '')}
        </section>
        <section class="rejilla-2">
          <article class="tarjeta"><h2>Destino (jerarquía de la ley)</h2>
            ${barras(porDestino, fmt.euro, k => k === 'Basura' ? 'mal' : k === 'Compost' ? 'medio' : 'bien')}
            <p class="tenue mt">Orden de prioridad: ${DESTINOS_MERMA.join(' → ')}.</p>
          </article>
          <article class="tarjeta"><h2>Últimos registros</h2>
            <div class="tabla-envoltorio"><table class="tabla mini">
              <thead><tr><th>Fecha</th><th>Producto</th><th class="num">Cant.</th><th>Motivo</th><th>Destino</th><th class="num">Coste</th><th></th></tr></thead>
              <tbody>${mermas.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).map(m => {
                const ing = Calc.ingrediente(ingredientes, m.ingId);
                return `<tr><td>${fmt.fecha(m.fecha)}</td><td>${esc(ing ? ing.nombre : '(eliminado)')}</td>
                  <td class="num">${fmt.num(m.cantidad)} ${ing ? ing.unidad : ''}</td><td>${esc(m.motivo)}</td>
                  <td><span class="badge ${m.destino === 'Basura' ? 'caducado' : 'ok'}">${esc(m.destino)}</span></td>
                  <td class="num">${fmt.euro(Calc.costeMerma(m, ingredientes))}</td>
                  <td>${si(puede('borrarMermas'), `<button class="btn-icono" data-accion="borrar-merma" data-id="${m.id}" aria-label="Borrar">🗑</button>`)}</td></tr>`;
              }).join('') || '<tr><td colspan="7" class="tenue">Sin mermas registradas.</td></tr>'}</tbody>
            </table></div>
          </article>
        </section>`;
  },

  /* ---------- PEDIDOS ---------- */
  pedidos() {
    const { ingredientes, proveedores } = D();
    const grupos = Calc.pedidosSugeridos(ingredientes, proveedores);
    const total = grupos.reduce((t, g) => t + g.total, 0);
    return cabecera('Pedidos a proveedores', 'Se generan solos con lo que está por debajo del stock mínimo',
        `<button class="btn" data-accion="nuevo-proveedor">+ Proveedor</button>`)
      + `<section class="kpis">
          ${kpi('Pedidos por hacer', grupos.length, `de ${proveedores.length} proveedores`, grupos.length ? 'aviso' : 'ok')}
          ${kpi('Productos a pedir', grupos.reduce((t, g) => t + g.lineas.length, 0), 'bajo mínimo')}
          ${kpi('Coste estimado', fmt.euro(total), 'a precio de última compra')}
        </section>
        <section class="rejilla-cartas anchas">${grupos.map(g => `
          <article class="tarjeta pedido">
            <header><div><small>${esc(g.proveedor.tipo)}</small><h3>${esc(g.proveedor.nombre)}</h3></div>
              <span class="badge pronto">Antes de las ${esc(g.proveedor.pedidoAntes)}</span></header>
            <table class="tabla mini">${g.lineas.map(l => `<tr>
                <td>${esc(l.ing.nombre)}<br><small class="tenue">quedan ${fmt.num(l.ing.stock)} ${l.ing.unidad} · mín. ${fmt.num(l.ing.minimo)}</small></td>
                <td class="num"><b>${fmt.num(l.cantidad)} ${l.ing.unidad}</b></td>
                <td class="num">${fmt.euro(l.cantidad * l.ing.precio)}</td></tr>`).join('')}
            </table>
            <p class="total-pedido"><span>Total estimado</span><b>${fmt.euro(g.total)}</b></p>
            <footer>
              <button class="btn btn-peque btn-primario" data-accion="copiar-pedido" data-id="${g.proveedor.id}">Copiar mensaje</button>
              <button class="btn btn-peque" data-accion="recibir-pedido" data-id="${g.proveedor.id}">Marcar recibido</button>
            </footer>
          </article>`).join('') || '<p class="tenue">No hace falta pedir nada: todo está por encima del mínimo.</p>'}
        </section>
        <h2 class="mt">Proveedores</h2>
        <div class="tabla-envoltorio"><table class="tabla">
          <thead><tr><th>Proveedor</th><th>Tipo</th><th>Teléfono</th><th>Reparto</th><th>Pedir antes de</th><th class="num">Productos</th><th></th></tr></thead>
          <tbody>${proveedores.map(p => `<tr>
            <td><b>${esc(p.nombre)}</b></td>
            <td data-t="Tipo">${esc(p.tipo)}</td>
            <td data-t="Teléfono">${esc(p.telefono)}</td>
            <td data-t="Reparto">${esc(p.reparto)}</td>
            <td data-t="Pedir antes de">${esc(p.pedidoAntes)}</td>
            <td data-t="Productos" class="num">${ingredientes.filter(i => i.proveedorId === p.id).length}</td>
            <td class="acciones-fila">
              <button class="btn-icono" data-accion="editar-proveedor" data-id="${p.id}" aria-label="Editar">✎</button>
              <button class="btn-icono" data-accion="borrar-proveedor" data-id="${p.id}" aria-label="Borrar">🗑</button>
            </td></tr>`).join('')}</tbody>
        </table></div>`;
  },
});

const camposIngrediente = () => [
  { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true },
  { nombre: 'proveedorId', etiqueta: 'Proveedor', tipo: 'select', opciones: [['', 'Sin proveedor'], ...D().proveedores.map(p => [p.id, p.nombre])] },
  { nombre: 'unidad', etiqueta: 'Unidad', tipo: 'select', opciones: [['kg', 'Kilogramo (kg)'], ['g', 'Gramo (g)'], ['l', 'Litro (l)'], ['ud', 'Unidad (ud)']] },
  { nombre: 'precio', etiqueta: 'Precio de compra por unidad (€)', tipo: 'number', paso: '0.01', min: 0, obligatorio: true },
  { nombre: 'stock', etiqueta: 'Stock actual', tipo: 'number', paso: '0.001', min: 0 },
  { nombre: 'minimo', etiqueta: 'Stock mínimo (aviso de pedido)', tipo: 'number', paso: '0.001', min: 0 },
  { nombre: 'caducidad', etiqueta: 'Fecha de caducidad', tipo: 'date', ayuda: 'Déjalo vacío si no aplica.' },
  { nombre: 'alergenos', etiqueta: 'Alérgenos que contiene', tipo: 'checks', opciones: ALERGENOS }
];

const camposPlato = () => [
  { nombre: 'nombre', etiqueta: 'Nombre del plato', obligatorio: true },
  { nombre: 'categoria', etiqueta: 'Categoría', ayuda: 'Ej.: Entrantes, Arroces, Postres' },
  { nombre: 'pvp', etiqueta: 'Precio de venta en carta (con IVA, €)', tipo: 'number', paso: '0.01', min: 0, obligatorio: true },
  { nombre: 'lineas', etiqueta: 'Ingredientes por ración', tipo: 'lineas' }
];

const camposProveedor = [
  { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true },
  { nombre: 'tipo', etiqueta: 'Qué suministra', ayuda: 'Ej.: Carnicería, Pescado, Fruta y verdura' },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
  { nombre: 'reparto', etiqueta: 'Días de reparto', ayuda: 'Ej.: Lunes a sábado' },
  { nombre: 'pedidoAntes', etiqueta: 'Hora límite para pedir', tipo: 'time' }
];

Object.assign(Acciones, {
  'nuevo-ingrediente': () => abrirFormulario({
    titulo: 'Nuevo ingrediente', campos: camposIngrediente(), valores: { unidad: 'kg', alergenos: [] },
    alGuardar: (v) => { Datos.insertar('ingredientes', v); avisar('Ingrediente añadido'); }
  }),
  'editar-ingrediente': (id) => {
    const ing = Calc.ingrediente(D().ingredientes, id);
    abrirFormulario({
      titulo: 'Editar ingrediente', campos: camposIngrediente(), valores: ing,
      alGuardar: (v) => { Datos.actualizar('ingredientes', id, v); avisar('Cambios guardados'); }
    });
  },
  'borrar-ingrediente': (id) => {
    const enUso = D().platos.filter(p => p.lineas.some(l => l.ingId === id));
    if (enUso.length) return avisar(`No se puede borrar: lo usan ${enUso.length} plato(s).`);
    if (confirmar('¿Borrar este ingrediente?')) { Datos.borrar('ingredientes', id); avisar('Ingrediente borrado'); pintar(); }
  },
  'mover-stock': (id) => {
    const ing = Calc.ingrediente(D().ingredientes, id);
    abrirFormulario({
      titulo: `Movimiento de stock · ${ing.nombre}`,
      campos: [
        { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'select', opciones: [['entrada', 'Entrada (llega pedido)'], ['salida', 'Salida (consumo)']] },
        { nombre: 'cantidad', etiqueta: `Cantidad (${ing.unidad})`, tipo: 'number', paso: '0.001', min: 0, obligatorio: true },
        { nombre: 'precio', etiqueta: 'Nuevo precio de compra (opcional, €)', tipo: 'number', paso: '0.01', min: 0, ayuda: 'Si el proveedor ha cambiado el precio, escríbelo y se recalculan los escandallos.' },
        { nombre: 'caducidad', etiqueta: 'Caducidad del lote nuevo (opcional)', tipo: 'date' }
      ],
      alGuardar: (v) => {
        const signo = v.tipo === 'entrada' ? 1 : -1;
        const cambios = { stock: Math.max(0, +(ing.stock + signo * v.cantidad).toFixed(3)) };
        if (v.precio > 0) cambios.precio = v.precio;
        if (v.caducidad) cambios.caducidad = v.caducidad;
        Datos.actualizar('ingredientes', id, cambios);
        avisar(`Stock de ${ing.nombre}: ${fmt.num(cambios.stock)} ${ing.unidad}`);
      }
    });
  },
  'filtro-inv': (_, boton) => { estadoUI.filtroInv = boton.dataset.valor; pintar(); },
  'filtro-carta': (_, boton) => { estadoUI.categoriaCarta = boton.dataset.valor; pintar(); },
  'mas-appcc': () => { estadoUI.limiteAppcc = (estadoUI.limiteAppcc || 60) + 120; pintar(); },
  'alternar-agotado': (id) => {
    const p = D().platos.find(x => x.id === id);
    Datos.actualizar('platos', id, { agotado: !p.agotado });
    avisar(p.agotado ? `${p.nombre}: AGOTADO. Sala ya no puede pedirlo` : `${p.nombre} vuelve a estar disponible`);
    pintar();
  },

  'nuevo-plato': () => {
    if (!D().ingredientes.length) return avisar('Primero añade ingredientes al inventario.');
    abrirFormulario({
      titulo: 'Nuevo plato', campos: camposPlato(), valores: { lineas: [], agotado: false },
      alGuardar: (v) => {
        if (!v.lineas.length) { avisar('Añade al menos un ingrediente con cantidad.'); return false; }
        Datos.insertar('platos', v); avisar('Plato creado');
      }
    });
  },
  'editar-plato': (id) => {
    const p = D().platos.find(x => x.id === id);
    abrirFormulario({
      titulo: 'Editar escandallo', campos: camposPlato(), valores: p,
      alGuardar: (v) => {
        if (!v.lineas.length) { avisar('Añade al menos un ingrediente con cantidad.'); return false; }
        Datos.actualizar('platos', id, v); avisar('Escandallo actualizado');
      }
    });
  },
  'borrar-plato': (id) => {
    if (confirmar('¿Borrar este plato?')) { Datos.borrar('platos', id); avisar('Plato borrado'); pintar(); }
  },

  'nueva-camara': () => abrirFormulario({
    titulo: 'Nueva cámara',
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true },
      { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'select', opciones: [['refrigeracion', 'Refrigeración (0 a 4 °C)'], ['congelacion', 'Congelación (≤ -18 °C)']] }
    ],
    alGuardar: (v) => { Datos.insertar('camaras', v); avisar('Cámara añadida'); }
  }),
  'borrar-camara': (id) => {
    if (confirmar('¿Quitar esta cámara? Su historial se conserva.')) { Datos.borrar('camaras', id); pintar(); }
  },
  'nuevo-registro': (_, boton) => {
    const { camaras } = D();
    if (!camaras.length) return avisar('Primero añade una cámara.');
    const ahora = ahoraISO();
    abrirFormulario({
      titulo: 'Registrar temperatura',
      campos: [
        { nombre: 'camaraId', etiqueta: 'Cámara', tipo: 'select', opciones: camaras.map(c => [c.id, `${c.nombre} (${Calc.RANGOS[c.tipo].texto})`]) },
        { nombre: 'temperatura', etiqueta: 'Temperatura (°C)', tipo: 'number', paso: '0.1', obligatorio: true },
        { nombre: 'fecha', etiqueta: 'Fecha y hora', tipo: 'datetime-local', obligatorio: true },
        puede('firmarComoOtro')
          ? { nombre: 'responsable', etiqueta: 'Responsable', tipo: 'select', opciones: D().usuarios.filter(u => u.activo && u.rol !== 'camarero').map(u => u.nombre) }
          : { nombre: 'responsable', etiqueta: 'Responsable', tipo: 'text', soloLectura: true },
        { nombre: 'accion', etiqueta: 'Acción correctora (si está fuera de rango)', tipo: 'textarea' }
      ],
      valores: { camaraId: boton?.dataset.camara || camaras[0].id, fecha: ahora, responsable: Auth.usuario().nombre },
      alGuardar: (v) => {
        const c = camaras.find(x => x.id === v.camaraId);
        const ok = Calc.temperaturaCorrecta(c.tipo, v.temperatura);
        if (!ok && !v.accion) { avisar('Fuera de rango: describe la acción correctora.'); return false; }
        if (!puede('firmarComoOtro')) v.responsable = Auth.usuario().nombre; // nadie firma por otro
        Datos.insertar('registros', v);
        avisar(ok ? 'Temperatura correcta registrada' : 'Registrada incidencia con acción correctora');
      }
    });
  },
  'borrar-registro': (id) => {
    if (confirmar('¿Borrar este registro? En una inspección conviene conservarlos.')) { Datos.borrar('registros', id); pintar(); }
  },
  'exportar-appcc': () => {
    const { camaras, registros } = D();
    const filas = [['fecha', 'camara', 'tipo', 'temperatura', 'correcta', 'responsable', 'accion_correctora']];
    registros.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach(r => {
      const c = camaras.find(x => x.id === r.camaraId) || { nombre: '(eliminada)', tipo: 'refrigeracion' };
      filas.push([r.fecha.replace('T', ' '), c.nombre, c.tipo, String(r.temperatura).replace('.', ','),
        Calc.temperaturaCorrecta(c.tipo, r.temperatura) ? 'si' : 'no', r.responsable, r.accion || '']);
    });
    const csv = filas.map(f => f.map(x => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    descargar('registro-temperaturas.csv', '﻿' + csv, 'text/csv;charset=utf-8');
  },

  'imprimir': () => window.print(),

  'nueva-merma': () => {
    const { ingredientes } = D();
    if (!ingredientes.length) return avisar('Primero añade ingredientes al inventario.');
    abrirFormulario({
      titulo: 'Registrar merma',
      campos: [
        { nombre: 'ingId', etiqueta: 'Producto', tipo: 'select', opciones: ingredientes.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(i => [i.id, `${i.nombre} (${i.unidad})`]) },
        { nombre: 'cantidad', etiqueta: 'Cantidad', tipo: 'number', paso: '0.001', min: 0, obligatorio: true },
        { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'select', opciones: MOTIVOS_MERMA },
        { nombre: 'destino', etiqueta: 'Destino', tipo: 'select', opciones: DESTINOS_MERMA, ayuda: 'Ordenados de más a menos deseable según la Ley 1/2025.' },
        { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date', obligatorio: true }
      ],
      valores: { fecha: hoyISO() },
      alGuardar: (v) => {
        if (v.cantidad <= 0) { avisar('La cantidad debe ser mayor que 0.'); return false; }
        v.responsable = Auth.usuario().nombre;
        Datos.insertar('mermas', v);
        const ing = Calc.ingrediente(ingredientes, v.ingId);
        Datos.actualizar('ingredientes', ing.id, { stock: Math.max(0, +(ing.stock - v.cantidad).toFixed(3)) });
        avisar('Merma registrada y descontada del stock');
      }
    });
  },
  'borrar-merma': (id) => {
    if (confirmar('¿Borrar este registro de merma?')) { Datos.borrar('mermas', id); pintar(); }
  },

  'copiar-pedido': (id) => {
    const { negocio, proveedores, ingredientes } = D();
    const g = Calc.pedidosSugeridos(ingredientes, proveedores).find(x => x.proveedor.id === id);
    if (!g) return;
    const texto = `Hola, soy ${Auth.usuario().nombre.split(' ')[0]}, de ${negocio.nombre}. Para el próximo reparto necesitaríamos:\n`
      + g.lineas.map(l => `- ${fmt.num(l.cantidad)} ${l.ing.unidad} de ${l.ing.nombre}`).join('\n')
      + '\n¡Gracias!';
    copiarTexto(texto).then(() => avisar('Mensaje copiado: pégalo en WhatsApp o en un email'));
  },
  'recibir-pedido': (id) => {
    const { proveedores, ingredientes } = D();
    const g = Calc.pedidosSugeridos(ingredientes, proveedores).find(x => x.proveedor.id === id);
    if (!g || !confirmar(`¿Ha llegado el pedido de ${g.proveedor.nombre}? Se sumará al stock.`)) return;
    g.lineas.forEach(l => Datos.actualizar('ingredientes', l.ing.id, { stock: +(l.ing.stock + l.cantidad).toFixed(3) }));
    avisar('Pedido recibido: stock actualizado');
    pintar();
  },
  'nuevo-proveedor': () => abrirFormulario({
    titulo: 'Nuevo proveedor', campos: camposProveedor, valores: { pedidoAntes: '20:00' },
    alGuardar: (v) => { Datos.insertar('proveedores', v); avisar('Proveedor añadido'); }
  }),
  'editar-proveedor': (id) => abrirFormulario({
    titulo: 'Editar proveedor', campos: camposProveedor, valores: D().proveedores.find(p => p.id === id),
    alGuardar: (v) => { Datos.actualizar('proveedores', id, v); avisar('Proveedor actualizado'); }
  }),
  'borrar-proveedor': (id) => {
    const usados = D().ingredientes.filter(i => i.proveedorId === id).length;
    if (usados) return avisar(`No se puede borrar: sirve ${usados} producto(s). Cámbialos de proveedor antes.`);
    if (confirmar('¿Borrar este proveedor?')) { Datos.borrar('proveedores', id); pintar(); }
  },
});
