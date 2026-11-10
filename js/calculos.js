/* =========================================================
   calculos.js — Funciones "puras" de negocio
   ---------------------------------------------------------
   Reciben datos y devuelven un resultado, sin tocar la
   pantalla. Así se pueden probar por separado.
   ========================================================= */

const Calc = {
  // Rangos legales de temperatura (APPCC)
  RANGOS: {
    refrigeracion: { min: 0, max: 4, texto: '0 a 4 °C' },
    congelacion: { min: -40, max: -18, texto: '≤ -18 °C' }
  },

  ingrediente(ingredientes, id) {
    return ingredientes.find(i => i.id === id);
  },

  // Coste de materia prima de un plato = suma de (cantidad × precio)
  costePlato(plato, ingredientes) {
    return plato.lineas.reduce((total, l) => {
      const ing = this.ingrediente(ingredientes, l.ingId);
      return total + (ing ? ing.precio * l.cantidad : 0);
    }, 0);
  },

  // Food cost % = coste / precio de venta sin IVA × 100
  foodCost(plato, ingredientes, iva = 10) {
    const pvpSinIva = plato.pvp / (1 + iva / 100);
    if (pvpSinIva <= 0) return 0;
    return this.costePlato(plato, ingredientes) / pvpSinIva * 100;
  },

  // Precio de venta recomendado (con IVA) para llegar al food cost objetivo
  pvpRecomendado(plato, ingredientes, objetivo = 30, iva = 10) {
    const coste = this.costePlato(plato, ingredientes);
    return coste / (objetivo / 100) * (1 + iva / 100);
  },

  // Alérgenos del plato = unión de los alérgenos de sus ingredientes
  alergenosPlato(plato, ingredientes) {
    const set = new Set();
    plato.lineas.forEach(l => {
      const ing = this.ingrediente(ingredientes, l.ingId);
      if (ing) ing.alergenos.forEach(a => set.add(a));
    });
    return ALERGENOS.filter(a => set.has(a)); // en el orden oficial
  },

  // Días que faltan hasta una fecha (negativo = ya pasó)
  diasHasta(fechaISO) {
    if (!fechaISO) return Infinity;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const f = new Date(fechaISO + 'T00:00:00');
    return Math.round((f - hoy) / 86400000);
  },

  estadoCaducidad(fechaISO) {
    const d = this.diasHasta(fechaISO);
    if (d < 0) return 'caducado';
    if (d <= 2) return 'pronto';
    return 'ok';
  },

  temperaturaCorrecta(tipo, t) {
    const r = this.RANGOS[tipo];
    return t >= r.min && t <= r.max;
  },

  costeMerma(merma, ingredientes) {
    const ing = this.ingrediente(ingredientes, merma.ingId);
    return ing ? ing.precio * merma.cantidad : 0;
  },

  valorStock(ingredientes) {
    return ingredientes.reduce((t, i) => t + i.precio * i.stock, 0);
  },

  // Mermas de los últimos n días
  mermasRecientes(mermas, dias = 30) {
    return mermas.filter(m => this.diasHasta(m.fecha) >= -dias);
  },

  // Cantidad a pedir para volver a tener el doble del mínimo, redondeada
  // a algo que un proveedor sirve de verdad (unidades enteras, medios kilos...)
  cantidadPedido(ing) {
    const falta = ing.minimo * 2 - ing.stock;
    if (falta <= 0) return 0;
    if (ing.unidad === 'ud') return Math.ceil(falta);
    if (ing.unidad === 'g') return Math.ceil(falta / 10) * 10;
    return Math.ceil(falta * 2) / 2; // kg y litros de medio en medio
  },

  // Agrupa por proveedor los ingredientes que están por debajo del mínimo
  pedidosSugeridos(ingredientes, proveedores) {
    return proveedores.map(p => {
      const lineas = ingredientes
        .filter(i => i.proveedorId === p.id && i.stock < i.minimo)
        .map(i => ({ ing: i, cantidad: this.cantidadPedido(i) }));
      const total = lineas.reduce((t, l) => t + l.cantidad * l.ing.precio, 0);
      return { proveedor: p, lineas, total };
    }).filter(g => g.lineas.length);
  },

  /* ---------- Sala y ventas ---------- */

  // Cuántas raciones se pueden hacer con el stock actual (la que menos permite manda)
  racionesDisponibles(plato, ingredientes) {
    let min = Infinity;
    plato.lineas.forEach(l => {
      const ing = this.ingrediente(ingredientes, l.ingId);
      if (ing && l.cantidad > 0) min = Math.min(min, Math.floor(ing.stock / l.cantidad + 1e-9));
    });
    return min === Infinity ? 0 : min;
  },

  // Importe de una comanda (lo que aún no se ha enviado no cuenta)
  totalComanda(c) {
    return c.lineas.filter(l => l.estado !== 'borrador').reduce((t, l) => t + l.precio * l.cantidad, 0);
  },

  // Minutos transcurridos desde una fecha "AAAA-MM-DDTHH:MM"
  minutosDesde(iso) {
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  },

  // Comandas cobradas en los últimos n días (n = 0 → solo hoy)
  ventas(comandas, dias) {
    return comandas.filter(c => c.estado === 'cerrada' && this.diasHasta(c.cerrada.slice(0, 10)) >= -dias);
  },

  // Coste teórico de la materia prima vendida (según escandallos actuales)
  costeVendido(comandas, platos, ingredientes) {
    let coste = 0;
    comandas.forEach(c => c.lineas.forEach(l => {
      const p = platos.find(x => x.id === l.platoId);
      if (p) coste += this.costePlato(p, ingredientes) * l.cantidad;
    }));
    return coste;
  },

  agruparSuma(lista, clave, valor) {
    const res = {};
    lista.forEach(x => { res[x[clave]] = (res[x[clave]] || 0) + valor(x); });
    return res;
  }
};

// Fecha/hora local en formato ISO (toISOString usa UTC y a medianoche daría el día anterior)
const hoyISO = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const ahoraISO = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

// Formateadores reutilizables
const fmt = {
  euro: (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
  num: (n, d = 2) => n.toLocaleString('es-ES', { maximumFractionDigits: d }),
  pct: (n) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' %',
  fecha: (iso) => iso ? new Date(iso.length > 10 ? iso : iso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—',
  fechaHora: (iso) => new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
};
