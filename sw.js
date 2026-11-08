const cachePrefix = `carrom-opocnice:${self.registration.scope}:`;
const cacheName = `${cachePrefix}v11`;
const assets = ["./fotogalerie/skupinova-fotografie.jpg", "./fotogalerie/letohrad-2026-10-03-26.jpg", "./manifest.webmanifest", "./ikona-192.png", "./ikona-512.png",
  "./fotogalerie/letohrad-2026-10-03-04.jpg",
  "./fotogalerie/letohrad-2026-10-03-05.jpg",
  "./fotogalerie/letohrad-2026-10-03-15.jpg",
  "./fotogalerie/letohrad-2026-10-03-18.jpg",
  "./fotogalerie/letohrad-2026-10-03-20.jpg",
  "./fotogalerie/letohrad-2026-10-03-21.jpg",
  "./fotogalerie/letohrad-2026-10-03-22.jpg",
  "./fotogalerie/letohrad-2026-10-03-24.jpg",
  "./fotogalerie/letohrad-2026-10-03-28.jpg",
  "./fotogalerie/letohrad-2026-10-03-31.jpg",
  "./fotogalerie/opoliga-2026-11-04-1.jpg",
  "./fotogalerie/opoliga-2026-11-04-2.jpg"];
const appFiles = ["./", "./index.html", "./CMV_Carrom_kartoteka.html", ...assets];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(appFiles)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
      .map(key => caches.delete(key))
  )));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || !url.href.startsWith(self.registration.scope)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(cacheName);
      return (await cache.match(request, { ignoreSearch: true })) || Response.error();
    }));
    return;
  }

  if (assets.some(file => url.href === new URL(file, self.registration.scope).href)) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(cacheName);
      return (await cache.match(request)) || Response.error();
    }));
  }
});
