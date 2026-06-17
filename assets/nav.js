/* =============================================================================
   nav.js — shared chrome + the canonical section registry.
   ONE source of truth for: the index timeline, the header jump-menu, and
   every page's prev/next pager. Page authors only set <body data-slug="...">.
   ========================================================================== */
(function (global) {
  "use strict";

  // slug = pages/<slug>.html  (00-manifesto lives at pages/00-manifesto.html)
  const SECTIONS = [
    { slug:"00-manifesto",    num:"00", years:"the idea",   title:"Creative Destruction",
      nav:"Manifesto", desc:"When the failure of a medium becomes the artwork. The thesis, and the three kinds of glitch.",
      mine:["serious-shit","rabbit-hole"] },
    { slug:"01-predigital",   num:"01", years:"1910–1950s", title:"Damage, Chance & Noise",
      nav:"Pre-digital", desc:"Before the computer: scratched film, moth wings, Cage's silence. The mistake as material.",
      mine:[] },
    { slug:"02-electronic",   num:"02", years:"1950s–60s",  title:"Electronic Images",
      nav:"Electronic", desc:"Oscilloscope abstractions and the first plotter art. Signal and algorithm become image.",
      mine:[] },
    { slug:"03-crt-magnet",   num:"03", years:"1963–1969",  title:"The Magnet on the CRT",
      nav:"Magnet TV", desc:"Nam June Paik turns the television against itself. Video art is born.",
      mine:[] },
    { slug:"04-video-signal", num:"04", years:"1969–1979",  title:"Video as Pure Signal",
      nav:"Video signal", desc:"Synthesizers, feedback and the Vasulkas: the electronic image as sculptable substance.",
      mine:["kloom-radio","gesture-synth"] },
    { slug:"05-systems",      num:"05", years:"1966–1970",  title:"Art + Engineering",
      nav:"Systems", desc:"E.A.T., Cybernetic Serendipity: technology as a messy collaborator, not a neutral tool.",
      mine:[] },
    { slug:"06-homecomputers",num:"06", years:"1980s",      title:"Bedrooms & Demoscene",
      nav:"Home computers", desc:"Cracktros, BBS, ASCII/ANSI, circuit bending. Glitch leaves the lab for the bedroom.",
      mine:["characterglitch","characterworld","comodore"] },
    { slug:"07-telematic",    num:"07", years:"1983–1993",  title:"Networks Before the Web",
      nav:"Telematic", desc:"Telematic art, BBS communities and cyberfeminism: the net as medium before net.art.",
      mine:["kloom-radio"] },
    { slug:"08-netart",       num:"08", years:"1994–1999",  title:"net.art",
      nav:"net.art", desc:"JODI, Lialina, Shulgin, Bunting. The browser, broken pages and source code as artwork. Born from a glitch.",
      mine:["wrong"] },
    { slug:"09-glitchmusic",  num:"09", years:"1990s–2000", title:"The Aesthetics of Failure",
      nav:"Glitch music", desc:"Oval's CD skips, Cascone's manifesto: clicks, cuts and errors as the material of sound.",
      mine:["GlitchPedal","KarplusStrongMachine","daisy-guitar-web","gesture-synth"] },
    { slug:"10-databending",  num:"10", years:"2000–2005",  title:"Databending",
      nav:"Databending", desc:"'Glitch art' gets its name. Open the wrong file in the wrong program and fuck it up.",
      mine:["hexglitcher","wrong"] },
    { slug:"11-datamosh",     num:"11", years:"2005–2010",  title:"Datamoshing",
      nav:"Datamosh", desc:"Attack the codec, not the pixel. Murata's Monster Movie; compression as digital liquid.",
      mine:["datamosh-gui","wrong"] },
    { slug:"12-institution",  num:"12", years:"2010–2016",  title:"GLI.TC/H & Dirty New Media",
      nav:"Institution", desc:"Menkman, Satrom, Cates. Glitch becomes theorised, festivalised — and commercialised.",
      mine:["serious-shit","rabbit-hole","wrong"] },
    { slug:"13-preservation", num:"13", years:"2001–2019",  title:"Preserving Net Art",
      nav:"Preservation", desc:"artport, Rhizome's Net Art Anthology. When the work is a behaviour, how do you keep it alive?",
      mine:[] },
    { slug:"14-postinternet", num:"14", years:"2006–2015",  title:"Post-Internet",
      nav:"Post-internet", desc:"Art made after the internet became the default condition of life. Glitch becomes a mood.",
      mine:["characterglitch"] },
    { slug:"15-aiglitch",     num:"15", years:"2020s",      title:"Synthetic Failure",
      nav:"AI glitch", desc:"Wrong hands, melting text, uncanny meshes. When meaning itself breaks.",
      mine:["3dscaning","video-frame-extractor","phonecamerathingpro"] },
    { slug:"16-branches",     num:"16", years:"the family",  title:"Branches & Canon",
      nav:"Branches", desc:"The whole family tree — circuit bending, software art, tactical media, vaporwave — and who to know.",
      mine:["GlitchPedal","characterglitch","alphaforge-knob-modeler"] },
  ];

  const inPages = /\/pages\//.test(location.pathname.replace(/\\/g, "/"));
  const root = inPages ? "../" : "";
  const pageHref = (slug) => root + "pages/" + slug + ".html";
  const homeHref = root + "index.html";
  const labHref  = root + "lab.html";
  const workHref = root + "yourwork.html";
  const assetHref = (f) => root + "assets/" + f;

  function injectHead() {
    // CRT noise layer + scroll progress (idempotent)
    if (!document.querySelector(".noise")) {
      const n = document.createElement("div"); n.className = "noise"; document.body.appendChild(n);
    }
    if (!document.getElementById("scrollbar")) {
      const s = document.createElement("div"); s.id = "scrollbar"; document.body.appendChild(s);
      addEventListener("scroll", () => {
        const h = document.documentElement;
        const p = h.scrollTop / Math.max(1, (h.scrollHeight - h.clientHeight));
        s.style.width = (p * 100) + "%";
      }, { passive: true });
    }
  }

  function header() {
    const cur = document.body.dataset.slug || "";
    let head = document.getElementById("site-head");
    if (!head) { head = document.createElement("header"); head.id = "site-head"; document.body.prepend(head); }
    const options = SECTIONS.map((s) =>
      `<option value="${pageHref(s.slug)}" ${s.slug === cur ? "selected" : ""}>${s.num} · ${s.nav}</option>`).join("");
    head.innerHTML = `
      <a class="skip" href="#main">skip to content</a>
      <div class="bar">
        <a class="brand" href="${homeHref}">CREATIVE <b>DESTRUCTION</b></a>
        <span class="idx">a history of glitch art</span>
        <span class="spacer"></span>
        <select class="btn" aria-label="jump to era" onchange="if(this.value)location.href=this.value">
          <option value="">jump to era ▾</option>${options}
        </select>
        <nav class="navlinks">
          <a href="${homeHref}#timeline">Timeline</a>
          <a href="${labHref}" ${/lab\.html/.test(location.pathname)?'aria-current="page"':""}>Lab</a>
          <a href="${workHref}" ${/yourwork\.html/.test(location.pathname)?'aria-current="page"':""}>Your Work</a>
        </nav>
      </div>`;
  }

  function pager() {
    const cur = document.body.dataset.slug;
    if (!cur) return;
    const i = SECTIONS.findIndex((s) => s.slug === cur);
    if (i < 0) return;
    const prev = i > 0 ? SECTIONS[i - 1] : null;
    const next = i < SECTIONS.length - 1 ? SECTIONS[i + 1] : null;
    const host = document.querySelector("[data-pager]") || (function () {
      const m = document.querySelector("main") || document.body;
      const d = document.createElement("div"); d.setAttribute("data-pager", ""); m.appendChild(d); return d;
    })();
    host.className = "pager"; host.removeAttribute("data-pager");
    host.innerHTML =
      (prev ? `<a href="${pageHref(prev.slug)}"><span class="lbl">◂ prev · ${prev.num}</span>${prev.title}</a>`
            : `<a href="${homeHref}"><span class="lbl">◂ back</span>The Timeline</a>`) +
      (next ? `<a class="nxt" href="${pageHref(next.slug)}"><span class="lbl">next · ${next.num} ▸</span>${next.title}</a>`
            : `<a class="nxt" href="${labHref}"><span class="lbl">next ▸</span>The Lab — all demos</a>`);
  }

  // Render the index timeline into [data-timeline]
  function timeline() {
    const host = document.querySelector("[data-timeline]");
    if (!host) return;
    host.classList.add("timeline");
    host.innerHTML = SECTIONS.map((s) => `
      <div class="tl-row">
        <div class="tl-year">${s.years}</div>
        <div class="tl-body">
          <a class="tl-link" href="${pageHref(s.slug)}">${s.num} — ${s.title}</a>
          <div class="tl-desc">${s.desc}</div>
          ${s.mine.length ? `<div class="tl-mine">▸ your work here: ${s.mine.join(" · ")}</div>` : ""}
        </div>
      </div>`).join("");
  }

  function footer() {
    let f = document.querySelector("footer[data-auto]");
    if (!f) return;
    f.innerHTML = `<div class="wrap">
      <div class="cols">
        <div><h5>Creative Destruction</h5>
          <p class="mono-sm">A history of glitch art — from the magnet on the CRT to synthetic failure. Built as a living lecture: every technique here is also a working demo.</p></div>
        <div><h5>Navigate</h5>
          <p><a href="${homeHref}">Home / Timeline</a><br><a href="${labHref}">The Lab</a><br><a href="${workHref}">Your Work</a></p></div>
        <div><h5>Willbear / Glitches</h5>
          <p><a href="https://github.com/willbearfruits">github.com/willbearfruits</a><br>
          <a href="https://willbearfruits.github.io/serious-shit/">Serious S.H.I.T.</a><br>
          <a href="https://www.patreon.com/Seriousshit">Patreon</a></p></div>
      </div>
      <p class="mono-sm" style="margin-top:24px">nothing here survives uncorrupted.</p>
    </div>`;
  }

  function boot() {
    injectHead(); header(); pager(); timeline(); footer();
    // mark active nav
    const cur = document.body.dataset.slug;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  global.Nav = { SECTIONS, pageHref, homeHref, labHref, workHref, assetHref };
})(window);
