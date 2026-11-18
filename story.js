/* Six scroll stories about life under capitalism. Each is told with one blue line that draws the illustrations, and each ends with the
   blue sun logo filling in at the bottom. Inspired by Listen to America (Gladeye) and Awwards-style scroll work.
   Core: data, helpers, the blue sun, the line illustrations, the switcher bar. Story 1 lives here; stories 2 to 6 live in concepts.js. */
(async function () {
  const root = document.getElementById("story");
  if (!root || !window.gsap || !window.ScrollTrigger || !window.d3 || !window.topojson) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [data, atlas, SUN] = await Promise.all([d3.json("assets/data/states.json"), d3.json("assets/data/states-10m.json"), d3.json("assets/data/sun.json")]);

  /* ---------- shared ---------- */
  const C = { BLUE: "#1250c4", MID: "#6f8fd6", LIGHT: "#c3d0ee", PALE: "#e3e6f1", INK: "#111", GREY: "#d9d7d1", BONE: "#f1f0ec", DIM: "#a3a29d" };
  const S = data.states, US = data.us;
  const fmt = { money: d3.format("$,.0f"), money2: d3.format("$,.2f"), num: d3.format(",") };
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, html) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (html) n.innerHTML = html; return n; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  const V = {
    gomez: { who: "James Gómez", say: "Why I'm Anti-Capitalist" },
    sen: { who: "Sanchari Sen", say: "101 Sins of Capitalism" },
    hamilton: { who: "Kaylin Hamilton", say: "From Famine Walls to Welfare Conditions, Why Do We Always Punish The Poor?" },
    hotta: { who: "Annika Hotta", say: "Independence Looks Different For Everyone, Especially If You're Disabled" },
    ogamdi: { who: "Dr. Emmanuel Ogamdi", say: "Playing Russian Roulette With Mental Health Patients" },
    judge: { who: "Tiffany Judge", say: "Americans Are Burying Themselves Alive With Cheap Stuff" },
  };
  const MEAS = {
    student: { name: "Student debt", fmt: fmt.money, line: "Nobody should owe decades of their life for an education.", src: "Federal Student Aid data, about 2023, as charted by Axios." },
    uninsured: { name: "No health insurance", fmt: (v) => v + "%", line: "Staying healthy should never cost you everything you have.", src: "CDC PLACES (BRFSS) 2023, adults 18 to 64." },
    housing: { name: "Housing insecurity", fmt: (v) => v + "%", line: "A roof is not a luxury. No one should live in fear of losing theirs.", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    food: { name: "Food insecurity", fmt: (v) => v + "%", line: "No one should go hungry in one of the richest countries on earth.", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    poverty: { name: "Poverty", fmt: (v) => v + "%", line: "Working your whole life shouldn't leave you poor.", src: "U.S. Census Bureau, American Community Survey 2023." },
    minwage: { name: "Minimum wage", low: true, fmt: (v) => "$" + v.toFixed(2), line: "A full-time job should pay for a life.", src: "Higher of state or federal minimum wage, 2025." },
  };
  const worst = (k) => { const m = MEAS[k]; return Object.entries(S).filter(([, s]) => s[k] != null).sort((a, b) => (m.low ? a[1][k] - b[1][k] : b[1][k] - a[1][k]))[0]; };
  const scaleFor = (k) => { const m = MEAS[k]; const vals = Object.values(S).map((s) => s[k]).filter((v) => v != null); const [lo, hi] = d3.extent(vals); const t = d3.scaleLinear().domain([lo, hi]).range(m.low ? [1, 0] : [0, 1]); return (v) => d3.interpolateRgb(C.PALE, C.BLUE)(t(v)); };
  const POOR = 40763043, MINW = 7.25, TOPH = US.top5avg / 2080;

  /* ---------- the line illustrations (single blue strokes, drawn on scroll) ---------- */
  const ICONS = {
    cap: ["M20 85 L100 48 L180 85 L100 122 Z", "M52 102 V138 C52 158 148 158 148 138 V102", "M180 85 V135"],
    heart: ["M100 160 C40 118 28 76 52 56 C72 40 94 50 100 68 C106 50 128 40 148 56 C172 76 160 118 100 160 Z", "M30 108 H72 L86 84 L104 136 L118 100 H170"],
    house: ["M24 104 L100 42 L176 104", "M44 92 V164 H156 V92", "M86 164 V118 H114 V164", "M130 62 V44 H146 V76"],
    plate: ["M100 100 m-52 0 a52 52 0 1 0 104 0 a52 52 0 1 0 -104 0", "M100 100 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0", "M22 40 V84 C22 94 36 94 36 84 V40 M29 40 V160", "M178 40 C160 56 160 96 178 108 V160"],
    coin: ["M100 100 m-60 0 a60 60 0 1 0 120 0 a60 60 0 1 0 -120 0", "M100 100 m-48 0 a48 48 0 1 0 96 0 a48 48 0 1 0 -96 0", "M118 78 C106 64 76 68 80 92 C84 112 118 100 118 124 C118 146 88 142 80 128", "M100 56 V144"],
    clock: ["M100 100 m-64 0 a64 64 0 1 0 128 0 a64 64 0 1 0 -128 0", "M100 56 V100 L132 118", "M100 40 V48 M160 100 H152 M100 160 V152 M40 100 H48"],
    people: ["M100 100 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0", "M52 170 C52 132 148 132 148 170", "M30 150 C30 130 44 122 58 120", "M170 150 C170 130 156 122 142 120"],
  };
  function icon(name, stroke = 2.4) { // returns {svg, paths}
    const svg = el("svg", { viewBox: "0 0 200 200", class: "ico", "aria-hidden": "true" });
    const paths = ICONS[name].map((d) => { const p = el("path", { d, fill: "none", stroke: C.BLUE, "stroke-width": stroke, "stroke-linecap": "round", "stroke-linejoin": "round" }); svg.appendChild(p); return p; });
    return { svg, paths };
  }
  const prep = (paths) => paths.map((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; return L; });
  /* draw(paths, 0..1): strokes draw one after another */
  function setDraw(paths, lens, p, from = 0, to = 1) {
    const n = paths.length, seg = 1 / n;
    paths.forEach((path, i) => { const a = i * seg, t = clamp((p - a) / seg); path.style.strokeDashoffset = lens[i] * (1 - t); });
  }

  /* ---------- the blue sun logo: the stroke draws it, then it fills ---------- */
  function sun(widthCss) {
    const svg = el("svg", { viewBox: `0 0 ${SUN.w} ${SUN.h}`, class: "sun", "aria-hidden": "true" }); if (widthCss) svg.style.width = widthCss;
    const parts = SUN.d.split("M").filter(Boolean).map((s) => "M" + s);
    const fill = el("path", { d: SUN.d, fill: C.BLUE, "fill-rule": "evenodd", opacity: 0 });
    const strokes = parts.map((d) => el("path", { d, fill: "none", stroke: C.BLUE, "stroke-width": 0.7, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    svg.append(fill, ...strokes);
    let lens = null;
    const api = {
      svg,
      init() { lens = strokes.map((s) => { const L = s.getTotalLength(); s.style.strokeDasharray = L; s.style.strokeDashoffset = L; return L; }); fill.setAttribute("opacity", 0); },
      set(p) { if (!lens) api.init(); strokes.forEach((s, i) => (s.style.strokeDashoffset = lens[i] * (1 - clamp(p / 0.62)))); fill.setAttribute("opacity", clamp((p - 0.55) / 0.45)); },
    };
    return api;
  }

  /* ---------- scribble (abstract portrait line) ---------- */
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  function scribble(seed) {
    const r = rng(seed * 9301 + 49297), pts = [];
    const loops = 5 + Math.floor(r() * 4), A = 34 + r() * 8, B = 14 + r() * 10, n = 3 + Math.floor(r() * 4), ph = r() * 6.28, sk = 0.7 + r() * 0.5;
    for (let i = 0; i <= 220; i++) { const t = (i / 220) * Math.PI * 2 * (loops / 2); pts.push([50 + A * Math.cos(t * 0.5) * 0.9 + B * Math.cos(t * n + ph), 50 + A * Math.sin(t * 0.5) * sk + B * Math.sin(t * n + ph) * 0.9]); }
    return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
  }
  const ARROW = '<span class="arrow-slide" aria-hidden="true"><span class="arrow-out"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="arrow-in"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>';

  /* ---------- listen: text to speech ---------- */
  const tts = window.speechSynthesis; let listenOn = false, voices = [];
  const loadVoices = () => (voices = (tts ? tts.getVoices() : []).filter((v) => /^en/i.test(v.lang)));
  if (tts) { loadVoices(); tts.onvoiceschanged = loadVoices; }
  function say(text, k = 0, onstart, onend) {
    if (!listenOn || !tts) return;
    tts.cancel(); const u = new SpeechSynthesisUtterance(text);
    if (voices.length) u.voice = voices[k % voices.length]; u.pitch = 0.85 + ((k * 37) % 30) / 100; u.rate = 0.95;
    u.onstart = () => onstart && onstart(); u.onend = u.onerror = () => onend && onend(); tts.speak(u);
  }
  const stopSay = () => tts && tts.cancel();
  function listenButton(parent) {
    if (!tts) return null;
    const b = document.createElement("button"); b.className = "thread-snd"; b.type = "button"; b.setAttribute("aria-pressed", String(listenOn)); b.textContent = listenOn ? "Listen: on" : "Listen: off";
    b.addEventListener("click", () => { listenOn = !listenOn; b.setAttribute("aria-pressed", String(listenOn)); b.textContent = listenOn ? "Listen: on" : "Listen: off"; if (!listenOn) stopSay(); });
    parent.appendChild(b); return b;
  }
  window.addEventListener("pagehide", stopSay);

  /* ---------- the toolkit handed to every story ---------- */
  const CWC = window.CWC = { root, reduce, data, atlas, SUN, C, S, US, fmt, V, MEAS, worst, scaleFor, POOR, MINW, TOPH, ICONS, icon, prep, setDraw, sun, scribble, ARROW, el, clamp, say, stopSay, listenButton, NS };

  /* ---------- Story 1: The Thread (where we started) ---------- */
  function mountThread(host) {
    const voice = (k) => ({ type: "voice", ...V[k], speak: `${V[k].say}. By ${V[k].who}.` });
    function mapViz(key) {
      const box = document.createElement("div"); box.className = "viz viz-map";
      const W = 560, H = 340; const svg = d3.select(box).append("svg").attr("viewBox", `0 0 ${W} ${H}`);
      const feats = topojson.feature(atlas, atlas.objects.states).features.filter((f) => S[f.properties.name]);
      const path = d3.geoPath(d3.geoAlbersUsa().fitExtent([[0, 0], [W, H]], { type: "FeatureCollection", features: feats }));
      const paths = svg.append("g").selectAll("path").data(feats).join("path").attr("d", path).attr("fill", C.GREY).attr("stroke", "#f1f0ec").attr("stroke-width", 0.8);
      const col = scaleFor(key), [wn] = worst(key);
      return { el: box, enter() {
        paths.transition().duration(reduce ? 0 : 1100).delay((d, i) => (reduce ? 0 : i * 12)).attr("fill", (d) => { const v = S[d.properties.name][key]; return v == null ? C.GREY : col(v); });
        const node = paths.filter((d) => d.properties.name === wn).node();
        if (node) { const dd = node.getAttribute("d"); [["#fff", 4], [C.BLUE, 2]].forEach(([c, w]) => svg.append("path").attr("d", dd).attr("fill", "none").attr("stroke", c).attr("stroke-width", w).attr("opacity", 0).transition().delay(reduce ? 0 : 1000).duration(400).attr("opacity", 1)); }
      } };
    }
    const mapMoment = (k) => { const [wn, ws] = worst(k), m = MEAS[k]; const isMin = k === "minwage"; const n = isMin ? Object.values(S).filter((s) => s.minwage === ws.minwage).length : 0;
      return { type: "viz", who: isMin ? m.name : `${m.name} · highest in ${wn}`, big: m.fmt(ws[k]), line: m.line, note: isMin ? `The wage floor in ${n} states.` : "", src: m.src, viz: () => mapViz(k), speak: `${m.name}. ${m.line}` }; };
    const moments = [voice("gomez"), mapMoment("student"), mapMoment("uninsured"), voice("sen"), mapMoment("housing"), mapMoment("poverty"), voice("hamilton"), mapMoment("minwage"),
      { type: "end", say: "The publication is on hiatus. These voices are still here.", link: ["Read the publication", "https://medium.com/coping-with-capitalism"] }];

    const wrap = document.createElement("div"); wrap.className = "thread"; host.appendChild(wrap);
    const head = document.createElement("div"); head.className = "thread-head"; head.innerHTML = '<p class="mono label">The thread</p><h2>One line, every measure.</h2><p>Follow the line, state by state.</p>';
    const lineSvg = el("svg", { class: "thread-line", "aria-hidden": "true" }), threadPath = el("path"); lineSvg.appendChild(threadPath);
    wrap.append(lineSvg); const snd = listenButton(wrap); wrap.append(head);

    const enters = []; let active = -1;
    const els = moments.map((m, k) => {
      const side = m.type === "end" ? "center" : k % 2 === 0 ? "left" : "right";
      const d = document.createElement("div"); d.className = `moment ${side}${m.type === "viz" ? " is-stat" : ""}`; const card = document.createElement("div"); card.className = "card-v";
      if (m.type === "voice") card.innerHTML = `<svg class="sig" viewBox="0 0 100 100" aria-hidden="true"><path d="${scribble(k + 3)}"/></svg><p class="mono who">${m.who}</p><p class="say">${m.say}</p><p class="mono listen-now"><i></i>Listening</p>`;
      else if (m.type === "viz") { const z = m.viz(); card.innerHTML = `<p class="mono who">${m.who}</p><p class="num">${m.big}</p><p class="note">${m.line}${m.note ? `<br><span style="color:var(--dim)">${m.note}</span>` : ""}</p>`; card.appendChild(z.el); card.insertAdjacentHTML("beforeend", `<p class="mono src">${m.src}</p><p class="mono listen-now"><i></i>Listening</p>`); enters[k] = z.enter; }
      else card.innerHTML = `<p class="say">${m.say}</p><p class="note"><a class="foot-link" style="font-family:inherit;text-transform:none;letter-spacing:inherit;border-bottom:1px solid currentColor" href="${m.link[1]}" target="_blank" rel="noopener">${m.link[0]}${ARROW}</a></p>`;
      d.appendChild(card); wrap.appendChild(d); return d;
    });
    // the sun at the end of the thread
    const sunBox = document.createElement("div"); sunBox.className = "sun-end"; const sn = sun("min(46vw, 320px)"); sunBox.appendChild(sn.svg); sunBox.insertAdjacentHTML("beforeend", '<p class="mono">Coping With Capitalism</p>'); wrap.appendChild(sunBox);

    els.forEach((e, k) => {
      const card = e.querySelector(".card-v"), p = e.querySelector(".sig path");
      if (reduce) { enters[k] && enters[k](); return; }
      gsap.set(card, { opacity: 0, y: 28 }); let len = 0; if (p) { len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); }
      ScrollTrigger.create({ trigger: e, start: "top 72%", once: true, onEnter: () => { gsap.to(card, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }); if (p) gsap.to(p, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }); enters[k] && enters[k](); } });
      ScrollTrigger.create({ trigger: e, start: "center 62%", end: "center 38%", onToggle: (s) => { if (s.isActive && k !== active) { active = k; const m = moments[k]; if (m.speak) say(m.speak, k, () => e.classList.add("speaking"), () => e.classList.remove("speaking")); } } });
    });
    sn.init(); if (!reduce) ScrollTrigger.create({ trigger: sunBox, start: "top 85%", end: "center 45%", scrub: 0.6, onUpdate: (s) => sn.set(s.progress) }); else sn.set(1);

    function sizeLine() {
      const w = wrap.clientWidth, h = wrap.scrollHeight, small = w < 760; lineSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      const ys = els.map((e) => e.offsetTop + e.offsetHeight / 2); const sunY = sunBox.offsetTop + 60;
      const pts = [[small ? 22 : w * 0.5, head.offsetTop + head.offsetHeight + 10]];
      els.forEach((e, k) => { const left = e.classList.contains("left"), center = e.classList.contains("center"); const x = small ? 22 + (k % 2 ? 10 : -4) : center ? w * 0.5 : w * 0.5 + (left ? 1 : -1) * w * 0.05, y = ys[k];
        pts.push([small ? 22 + (k % 2 ? -8 : 8) : w * 0.5 + (left ? -1 : 1) * w * 0.012, y - 110]); pts.push([x, y]); pts.push([small ? 22 : w * 0.5, y + 110]); });
      pts.push([small ? 22 : w * 0.5, sunY]);
      threadPath.setAttribute("d", d3.line().curve(d3.curveCatmullRom.alpha(0.6))(pts));
      const len = threadPath.getTotalLength(); threadPath.style.strokeDasharray = len; threadPath.style.strokeDashoffset = reduce ? 0 : len;
      if (!reduce) { threadPath.__tw && threadPath.__tw.kill(); threadPath.__tw = gsap.to(threadPath, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: wrap, start: "top 55%", end: "bottom 70%", scrub: 0.5, invalidateOnRefresh: true } }); }
    }
    sizeLine(); const ro = new ResizeObserver(() => { clearTimeout(ro.__t); ro.__t = setTimeout(() => { sizeLine(); ScrollTrigger.refresh(); }, 200); }); ro.observe(wrap);
    return () => { ro.disconnect(); if (threadPath.__tw) { threadPath.__tw.scrollTrigger && threadPath.__tw.scrollTrigger.kill(); threadPath.__tw.kill(); } };
  }

  /* ---------- registry, switcher bar ---------- */
  const STORIES = [
    { name: "The thread", mount: mountThread },
    ...(window.CWC_STORIES || []),
  ];
  let cur = clamp((parseInt(new URLSearchParams(location.search).get("c"), 10) || 1) - 1, 0, STORIES.length - 1), ctx = null, cleanup = null;
  function build(i, scrollTo) {
    if (ctx) ctx.revert(); if (cleanup) cleanup(); stopSay(); root.innerHTML = ""; root.className = "story"; root.removeAttribute("style");
    cur = i; const u = new URL(location.href); u.searchParams.set("c", i + 1); history.replaceState(null, "", u);
    ctx = gsap.context(() => { cleanup = STORIES[i].mount(root) || null; }, root);
    document.querySelectorAll(".story-bar a").forEach((a, n) => (n === i ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    ScrollTrigger.sort(); ScrollTrigger.refresh();
    if (scrollTo) { const top = root.getBoundingClientRect().top + scrollY; window.lenis ? window.lenis.scrollTo(top, { duration: 1.2 }) : window.scrollTo({ top, behavior: "smooth" }); }
  }
  const arrow = (d) => `<button type="button" class="sb-nav" data-d="${d}" aria-label="${d < 0 ? "Previous" : "Next"} story"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="${d < 0 ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  const bar = document.createElement("nav"); bar.className = "story-bar show"; bar.setAttribute("aria-label", "Scroll stories");
  bar.innerHTML = arrow(-1) + STORIES.map((c, n) => `<a href="?c=${n + 1}" data-i="${n}"><i>${n + 1}</i><span>${c.name}</span></a>`).join("") + arrow(1);
  document.body.appendChild(bar);
  const go = (i) => build((i + STORIES.length) % STORIES.length, true);
  bar.addEventListener("click", (e) => {
    const n = e.target.closest(".sb-nav"); if (n) return go(cur + +n.dataset.d);
    const a = e.target.closest("a"); if (!a) return; e.preventDefault(); go(+a.dataset.i);
  });
  // keyboard: [ and ] or the left and right arrows step through the stories
  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || document.querySelector("dialog[open]")) return;
    if (e.key === "]" || e.key === "ArrowRight") go(cur + 1); else if (e.key === "[" || e.key === "ArrowLeft") go(cur - 1);
  });
  build(cur, false);
  document.fonts && document.fonts.ready.then(() => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
})();
