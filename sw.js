const cachePrefix = `carrom-opocnice:${self.registration.scope}:`;
const cacheName = `${cachePrefix}v1`;
const appFiles = ["./", "./index.html", "./manifest.webmanifest", "./ikona-192.png", "./ikona-512.png"];

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

  if (appFiles.slice(2).some(file => url.href === new URL(file, self.registration.scope).href)) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(cacheName);
      return (await cache.match(request)) || Response.error();
    }));
  }
});
