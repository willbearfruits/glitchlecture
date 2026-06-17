# CREATIVE DESTRUCTION — a history of glitch art

A self-hosted, interactive lecture site on the history of glitch art — from the
magnet pressed to a television in 1965 to the melting hands of a diffusion model.
**Every era is also a working demo you can break with your hands.** Nothing here is
a GIF or a filter preset: the databender does real JPEG byte corruption, the
datamosher does real block-motion bleed, the magnet really warps the picture.

Built for / around Willbear · Yaniv Schonfeld · *Glitches* ·
[github.com/willbearfruits](https://github.com/willbearfruits) · Serious S.H.I.T.

---

## Run it

It's a static site, but several demos decode images on a canvas and use the
webcam, so serve it over `http://` (not `file://`). A secure-context localhost is
all you need.

**Windows (easiest):** double-click **`start.cmd`** — it launches the server and
opens your browser.

**Any OS:**

```bash
python serve.py            # → http://127.0.0.1:8042/index.html (auto-opens)
python serve.py 9000       # pick a port
python serve.py --no-open  # don't open a browser
# or:  ./start.sh
```

Stop with `Ctrl+C`.

---

## What's inside

```
index.html        the hub: hero, the core idea, the interactive timeline
lab.html          THE LAB — every glitch technique in one room
yourwork.html     YOUR WORK — Willbear's tools, mapped onto the history (live embeds)
pages/            17 era pages, 00–16 (manifesto → branches & canon)
assets/
  glitch.css      the whole design system (CRT/terminal, RGB-split, scanlines)
  glitch.js       the reusable glitch-effect library (see below)
  nav.js          shared header, jump-menu, prev/next pager, the timeline registry
  works.js        Willbear's repos, tagged to the eras they belong to
serve.py          local dev server (no-cache, correct mime types)
start.cmd/.sh     launchers
DESIGN_CONTRACT.md how the pages are built (read this before editing pages)
```

The 17 eras:

`00` Manifesto · `01` Damage, Chance & Noise · `02` Electronic Images ·
`03` The Magnet on the CRT · `04` Video as Pure Signal · `05` Art + Engineering ·
`06` Bedrooms & Demoscene · `07` Networks Before the Web · `08` net.art ·
`09` The Aesthetics of Failure · `10` Databending · `11` Datamoshing ·
`12` GLI.TC/H & Dirty New Media · `13` Preserving Net Art · `14` Post-Internet ·
`15` Synthetic Failure · `16` Branches & Canon.

---

## The demos (all real implementations)

Every demo is declared with a single `data-glitch` attribute and wires itself up —
controls, off-screen pausing and a generated offline source included.

| `data-glitch` | technique | era |
|---|---|---|
| `crtMagnet`    | Paik's Magnet TV — drag a magnetic field that bends the beam | §03 |
| `oscilloscope` | Laposky oscillons — Lissajous figures on phosphor | §02 |
| `videoFeedback`| Vasulka closed-circuit feedback (webcam optional) | §04 |
| `rgbShift`     | chromatic channel split / slice displacement | §04 / §12 |
| `databend`     | **real** JPEG byte corruption, re-decoded live + file upload | §10 |
| `datamosh`     | P-frame motion bleed / keyframe removal (webcam optional) | §11 |
| `pixelSort`    | Asendorf-style brightness pixel sort + file upload | §10 |
| `ascii`        | render any source as Unicode glyphs (webcam optional) | §06 / §14 |
| `demoscene`    | plasma + copper bars + starfield + sine scroller | §06 |
| `plotter`      | Molnár "désordre" algorithmic grid | §02 / §05 |
| `aiMelt`       | latent-drift warp + posterise = synthetic failure | §15 |
| `jodi`         | broken-browser net.art homage (move / click) | §08 |
| `glitchAudio`  | Web Audio CD-skip / clicks & cuts / bitcrush | §09 |
| `zalgo`        | combining-diacritic text corruption | §00 / §01 |

Drop one anywhere:

```html
<div class="demo">
  <div class="demo-head"><span class="dot"></span><span class="title">magnet TV</span></div>
  <div class="stage"><canvas data-glitch="crtMagnet"></canvas></div>
  <div class="cap">drag the magnet…</div>
</div>
```

`jodi`, `glitchAudio` and `zalgo` use a `<div>` instead of a `<canvas>`.

---

## How your own work is woven in

`assets/works.js` lists Willbear's repos and tags each to its eras; any
`<div data-works="03-crt-magnet"></div>` auto-fills with the right cards. The
timeline on the home page marks (`▸`) where your tools sit, and `yourwork.html`
embeds the live ones (WRONG, characterglitch, Kloom Radio, …). Highlights:
**WRONG** (§08/§10/§11), **HexGlitcher** (§10), **Datamosh GUI** (§11),
**characterglitch** (§06/§14), **GlitchPedal** (§09), **3dscaning** (§15).

---

## Editing / extending

- **Add or reorder an era:** edit the `SECTIONS` array in `assets/nav.js` (the
  single source of truth for the timeline, jump-menu and pagers), then add the
  matching `pages/<slug>.html`. Follow `DESIGN_CONTRACT.md`.
- **Add one of your tools to an era:** add it to `WORKS` in `assets/works.js`
  with the era slug in its `eras` array.
- **Add a new effect:** add a function to `FX` in `assets/glitch.js`; it auto-runs
  for any element with that `data-glitch` name.

Don't hand-write the header, footer or pager — `nav.js` injects them from
`<body data-slug="…">`.

---

*nothing here survives uncorrupted.*
