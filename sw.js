/* Ecou service worker.
   - Adds cross-origin isolation headers to the page so the stem splitter can use all CPU cores.
   - Pages are network-first (always revalidated, so the installed app gets updates); the last good copy is kept so Ecou opens offline.
   - Instrument samples, vendor scripts and icons are cached the first time they load (cache-first), so they also work offline. */
var PAGE = 'ecou-page-v1', ASSETS = 'ecou-assets-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return /^ecou-/.test(k) && k !== PAGE && k !== ASSETS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function isolate(res) {
  var h = new Headers(res.headers);
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'credentialless');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(function (res) {
      if (!res || res.status === 0 || res.type === 'opaqueredirect') return res;
      if (res.ok && u.origin === self.location.origin) { var copy = res.clone(); caches.open(PAGE).then(function (c) { c.put(u.pathname, copy); }).catch(function () {}); }
      return isolate(res);
    }).catch(function () {
      return caches.open(PAGE).then(function (c) { return c.match(u.pathname).then(function (m) { return m || c.match('/') || c.match('/index.html'); }); })
        .then(function (m) { return m ? isolate(m) : fetch(r); });
    }));
    return;
  }
  if (u.origin === self.location.origin && /^\/(samples|vendor|icons)\//.test(u.pathname)) {
    e.respondWith(caches.open(ASSETS).then(function (c) {
      return c.match(r).then(function (m) {
        if (m) return m;
        return fetch(r).then(function (res) { if (res && res.ok && res.type === 'basic') c.put(r, res.clone()).catch(function () {}); return res; });
      });
    }));
  }
});
