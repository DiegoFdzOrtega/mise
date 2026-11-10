/* sw.js — Service worker: guarda la app en caché para que funcione sin internet.
   Estrategia "primero la red": con conexión siempre carga la última versión. */
const VERSION = 'mise-v2';
const ARCHIVOS = [
  './', './index.html', './css/estilos.css',
  './js/sha256.js', './js/datos.js', './js/calculos.js', './js/ui.js', './js/auth.js',
  './js/vistas-cocina.js', './js/vistas-sala.js', './js/vistas-admin.js', './js/app.js',
  './manifest.webmanifest', './img/icono.svg', './img/icono-192.png', './img/icono-512.png'
];

// Al instalarse, descarga todos los archivos a la caché
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

// Al activarse, borra cachés de versiones antiguas
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(claves =>
    Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

// Primero intenta la red (para tener siempre la última versión);
// si no hay conexión, usa la copia guardada en caché
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copia = resp.clone();
        caches.open(VERSION).then(c => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
