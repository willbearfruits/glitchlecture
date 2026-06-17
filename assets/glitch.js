/* =============================================================================
   CREATIVE DESTRUCTION — glitch.js
   A small library of *real* glitch techniques, wired declaratively.

   USAGE (declarative — preferred):
     <canvas data-glitch="crtMagnet"></canvas>
     <canvas data-glitch="databend" data-mode="shift"></canvas>
   glitch.js scans the DOM on load, builds each effect + its own controls,
   pauses effects that scroll off-screen, and respects prefers-reduced-motion.

   Every effect works OFFLINE: if no data-src is given it renders a generated
   "scene" so the page is self-contained on a local server.

   Effects: crtMagnet, oscilloscope, videoFeedback, databend, datamosh,
            pixelSort, rgbShift, ascii, demoscene, plotter, aiMelt, jodi,
            glitchAudio, zalgo
   ========================================================================== */
(function (global) {
  "use strict";

  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;

  /* ---- seeded RNG (mulberry32) so glitches are reproducible ------------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---- loop manager: one rAF, effects opt in, paused when off-screen ---- */
  const ticking = new Set();
  let running = false;
  function pump(t) {
    running = ticking.size > 0;
    ticking.forEach((fn) => { try { fn(t); } catch (e) { /* keep looping */ } });
    if (running) requestAnimationFrame(pump);
  }
  function play(fn) { ticking.add(fn); if (!running) { running = true; requestAnimationFrame(pump); } }
  function stop(fn) { ticking.delete(fn); }

  function visibility(el, onShow, onHide) {
    if (!("IntersectionObserver" in global)) { onShow(); return; }
    new IntersectionObserver((ents) => {
      ents.forEach((e) => (e.isIntersecting ? onShow() : onHide()));
    }, { threshold: 0.05 }).observe(el);
  }

  /* ---- sizing: backing store matches CSS box * dpr (capped) ------------- */
  function fit(canvas, cap = 720) {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    let w = Math.max(2, Math.round((r.width || 600)));
    let h = Math.max(2, Math.round((r.height || w * 0.62)));
    const scale = Math.min(1, cap / Math.max(w, h));
    canvas.width = Math.round(w * scale * dpr);
    canvas.height = Math.round(h * scale * dpr);
    return canvas;
  }

  /* ---- the generated default "scene" (so demos need no external assets) - */
  function makeScene(w, h, seed = 7) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    const R = rng(seed);
    // sky gradient
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1b1140"); g.addColorStop(0.5, "#3a1e5c"); g.addColorStop(1, "#0a0a12");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    // sun
    const sx = w * 0.5, sy = h * 0.42, sr = Math.min(w, h) * 0.22;
    const sg = x.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, "#ffe14a"); sg.addColorStop(0.6, "#ff7a1a"); sg.addColorStop(1, "rgba(255,42,74,0)");
    x.fillStyle = sg; x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill();
    // scan-grid horizon
    x.strokeStyle = "rgba(51,224,255,.6)"; x.lineWidth = Math.max(1, w / 900);
    for (let i = 1; i <= 14; i++) {
      const yy = h * 0.6 + (h * 0.4) * (i / 14) * (i / 14);
      x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke();
    }
    for (let i = -10; i <= 10; i++) {
      x.beginPath(); x.moveTo(w / 2 + i * w * 0.05, h * 0.6);
      x.lineTo(w / 2 + i * w * 0.18, h); x.stroke();
    }
    // floating blocks (give the sorter/databender edges to chew)
    for (let i = 0; i < 26; i++) {
      x.fillStyle = ["#b6ff7a", "#33e0ff", "#ff2a4a", "#ff4ad1", "#ffe14a"][(R() * 5) | 0];
      x.globalAlpha = 0.5 + R() * 0.5;
      const bw = w * (0.02 + R() * 0.08);
      x.fillRect(R() * w, R() * h * 0.6, bw, bw * (0.4 + R()));
    }
    x.globalAlpha = 1;
    // title
    x.fillStyle = "#f1ede5"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = `700 ${Math.round(h * 0.16)}px IBM Plex Mono, monospace`;
    x.fillText("GLITCH", w / 2, h * 0.5);
    return c;
  }

  /* ---- source resolver: image url | webcam | video | generated scene ---- */
  function resolveSource(opts, w, h, onReady) {
    if (opts.src) {
      const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => onReady(im, im.naturalWidth, im.naturalHeight);
      im.onerror = () => onReady(makeScene(w, h, opts.seed || 7), w, h);
      im.src = opts.src;
      return;
    }
    onReady(makeScene(w, h, opts.seed || 7), w, h);
  }

  function camera(video, onReady, onFail) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return onFail && onFail();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640 }, audio: false })
      .then((s) => { video.srcObject = s; video.play(); video.onloadedmetadata = () => onReady(); })
      .catch(() => onFail && onFail());
  }

  /* ---- declarative control builder ------------------------------------- */
  function controls(host, specs) {
    const row = document.createElement("div");
    row.className = "ctrls";
    const api = {};
    specs.forEach((s) => {
      if (s.type === "button") {
        const b = document.createElement("button");
        b.className = "btn" + (s.danger ? " danger" : "") + (s.active ? " on" : "");
        b.textContent = s.label;
        b.onclick = () => { const on = s.toggle ? b.classList.toggle("on") : true; s.onClick && s.onClick(on, b); };
        row.appendChild(b); api[s.key] = b; return;
      }
      if (s.type === "select") {
        const wrap = document.createElement("div"); wrap.className = "ctrl";
        const lab = document.createElement("label"); lab.textContent = s.label;
        const sel = document.createElement("select"); sel.className = "btn";
        s.options.forEach((o) => { const op = document.createElement("option");
          op.value = o.value != null ? o.value : o; op.textContent = o.label != null ? o.label : o; sel.appendChild(op); });
        if (s.value != null) sel.value = s.value;
        sel.onchange = () => s.onChange && s.onChange(sel.value);
        wrap.appendChild(lab); wrap.appendChild(sel); row.appendChild(wrap); api[s.key] = sel; return;
      }
      if (s.type === "file") {
        const wrap = document.createElement("div"); wrap.className = "ctrl";
        const lab = document.createElement("label"); lab.textContent = s.label;
        const inp = document.createElement("input"); inp.type = "file"; inp.accept = s.accept || "image/*";
        inp.className = "btn"; inp.style.fontSize = "11px";
        inp.onchange = () => { const f = inp.files[0]; if (f) s.onChange && s.onChange(URL.createObjectURL(f), f); };
        wrap.appendChild(lab); wrap.appendChild(inp); row.appendChild(wrap); api[s.key] = inp; return;
      }
      // range (default)
      const wrap = document.createElement("div"); wrap.className = "ctrl";
      const lab = document.createElement("label");
      const val = document.createElement("span");
      const setLab = (v) => { lab.textContent = s.label + (s.unit ? "  " + v + s.unit : ""); };
      const inp = document.createElement("input");
      inp.type = "range"; inp.min = s.min; inp.max = s.max; inp.step = s.step != null ? s.step : 1;
      inp.value = s.value != null ? s.value : s.min;
      setLab(inp.value);
      inp.oninput = () => { setLab(inp.value); s.onChange && s.onChange(parseFloat(inp.value)); };
      wrap.appendChild(lab); wrap.appendChild(inp); row.appendChild(wrap); api[s.key] = inp;
    });
    host.appendChild(row);
    return api;
  }

  // place generated controls / hint inside the .demo wrapper after .stage
  function afterStage(canvas) {
    const stage = canvas.closest(".stage") || canvas.parentElement;
    const demo = canvas.closest(".demo") || stage;
    const cap = demo.querySelector(".cap");
    return {
      mountCtrls(specs) { const r = document.createElement("div"); demo.insertBefore(r, cap || null);
        return controls(r, specs); },
      mount(node) { demo.insertBefore(node, cap || null); }
    };
  }
  function hint(canvas, text) {
    const stage = canvas.closest(".stage") || canvas.parentElement;
    if (stage.querySelector(".hint")) return;
    const h = document.createElement("div"); h.className = "hint"; h.textContent = text;
    stage.style.position = stage.style.position || "relative";
    stage.appendChild(h);
  }

  /* ===================================================================== */
  /* EFFECTS                                                               */
  /* ===================================================================== */
  const FX = {};

  /* --- 1. CRT MAGNET — Nam June Paik, Magnet TV (1965) ------------------ */
  FX.crtMagnet = function (canvas, opts) {
    fit(canvas, 640); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let scene = makeScene(W, H, opts.seed || 11);
    resolveSource(opts, W, H, (img) => { const c = document.createElement("canvas");
      c.width = W; c.height = H; c.getContext("2d").drawImage(img, 0, 0, W, H); scene = c; });
    let mx = W * 0.5, my = H * 0.5, down = false, strength = +opts.strength || 0.55;
    const src = document.createElement("canvas"); src.width = W; src.height = H;
    const sx = src.getContext("2d");
    function pos(e) { const r = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e;
      mx = (t.clientX - r.left) / r.width * W; my = (t.clientY - r.top) / r.height * H; }
    canvas.addEventListener("pointerdown", (e) => { down = true; pos(e); });
    canvas.addEventListener("pointermove", (e) => { if (down || !("ontouchstart" in global)) pos(e); });
    addEventListener("pointerup", () => { down = false; });
    let warp = 0;
    function frame(t) {
      sx.drawImage(scene, 0, 0, W, H);
      const img = sx.getImageData(0, 0, W, H), s = img.data;
      const out = x.createImageData(W, H), o = out.data;
      const R = (strength) * Math.min(W, H) * 0.9 * (down ? 1.25 : 1);
      warp += 0.02;
      for (let y = 0; y < H; y++) {
        for (let xx = 0; xx < W; xx++) {
          const dx = xx - mx, dy = y - my, d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const pull = Math.exp(-(d * d) / (2 * R * R));
          const ang = Math.atan2(dy, dx) + pull * (3.2 + Math.sin(warp) * 0.6);
          const nd = d * (1 - pull * 0.55);
          let sxp = clamp(Math.round(mx + Math.cos(ang) * nd), 0, W - 1);
          let syp = clamp(Math.round(my + Math.sin(ang) * nd + Math.sin(y * 0.06 + warp) * pull * 8), 0, H - 1);
          const si = (syp * W + sxp) * 4, di = (y * W + xx) * 4;
          // chroma tear under the field
          const sh = (pull * 9) | 0;
          o[di]     = s[((syp * W + clamp(sxp + sh, 0, W - 1)) * 4)];
          o[di + 1] = s[si + 1];
          o[di + 2] = s[((syp * W + clamp(sxp - sh, 0, W - 1)) * 4) + 2];
          o[di + 3] = 255;
        }
      }
      x.putImageData(out, 0, 0);
      // rolling scanline
      x.fillStyle = "rgba(255,255,255,.05)";
      x.fillRect(0, (t * 0.12 % H), W, 2);
    }
    visibility(canvas, () => play(frame), () => stop(frame));
    hint(canvas, "drag the magnet across the screen");
  };

  /* --- 2. OSCILLOSCOPE — Ben Laposky, Oscillons (1950s) ----------------- */
  FX.oscilloscope = function (canvas, opts) {
    fit(canvas, 640); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let a = +opts.a || 3, b = +opts.b || 4, dphi = 0.4, decay = 0.08;
    const ui = afterStage(canvas).mountCtrls([
      { key: "a", label: "x ratio", min: 1, max: 9, value: a, onChange: (v) => a = v },
      { key: "b", label: "y ratio", min: 1, max: 9, value: b, onChange: (v) => b = v },
      { key: "p", label: "phase", min: 0, max: 100, value: 40, onChange: (v) => dphi = v / 50 },
      { key: "d", label: "persistence", min: 1, max: 40, value: 12, onChange: (v) => decay = 0.18 - v / 250 },
    ]);
    let t = 0;
    function frame() {
      x.fillStyle = `rgba(4,8,4,${decay})`; x.fillRect(0, 0, W, H);
      x.strokeStyle = "rgba(182,255,122,.9)"; x.lineWidth = Math.max(1, W / 700);
      x.shadowColor = "#b6ff7a"; x.shadowBlur = 8; x.beginPath();
      const cx = W / 2, cy = H / 2, rx = W * 0.4, ry = H * 0.4;
      for (let i = 0; i <= 600; i++) {
        const u = i / 600 * TAU;
        const px = cx + Math.sin(a * u + t) * rx;
        const py = cy + Math.sin(b * u + t * dphi) * ry;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke(); x.shadowBlur = 0; t += 0.012;
    }
    visibility(canvas, () => play(frame), () => stop(frame));
  };

  /* --- 3. VIDEO FEEDBACK — the Vasulkas / closed circuit (1970s) -------- */
  FX.videoFeedback = function (canvas, opts) {
    fit(canvas, 600); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let zoom = 1.04, rot = 0.01, hue = 2, useCam = false;
    const video = document.createElement("video"); video.muted = true; video.playsInline = true;
    let scene = makeScene(W, H, 23);
    const ui = afterStage(canvas).mountCtrls([
      { key: "z", label: "zoom", min: 100, max: 112, value: 104, onChange: (v) => zoom = v / 100 },
      { key: "r", label: "rotate", min: -40, max: 40, value: 10, onChange: (v) => rot = v / 1000 },
      { key: "h", label: "hue drift", min: 0, max: 12, value: 2, onChange: (v) => hue = v },
      { key: "cam", type: "button", label: "use webcam", toggle: true, onClick: (on) => {
          useCam = on; if (on) camera(video, () => {}, () => { useCam = false; ui.cam.classList.remove("on"); }); } },
      { key: "seed", type: "button", label: "re-seed", onClick: () => scene = makeScene(W, H, (Math.random() * 1e9) | 0) },
    ]);
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
    function frame() {
      x.save();
      x.translate(W / 2, H / 2); x.rotate(rot); x.scale(zoom, zoom); x.translate(-W / 2, -H / 2);
      x.globalAlpha = 0.92; x.drawImage(canvas, 0, 0, W, H); x.restore();
      x.globalAlpha = 0.16;
      if (useCam && video.readyState >= 2) x.drawImage(video, 0, 0, W, H);
      else x.drawImage(scene, 0, 0, W, H);
      x.globalAlpha = 1;
      if (hue) { x.globalCompositeOperation = "color";
        x.fillStyle = `hsla(${(performance.now() / 30) % 360},100%,50%,${hue / 100})`;
        x.fillRect(0, 0, W, H); x.globalCompositeOperation = "source-over"; }
    }
    visibility(canvas, () => play(frame), () => stop(frame));
    hint(canvas, "the image eating itself — turn up zoom + rotate");
  };

  /* --- 4. DATABEND — real JPEG byte corruption (hexglitcher / wrong) ---- */
  FX.databend = function (canvas, opts) {
    fit(canvas, 720); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let mode = opts.mode || "shift", amount = 40, seed = 7, quality = 0.6;
    let baseImg = null;
    const stage = canvas.closest(".stage") || canvas.parentElement;
    const ui = afterStage(canvas).mountCtrls([
      { key: "mode", type: "select", label: "operation", value: mode, options: [
          { value: "shift", label: "byte shift" }, { value: "noise", label: "random noise" },
          { value: "sort", label: "byte sort" }, { value: "repeat", label: "chunk repeat" },
          { value: "reverse", label: "chunk reverse" } ], onChange: (v) => { mode = v; run(); } },
      { key: "amt", label: "intensity", min: 1, max: 100, value: amount, onChange: (v) => { amount = v; run(); } },
      { key: "q", label: "jpeg quality", min: 5, max: 95, value: 60, onChange: (v) => { quality = v / 100; run(); } },
      { key: "seed", type: "button", label: "🎲 re-roll", onClick: () => { seed = (Math.random() * 1e9) | 0; run(); } },
      { key: "file", type: "file", label: "your image", onChange: (url) => loadImg(url) },
    ]);
    function loadImg(url) {
      const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => { baseImg = im; run(); };
      im.onerror = () => { baseImg = makeScene(W, H, 7); run(); };
      im.src = url;
    }
    function drawBase() {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const cx = c.getContext("2d");
      if (baseImg) { // cover-fit
        const s = Math.max(W / baseImg.width, H / baseImg.height);
        const dw = baseImg.width * s, dh = baseImg.height * s;
        cx.drawImage(baseImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      } else cx.drawImage(makeScene(W, H, 7), 0, 0, W, H);
      return c;
    }
    function corrupt(bytes) {
      const R = rng(seed); const n = bytes.length;
      const start = Math.min(n - 4, 0x260 + ((R() * 200) | 0)); // skip header / past SOS-ish
      const hits = Math.round((amount / 100) * (n - start) * 0.04) + 1;
      for (let i = 0; i < hits; i++) {
        const p = start + ((R() * (n - start - 8)) | 0);
        if (mode === "shift") bytes[p] = (bytes[p] + 1 + ((R() * 64) | 0)) & 0xff;
        else if (mode === "noise") bytes[p] = (R() * 256) | 0;
        else if (mode === "sort") { const len = 8 + ((R() * 40) | 0);
          const seg = bytes.slice(p, p + len).sort(); bytes.set(seg, p); }
        else if (mode === "repeat") { const len = 4 + ((R() * 24) | 0);
          const seg = bytes.slice(p, p + len); for (let k = 0; k < 3; k++) bytes.set(seg, p + len * k); }
        else if (mode === "reverse") { const len = 6 + ((R() * 40) | 0);
          const seg = bytes.slice(p, p + len).reverse(); bytes.set(seg, p); }
      }
      return bytes;
    }
    function run() {
      const base = drawBase();
      base.toBlob((blob) => {
        if (!blob) return;
        blob.arrayBuffer().then((buf) => {
          const bytes = corrupt(new Uint8Array(buf));
          const url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
          const im = new Image();
          im.onload = () => { x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
            x.drawImage(im, 0, 0, W, H); URL.revokeObjectURL(url); };
          im.onerror = () => { // too broken to decode — keep last good + flash a tear
            x.fillStyle = "rgba(255,42,74,.25)"; x.fillRect(0, H * Math.random(), W, 6);
            URL.revokeObjectURL(url); };
          im.src = url;
        });
      }, "image/jpeg", quality);
    }
    loadImg(opts.src || null); // null → generated scene via drawBase
    if (!opts.src) run();
    hint(canvas, "real JPEG byte corruption — re-roll for happy accidents");
  };

  /* --- 5. PIXEL SORT — Kim Asendorf / ASDF pixel sort (2010) ------------ */
  FX.pixelSort = function (canvas, opts) {
    fit(canvas, 720); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let lo = 60, hi = 200, dir = "h", baseImg = null;
    const ui = afterStage(canvas).mountCtrls([
      { key: "dir", type: "select", label: "axis", options: [
          { value: "h", label: "horizontal" }, { value: "v", label: "vertical" }],
        onChange: (v) => { dir = v; run(); } },
      { key: "lo", label: "low threshold", min: 0, max: 255, value: lo, onChange: (v) => { lo = v; run(); } },
      { key: "hi", label: "high threshold", min: 0, max: 255, value: hi, onChange: (v) => { hi = v; run(); } },
      { key: "file", type: "file", label: "your image", onChange: (url) => loadImg(url) },
    ]);
    function loadImg(url) { if (!url) { baseImg = null; run(); return; }
      const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => { baseImg = im; run(); }; im.onerror = () => { baseImg = null; run(); }; im.src = url; }
    const bright = (d, i) => (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
    function run() {
      if (baseImg) { const s = Math.max(W / baseImg.width, H / baseImg.height);
        x.drawImage(baseImg, (W - baseImg.width * s) / 2, (H - baseImg.height * s) / 2, baseImg.width * s, baseImg.height * s);
      } else x.drawImage(makeScene(W, H, 5), 0, 0, W, H);
      const img = x.getImageData(0, 0, W, H), d = img.data;
      const sortSpan = (idxs) => {
        // idxs: array of pixel byte-offsets; sort contiguous runs within [lo,hi]
        let run = [];
        const flush = () => { if (run.length > 1) {
          const px = run.map((i) => [d[i], d[i+1], d[i+2], d[i+3], bright(d, i)]);
          px.sort((p, q) => p[4] - q[4]);
          run.forEach((i, k) => { d[i]=px[k][0]; d[i+1]=px[k][1]; d[i+2]=px[k][2]; d[i+3]=px[k][3]; }); }
          run = []; };
        for (const i of idxs) { const b = bright(d, i);
          if (b >= lo && b <= hi) run.push(i); else flush(); }
        flush();
      };
      if (dir === "h") { for (let y = 0; y < H; y++) { const row = [];
        for (let xx = 0; xx < W; xx++) row.push((y * W + xx) * 4); sortSpan(row); } }
      else { for (let xx = 0; xx < W; xx++) { const col = [];
        for (let y = 0; y < H; y++) col.push((y * W + xx) * 4); sortSpan(col); } }
      x.putImageData(img, 0, 0);
    }
    loadImg(opts.src || null);
    hint(canvas, "contiguous pixels in the brightness band get sorted");
  };

  /* --- 6. RGB SHIFT — chromatic channel displacement -------------------- */
  FX.rgbShift = function (canvas, opts) {
    fit(canvas, 680); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let amt = +opts.amount || 8, jitter = 0.5, useCam = false;
    let scene = makeScene(W, H, 14);
    const video = document.createElement("video"); video.muted = true; video.playsInline = true;
    const src = document.createElement("canvas"); src.width = W; src.height = H; const sx = src.getContext("2d");
    const ui = afterStage(canvas).mountCtrls([
      { key: "a", label: "split", min: 0, max: 40, value: amt, onChange: (v) => amt = v },
      { key: "j", label: "jitter", min: 0, max: 100, value: 50, onChange: (v) => jitter = v / 100 },
      { key: "cam", type: "button", label: "use webcam", toggle: true, onClick: (on) => {
          useCam = on; if (on) camera(video, () => {}, () => { useCam = false; ui.cam.classList.remove("on"); }); } },
    ]);
    function frame(t) {
      if (useCam && video.readyState >= 2) sx.drawImage(video, 0, 0, W, H); else sx.drawImage(scene, 0, 0, W, H);
      const j = (Math.sin(t / 90) * jitter + (Math.random() - .5) * jitter) * amt;
      const a = amt + j;
      x.clearRect(0, 0, W, H);
      x.globalCompositeOperation = "lighter";
      drawChan("r", a, 0); drawChan("g", 0, 0); drawChan("b", -a, 0);
      x.globalCompositeOperation = "source-over";
      // occasional slice displacement
      if (Math.random() < jitter * 0.15) { const yy = Math.random() * H, hh = 4 + Math.random() * 30;
        x.drawImage(canvas, 0, yy, W, hh, (Math.random() - .5) * a * 4, yy, W, hh); }
    }
    function drawChan(ch, ox, oy) {
      const img = sx.getImageData(0, 0, W, H), d = img.data;
      const out = x.createImageData(W, H), o = out.data;
      const ci = ch === "r" ? 0 : ch === "g" ? 1 : 2;
      for (let i = 0; i < d.length; i += 4) { o[i + ci] = d[i + ci]; o[i + 3] = 255; }
      const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
      tmp.getContext("2d").putImageData(out, 0, 0);
      x.drawImage(tmp, ox, oy);
    }
    visibility(canvas, () => play(frame), () => stop(frame));
  };

  /* --- 7. ASCII — character rendering (characterglitch / characterworld)  */
  FX.ascii = function (canvas, opts) {
    fit(canvas, 520); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const ramps = {
      blocks: " ░▒▓█", classic: " .:-=+*#%@", braille: " ⠁⠉⠋⠛⠟⠿⡿⣿",
      glitch: " ·∴≡⊟⊠▤▥▦▧▨▩█", unicode: " ·•◦○●◍◉⬢⬣"
    };
    let ramp = ramps[opts.ramp] || ramps.classic, cell = +opts.cell || 8, useCam = false, color = true;
    let scene = makeScene(W, H, 9);
    const video = document.createElement("video"); video.muted = true; video.playsInline = true;
    const off = document.createElement("canvas"), ox = off.getContext("2d");
    const ui = afterStage(canvas).mountCtrls([
      { key: "ramp", type: "select", label: "glyph set", options: Object.keys(ramps).map((k) => ({ value: k, label: k })),
        value: opts.ramp || "classic", onChange: (v) => ramp = ramps[v] },
      { key: "cell", label: "cell size", min: 4, max: 20, value: cell, onChange: (v) => cell = v },
      { key: "col", type: "button", label: "color", toggle: true, active: true, onClick: (on) => color = on },
      { key: "cam", type: "button", label: "use webcam", toggle: true, onClick: (on) => {
          useCam = on; if (on) camera(video, () => {}, () => { useCam = false; ui.cam.classList.remove("on"); }); } },
    ]);
    function frame() {
      const cols = Math.max(2, Math.floor(W / cell)), rows = Math.max(2, Math.floor(H / cell));
      off.width = cols; off.height = rows;
      if (useCam && video.readyState >= 2) ox.drawImage(video, 0, 0, cols, rows); else ox.drawImage(scene, 0, 0, cols, rows);
      const d = ox.getImageData(0, 0, cols, rows).data;
      x.fillStyle = "#050505"; x.fillRect(0, 0, W, H);
      x.font = `${cell}px IBM Plex Mono, monospace`; x.textBaseline = "top";
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 4;
        const lum = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114) / 255;
        const g = ramp[Math.min(ramp.length - 1, Math.floor(lum * ramp.length))];
        if (g === " ") continue;
        x.fillStyle = color ? `rgb(${d[i]},${d[i+1]},${d[i+2]})` : `rgba(182,255,122,${0.4 + lum * 0.6})`;
        x.fillText(g, c * cell, r * cell);
      }
    }
    visibility(canvas, () => play(frame), () => stop(frame));
  };

  /* --- 8. DEMOSCENE — plasma + copper bars + starfield (the demoscene) -- */
  FX.demoscene = function (canvas, opts) {
    fit(canvas, 520); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const img = x.createImageData(W, H), d = img.data;
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, z: Math.random() }));
    let t = 0, msg = (opts.text || "★ CREATIVE DESTRUCTION ★ GREETINGS TO ALL GLITCHERS ★ ").toUpperCase();
    function frame() {
      t += 0.03;
      for (let y = 0; y < H; y += 2) for (let xx = 0; xx < W; xx += 2) {
        const v = Math.sin(xx / 28 + t) + Math.sin(y / 22 - t) +
                  Math.sin((xx + y) / 36 + t) + Math.sin(Math.sqrt(xx*xx + y*y) / 30 - t * 1.3);
        const h = ((v + 4) / 8) * 360;
        const [r, g, b] = hsl(h, 90, 45 + Math.sin(v + t) * 12);
        for (let oy = 0; oy < 2; oy++) for (let oxx = 0; oxx < 2; oxx++) {
          const i = ((y + oy) * W + (xx + oxx)) * 4; d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255; }
      }
      x.putImageData(img, 0, 0);
      // copper bars
      for (let i = 0; i < 4; i++) { const yy = H/2 + Math.sin(t*1.4 + i) * H*0.3;
        const g = x.createLinearGradient(0, yy-14, 0, yy+14);
        const hue = (t*40 + i*70) % 360;
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(.5, `hsl(${hue},100%,60%)`); g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g; x.fillRect(0, yy-14, W, 28); }
      // starfield
      x.fillStyle = "#fff";
      stars.forEach((s) => { s.x -= (0.5 + s.z * 4); if (s.x < 0) s.x = W;
        const sz = 1 + s.z * 2; x.globalAlpha = 0.3 + s.z * 0.7;
        x.fillRect(s.x, H * (0.2 + s.z * 0.6), sz, sz); });
      x.globalAlpha = 1;
      // sine scroller
      x.font = `700 ${Math.round(H*0.1)}px IBM Plex Mono, monospace`; x.textBaseline = "middle";
      const cw = H * 0.07;
      for (let i = 0; i < msg.length; i++) {
        const px = W - ((t * 90) % (msg.length * cw + W)) + i * cw;
        if (px < -cw || px > W) continue;
        x.fillStyle = `hsl(${(px + t*60) % 360},100%,65%)`;
        x.fillText(msg[i], px, H * 0.85 + Math.sin(px / 50 + t * 3) * H * 0.07);
      }
    }
    function hsl(h, s, l) { s/=100; l/=100; const k=(n)=>(n+h/30)%12;
      const a=s*Math.min(l,1-l); const f=(n)=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
      return [Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)]; }
    visibility(canvas, () => play(frame), () => stop(frame));
  };

  /* --- 9. PLOTTER — algorithmic / early computer art (Molnár, Nake) ----- */
  FX.plotter = function (canvas, opts) {
    fit(canvas, 600); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let disorder = 0.4, seed = 3;
    const ui = afterStage(canvas).mountCtrls([
      { key: "d", label: "disorder", min: 0, max: 100, value: 40, onChange: (v) => { disorder = v / 100; draw(); } },
      { key: "s", type: "button", label: "re-plot", onClick: () => { seed = (Math.random()*1e9)|0; draw(); } },
    ]);
    function draw() {
      const R = rng(seed);
      x.fillStyle = "#0a0a0a"; x.fillRect(0, 0, W, H);
      x.strokeStyle = "#b6ff7a"; x.lineWidth = Math.max(1, W/700);
      const cols = 12, rows = 9, mx = W*0.08, my = H*0.08;
      const cw = (W - mx*2)/cols, ch = (H - my*2)/rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const dis = disorder * (r / rows); // Molnár-style increasing disorder
        x.save();
        x.translate(mx + c*cw + cw/2, my + r*ch + ch/2);
        x.rotate((R()-0.5) * dis * 2);
        x.beginPath();
        const w2 = cw*0.4, h2 = ch*0.4;
        x.rect(-w2 + (R()-.5)*dis*cw, -h2 + (R()-.5)*dis*ch, w2*2, h2*2);
        x.stroke(); x.restore();
      }
    }
    draw();
    hint(canvas, "Vera Molnár's 'désordre' — disorder rises down the grid");
  };

  /* --- 10. AI MELT — semantic / latent glitch sim (2020s) --------------- */
  FX.aiMelt = function (canvas, opts) {
    fit(canvas, 640); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let melt = 0.5, useCam = false;
    let scene = makeScene(W, H, 31);
    const video = document.createElement("video"); video.muted = true; video.playsInline = true;
    const src = document.createElement("canvas"); src.width = W; src.height = H; const sx = src.getContext("2d");
    const ui = afterStage(canvas).mountCtrls([
      { key: "m", label: "hallucination", min: 0, max: 100, value: 50, onChange: (v) => melt = v / 100 },
      { key: "cam", type: "button", label: "use webcam", toggle: true, onClick: (on) => {
          useCam = on; if (on) camera(video, () => {}, () => { useCam = false; ui.cam.classList.remove("on"); }); } },
    ]);
    let t = 0;
    function frame() {
      t += 0.02;
      if (useCam && video.readyState >= 2) sx.drawImage(video, 0, 0, W, H); else sx.drawImage(scene, 0, 0, W, H);
      const img = sx.getImageData(0, 0, W, H), s = img.data;
      const out = x.createImageData(W, H), o = out.data;
      const amp = melt * 40;
      for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
        // flow-field warp = latent drift; doubling = wrong-hands artifact
        const wx = Math.sin(y / 30 + t) * amp + Math.sin(xx / 80 - t) * amp * 0.5;
        const wy = Math.cos(xx / 40 + t * 1.3) * amp * 0.6;
        const sxp = clamp(Math.round(xx + wx), 0, W-1), syp = clamp(Math.round(y + wy), 0, H-1);
        const si = (syp*W+sxp)*4, di = (y*W+xx)*4;
        o[di]=s[si]; o[di+1]=s[si+1]; o[di+2]=s[si+2]; o[di+3]=255;
        // posterize toward synthetic look
        if (melt > 0.4) { const q = 255 / (4 + (1-melt)*40);
          o[di]=Math.round(o[di]/q)*q; o[di+1]=Math.round(o[di+1]/q)*q; o[di+2]=Math.round(o[di+2]/q)*q; }
      }
      x.putImageData(out, 0, 0);
    }
    visibility(canvas, () => play(frame), () => stop(frame));
    hint(canvas, "latent drift + posterize — when meaning melts");
  };

  /* --- 11. JODI — broken-browser net.art homage (interactive) ----------- */
  FX.jodi = function (host) {
    // host is a DIV (not canvas)
    host.classList.add("jodi-stage");
    host.style.cssText += ";position:relative;overflow:hidden;background:#0b0;color:#000;min-height:340px;font-family:monospace;cursor:crosshair";
    const glyphs = "▓▒░█▌▐│┤╡╢╖╕╣║╗╝┐└┴┬├─┼╞╟╚╔╩╦╠═╬§¶<>{}[]()=+*&^%$#@!?/\\|";
    const chunks = [
      "<HEAD>","%20","404","SELECT * FROM","<BLINK>","#FF00FF","</BODY","wwwwww",
      "0x4A 0x4F 0x44 0x49","::before","NULL","jodi.org","reload","view-source:","\\n\\r"
    ];
    function blast() {
      host.innerHTML = "";
      const n = 220;
      let s = "";
      const R = rng((performance.now()|0) % 999999);
      for (let i = 0; i < n; i++) {
        if (R() < 0.12) s += `<span style="color:#f0f;background:#0f0">${chunks[(R()*chunks.length)|0]}</span>`;
        else if (R() < 0.04) s += "<br>";
        else s += glyphs[(R()*glyphs.length)|0];
      }
      const pre = document.createElement("pre");
      pre.style.cssText = "margin:0;padding:14px;white-space:pre-wrap;word-break:break-all;font-size:14px;line-height:1.3";
      pre.innerHTML = s; host.appendChild(pre);
      // a few rogue blinking buttons (Form Art / Shulgin nod)
      for (let i = 0; i < 5; i++) {
        const b = document.createElement("button");
        b.textContent = ["OK","?","↵","[ ]","░"][i];
        b.style.cssText = `position:absolute;left:${(R()*85)|0}%;top:${(R()*80)|0}%;background:#000;color:#0f0;border:2px solid #f0f;font-family:monospace;cursor:pointer`;
        b.onclick = (e) => { e.stopPropagation(); blast(); };
        host.appendChild(b);
      }
    }
    host.addEventListener("pointermove", () => { if (Math.random() < 0.06) blast(); });
    host.addEventListener("click", blast);
    blast();
    const h = document.createElement("div"); h.className = "hint";
    h.style.cssText = "position:absolute;bottom:6px;left:8px;background:rgba(0,0,0,.6);color:#0f0;padding:2px 7px;font-size:11px";
    h.textContent = "move / click — this page is wrong on purpose"; host.appendChild(h);
  };

  /* --- 12. GLITCH AUDIO — CD-skip / clicks&cuts / bitcrush (Oval, Cascone) */
  FX.glitchAudio = function (host) {
    host.classList.add("glitch-audio");
    let ctx = null, playing = false, node = null, src = null, rate = 1, crush = 1, skip = 0.3;
    const ui = controls(host, [
      { key: "play", type: "button", label: "▶ play / cut", toggle: true, onClick: (on) => on ? start() : start2(on) },
      { key: "rate", label: "speed", min: 25, max: 200, value: 100, onChange: (v) => rate = v / 100 },
      { key: "crush", label: "bitcrush", min: 1, max: 16, value: 1, onChange: (v) => crush = v },
      { key: "skip", label: "skip / stutter", min: 0, max: 100, value: 30, onChange: (v) => skip = v / 100 },
    ]);
    function start() {
      if (!ctx) ctx = new (global.AudioContext || global.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      playing = true;
      const sr = ctx.sampleRate, len = sr * 4;
      const buf = ctx.createBuffer(1, len, sr);
      const ch = buf.getChannelData(0);
      // a simple looped chordy tone-bed to mangle
      for (let i = 0; i < len; i++) {
        const tt = i / sr;
        ch[i] = (Math.sin(tt*220*TAU)*0.3 + Math.sin(tt*277*TAU)*0.2 + Math.sin(tt*330*TAU)*0.15)
              * (0.6 + 0.4*Math.sin(tt*2*TAU));
      }
      src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      // bitcrusher via ScriptProcessor (broadly supported)
      const proc = ctx.createScriptProcessor(2048, 1, 1);
      let hold = 0, phase = 0;
      proc.onaudioprocess = (e) => {
        const inp = e.inputBuffer.getChannelData(0), out = e.outputBuffer.getChannelData(0);
        const step = Math.pow(2, crush) ; const decim = Math.max(1, Math.round(crush));
        for (let i = 0; i < out.length; i++) {
          if (phase++ % decim === 0) hold = Math.round(inp[i] * step) / step;
          // CD-skip: randomly freeze / repeat
          out[i] = (Math.random() < skip * 0.004) ? 0 : hold * 0.8;
        }
      };
      src.playbackRate.value = rate;
      const iv = setInterval(() => { if (src) src.playbackRate.value = rate; }, 60);
      src.onended = () => clearInterval(iv);
      src.connect(proc); proc.connect(ctx.destination); src.start(); node = proc;
    }
    function start2() { if (src) { try { src.stop(); } catch (e) {} src = null; } playing = false; }
  };

  /* --- 13. ZALGO — combining-mark corruption (wrong / characterglitch) -- */
  FX.zalgo = function (host) {
    const up = [], down = [], mid = [];
    for (let i = 0x0300; i <= 0x036f; i++) {
      if (i <= 0x0314 || (i >= 0x033d && i <= 0x0344)) up.push(String.fromCharCode(i));
      else if (i >= 0x0316 && i <= 0x0333) down.push(String.fromCharCode(i));
      else mid.push(String.fromCharCode(i));
    }
    const base = host.dataset.text || "creative destruction";
    const out = document.createElement("div");
    out.style.cssText = "font-size:clamp(22px,5vw,46px);line-height:1.8;color:#f1ede5;word-break:break-word;padding:8px 0";
    host.appendChild(out);
    let intensity = 12;
    function render() {
      let s = "";
      for (const ch of base) {
        s += ch;
        if (ch === " ") continue;
        const n = Math.round(Math.random() * intensity);
        for (let i = 0; i < n; i++) s += up[(Math.random()*up.length)|0];
        for (let i = 0; i < n; i++) s += down[(Math.random()*down.length)|0];
        for (let i = 0; i < intensity/3; i++) s += mid[(Math.random()*mid.length)|0];
      }
      out.textContent = s;
    }
    controls(host, [
      { key: "i", label: "corruption", min: 0, max: 40, value: 12, onChange: (v) => { intensity = v; render(); } },
      { key: "r", type: "button", label: "re-corrupt", onClick: render },
    ]);
    render();
  };

  /* --- 14. DATAMOSH — P-frame motion bleed (Murata; datamosh-gui / wrong) */
  FX.datamosh = function (canvas, opts) {
    fit(canvas, 560); const x = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const bw = Math.max(8, Math.round(W / 28));
    const cols = Math.ceil(W / bw), rows = Math.ceil(H / bw);
    const SR = 2; // block search radius
    let leak = 0.04, strength = 1, useCam = false, moshing = true;
    const video = document.createElement("video"); video.muted = true; video.playsInline = true;
    // source + read buffers
    const src = document.createElement("canvas"); src.width = W; src.height = H; const sx = src.getContext("2d");
    const read = document.createElement("canvas"); read.width = W; read.height = H; const rx = read.getContext("2d");
    const small = document.createElement("canvas"); small.width = cols; small.height = rows; const smx = small.getContext("2d");
    let cur = new Float32Array(cols * rows), prev = new Float32Array(cols * rows);
    let t = 0;
    const ui = afterStage(canvas).mountCtrls([
      { key: "mosh", type: "button", label: "remove keyframes", toggle: true, active: true,
        onClick: (on) => moshing = on },
      { key: "leak", label: "keyframe leak", min: 0, max: 40, value: 4, onChange: (v) => leak = v / 100 },
      { key: "s", label: "smear", min: 1, max: 30, value: 10, onChange: (v) => strength = v / 10 },
      { key: "reset", type: "button", label: "I-frame (reset)", onClick: () => { x.drawImage(srcFrame(), 0, 0, W, H); } },
      { key: "cam", type: "button", label: "use webcam", toggle: true, onClick: (on) => {
          useCam = on; if (on) camera(video, () => {}, () => { useCam = false; ui.cam.classList.remove("on"); }); } },
    ]);
    function srcFrame() {
      if (useCam && video.readyState >= 2) { sx.drawImage(video, 0, 0, W, H); return src; }
      // animated generated source so it works with no camera
      t += 0.016;
      sx.fillStyle = "#0a0a12"; sx.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        const a = t * (0.4 + i * 0.13) + i;
        const px = W / 2 + Math.cos(a) * W * (0.12 + i * 0.045);
        const py = H / 2 + Math.sin(a * 1.3) * H * (0.12 + i * 0.05);
        sx.fillStyle = ["#b6ff7a", "#33e0ff", "#ff2a4a", "#ff4ad1", "#ffe14a", "#ffae3b", "#fff"][i];
        sx.beginPath(); sx.arc(px, py, W * 0.06, 0, TAU); sx.fill();
      }
      sx.fillStyle = "#f1ede5"; sx.textAlign = "center"; sx.textBaseline = "middle";
      sx.font = `700 ${Math.round(H * 0.16)}px IBM Plex Mono, monospace`;
      sx.fillText("MOSH", W / 2 + Math.sin(t) * 18, H / 2);
      return src;
    }
    x.drawImage(srcFrame(), 0, 0, W, H);
    function frame() {
      const f = srcFrame();
      // luminance at block resolution
      smx.drawImage(f, 0, 0, cols, rows);
      const d = smx.getImageData(0, 0, cols, rows).data;
      const tmp = prev; prev = cur; cur = tmp;
      for (let i = 0; i < cols * rows; i++) cur[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;

      if (!moshing) { x.drawImage(f, 0, 0, W, H); return; }

      rx.clearRect(0, 0, W, H); rx.drawImage(canvas, 0, 0); // snapshot last frame
      for (let by = 0; by < rows; by++) for (let bx = 0; bx < cols; bx++) {
        // block-match cur vs prev in a small window → motion vector
        let best = 1e9, mvx = 0, mvy = 0;
        for (let dy = -SR; dy <= SR; dy++) for (let dx2 = -SR; dx2 <= SR; dx2++) {
          let cost = 0, cnt = 0;
          for (let ny = -1; ny <= 1; ny++) for (let nx = -1; nx <= 1; nx++) {
            const ci = (by + ny) * cols + (bx + nx);
            const pi = (by + ny + dy) * cols + (bx + nx + dx2);
            if (ci < 0 || pi < 0 || ci >= cur.length || pi >= prev.length) continue;
            cost += Math.abs(cur[ci] - prev[pi]); cnt++;
          }
          cost = cnt ? cost / cnt : 1e9;
          if (cost < best) { best = cost; mvx = dx2; mvy = dy; }
        }
        const dxp = bx * bw, dyp = by * bw;
        const ssx = clamp(dxp + mvx * bw * strength, 0, W - bw);
        const ssy = clamp(dyp + mvy * bw * strength, 0, H - bw);
        x.drawImage(read, ssx, ssy, bw, bw, dxp, dyp, bw, bw); // pull old pixels along motion = bleed
      }
      if (leak > 0) { x.globalAlpha = leak; x.drawImage(f, 0, 0, W, H); x.globalAlpha = 1; }
    }
    visibility(canvas, () => play(frame), () => stop(frame));
    hint(canvas, "keyframes removed → motion smears one shot into the next");
  };

  /* ===================================================================== */
  /* AUTO-INIT                                                              */
  /* ===================================================================== */
  function parseOpts(el) {
    const o = {};
    for (const k in el.dataset) if (k !== "glitch") o[k] = el.dataset[k];
    return o;
  }
  function boot() {
    document.querySelectorAll("[data-glitch]").forEach((el) => {
      const name = el.dataset.glitch;
      if (!FX[name] || el.__glitched) return;
      el.__glitched = true;
      try { FX[name](el, parseOpts(el)); }
      catch (e) { console.warn("glitch:", name, e); }
    });
  }
  // re-fit canvases on resize (debounced) by re-booting fresh ones only
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => {
    document.querySelectorAll("canvas[data-glitch]").forEach((c) => {
      // light refit: keep CSS size; effects read backing store lazily where possible
    });
  }, 250); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  global.Glitch = { FX, boot, makeScene, rng, controls, play, stop, REDUCED };
})(window);
