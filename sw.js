/* Ecou service worker.
   - Adds cross-origin isolation headers to the page so the stem splitter can use all CPU cores.
   - Pages are network-first (always revalidated, so the installed app gets updates); the last good copy is kept so Ecou opens offline.
   - Instrument samples, vendor scripts and icons are cached the first time they load (cache-first), so they also work offline. */
var PAGE = 'ecou-page-v1', ASSETS = 'ecou-assets-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return /^ecou-/.test(k) && k !== PAGE && k !== ASSETS && k !== 'ecou-stems-v2'; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function isolate(res) {
  var h = new Headers(res.headers);
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'credentialless');
  if (!h.has('Cross-Origin-Resource-Policy')) h.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
/* every same-origin response this worker hands out carries COOP/COEP/CORP: under cross-origin isolation a Worker script
   (stems, sheet music) or a module served without COEP is refused, so isolated and offline users could not split. */
function iso(res) { return (!res || res.status === 0 || res.type === 'opaqueredirect' || res.type === 'opaque') ? res : isolate(res); }
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
  if (u.origin !== self.location.origin) return;
  /* stem-splitter model parts: the stems worker keeps them in its own cache (ecou-stems-v2), part by part */
  if (/\/vendor\/stems\/.*\.part\d+$/.test(u.pathname)) { e.respondWith(fetch(r).then(iso)); return; }
  /* the stem splitter's manifest and worker: network-first (a new model is picked up), the cached copy when offline */
  if (/\/vendor\/stems\/(manifest\.json|worker\.js)$/.test(u.pathname)) {
    e.respondWith(caches.open(ASSETS).then(function (c) {
      return fetch(r, { cache: 'no-cache' }).then(function (res) { if (res && res.ok && res.type === 'basic') c.put(r, res.clone()).catch(function () {}); return iso(res); })
        .catch(function () { return c.match(r).then(function (m) { if (m) return iso(m); throw new Error('offline'); }); });
    }));
    return;
  }
  if (/\/(samples|vendor|icons)\//.test(u.pathname)) {
    e.respondWith(caches.open(ASSETS).then(function (c) {
      return c.match(r).then(function (m) {
        if (m) return iso(m);
        return fetch(r).then(function (res) { if (res && res.ok && res.type === 'basic') c.put(r, res.clone()).catch(function () {}); return iso(res); });
      });
    }));
    return;
  }
  e.respondWith(fetch(r).then(iso));
});
