const CACHE_NAME = 'your-app-cache-v1';
const urlsToCache = [
    '/',
    '/css/app.css',
    '/js/app.js',
    // add any other assets you want to cache
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
