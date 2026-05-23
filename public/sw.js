const CACHE_NAME = 'trung-bac-can-v3';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/login',
  '/input',
  '/more',
  '/sync',
  '/admin'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tải và cache các trang gốc
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => 
          fetch(new Request(url, { cache: 'reload' })).then(response => {
            if (response.ok) return cache.put(url, response);
          }).catch(err => console.error("Cache failed for", url, err))
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Chỉ quan tâm đến GET requests
  if (event.request.method !== 'GET') return;

  // Bỏ qua các yêu cầu nội bộ của Next.js hot-reload (webpack)
  if (event.request.url.includes('_next/webpack-hmr')) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      const clonedResponse = response.clone();
      
      // Lưu lại vào cache mọi thứ load thành công
      if (response.status === 200 && !response.url.includes('googleusercontent.com')) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse);
        }).catch(() => {});
      }
      
      return response;
    }).catch(() => {
      // Khi mất mạng, tìm trong cache
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Nếu là chuyển trang (document) thì fallback về '/'
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        
        return new Response('', { status: 404, statusText: 'Offline' });
      });
    })
  );
});