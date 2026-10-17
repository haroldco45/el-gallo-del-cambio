// El Gallo del Cambio — Service Worker
// Desarrollada por Vibras Positivas HM — Derechos de Autor Reservados
const CACHE = 'gallo-cambio-v1';
const BASE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'og-image.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Los videos de YouTube no se guardan: siempre en vivo
  if (/youtube(-nocookie)?\.com|googlevideo\.com/.test(url.hostname)) return;

  // La página: primero la red (para ver cambios), y si no hay señal, la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put('index.html', c)); return r; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Íconos, imágenes de los videos y letra: primero la copia guardada
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') {
        const c = r.clone();
        caches.open(CACHE).then(k => k.put(req, c));
      }
      return r;
    }).catch(() => hit))
  );
});

