/* =============================================================================
   works.js — Willbear / Yaniv Schonfeld / "Glitches" own tools, mapped to eras.
   These appear inside the relevant history sections as LIVING EXAMPLES:
   the techniques in the lecture, built and shipped.
   github.com/willbearfruits
   ========================================================================== */
(function (global) {
  "use strict";

  const GH = "https://github.com/willbearfruits/";

  // kind: "live" (runs in browser, has homepage), "app" (desktop download),
  //       "fw" (hardware firmware), "code" (source only)
  const WORKS = [
    { id:"wrong", name:"WRONG", kind:"live",
      live:"https://willbearfruits.github.io/wrong/", repo:GH+"wrong", lang:"JavaScript / Electron",
      desc:"A browser that's wrong on purpose. Byte-flips JPEG/PNG/WebP before the decoder sees them, pours combining diacritics into every visible character, and datamoshes video at the frame level. Glitch as an everyday browsing surface.",
      eras:["08-netart","10-databending","11-datamosh","12-institution"] },

    { id:"hexglitcher", name:"HexGlitcher", kind:"app",
      live:null, repo:GH+"hexglitcher", lang:"Python / PySide6",
      desc:"A layered realtime databender: corrupt the raw bytes of an image with a live re-decoding preview. Byte ops (pre-decode) vs pixel ops (post-decode), the Audacity audio-on-image workflow built in, seeds for reproducible accidents.",
      eras:["10-databending"] },

    { id:"datamosh-gui", name:"Datamosh GUI", kind:"app",
      live:null, repo:GH+"datamosh-gui", lang:"Python",
      desc:"Timeline-based datamoshing with clip-level I-frame / P-frame manipulation, per-segment glitch settings and live preview. Removing keyframes so motion vectors bleed one shot into the next.",
      eras:["11-datamosh"] },

    { id:"characterglitch", name:"Character Glitch", kind:"live",
      live:"https://willbearfruits.github.io/characterglitch/", repo:GH+"characterglitch", lang:"HTML / Canvas",
      desc:"Single-file canvas experiments where pixels are Unicode glyphs — physarum swarms, strange attractors, reaction-diffusion and a hex heart in decay, all rendered as characters with Zalgo corruption rising over them. Includes 'the line', a sounded timeline of communication eras.",
      eras:["06-homecomputers","14-postinternet","16-branches"] },

    { id:"characterworld", name:"Character World", kind:"live",
      live:"https://willbearfruits.github.io/characterworld/", repo:GH+"characterworld", lang:"JavaScript",
      desc:"A character-only Photoshop in one HTML file: layers, selections, filters, GIF/PNG/ANSI export — every visible form is a typed glyph. ANSI/ASCII art as a full paint surface.",
      eras:["06-homecomputers","16-branches"] },

    { id:"GlitchPedal", name:"GlitchPedal", kind:"fw",
      live:null, repo:GH+"GlitchPedal", lang:"C++ / Daisy Seed",
      desc:"A multi-effects guitar pedal for the Daisy Seed: overdrive, FFT phase-vocoder pitch shift, spectral freeze and a 'drone' mode that accumulates harmonics into infinite sustain. The aesthetics of failure, in DSP.",
      eras:["09-glitchmusic","16-branches"] },

    { id:"KarplusStrongMachine", name:"Karplus-Strong Machine", kind:"fw",
      live:null, repo:GH+"KarplusStrongMachine", lang:"C++ / Daisy Seed",
      desc:"A digital kalimba built on Karplus-Strong string synthesis, with a WebUSB flasher and workshop docs. Physical modelling as a teaching object.",
      eras:["09-glitchmusic"] },

    { id:"daisy-guitar-web", name:"DP v2.1 — Dual-Processing FX", kind:"fw",
      live:null, repo:GH+"daisy-guitar-web", lang:"C++ / WebUSB",
      desc:"Dual-channel guitar effects for Daisy Seed with browser-based firmware flashing (WebUSB DFU) and live parameter control over Web Serial — 24+ parameters, cross-channel modulation, no install.",
      eras:["09-glitchmusic"] },

    { id:"gesture-synth", name:"Gesture Synth", kind:"live",
      live:"https://willbearfruits.github.io/gesture-synth/", repo:GH+"gesture-synth", lang:"TypeScript / MediaPipe",
      desc:"A web synth played by hand gestures — MediaPipe hand-tracking driving Karplus-Strong + granular synthesis. The body as signal source.",
      eras:["09-glitchmusic","04-video-signal"] },

    { id:"kloom-radio", name:"Kloom Radio", kind:"live",
      live:"https://willbearfruits.github.io/kloom-radio/", repo:GH+"kloom-radio", lang:"HTML",
      desc:"Experimental broadcasts, archives and 'Nothing Is Holy' transmissions — net-native pirate radio in the lineage of transmission and tactical media art.",
      eras:["07-telematic","04-video-signal","16-branches"] },

    { id:"3dscaning", name:"3dscaning", kind:"app",
      live:null, repo:GH+"3dscaning", lang:"Python / COLMAP / OpenMVS",
      desc:"A local, open-source KIRI-Engine-style photogrammetry pipeline: photos/video → camera poses → dense mesh → textured GLB, all on your own GPU. Where 3D capture breaks, you get the uncanny meshes of the 2020s.",
      eras:["15-aiglitch"] },

    { id:"video-frame-extractor", name:"Video Frame Extractor", kind:"app",
      live:null, repo:GH+"video-frame-extractor", lang:"Python",
      desc:"Pulls sharp, de-duplicated frames from video for photogrammetry — the front of the capture-to-mesh pipeline, with blur detection.",
      eras:["15-aiglitch"] },

    { id:"phonecamerathingpro", name:"Phone Camera Thing Pro", kind:"code",
      live:null, repo:GH+"phonecamerathingpro", lang:"Kotlin",
      desc:"Turning a phone into a capture instrument — feeding the photogrammetry and machine-vision pipelines that produce 2020s synthetic artifacts.",
      eras:["15-aiglitch"] },

    { id:"comodore", name:"comodore", kind:"code",
      live:null, repo:GH+"comodore", lang:"—",
      desc:"Commodore-flavoured experiments — the home-computer / demoscene substrate of bedroom glitch culture.",
      eras:["06-homecomputers"] },

    { id:"rabbit-hole", name:"The Rabbit Hole", kind:"live",
      live:"https://willbearfruits.github.io/rabbit-hole/", repo:GH+"rabbit-hole", lang:"TypeScript",
      desc:"An open-source workbench, library and workshop toolset for media artists — the institutional/teaching layer of this practice.",
      eras:["00-manifesto","12-institution"] },

    { id:"serious-shit", name:"Serious S.H.I.T.", kind:"live",
      live:"https://willbearfruits.github.io/serious-shit/", repo:GH+"serious-shit", lang:"HTML",
      desc:"Open-source workshops, hardware and 'creative destruction' tools — the studio/school this whole lecture comes out of.",
      eras:["00-manifesto","12-institution"] },

    { id:"yaniv-schonfeld-site", name:"Yaniv Schonfeld / Willbear", kind:"live",
      live:"https://willbearfruits.github.io/yaniv-schonfeld-site/", repo:GH+"yaniv-schonfeld-site", lang:"JavaScript",
      desc:"Character-rendered artist site: sound, performance, creative electronics, workshops and artist tools.",
      eras:["00-manifesto"] },

    { id:"alphaforge-knob-modeler", name:"AlphaForge Knob Modeler", kind:"code",
      live:null, repo:GH+"alphaforge-knob-modeler", lang:"TypeScript",
      desc:"AI-powered 3D knob designer for synths and pedals from natural language — tooling for the DIY-hardware side of the practice.",
      eras:["16-branches"] },
  ];

  const KIND_LABEL = { live:"live in browser", app:"desktop app", fw:"hardware firmware", code:"source" };

  function esc(s){ return String(s).replace(/[&<>"]/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

  function card(w){
    const links = [];
    if (w.live) links.push(`<a href="${w.live}">live ↗</a>`);
    links.push(`<a href="${w.repo}">source ↗</a>`);
    return `<div class="workcard">
      <div class="wtag">your work · ${KIND_LABEL[w.kind]||w.kind}</div>
      <div class="wt">${esc(w.name)}</div>
      <div class="wd">${esc(w.desc)}</div>
      <div class="wlinks">${links.join("")}<span class="lang">${esc(w.lang)}</span></div>
    </div>`;
  }

  const Works = {
    all: WORKS,
    byEra(era){ return WORKS.filter((w)=>w.eras.includes(era)); },
    cardsHTML(era){ const list = era ? this.byEra(era) : WORKS;
      return list.length ? `<div class="work">${list.map(card).join("")}</div>` : ""; },
    // mount into the element matching selector; era from its data-era or arg
    mount(selector, era){
      document.querySelectorAll(selector).forEach((el)=>{
        const e = era || el.dataset.era;
        const html = this.cardsHTML(e);
        if (html) el.insertAdjacentHTML("beforeend", html);
      });
    },
    // auto: any element with [data-works] gets cards for its era
    boot(){
      document.querySelectorAll("[data-works]").forEach((el)=>{
        const e = el.dataset.works; el.insertAdjacentHTML("beforeend", this.cardsHTML(e));
      });
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ()=>Works.boot());
  else Works.boot();

  global.Works = Works;
})(window);
