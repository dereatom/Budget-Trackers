const APP_PREFIX = 'Budget_Fest';     
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = "data-cache-" + VERSION;

const FILES_TO_CACHE = [
    './',
    './index.html',
    './index.js',
    './db.js',
    './manifest.webmanifest',
    './styles.css',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'  
  ];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
          console.log('installing cache : ' + CACHE_NAME)
          return cache.addAll(FILES_TO_CACHE)
        })
      )
      self.skipWaiting();   
  }); 

// activate a service worker
self.addEventListener('activate', function (e) {

    e.waitUntil(
      caches.keys().then(function (keyList) {
        let cacheKeeplist = keyList.filter(function (key) {
          return key.indexOf(APP_PREFIX);
        });
            cacheKeeplist.push(CACHE_NAME);
            // returns a promise that resolves once all old versions of the cache have been deleted 
            return Promise.all(keyList.map(function (key, i) {
                if (cacheKeeplist.indexOf(key) === -1) {
                console.log('deleting cache : ' + keyList[i] );
                return caches.delete(keyList[i]);
                }
            })
        );
    })
 );
 self.clients.claim();
});

self.addEventListener("fetch", function(evt) {
    if (evt.request.url.includes("/api/")) {
        console.log('[Service Worker] Fetch(data)', evt.request.url);

      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    evt.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(evt.request).then(response => {
          return response || fetch(evt.request);
        });
      })
    );
  });
  