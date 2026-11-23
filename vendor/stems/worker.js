/* Ecou stem splitter worker: Spleeter 4-stems (Deezer, MIT) converted to ONNX by Ecou, see README.txt.
   Classic worker. Messages in:  {t:'init', base, ort}  then  {t:'run', L, R, overlap}
   Messages out: {t:'dl', f, got, total, resumed} · {t:'stage'} · {t:'ready', ep, names} · {t:'p', f} · {t:'done', names, stems:[[L,R],..]} · {t:'err', m}
   The model is fetched in <=10 MB parts listed in manifest.json and kept in Cache Storage ('ecou-stems-v2'), part by part,
   so an interrupted download resumes at the last finished part and later runs are offline. */
var NFFT = 4096, HOP = 1024, NB = NFFT / 2 + 1, F = 1024, T = 512, SEG = T * HOP, CACHE = 'ecou-stems-v2';
var WIN = new Float32Array(NFFT), WSQ = new Float32Array(NFFT);
for (var i = 0; i < NFFT; i++) { WIN[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / NFFT); WSQ[i] = WIN[i] * WIN[i]; }

/* ---- radix-2 complex FFT, in place ---- */
var LOG = 12, REV = new Uint16Array(NFFT), CS = new Float64Array(NFFT / 2), SN = new Float64Array(NFFT / 2);
for (i = 0; i < NFFT; i++) { var r = 0; for (var b = 0; b < LOG; b++) r = (r << 1) | ((i >> b) & 1); REV[i] = r; }
for (i = 0; i < NFFT / 2; i++) { CS[i] = Math.cos(-2 * Math.PI * i / NFFT); SN[i] = Math.sin(-2 * Math.PI * i / NFFT); }
function fft(re, im, inv) {
  var n = NFFT, i, j, t;
  for (i = 0; i < n; i++) { j = REV[i]; if (j > i) { t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (var size = 2; size <= n; size <<= 1) {
    var half = size >> 1, step = n / size;
    for (var s = 0; s < n; s += size) for (var k = 0; k < half; k++) {
      var wr = CS[k * step], wi = inv ? -SN[k * step] : SN[k * step], a = s + k, c = a + half;
      var xr = re[c] * wr - im[c] * wi, xi = re[c] * wi + im[c] * wr;
      re[c] = re[a] - xr; im[c] = im[a] - xi; re[a] += xr; im[a] += xi;
    }
  }
}

/* STFT of one channel segment (centre-padded): returns {re, im, frames} with frames x NB layout */
function stft(x) {
  var n = x.length, pad = NFFT / 2, frames = 1 + Math.floor((n + 2 * pad - NFFT) / HOP);
  var RE = new Float32Array(frames * NB), IM = new Float32Array(frames * NB), re = new Float64Array(NFFT), im = new Float64Array(NFFT);
  for (var f = 0; f < frames; f++) {
    var o = f * HOP - pad;
    for (var i = 0; i < NFFT; i++) { var j = o + i; re[i] = j >= 0 && j < n ? x[j] * WIN[i] : 0; im[i] = 0; }
    fft(re, im, false);
    RE.set(re.subarray(0, NB), f * NB); IM.set(im.subarray(0, NB), f * NB);
  }
  return { re: RE, im: IM, frames: frames };
}
/* inverse STFT of X*mask (mask frames x NB), length n */
function istftMasked(X, M, n) {
  var pad = NFFT / 2, out = new Float64Array(n + NFFT), ws = new Float64Array(n + NFFT), re = new Float64Array(NFFT), im = new Float64Array(NFFT);
  for (var f = 0; f < X.frames; f++) {
    var b0 = f * NB, k;
    for (k = 0; k < NB; k++) { var m = M[b0 + k]; re[k] = X.re[b0 + k] * m; im[k] = X.im[b0 + k] * m; }
    for (k = 1; k < NFFT / 2; k++) { re[NFFT - k] = re[k]; im[NFFT - k] = -im[k]; }
    fft(re, im, true);
    var o = f * HOP;
    for (k = 0; k < NFFT; k++) { out[o + k] += re[k] / NFFT * WIN[k]; ws[o + k] += WSQ[k]; }
  }
  var y = new Float32Array(n);
  for (var i = 0; i < n; i++) { var w = ws[i + pad]; y[i] = w > 1e-8 ? out[i + pad] / w : 0; }
  return y;
}

/* one segment (<= SEG samples, i.e. <= 512 frames): returns vocals [L,R]; accompaniment = segment - vocals */
function segment(L, R, run) {
  var XL = stft(L), XR = stft(R), fr = XL.frames, k = Math.min(fr, T), x = new Float32Array(2 * T * F);
  [XL, XR].forEach(function (X, c) {
    for (var f = 0; f < k; f++) for (var b = 0; b < F; b++) { var j = f * NB + b; x[(c * T + f) * F + b] = Math.hypot(X.re[j], X.im[j]); }
  });
  return run(x).then(function (y) {
    var N = y.length, eps = 1e-10, den = new Float32Array(2 * T * F), i, j;
    for (i = 0; i < N; i++) { var yi = y[i]; for (j = 0; j < den.length; j++) den[j] += yi[j] * yi[j]; }
    for (j = 0; j < den.length; j++) den[j] += eps;
    /* returns stems[i] = [L, R] for the first N-1 sources; the caller derives the last as mix - the others */
    var out = [];
    for (i = 0; i < N - 1; i++) out.push([XL, XR].map(function (X, c) {
      var M = new Float32Array(fr * NB), yi = y[i];
      for (var f = 0; f < fr; f++) {
        if (f >= k) { M.fill(1 / N, f * NB, (f + 1) * NB); continue; }
        var sum = 0, b0 = (c * T + f) * F;
        for (var b = 0; b < F; b++) { var v = yi[b0 + b], m = (v * v + eps / N) / den[b0 + b]; M[f * NB + b] = m; sum += m; }
        M.fill(sum / F, f * NB + F, (f + 1) * NB); /* spleeter "average" mask extension above 11 kHz */
      }
      return istftMasked(X, M, c ? R.length : L.length);
    }));
    return out;
  });
}

/* whole song: segments of ~11.8 s with linear cross-fades of `overlap` seconds (overlap-add), progress via onP(f) */
function separate(L, R, run, overlap, onP, sr, names) {
  sr = sr || 44100; names = names || ['vocals', 'accompaniment'];
  var n = L.length, ov = Math.round((overlap || 1) * sr), step = SEG - ov - NFFT, N = names.length, S = [], W = new Float32Array(n), s = 0;
  for (var q = 0; q < N - 1; q++) S.push([new Float32Array(n), new Float32Array(n)]);
  function next() {
    var e = Math.min(n, s + step + ov);
    return segment(L.subarray(s, e), R.subarray(s, e), run).then(function (v) {
      for (var i = s; i < e; i++) {
        var w = 1, d = i - s;
        if (s > 0 && d < ov) w = d / ov;
        if (e < n && e - i <= ov) w = Math.min(w, (e - i) / ov);
        for (var t = 0; t < N - 1; t++) { S[t][0][i] += v[t][0][d] * w; S[t][1][i] += v[t][1][d] * w; }
        W[i] += w;
      }
      if (onP) onP(e / n);
      if (e >= n) {
        var LL = new Float32Array(n), RR = new Float32Array(n);
        for (var j = 0; j < n; j++) {
          var g = W[j] > 1e-6 ? 1 / W[j] : 0, a = L[j], b = R[j];
          for (var t = 0; t < N - 1; t++) { S[t][0][j] *= g; S[t][1][j] *= g; a -= S[t][0][j]; b -= S[t][1][j]; }
          LL[j] = a; RR[j] = b;
        }
        S.push([LL, RR]); /* last stem = mix - the others, so the stems always add back to the mixture */
        return { names: names, stems: S };
      }
      s += step; return next();
    });
  }
  return next();
}

/* ---- download: resumable by part, cached ---- */
function loadModel(base, man, post) {
  var parts = [], total = 0, got = 0;
  man.models.forEach(function (m) { m.parts.forEach(function (p) { parts.push(p); total += p.size; }); });
  var cacheP = (typeof caches !== 'undefined') ? caches.open(CACHE).catch(function () { return null; }) : Promise.resolve(null);
  return cacheP.then(function (cache) {
    var bufs = {}, resumed = 0;
    return parts.reduce(function (pr, p) {
      return pr.then(function () {
        var url = base + p.file;
        return (cache ? cache.match(url) : Promise.resolve(null)).then(function (hit) {
          if (hit) return hit.arrayBuffer().then(function (ab) { if (ab.byteLength !== p.size) return null; resumed++; return ab; });
          return null;
        }).then(function (ab) {
          if (ab) { got += ab.byteLength; post({ t: 'dl', f: got / total, got: got, total: total, resumed: resumed }); return ab; }
          return fetch(url, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) throw new Error('download failed (' + res.status + ')');
            var rd = res.body.getReader(), chunks = [], n = 0;
            function pump() {
              return rd.read().then(function (r) {
                if (r.done) return;
                chunks.push(r.value); n += r.value.length; post({ t: 'dl', f: (got + n) / total, got: got + n, total: total, resumed: resumed });
                return pump();
              });
            }
            return pump().then(function () {
              if (n !== p.size) throw new Error('download incomplete');
              var u = new Uint8Array(n), o = 0; chunks.forEach(function (c) { u.set(c, o); o += c.length; });
              got += n;
              var put = cache ? cache.put(url, new Response(u.slice().buffer)).catch(function () {}) : Promise.resolve();
              return put.then(function () { return u.buffer; });
            });
          });
        }).then(function (ab) { bufs[p.file] = ab; });
      });
    }, Promise.resolve()).then(function () {
      return man.models.map(function (m) {
        var sz = m.parts.reduce(function (a, p) { return a + p.size; }, 0), u = new Uint8Array(sz), o = 0;
        m.parts.forEach(function (p) { u.set(new Uint8Array(bufs[p.file]), o); o += p.size; });
        return u;
      });
    });
  });
}

/* sessions run in turn; their outputs, in output order, are the sources in manifest.stems order */
function makeRunner(ort, sessions) {
  return function (x) {
    var t = new ort.Tensor('float32', x, [2, 1, T, F]), ys = [];
    return sessions.reduce(function (p, s) {
      return p.then(function () { return s.run({ x: t }).then(function (o) { s.outputNames.forEach(function (k) { ys.push(o[k].data); }); }); });
    }, Promise.resolve()).then(function () { return ys; });
  };
}

var RUN = null, NAMES = null;
function init(d, post) {
  var ort = self.ort;
  return fetch(d.base + 'manifest.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('no manifest'); return r.json(); })
    .then(function (man) { NAMES = man.stems; return loadModel(d.base, man, post); })
    .then(function (bytes) {
      post({ t: 'stage' });
      ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;
      if (d.ort) ort.env.wasm.wasmPaths = d.ort;
      function make(eps) { return Promise.all(bytes.map(function (b) { return ort.InferenceSession.create(b, { executionProviders: eps }); })); }
      var gpu = typeof navigator !== 'undefined' && navigator.gpu && !d.noGpu;
      return (gpu ? make(['webgpu']).then(function (s) { return { s: s, ep: 'webgpu' }; }, function () { return null; }) : Promise.resolve(null))
        .then(function (g) { return g || make(['wasm']).then(function (s) { return { s: s, ep: 'wasm' }; }); });
    }).then(function (o) { RUN = makeRunner(ort, o.s); post({ t: 'ready', ep: o.ep, names: NAMES }); });
}

if (typeof self !== 'undefined' && typeof importScripts === 'function') {
  self.onmessage = function (e) {
    var d = e.data, post = function (m, tr) { self.postMessage(m, tr || []); };
    if (d.t === 'init') {
      try { if (!self.ort) importScripts(d.ort + 'ort.min.js'); } catch (x) { post({ t: 'err', m: 'runtime: ' + x.message }); return; }
      init(d, post).catch(function (x) { post({ t: 'err', m: String(x && x.message || x) }); });
    } else if (d.t === 'run') {
      if (!RUN) { post({ t: 'err', m: 'not ready' }); return; }
      separate(d.L, d.R, RUN, d.overlap, function (f) { post({ t: 'p', f: f }); }, 44100, NAMES).then(function (r) {
        var tr = []; r.stems.forEach(function (s) { tr.push(s[0].buffer, s[1].buffer); });
        post({ t: 'done', names: r.names, stems: r.stems }, tr);
      }).catch(function (x) { post({ t: 'err', m: String(x && x.message || x) }); });
    }
  };
}
if (typeof module !== 'undefined') module.exports = { separate: separate, makeRunner: makeRunner, segment: segment };
