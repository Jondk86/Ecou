# Ecou sources

`index.html` is a **build output**. Edit the files in `src/`, never `index.html` directly.

## Workflow
1. Edit the part(s) in `src/`.
2. `node build.js` (from the repo root; Node only, no dependencies). It concatenates the parts listed in
   `src/build.json`, in order, into `index.html`, and stamps `var V="..."` plus `version.txt` with a content hash
   of the sources (same sources give the same version). `--version X` stamps X instead.
3. Test (QA suite in /tmp/qa with `ECOU_SRC=.../index.html`, stage regressions, phone checks).
4. Commit `src/`, `index.html` and `version.txt` together on `beta`, then run `/home/claude/deploy_beta.sh`.

`node build.js --check` rebuilds in memory with the version already in `index.html` and compares byte-for-byte; it
writes nothing and exits 1 if `index.html` was edited directly or `src/` was changed without building. The deploy
script runs `--check`, then `node build.js`, and refuses to deploy if the built file differs from the committed one.

## Layout
- `head.html`: everything before the first `<style>`.
- `css/*.css`: the main stylesheet, split at top-level rule boundaries.
- `body/*.html`: body markup, split at top-level elements. `00-shell...` keeps its small inline style/script blocks
  (splash, iOS hint, tab overlay); `99-update-bar-tail.html` holds the update bar script with the `var V` stamp.
- `html/*.html`: glue lines (`<style>`, `</style>`, `<script>`, `</script>`, `</head>`).
- `js/00-vendor-abcjs.min.js`: inline abcjs (vendor, do not edit by hand).
- `js/01-iife-open.js` / `js/99-iife-close.js`: the open and close lines of the main `(function(){ ... })();`.
  Every `js/NN-area.js` between them is a slice of that one function body: same scope, shared variables. These
  modules are not standalone, so order matters. Variable initialisers run top to bottom, and init calls
  (e.g. `buildControls();initStudio();...` in `39-garage-view-tempo.js`, `initDoctor()` in `15-song-doctor.js`)
  are spread through the modules at the point where they were in the original file.

## Rules
- Split only at top-level statement boundaries (never inside a function), and keep `build.json` in order.
- Adding a new part: create the file (it must end with a newline) and add it to `build.json`. The build fails if a listed part is missing.
- `src/` is served publicly by GitHub Pages (it's the same code). The service worker only caches navigations
  and `/samples|vendor|icons/`, so `src/` is never precached.
