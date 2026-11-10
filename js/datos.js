/* =========================================================
   datos.js — Capa de datos de "Mise"
   ---------------------------------------------------------
   Guarda todo en localStorage (un "cajón" del navegador que
   conserva datos aunque cierres la pestaña) en formato JSON.
   Incluye los datos de ejemplo de Restaurante Diego.
   ========================================================= */

const ALERGENOS = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes', 'Soja', 'Lácteos',
  'Frutos de cáscara', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos'
];

const MOTIVOS_MERMA = ['Caducidad', 'Sobreproducción', 'Preparación', 'Rotura / mal estado', 'Devolución cliente'];

// Jerarquía de la Ley 1/2025: de lo más deseable a lo menos
const DESTINOS_MERMA = ['Donación', 'Comida de personal', 'Transformación', 'Alimentación animal', 'Compost', 'Basura'];

const VERSION_DATOS = 3;

const Datos = (() => {
  const CLAVE = 'mise.datos';
  let estado = null;

  // Crea un identificador corto y único
  const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Convierte una fecha a texto ISO en hora local (toISOString usa hora UTC)
  const isoLocal = (d) => new Date(d - d.getTimezoneOffset() * 60000).toISOString();

  // Fecha "hoy + n días" en formato AAAA-MM-DD
  function fechaRelativa(dias) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return isoLocal(d).slice(0, 10);
  }

  // Generador de números "aleatorios" que siempre da la misma secuencia,
  // para que los datos de ejemplo sean iguales cada vez que se cargan
  function aleatorio(semilla) {
    return () => {
      semilla = (semilla * 16807) % 2147483647;
      return (semilla - 1) / 2147483646;
    };
  }

  /* -------------------- DATOS DE EJEMPLO -------------------- */
  function datosDemo() {
    const azar = aleatorio(20261110);

    const negocio = {
      nombre: 'Restaurante Diego',
      localidad: 'Bétera, Valencia',
      cif: 'B00000000',
      iva: 10,
      objetivoFoodCost: 30,
      bloqueoMinutos: 15
    };

    // Usuarios de la demo. El PIN nunca se guarda: solo su hash con "sal"
    const usuario = (nombre, rol, pin, color) => crearUsuario({ nombre, rol, pin, color });
    const usuarios = [
      usuario('Diego Fernández', 'admin', '1111', '#ff6a2b'),
      usuario('Laura Martí', 'jefe', '2222', '#ffb347'),
      usuario('Marcos Soler', 'cocinero', '3333', '#5cc98b'),
      usuario('Aitana Ruiz', 'cocinero', '4444', '#4fb3d9'),
      usuario('Sergio Gómez', 'camarero', '5555', '#b98cf5'),
      usuario('Nerea Blasco', 'camarero', '6666', '#f57fb0')
    ];

    // Proveedores ficticios (nombres y teléfonos inventados)
    const prov = (clave, nombre, tipo, telefono, reparto, pedidoAntes) =>
      ({ id: nuevoId(), clave, nombre, tipo, telefono, reparto, pedidoAntes, contacto: '' });
    const proveedores = [
      prov('carne', 'Carns Ferrer', 'Carnicería', '960 000 101', 'Lunes a sábado', '20:00'),
      prov('peix', 'Peix del Grau', 'Pescado y marisco', '960 000 102', 'Martes a sábado', '22:00'),
      prov('horta', "L'Horta de Bétera", 'Fruta y verdura', '960 000 103', 'Lunes a sábado', '21:00'),
      prov('turia', 'Distribucions Túria', 'Secos, aceite y bebidas', '960 000 104', 'Lunes y jueves', '12:00'),
      prov('vall', 'Lactis La Vall', 'Huevos y lácteos', '960 000 105', 'Martes y viernes', '18:00'),
      prov('forn', 'Forn del Poble', 'Panadería', '960 000 106', 'Todos los días', '19:00')
    ];
    const P = Object.fromEntries(proveedores.map(p => [p.clave, p.id]));
    proveedores.forEach(p => delete p.clave);

    // nombre, unidad, precio €/unidad, stock, mínimo, días hasta caducar (null = no aplica), proveedor, alérgenos
    const ing = (nombre, unidad, precio, stock, minimo, cad, proveedor, alergenos = []) => ({
      id: nuevoId(), nombre, unidad, precio, stock, minimo,
      caducidad: cad === null ? '' : fechaRelativa(cad), proveedorId: P[proveedor], alergenos
    });

    const ingredientes = [
      // Secos y despensa
      ing('Arroz senia', 'kg', 2.90, 18, 10, 320, 'turia'),
      ing('Arroz bomba', 'kg', 3.60, 6, 5, 300, 'turia'),
      ing('Fideo de fideuà nº 2', 'kg', 2.40, 3, 4, 240, 'turia', ['Gluten']),
      ing('Garbanzo cocido', 'kg', 3.20, 4, 3, 90, 'turia'),
      ing('Aceite de oliva virgen extra', 'l', 7.20, 14, 10, 420, 'turia'),
      ing('Aceite de girasol (freidora)', 'l', 2.10, 20, 10, 300, 'turia'),
      ing('Azafrán en hebra', 'g', 5.00, 18, 10, 700, 'turia'),
      ing('Pimentón dulce', 'kg', 14.00, 0.8, 0.5, 365, 'turia'),
      ing('Harina de trigo', 'kg', 0.95, 9, 5, 200, 'turia', ['Gluten']),
      ing('Azúcar', 'kg', 1.10, 7, 4, null, 'turia'),
      ing('Sal marina', 'kg', 0.60, 10, 4, null, 'turia'),
      ing('Vino blanco de cocina', 'l', 2.80, 6, 3, 400, 'turia', ['Sulfitos']),
      ing('Tinta de sepia', 'kg', 38.00, 0.4, 0.25, 180, 'turia', ['Moluscos']),
      ing('Almendra marcona', 'kg', 17.00, 1.2, 0.5, 120, 'turia', ['Frutos de cáscara']),
      ing('Canela en rama', 'g', 0.04, 120, 50, 500, 'turia'),
      // Carne
      ing('Pollo de corral troceado', 'kg', 6.40, 7, 10, 3, 'carne'),
      ing('Conejo troceado', 'kg', 8.90, 4.5, 6, 3, 'carne'),
      ing('Costilla de cerdo', 'kg', 6.20, 3, 3, 3, 'carne'),
      ing('Presa ibérica', 'kg', 19.50, 2.6, 2, 4, 'carne'),
      // Pescado y marisco
      ing('Sepia limpia', 'kg', 12.50, 2.8, 3, 1, 'peix', ['Moluscos']),
      ing('Calamar', 'kg', 13.00, 2.2, 2, 3, 'peix', ['Moluscos']),
      ing('Gamba roja de Dénia', 'kg', 38.00, 1.4, 1.5, 2, 'peix', ['Crustáceos']),
      ing('Puntilla', 'kg', 11.00, 1.5, 1.5, 0, 'peix', ['Moluscos']),
      ing('Merluza de pincho', 'kg', 14.50, 2.4, 2, 3, 'peix', ['Pescado']),
      ing('Bacalao desalado', 'kg', 16.00, 1.1, 1, 3, 'peix', ['Pescado']),
      ing('Fumet de pescado (casero)', 'l', 1.90, 8, 6, 3, 'peix', ['Pescado', 'Crustáceos']),
      // Verdura y fruta
      ing('Tomate pera', 'kg', 1.90, 9, 6, 4, 'horta'),
      ing('Cebolla', 'kg', 1.20, 8, 5, 20, 'horta'),
      ing('Ajo', 'kg', 4.50, 1.5, 1, 30, 'horta'),
      ing('Pimiento rojo', 'kg', 2.60, 3.5, 3, 5, 'horta'),
      ing('Bajoqueta (judía ferraura)', 'kg', 3.40, 1.6, 3, 3, 'horta'),
      ing('Garrofó', 'kg', 8.20, 2.2, 1.5, 150, 'horta'),
      ing('Alcachofa', 'kg', 3.80, 4, 3, 4, 'horta'),
      ing('Patata', 'kg', 0.95, 22, 15, 25, 'horta'),
      ing('Lechuga romana', 'ud', 0.85, 6, 8, 3, 'horta'),
      ing('Limón', 'kg', 1.80, 3, 2, 14, 'horta'),
      ing('Perejil (manojo)', 'ud', 0.60, 4, 3, 4, 'horta'),
      // Huevos y lácteos
      ing('Huevo campero', 'ud', 0.30, 90, 60, 16, 'vall', ['Huevos']),
      ing('Leche entera', 'l', 1.05, 8, 6, 5, 'vall', ['Lácteos']),
      ing('Nata 35 %', 'l', 4.10, 2, 2, 6, 'vall', ['Lácteos']),
      ing('Mantequilla', 'kg', 9.80, 1.5, 1, 25, 'vall', ['Lácteos']),
      // Panadería
      ing('Pan de pueblo', 'ud', 1.80, 10, 12, 0, 'forn', ['Gluten']),
      // Bebidas (se preparan en barra, no pasan por cocina)
      ing('Agua mineral 1 l', 'ud', 0.45, 60, 36, null, 'turia'),
      ing('Refresco (lata)', 'ud', 0.55, 48, 24, null, 'turia'),
      ing('Cerveza de barril', 'l', 2.20, 45, 30, 60, 'turia', ['Gluten']),
      ing('Vino blanco D.O. Valencia', 'ud', 4.80, 18, 12, null, 'turia', ['Sulfitos']),
      ing('Vino tinto D.O. Utiel-Requena', 'ud', 5.40, 16, 12, null, 'turia', ['Sulfitos']),
      ing('Café en grano', 'kg', 17.00, 3, 2, 120, 'turia')
    ];

    const id = (n) => {
      const i = ingredientes.find(x => x.nombre === n);
      if (!i) throw new Error('Ingrediente de ejemplo no encontrado: ' + n);
      return i.id;
    };
    const L = (n, cantidad) => ({ ingId: id(n), cantidad });
    const plato = (nombre, categoria, pvp, lineas) => ({ id: nuevoId(), nombre, categoria, pvp, lineas, agotado: false });

    const platos = [
      plato('Paella valenciana', 'Arroces', 15.50, [
        L('Arroz senia', 0.1), L('Pollo de corral troceado', 0.15), L('Conejo troceado', 0.1), L('Bajoqueta (judía ferraura)', 0.05),
        L('Garrofó', 0.03), L('Tomate pera', 0.04), L('Aceite de oliva virgen extra', 0.025), L('Azafrán en hebra', 0.1),
        L('Pimentón dulce', 0.002), L('Sal marina', 0.005)]),
      plato('Arròs a banda', 'Arroces', 16.50, [
        L('Arroz senia', 0.1), L('Sepia limpia', 0.06), L('Gamba roja de Dénia', 0.03), L('Fumet de pescado (casero)', 0.35),
        L('Tomate pera', 0.03), L('Ajo', 0.005), L('Aceite de oliva virgen extra', 0.025), L('Azafrán en hebra', 0.08), L('Pimentón dulce', 0.002)]),
      plato('Arròs negre', 'Arroces', 16.50, [
        L('Arroz senia', 0.1), L('Sepia limpia', 0.1), L('Tinta de sepia', 0.004), L('Fumet de pescado (casero)', 0.35),
        L('Tomate pera', 0.03), L('Ajo', 0.005), L('Aceite de oliva virgen extra', 0.025), L('Huevo campero', 0.2)]),
      plato('Fideuà de Gandia', 'Arroces', 16.00, [
        L('Fideo de fideuà nº 2', 0.1), L('Sepia limpia', 0.05), L('Gamba roja de Dénia', 0.03), L('Fumet de pescado (casero)', 0.3),
        L('Tomate pera', 0.03), L('Aceite de oliva virgen extra', 0.03), L('Azafrán en hebra', 0.08), L('Huevo campero', 0.2), L('Ajo', 0.005)]),
      plato('Arròs al forn', 'Arroces', 14.00, [
        L('Arroz senia', 0.1), L('Costilla de cerdo', 0.12), L('Garbanzo cocido', 0.05), L('Patata', 0.08), L('Tomate pera', 0.06),
        L('Ajo', 0.01), L('Aceite de oliva virgen extra', 0.03), L('Azafrán en hebra', 0.05)]),
      plato('Ensalada valenciana', 'Entrantes', 9.50, [
        L('Lechuga romana', 0.4), L('Tomate pera', 0.2), L('Cebolla', 0.05), L('Aceite de oliva virgen extra', 0.02), L('Huevo campero', 1)]),
      plato('Esgarraet', 'Entrantes', 11.50, [
        L('Pimiento rojo', 0.25), L('Bacalao desalado', 0.08), L('Ajo', 0.005), L('Aceite de oliva virgen extra', 0.04), L('Pan de pueblo', 0.15)]),
      plato('Alcachofas confitadas', 'Entrantes', 11.00, [
        L('Alcachofa', 0.4), L('Aceite de oliva virgen extra', 0.06), L('Sal marina', 0.003), L('Limón', 0.03)]),
      plato('Puntilla frita', 'Entrantes', 12.50, [
        L('Puntilla', 0.2), L('Harina de trigo', 0.04), L('Aceite de girasol (freidora)', 0.08), L('Limón', 0.05)]),
      plato('Calamar a la romana', 'Entrantes', 12.00, [
        L('Calamar', 0.22), L('Harina de trigo', 0.05), L('Huevo campero', 1), L('Aceite de girasol (freidora)', 0.08), L('Limón', 0.05)]),
      plato('Tortilla de patata', 'Entrantes', 9.00, [
        L('Huevo campero', 4), L('Patata', 0.3), L('Cebolla', 0.08), L('Aceite de oliva virgen extra', 0.06), L('Sal marina', 0.003)]),
      plato('Gambas al ajillo', 'Entrantes', 16.00, [
        L('Gamba roja de Dénia', 0.12), L('Ajo', 0.02), L('Aceite de oliva virgen extra', 0.08), L('Vino blanco de cocina', 0.02),
        L('Perejil (manojo)', 0.1), L('Pan de pueblo', 0.2)]),
      plato('Sepia a la plancha con alioli', 'Pescados', 15.50, [
        L('Sepia limpia', 0.3), L('Aceite de oliva virgen extra', 0.05), L('Huevo campero', 0.5), L('Ajo', 0.008), L('Perejil (manojo)', 0.1)]),
      plato('Merluza a la plancha', 'Pescados', 18.50, [
        L('Merluza de pincho', 0.28), L('Patata', 0.15), L('Aceite de oliva virgen extra', 0.04), L('Limón', 0.04)]),
      plato('Presa ibérica a la brasa', 'Carnes', 21.00, [
        L('Presa ibérica', 0.25), L('Patata', 0.2), L('Pimiento rojo', 0.1), L('Aceite de oliva virgen extra', 0.03), L('Sal marina', 0.004)]),
      plato('Flan de huevo casero', 'Postres', 5.50, [
        L('Huevo campero', 1.5), L('Leche entera', 0.12), L('Azúcar', 0.04)]),
      plato('Arroz con leche', 'Postres', 5.00, [
        L('Arroz bomba', 0.03), L('Leche entera', 0.2), L('Azúcar', 0.03), L('Canela en rama', 2), L('Limón', 0.01)]),
      plato('Coca de llanda', 'Postres', 4.50, [
        L('Harina de trigo', 0.05), L('Huevo campero', 0.6), L('Azúcar', 0.04), L('Leche entera', 0.04),
        L('Aceite de girasol (freidora)', 0.02), L('Limón', 0.01), L('Almendra marcona', 0.01)]),
      plato('Agua mineral 1 l', 'Bebidas', 2.50, [L('Agua mineral 1 l', 1)]),
      plato('Refresco', 'Bebidas', 2.80, [L('Refresco (lata)', 1)]),
      plato('Caña de cerveza', 'Bebidas', 2.50, [L('Cerveza de barril', 0.25)]),
      plato('Copa de vino blanco', 'Bebidas', 3.50, [L('Vino blanco D.O. Valencia', 0.2)]),
      plato('Copa de vino tinto', 'Bebidas', 3.80, [L('Vino tinto D.O. Utiel-Requena', 0.2)]),
      plato('Café', 'Bebidas', 1.50, [L('Café en grano', 0.008)])
    ];

    const camaras = [
      { id: nuevoId(), nombre: 'Cámara de carnes', tipo: 'refrigeracion', base: 2.4 },
      { id: nuevoId(), nombre: 'Cámara de pescado', tipo: 'refrigeracion', base: 1.6 },
      { id: nuevoId(), nombre: 'Cámara de verdura y lácteos', tipo: 'refrigeracion', base: 3.0 },
      { id: nuevoId(), nombre: 'Arcón congelador', tipo: 'congelacion', base: -20 }
    ];

    // Registros de las últimas 3 semanas: mañana (9:30) y tarde (18:30)
    const registros = [];
    const turnos = [{ h: 9, m: 30, quien: ['Laura Martí', 'Marcos Soler', 'Aitana Ruiz'] }, { h: 18, m: 30, quien: ['Marcos Soler', 'Aitana Ruiz', 'Laura Martí'] }];
    const incidencias = {
      '6-1-1': { t: 6.2, accion: 'Puerta abierta durante la descarga de Peix del Grau. Se cierra, se revisa el producto (correcto) y se repite a los 30 min: 3,1 °C.' },
      '13-0-3': { t: -14.8, accion: 'Escarcha acumulada en el arcón. Se pasa el producto al congelador de apoyo, se descongela el arcón y se repite: -19,4 °C.' },
      '17-1-0': { t: 5.4, accion: 'Mucha carga de género tras el pedido del sábado. Se reparte en baldas y se repite a los 45 min: 3,6 °C.' }
    };
    const ahora = new Date();
    for (let dia = 20; dia >= 0; dia--) {
      turnos.forEach((turno, ti) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - dia);
        fecha.setHours(turno.h, turno.m + Math.floor(azar() * 12), 0, 0);
        if (fecha > ahora) return; // no inventamos registros del futuro
        camaras.forEach((c, ci) => {
          const inc = incidencias[`${dia}-${ti}-${ci}`];
          const ruido = (azar() - 0.5) * (c.tipo === 'congelacion' ? 2.4 : 1.6);
          const t = inc ? inc.t : +(c.base + ruido).toFixed(1);
          registros.push({
            id: nuevoId(), camaraId: c.id, fecha: isoLocal(fecha).slice(0, 16), temperatura: t,
            responsable: turno.quien[(dia + ci) % turno.quien.length], accion: inc ? inc.accion : ''
          });
        });
      });
    }
    camaras.forEach(c => delete c.base);

    const merma = (dias, n, cantidad, motivo, destino) =>
      ({ id: nuevoId(), fecha: fechaRelativa(-dias), ingId: id(n), cantidad, motivo, destino });
    const mermas = [
      merma(0, 'Pan de pueblo', 2, 'Sobreproducción', 'Transformación'),
      merma(1, 'Lechuga romana', 2, 'Rotura / mal estado', 'Compost'),
      merma(1, 'Pollo de corral troceado', 0.6, 'Sobreproducción', 'Comida de personal'),
      merma(2, 'Puntilla', 0.3, 'Caducidad', 'Basura'),
      merma(3, 'Tomate pera', 0.8, 'Preparación', 'Compost'),
      merma(4, 'Pan de pueblo', 3, 'Sobreproducción', 'Donación'),
      merma(5, 'Merluza de pincho', 0.25, 'Devolución cliente', 'Basura'),
      merma(6, 'Alcachofa', 0.9, 'Preparación', 'Compost'),
      merma(7, 'Arroz senia', 0.4, 'Sobreproducción', 'Comida de personal'),
      merma(8, 'Nata 35 %', 0.5, 'Caducidad', 'Basura'),
      merma(9, 'Patata', 1.5, 'Preparación', 'Alimentación animal'),
      merma(11, 'Calamar', 0.35, 'Rotura / mal estado', 'Basura'),
      merma(12, 'Pan de pueblo', 4, 'Sobreproducción', 'Donación'),
      merma(13, 'Garrofó', 0.4, 'Rotura / mal estado', 'Basura'),
      merma(14, 'Leche entera', 1, 'Caducidad', 'Basura'),
      merma(16, 'Costilla de cerdo', 0.5, 'Sobreproducción', 'Comida de personal'),
      merma(18, 'Bajoqueta (judía ferraura)', 0.5, 'Preparación', 'Compost'),
      merma(20, 'Gamba roja de Dénia', 0.12, 'Devolución cliente', 'Basura'),
      merma(23, 'Pimiento rojo', 0.6, 'Rotura / mal estado', 'Compost'),
      merma(26, 'Pan de pueblo', 3, 'Sobreproducción', 'Transformación'),
      merma(29, 'Huevo campero', 6, 'Rotura / mal estado', 'Basura')
    ];

    /* ---- Sala: mesas y comandas ---- */
    const mesas = [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ id: nuevoId(), nombre: 'Mesa ' + n, zona: 'Salón', plazas: n <= 4 ? 4 : n <= 6 ? 6 : 8 })),
      ...[1, 2, 3, 4].map(n => ({ id: nuevoId(), nombre: 'Terraza ' + n, zona: 'Terraza', plazas: 4 }))
    ];
    const comandas = generarHistorial({ azar, platos, mesas, usuarios });

    return { version: VERSION_DATOS, negocio, usuarios, proveedores, ingredientes, platos, camaras, registros, mermas, mesas, comandas };
  }

  /* ---------- Historial de ventas de las últimas 4 semanas ---------- */
  function generarHistorial({ azar, platos, mesas, usuarios }) {
    const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
    const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
    const cat = (c) => platos.filter(p => p.categoria === c);
    const porNombre = (n) => platos.find(p => p.nombre === n);
    const camareros = usuarios.filter(u => u.rol === 'camarero');
    const comandas = [];

    const linea = (p, cantidad, estado, enviada) =>
      ({ id: nuevoId(), platoId: p.id, nombre: p.nombre, precio: p.pvp, cantidad, nota: '', estado, enviada });

    // Lo que pide una mesa "típica" de un arrocero valenciano
    function pedidoMesa(comensales, cuando) {
      const ls = [];
      const add = (p, n) => { if (p && n > 0) ls.push(linea(p, n, 'servido', cuando)); };
      add(porNombre('Agua mineral 1 l'), Math.ceil(comensales / 2));
      add(porNombre('Caña de cerveza'), entre(0, comensales));
      add(elegir([porNombre('Copa de vino blanco'), porNombre('Copa de vino tinto')]), entre(0, comensales - 1));
      add(porNombre('Refresco'), entre(0, 1));
      const entrantes = cat('Entrantes').slice().sort(() => azar() - 0.5).slice(0, Math.min(3, Math.ceil(comensales / 2)));
      entrantes.forEach(p => add(p, 1));
      if (comensales >= 2 && azar() < 0.8) {
        // Arroz para la mesa: la Paella es la que más sale
        const arroz = azar() < 0.45 ? porNombre('Paella valenciana') : elegir(cat('Arroces'));
        add(arroz, comensales);
      } else {
        for (let i = 0; i < comensales; i++) add(elegir([...cat('Pescados'), ...cat('Carnes')]), 1);
      }
      cat('Postres').forEach(p => add(p, azar() < 0.4 ? entre(1, Math.max(1, Math.floor(comensales / 2))) : 0));
      add(porNombre('Café'), entre(0, comensales));
      // Junta líneas repetidas del mismo plato
      const unidas = {};
      ls.forEach(l => { if (unidas[l.platoId]) unidas[l.platoId].cantidad += l.cantidad; else unidas[l.platoId] = l; });
      return Object.values(unidas);
    }

    const ahora = new Date();
    for (let dia = 28; dia >= 1; dia--) {
      const fecha = new Date(); fecha.setDate(fecha.getDate() - dia);
      const diaSemana = fecha.getDay(); // 0 domingo ... 1 lunes
      if (diaSemana === 1) continue; // los lunes cierra
      const servicios = [{ h: 13, m: 30, mesas: [0, 6].includes(diaSemana) ? entre(10, 12) : entre(5, 9) }];
      if ([4, 5, 6].includes(diaSemana)) servicios.push({ h: 20, m: 45, mesas: entre(5, 10) });
      servicios.forEach(serv => {
        mesas.slice().sort(() => azar() - 0.5).slice(0, serv.mesas).forEach(mesa => {
          const abierta = new Date(fecha); abierta.setHours(serv.h, serv.m + entre(0, 100), 0, 0);
          if (abierta > ahora) return;
          const cerrada = new Date(abierta.getTime() + entre(55, 110) * 60000);
          const comensales = Math.min(mesa.plazas, entre(2, mesa.plazas));
          const lineas = pedidoMesa(comensales, isoLocal(abierta).slice(0, 16));
          const total = +lineas.reduce((t, l) => t + l.precio * l.cantidad, 0).toFixed(2);
          comandas.push({
            id: nuevoId(), mesaId: mesa.id, camareroId: elegir(camareros).id, comensales, alergias: [],
            abierta: isoLocal(abierta).slice(0, 16), cerrada: isoLocal(cerrada).slice(0, 16),
            estado: 'cerrada', formaPago: azar() < 0.7 ? 'Tarjeta' : azar() < 0.85 ? 'Efectivo' : 'Bizum', total, lineas
          });
        });
      });
    }

    // Mesas abiertas ahora mismo, para que la sala y la cocina tengan movimiento
    const hace = (min) => isoLocal(new Date(Date.now() - min * 60000)).slice(0, 16);
    const abierta = (mesaN, camarero, comensales, minutos, alergias, items) => {
      const c = {
        id: nuevoId(), mesaId: mesas[mesaN].id, camareroId: camareros[camarero].id, comensales, alergias,
        abierta: hace(minutos), cerrada: '', estado: 'abierta', formaPago: '', total: 0, lineas: []
      };
      items.forEach(([nombre, cantidad, estado, minEnviada, nota = '']) => {
        const p = porNombre(nombre);
        const l = linea(p, cantidad, estado, estado === 'borrador' ? '' : hace(minEnviada));
        l.nota = nota;
        c.lineas.push(l);
      });
      comandas.push(c);
    };
    abierta(1, 0, 4, 38, [], [
      ['Agua mineral 1 l', 2, 'servido', 36], ['Caña de cerveza', 2, 'servido', 36],
      ['Esgarraet', 1, 'servido', 34], ['Puntilla frita', 1, 'servido', 34],
      ['Paella valenciana', 4, 'preparando', 30, 'Socarrat bien hecho']
    ]);
    abierta(3, 1, 2, 22, ['Gluten'], [
      ['Copa de vino blanco', 2, 'servido', 20], ['Ensalada valenciana', 1, 'listo', 16],
      ['Calamar a la romana', 1, 'pendiente', 6, 'Sin rebozar (celíaco): a la plancha'], ['Merluza a la plancha', 1, 'pendiente', 6]
    ]);
    abierta(6, 0, 6, 12, [], [
      ['Agua mineral 1 l', 3, 'servido', 10], ['Refresco', 2, 'servido', 10],
      ['Tortilla de patata', 1, 'pendiente', 4], ['Gambas al ajillo', 1, 'pendiente', 4], ['Alcachofas confitadas', 2, 'pendiente', 4]
    ]);
    abierta(9, 1, 3, 4, [], [
      ['Caña de cerveza', 3, 'borrador', 0]
    ]);
    return comandas;
  }

  // Crea un usuario guardando solo el hash del PIN
  function crearUsuario({ nombre, rol, pin, color }) {
    const sal = Math.random().toString(36).slice(2, 10);
    return { id: nuevoId(), nombre, rol, color: color || '#ff6a2b', activo: true, sal, pinHash: sha256(sal + pin), ultimoAcceso: '' };
  }

  /* -------------------- OPERACIONES -------------------- */
  function cargar() {
    try { estado = JSON.parse(localStorage.getItem(CLAVE)); } catch { estado = null; }
    if (!estado || estado.version !== VERSION_DATOS) {
      estado = datosDemo();
      guardar();
    }
    return estado;
  }

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
    catch (e) { console.warn('No se pudo guardar en localStorage', e); }
  }

  // Operaciones genéricas sobre una colección (ingredientes, platos...)
  function insertar(coleccion, obj) {
    obj.id = nuevoId();
    estado[coleccion].push(obj);
    guardar();
    return obj;
  }

  function actualizar(coleccion, id, cambios) {
    const obj = estado[coleccion].find(o => o.id === id);
    if (obj) Object.assign(obj, cambios);
    guardar();
    return obj;
  }

  function borrar(coleccion, id) {
    estado[coleccion] = estado[coleccion].filter(o => o.id !== id);
    guardar();
  }

  function exportar() {
    return JSON.stringify(estado, null, 2);
  }

  function importar(texto) {
    const nuevo = JSON.parse(texto);
    const claves = ['usuarios', 'mesas', 'comandas', 'proveedores', 'ingredientes', 'platos', 'camaras', 'registros', 'mermas'];
    if (nuevo.version !== VERSION_DATOS || !nuevo.negocio || !claves.every(k => Array.isArray(nuevo[k]))) {
      throw new Error('El archivo no es una copia de seguridad válida de Mise.');
    }
    estado = nuevo;
    guardar();
  }

  // Vuelve a leer de localStorage (cuando otra pestaña ha cambiado los datos)
  function recargar() {
    try { const nuevo = JSON.parse(localStorage.getItem(CLAVE)); if (nuevo) estado = nuevo; } catch { /* nada */ }
  }

  function reiniciar() {
    estado = datosDemo();
    guardar();
  }

  return {
    cargar, guardar, insertar, actualizar, borrar, exportar, importar, reiniciar, recargar, crearUsuario, nuevoId,
    get estado() { return estado; }
  };
})();
