const CACHE_NAME = 'calculatrice-v1';
const urlsToCache = [
  '/meg-calculatrice/',
  '/meg-calculatrice/index.html',
  '/meg-calculatrice/css/calculatrice.css',
  '/meg-calculatrice/css/convert.css',
  '/meg-calculatrice/css/hist.css',
  '/meg-calculatrice/js/calculatrice.js',
  '/meg-calculatrice/js/convert.js',
  '/meg-calculatrice/js/hist.js',
  '/meg-calculatrice/manifest.json'
];

// Installation du service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Erreur installation cache:', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie Cache-First avec fallback réseau
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Ne cacher que les réponses valides
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback quand pas de connexion
        return new Response('Offline - Contenu non disponible', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});
