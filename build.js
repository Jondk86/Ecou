#!/usr/bin/env node
/* Ecou build: concatenates the parts listed in src/build.json into index.html (no dependencies).
   Usage:
     node build.js                 build; version = content hash of the sources (stable: same sources -> same version)
     node build.js --version X     build and stamp version X
     node build.js --check         build in memory with the version already in index.html and compare byte-for-byte;
                                   writes nothing; exits 1 if index.html was edited directly or src/ was not built
   Writes index.html and version.txt. Fails loudly if a part is missing or the stamp is not found exactly once. */
'use strict';
var fs = require('fs'), path = require('path'), crypto = require('crypto');
var ROOT = __dirname, SRC = path.join(ROOT, 'src');
var STAMP = /var V="[^"]*"/g;

function die(msg) { console.error('BUILD FAILED: ' + msg); process.exit(1); }
function arg(name) { var i = process.argv.indexOf(name); if (i < 0) return null; var v = process.argv[i + 1]; if (!v || v.slice(0, 2) === '--') die(name + ' needs a value'); return v; }

var manifest;
try { manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'build.json'), 'utf8')); } catch (e) { die('cannot read src/build.json: ' + e.message); }
if (!Array.isArray(manifest.parts) || !manifest.parts.length) die('src/build.json has no parts');
var missing = manifest.parts.filter(function (p) { return !fs.existsSync(path.join(SRC, p)); });
if (missing.length) die('missing part(s):\n  src/' + missing.join('\n  src/'));
if (manifest.parts.indexOf(manifest.stampPart) < 0) die('stampPart ' + manifest.stampPart + ' is not in parts');

function assemble(version) {
  return manifest.parts.map(function (p) {
    var s = fs.readFileSync(path.join(SRC, p), 'utf8');
    if (s.length && s[s.length - 1] !== '\n') die('src/' + p + ' must end with a newline');
    if (p === manifest.stampPart) {
      var n = (s.match(STAMP) || []).length;
      if (n !== 1) die('src/' + p + ' must contain var V="..." exactly once (found ' + n + ')');
      if (version !== null) s = s.replace(STAMP, 'var V="' + version + '"');
    }
    return s;
  }).join('');
}

var outFile = path.join(ROOT, manifest.output || 'index.html');
var verFile = path.join(ROOT, manifest.versionFile || 'version.txt');

if (process.argv.indexOf('--check') >= 0) {
  if (!fs.existsSync(outFile)) die(outFile + ' does not exist');
  var cur = fs.readFileSync(outFile, 'utf8');
  var tail = cur.slice(cur.lastIndexOf('<div id="updBar"'));
  var m = tail.match(/var V="([^"]*)"/);
  if (!m) die('no var V="..." stamp found in current ' + path.basename(outFile));
  var built = assemble(m[1]);
  if (built === cur) { console.log('CHECK OK: src/ reproduces ' + path.basename(outFile) + ' byte-for-byte (version ' + m[1] + ')'); process.exit(0); }
  var a = built.split('\n'), b = cur.split('\n'), i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  console.error('CHECK FAILED: ' + path.basename(outFile) + ' differs from src/ at line ' + (i + 1) + '.');
  console.error('  built  : ' + String(a[i]).slice(0, 160));
  console.error('  current: ' + String(b[i]).slice(0, 160));
  console.error('Either index.html was edited directly (move the change into src/) or src/ changed and was not built (run node build.js).');
  process.exit(1);
}

var version = arg('--version');
if (version !== null && !/^[A-Za-z0-9._-]+$/.test(version)) die('--version may only contain letters, digits, . _ -');
if (version === null) version = crypto.createHash('sha256').update(assemble('')).digest('hex').slice(0, 10);
var html = assemble(version);
fs.writeFileSync(outFile, html);
fs.writeFileSync(verFile, version + '\n');
console.log('Built ' + path.basename(outFile) + ' (' + html.length + ' chars, ' + manifest.parts.length + ' parts), version ' + version);
