# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **static, self-hosted interactive lecture site** on the history of glitch art ("creative destruction"). 20 HTML pages + 4 shared JS/CSS assets, zero build step, zero npm dependencies (only a Google Font over CDN). Every historical era is paired with a *real* working glitch demo (real JPEG byte corruption, block-motion datamosh, etc.), not a filter or GIF.

Authored for **Willbear / willbearfruits**; the user's own GitHub tools are woven into the eras they belong to.

## Commands

There is **no build, lint, or test framework**. Develop by serving and viewing.

```bash
python serve.py            # serve http://127.0.0.1:8042/index.html (auto-opens browser)
python serve.py 9000       # custom port; --no-open to suppress browser
start.cmd                  # Windows launcher (finds py/python)   ./start.sh on POSIX
```

Serve over **http**, never `file://` — demos decode images on a canvas and webcam/audio demos need a secure context (`127.0.0.1` qualifies). `serve.py` sends no-cache headers so edits show on refresh.

**Verify changes** (this is the project's "test" — no harness exists):
```bash
node --check assets/glitch.js                                   # JS syntax
# headless render check — count that chrome wired things up at runtime:
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --no-sandbox --virtual-time-budget=2500 --dump-dom \
  "http://127.0.0.1:8042/pages/03-crt-magnet.html" 2>/dev/null | grep -c 'class="demo"'
```
A correct page shows `id="site-head"`, the assigned `class="demo"` blocks, `class="pager"`, footer `class="cols"`, and (where applicable) `workcard` elements in the dumped DOM. To smoke-test **all 14 effects at once**, dump-dom `lab.html` (it instantiates every `data-glitch`) and assert the count is 14:
```bash
"…/chrome.exe" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=2500 \
  --dump-dom "http://127.0.0.1:8042/lab.html" 2>/dev/null | grep -c 'class="demo"'   # expect 14
```
The global is `window.Glitch` (`{ FX, boot, makeScene, rng, controls, play, stop, REDUCED }`), so for a one-off effect check you can instantiate `Glitch.FX[name](el, opts)` directly in a throwaway page. There is no `_smoke.html` checked in — build any throwaway harness fresh.

## Architecture — the three-file spine

The site's coherence comes from three shared assets that pages depend on but must **not** duplicate. Pages are declarative shells; behavior lives here.

### `assets/glitch.js` — the effect library (declarative auto-init)
The central mechanism. On load it scans for `[data-glitch="<name>"]` and runs `FX[name](el, opts)`, which builds the effect **and its own controls/hint**. Pages never write effect JS — they place `<canvas data-glitch="crtMagnet">` (or a `<div>` for `jodi`/`glitchAudio`/`zalgo`) and the library does the rest. 14 effects exist (`crtMagnet`, `databend`, `datamosh`, `pixelSort`, `ascii`, `demoscene`, `aiMelt`, `jodi`, `zalgo`, etc.). Internals shared by all effects: a single rAF loop manager (`play`/`stop`), `IntersectionObserver` that pauses off-screen effects, a seeded `rng` (mulberry32) for reproducible corruption, `fit()` (DPR-capped canvas sizing), `controls()` (builds slider/button/select/file rows from specs), `afterStage()` (mounts controls into the `.demo` wrapper), and `makeScene()` which generates an **offline source image** so every demo works with no external assets. Webcam-based effects fall back to `makeScene` if `getUserMedia` fails. **Adding an effect = adding one `FX.<name>` function**; it auto-runs anywhere that `data-glitch` appears.

### `assets/nav.js` — single source of truth for site structure
The `SECTIONS` array (17 entries, `00`–`16`) drives **everything structural**: the home-page timeline (`[data-timeline]`), the header jump-menu, and each page's prev/next **pager**. Pages get their header, pager, footer, scroll-progress bar and CRT-noise layer injected automatically — they only declare `<body data-slug="<slug>">`. `nav.js` detects whether it's running under `/pages/` and rewrites all asset/link paths accordingly (root pages use `assets/…`, era pages use `../assets/…`). **Reordering or adding an era = editing `SECTIONS`** (plus creating the matching `pages/<slug>.html`).

### `assets/works.js` — the user's tools, mapped to eras
The `WORKS` array tags each willbearfruits repo with the era slugs it belongs to (`eras: [...]`). Any `<div data-works="<slug>"></div>` auto-fills with cards for that era; `data-works=""` renders all. **`SECTIONS[].mine[]` in nav.js (timeline teaser) and `WORKS[].eras[]` in works.js (the actual cards) are separate lists and must be kept consistent** — a slug in `mine[]` with no matching `eras[]` entry renders an empty section.

### Script load order
Every page loads, with `defer`, in this order: `works.js`, `nav.js`, `glitch.js`. Era pages use `../assets/…`; root pages (`index.html`, `lab.html`, `yourwork.html`) use `assets/…`.

## How pages are built — the contract

`DESIGN_CONTRACT.md` is the binding spec for any era page (the original pages were generated by parallel agents against it). When creating or editing a page, follow it exactly:
- Use the documented page skeleton (font link, `../assets/glitch.css`, the three deferred scripts, `<body data-slug>`, `<main id="main" class="wrap">`, `<footer data-auto></footer>`).
- **Only** use CSS classes defined in `assets/glitch.css` and `data-glitch` names defined in `assets/glitch.js`. **No inline `<style>`, no new CSS/JS in pages.**
- Do **not** hand-write the header, footer, or pager — `nav.js` injects them from `data-slug`.
- Wrap every demo in the standard `.demo > .demo-head + .stage + .cap` structure so it looks consistent.

`assets/glitch.css` is the entire design system (CRT/terminal aesthetic: scanlines, RGB-split `.glitch` titles, the `--green/--cyan/--red/--magenta` palette carried over from the user's `wrong`/`characterglitch` projects). Add visual components here, never in pages.

## Page inventory

`index.html` (hub + timeline), `lab.html` (all 14 demos), `yourwork.html` (the user's tools + live embeds), and `pages/00-manifesto.html` … `pages/16-branches.html` (the 17 eras). Demos generate their own offline sources; webcam/file/audio inputs are optional and start on a user click.
