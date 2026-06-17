# DESIGN CONTRACT — Creative Destruction (history of glitch art)

You are building ONE era page for a multi-page lecture site. The shared spine
(CSS + JS) is already built and tested. **Do not** write CSS or JS. **Do not**
create new files other than the single page you are told to write. Use only the
classes and `data-glitch` demos documented here. Consistency across pages is the
top priority — match this contract exactly.

Site root: `C:/Users/glitches/github/glitchlecture/`
Your page lives in: `C:/Users/glitches/github/glitchlecture/pages/<slug>.html`
(so all assets are referenced with `../assets/...`)

---

## 1. EXACT page skeleton (copy this; fill the `<main>`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><SECTION TITLE> — Creative Destruction</title>
<meta name="description" content="<one sentence about this era>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/glitch.css">
</head>
<body data-slug="<SLUG>">
<main id="main" class="wrap">

  <!-- ERA HEADER -->
  <header class="era-head">
    <p class="era-num"><NN></p>
    <h1 class="era-h glitch" data-text="<TITLE>"><TITLE></h1>
    <p><span class="era-years"><YEARS></span></p>
    <p class="lede"><strong>one-line hook</strong> … 1–2 sentence standfirst.</p>
    <div class="era-tags">
      <span class="tag">tag one</span><span class="tag">tag two</span><span class="tag">tag three</span>
    </div>
  </header>

  <!-- ...your sections, demos, links, works... -->

  <!-- YOUR-WORK auto-injection (omit the wrapper if this era has no mine[]) -->
  <section>
    <h2 class="era-h">In this lineage: Willbear's tools</h2>
    <p class="dim">The technique above, built and shipped:</p>
    <div data-works="<SLUG>"></div>
  </section>

</main>

<!-- pager auto-renders from body[data-slug]; footer auto-renders -->
<footer data-auto></footer>

<script src="../assets/works.js" defer></script>
<script src="../assets/nav.js" defer></script>
<script src="../assets/glitch.js" defer></script>
</body>
</html>
```

Notes:
- The sticky header, the prev/next pager, and the footer are injected automatically
  by `nav.js` — you only set `<body data-slug="...">`. Do not hand-write nav/footer.
- `<div data-works="<slug>"></div>` auto-fills with cards for THIS era's tools.
  Only include the "In this lineage" section if `mine[]` is non-empty (told to you).
- The `glitch` class + `data-text` gives a title an RGB-split animation. Use it on the H1.

---

## 2. DEMOS — drop-in interactive glitch effects (`data-glitch`)

Wrap EVERY demo in this exact structure so it looks consistent:

```html
<div class="demo">
  <div class="demo-head">
    <span class="dot"></span>
    <span class="title">short demo name</span>
    <span class="by">optional credit / tie-in</span>
  </div>
  <div class="stage"><canvas data-glitch="<EFFECT>"></canvas></div>
  <div class="cap">1–2 sentences: what it is, what it teaches, what to try.</div>
</div>
```

The effect builds its OWN controls and hint automatically. You just place the canvas.
For `jodi`, `glitchAudio`, `zalgo` use a `<div>` instead of `<canvas>` (see below).

Available effects (use the ones you're assigned; don't invent names):

| `data-glitch` | element | what it does | extra `data-*` |
|---|---|---|---|
| `crtMagnet`   | canvas | Paik magnet-TV: drag a magnetic field that warps + chroma-tears a live image | `data-strength` 0–1 |
| `oscilloscope`| canvas | Laposky oscillons: Lissajous waveforms, glowing phosphor | `data-a` `data-b` ratios |
| `videoFeedback`| canvas | Vasulka closed-circuit feedback (zoom/rotate/hue, optional webcam) | — |
| `databend`    | canvas | **real** JPEG byte corruption, re-decoded live; file upload + re-roll | `data-mode` shift\|noise\|sort\|repeat\|reverse |
| `datamosh`    | canvas | P-frame motion bleed (keyframe removal); animated source or webcam | — |
| `pixelSort`   | canvas | Asendorf-style brightness pixel sort; file upload | — |
| `rgbShift`    | canvas | chromatic channel split / slice displacement; optional webcam | `data-amount` |
| `ascii`       | canvas | render source as Unicode glyphs (characterglitch tie-in); webcam | `data-ramp` blocks\|classic\|braille\|glitch\|unicode , `data-cell` |
| `demoscene`   | canvas | plasma + copper bars + starfield + sine-scroller | `data-text` |
| `plotter`     | canvas | Molnár "désordre" algorithmic grid; disorder slider | — |
| `aiMelt`      | canvas | latent-drift warp + posterize = "synthetic failure"; webcam | — |
| `jodi`        | **div** | broken-browser net.art homage; move/click to re-glitch | — |
| `glitchAudio` | **div** | Web Audio CD-skip / clicks&cuts / bitcrush (needs a click to start) | — |
| `zalgo`       | **div** | combining-diacritic text corruption with a slider | `data-text="your phrase"` |

For div-based ones:
```html
<div class="demo">
  <div class="demo-head"><span class="dot"></span><span class="title">net.art: a page that is wrong</span></div>
  <div class="stage"><div data-glitch="jodi"></div></div>
  <div class="cap">…</div>
</div>
```

Webcam/audio demos work on `127.0.0.1` (secure context). They start on a button
click inside the demo, so they're safe to include.

---

## 3. CSS COMPONENTS you may use (no others; never add styles)

- Layout: `<main class="wrap">` (already in skeleton). Sections: `<section>…</section>`.
- Headings: `h2.era-h` (big), `h3`, `h4` (green eyebrow), `p`, `blockquote`+`cite`,
  `code`, `mark`, `em`, `strong`, `.dim`, `.mono-sm`, `hr`.
- Lists: `ul.tight`, `ol.tight`, `ul.dash` (em-dash bullets).
- Cards grid: `<div class="grid cols-2|cols-3"> <div class="card">…</div> … </div>`
- Canonical figures (people/works), great for "who to know":
  ```html
  <div class="fig"><span class="yr">1965</span><span><span class="nm">Nam June Paik</span> — <span class="what">Magnet TV.</span></span></div>
  ```
- Source / further-reading list (USE THIS for citations):
  ```html
  <h4>Go deeper</h4>
  <ul class="links">
    <li><span class="src">Whitney</span><a href="https://whitney.org/collection/works/6139">Nam June Paik — Magnet TV</a></li>
  </ul>
  ```
- Callouts: `<div class="note"><h4>…</h4><p>…</p></div>` (variants: `note warn`, `note kind`).
- Concept tiles: `<div class="deck"><div class="t"><div class="n">01</div><div class="h">Title</div><p>…</p></div></div>`
- Pills/tags: `<span class="pill">…</span>`, `<span class="tag">…</span>`.
- Buttons/links styled as buttons: `<a class="btn" href="…">label</a>`.
- Embed a LIVE github.io project of Willbear's (only if told to / relevant):
  ```html
  <div class="embed">
    <div class="embed-head"><span class="dot"></span><span>WRONG — live</span><span class="url">willbearfruits.github.io/wrong</span></div>
    <div class="frame-holder"><iframe loading="lazy" src="https://willbearfruits.github.io/wrong/" title="WRONG"></iframe></div>
  </div>
  ```

---

## 4. VOICE & DEPTH

- Voice: the lecturer's — sharp, direct, a little punk; lowercase-leaning in captions/labels,
  proper case in body prose. This is "creative destruction." Confident, concrete, no fluff.
- Depth: this is comprehensive. Aim for a substantial page — multiple prose sections (≈500–900 words),
  at least the demos you're assigned, a "who/what to know" figure list where relevant, and a
  "Go deeper" `ul.links` with the real citation URLs you're given. Don't pad; be dense and useful.
- Accuracy: stick to the facts and dates in your brief. Don't invent works, quotes, or dates.
- Always end the main content; the pager + footer are automatic. Do not add your own.

---

## 5. HARD RULES
1. Write exactly ONE file, at the path you're given. Nothing else.
2. Use the exact skeleton, exact script tags, `../assets/...` paths, and `body[data-slug]`.
3. Only use documented classes + `data-glitch` names. No inline `<style>`, no new CSS/JS.
4. Include only the demos and the works-slug you're assigned.
5. Use the real citation URLs provided in your brief, in a `ul.links` "Go deeper" block.
6. Self-contained, valid HTML5. No external libs except the Google Font already in the skeleton.
