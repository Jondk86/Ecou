/* Ecou service worker: adds cross-origin isolation headers to the page so the stem splitter can use all CPU cores.
   It caches nothing and changes no other request. Pages are always revalidated so the installed app gets updates. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.mode !== 'navigate') return;
  e.respondWith(fetch(r, { cache: 'no-cache' }).then(function (res) {
    if (!res || res.status === 0 || res.type === 'opaqueredirect') return res;
    var h = new Headers(res.headers);
    h.set('Cross-Origin-Opener-Policy', 'same-origin');
    h.set('Cross-Origin-Embedder-Policy', 'credentialless');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }).catch(function () { return fetch(r); }));
});
