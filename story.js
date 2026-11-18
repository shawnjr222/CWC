/* Two scroll stories about life under capitalism. Both end with the blue sun logo: in "The thread" the line itself runs down into the sun,
   traces its outline, and then the sun fills in.
   Core: data, helpers, the sun, the line illustrations, the switcher. Story 1 (The thread) lives here; story 2 (Kinetic type) in concepts.js.
   References: Gladeye's Listen to America (one line, many voices) and Apple's product pages (sticky storytelling, scroll-lit text, count-ups, clean stops). */
(async function () {
  const root = document.getElementById("story");
  if (!root || !window.gsap || !window.ScrollTrigger || !window.d3 || !window.topojson) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [data, atlas, SUN, TOP] = await Promise.all([d3.json("assets/data/states.json"), d3.json("assets/data/states-10m.json"), d3.json("assets/data/sun.json"), d3.json("assets/data/medium-top10.json").catch(() => null)]);

  /* ---------- shared ---------- */
  const C = { BLUE: "#1250c4", MID: "#6f8fd6", LIGHT: "#c3d0ee", PALE: "#e3e6f1", INK: "#111", GREY: "#d9d7d1", BONE: "#f1f0ec", DIM: "#6a6965" };
  const S = data.states, US = data.us;
  const PUB = "https://medium.com/coping-with-capitalism";
  const HIATUS_LINE = "While the publication is on hiatus, the stories are still here.";
  const fmt = { money: d3.format("$,.0f"), money2: d3.format("$,.2f"), num: d3.format(",") };
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, html) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (html) n.innerHTML = html; return n; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const div = (cls, html) => { const d = document.createElement("div"); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const place = (n) => (n === "District of Columbia" ? "the District of Columbia" : n);
  const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const worst = (k, low) => Object.entries(S).filter(([, s]) => s[k] != null).sort((a, b) => (low ? a[1][k] - b[1][k] : b[1][k] - a[1][k]))[0];
  const POOR = 40763043, MINW = 7.25, TOPH = US.top5avg / 2080;
  const followers = TOP && TOP.totals.followers ? TOP.totals.followers : 2.3;

  /* ---------- the line illustrations (single blue strokes, drawn on scroll) ---------- */
  const ICONS = {
    cap: ["M20 85 L100 48 L180 85 L100 122 Z", "M52 102 V138 C52 158 148 158 148 138 V102", "M180 85 V135"],
    coin: ["M100 100 m-60 0 a60 60 0 1 0 120 0 a60 60 0 1 0 -120 0", "M100 100 m-48 0 a48 48 0 1 0 96 0 a48 48 0 1 0 -96 0", "M118 78 C106 64 76 68 80 92 C84 112 118 100 118 124 C118 146 88 142 80 128", "M100 56 V144"],
    clock: ["M100 100 m-64 0 a64 64 0 1 0 128 0 a64 64 0 1 0 -128 0", "M100 56 V100 L132 118", "M100 40 V48 M160 100 H152 M100 160 V152 M40 100 H48"],
    people: ["M100 100 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0", "M52 170 C52 132 148 132 148 170", "M30 150 C30 130 44 122 58 120", "M170 150 C170 130 156 122 142 120"],
  };
  function icon(name, stroke = 2.4, color = C.BLUE) {
    const svg = el("svg", { viewBox: "0 0 200 200", class: "ico", "aria-hidden": "true" });
    const paths = ICONS[name].map((d) => { const p = el("path", { d, fill: "none", stroke: color, "stroke-width": stroke, "stroke-linecap": "round", "stroke-linejoin": "round" }); svg.appendChild(p); return p; });
    return { svg, paths };
  }
  const prep = (paths) => paths.map((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; return L; });
  function setDraw(paths, lens, p) { const n = paths.length, seg = 1 / n; paths.forEach((path, i) => { path.style.strokeDashoffset = lens[i] * (1 - clamp((p - i * seg) / seg)); }); }

  /* ---------- the blue sun logo: the stroke draws it, then it fills ---------- */
  function sun(widthCss) {
    const svg = el("svg", { viewBox: `0 0 ${SUN.w} ${SUN.h}`, class: "sun", role: "img", "aria-label": "The Coping With Capitalism sun" }); if (widthCss) svg.style.width = widthCss;
    const parts = SUN.d.split("M").filter(Boolean).map((s) => "M" + s);
    const fill = el("path", { d: SUN.d, fill: C.BLUE, "fill-rule": "evenodd", opacity: 0 });
    const strokes = parts.map((d) => el("path", { d, fill: "none", stroke: C.BLUE, "stroke-width": 0.7, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    svg.append(fill, ...strokes);
    const m = SUN.d.match(/^M\s*([-\d.]+)[ ,]([-\d.]+)/); const start = m ? { x: +m[1], y: +m[2] } : { x: SUN.w / 2, y: 0 };
    let lens = null;
    const api = { svg, start, outer: strokes[0],
      init() { lens = strokes.map((s) => { const L = s.getTotalLength(); s.style.strokeDasharray = L; s.style.strokeDashoffset = L; return L; }); fill.setAttribute("opacity", 0); },
      set(p) { if (!lens) api.init(); strokes.forEach((s, i) => (s.style.strokeDashoffset = lens[i] * (1 - clamp(p / 0.62)))); fill.setAttribute("opacity", clamp((p - 0.55) / 0.45)); },
      pointAt(p) { if (!lens) api.init(); return strokes[0].getPointAtLength(lens[0] * clamp(p / 0.62)); },
    };
    return api;
  }

  /* ---------- an abstract signature line (never a likeness) ---------- */
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  function scribble(seed) {
    const r = rng(seed * 9301 + 49297), pts = [];
    const loops = 5 + Math.floor(r() * 4), A = 34 + r() * 8, B = 14 + r() * 10, n = 3 + Math.floor(r() * 4), ph = r() * 6.28, sk = 0.7 + r() * 0.5;
    for (let i = 0; i <= 260; i++) { const t = (i / 260) * Math.PI * 2 * (loops / 2); pts.push([50 + A * Math.cos(t * 0.5) * 0.9 + B * Math.cos(t * n + ph), 50 + A * Math.sin(t * 0.5) * sk + B * Math.sin(t * n + ph) * 0.9]); }
    return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
  }
  const ARROW_SVG = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ARROW = `<span class="arrow-slide" aria-hidden="true"><span class="arrow-out">${ARROW_SVG}</span><span class="arrow-in">${ARROW_SVG}</span></span>`;
  const vlink = (href, label, cls = "vlink") => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}${ARROW}</a>`;

  /* ---------- count-up and scroll-lit words ---------- */
  function fmtNum(v, o) { return `${o.pre || ""}${o.dec ? v.toFixed(o.dec) : Math.round(v).toLocaleString("en-US")}${o.suf || ""}`; }
  function countTween(node, o, vars = {}) { // returns a tween (or sets the final value when motion is reduced)
    const to = +o.to, from = o.from == null ? 0 : +o.from, box = { v: from };
    if (reduce) { node.textContent = fmtNum(to, o); return null; }
    node.textContent = fmtNum(from, o);
    return gsap.to(box, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => (node.textContent = fmtNum(box.v, o)), ...vars });
  }
  function splitWords(node) { // wraps each word in a span, keeps <em> emphasis, leaves [data-count] alone
    const out = []; const walk = (n, emph) => { [...n.childNodes].forEach((c) => { if (c.nodeType === 3) { const frag = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w)); else { const s = document.createElement("span"); s.className = "w" + (emph ? " em" : ""); s.textContent = w; frag.appendChild(s); out.push(s); } }); c.replaceWith(frag); } else if (c.nodeType === 1 && !c.hasAttribute("data-count")) walk(c, emph || c.tagName === "EM"); }); };
    walk(node, false); return out;
  }

  /* ---------- the toolkit handed to story 2 ---------- */
  window.CWC = { root, reduce, data, atlas, SUN, TOP, PUB, HIATUS_LINE, C, S, US, fmt, worst, POOR, MINW, TOPH, followers, place, icon, prep, setDraw, sun, scribble, ARROW, vlink, el, div, clamp, esc, countTween, fmtNum, splitWords, NS };

  /* ====================== interactive maps ====================== */
  // Each map leads with the worst case (outlined), and answers hover or touch with that state's own figure and rank.
  const MAPS = {
    mental: { key: "mental", unit: "of adults report frequent mental distress", fmt: (v) => v + "%", src: "CDC PLACES (BRFSS) 2023: adults with 14 or more poor mental health days a month." },
    food: { key: "food", unit: "of adults faced food insecurity in the past year", fmt: (v) => v + "%", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    housing: { key: "housing", unit: "of adults faced housing insecurity in the past year", fmt: (v) => v + "%", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    poverty: { key: "poverty", unit: "of people live below the poverty line", fmt: (v) => v + "%", src: "U.S. Census Bureau, American Community Survey 2023." },
    uninsured: { key: "uninsured", unit: "of adults 18 to 64 have no health insurance", fmt: (v) => v + "%", src: "CDC PLACES (BRFSS) 2023, adults 18 to 64." },
    ratio: { key: "ratio", unit: "times more income for the top fifth of households than the bottom fifth", fmt: (v) => v.toFixed(1) + "×", src: "80th ÷ 20th percentile household income. U.S. Census Bureau, ACS 2023. Income, not wealth." },
    minwage: { key: "minwage", low: true, unit: "minimum wage an hour", fmt: (v) => "$" + v.toFixed(2), src: "Higher of state or federal minimum wage, 2025. Darker means lower." },
    student: { key: "student", unit: "average federal student loan per borrower", fmt: (v) => fmt.money(v), src: "Federal Student Aid data, about 2023, as charted by Axios." },
  };
  function interactiveMap(name) {
    const M = MAPS[name], key = M.key;
    const box = div("t-viz t-map");
    const W = 560, H = 340;
    const svg = d3.select(box).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", `Map of the United States. ${M.unit}, by state. Hover or tap a state.`);
    const feats = topojson.feature(atlas, atlas.objects.states).features.filter((f) => S[f.properties.name]);
    const path = d3.geoPath(d3.geoAlbersUsa().fitExtent([[2, 2], [W - 2, H - 2]], { type: "FeatureCollection", features: feats }));
    const vals = Object.values(S).map((s) => s[key]).filter((v) => v != null); const [lo, hi] = d3.extent(vals);
    const t = d3.scaleLinear().domain([lo, hi]).range(M.low ? [1, 0] : [0, 1]); const col = (v) => d3.interpolateRgb(C.PALE, C.BLUE)(t(v));
    const ranked = Object.entries(S).filter(([, s]) => s[key] != null).sort((a, b) => (M.low ? a[1][key] - b[1][key] : b[1][key] - a[1][key]));
    const rankOf = (n) => ranked.findIndex(([k]) => k === n) + 1;
    const [wn, ws] = ranked[0];
    const paths = svg.append("g").selectAll("path").data(feats).join("path").attr("d", path).attr("fill", C.GREY).attr("stroke", "#f1f0ec").attr("stroke-width", 0.8).style("cursor", "crosshair");
    const hl = svg.append("g").attr("pointer-events", "none");
    const readout = div("t-read"); readout.setAttribute("aria-live", "polite");
    const legend = div("t-legend", `<span>${M.low ? "Higher" : "Lower"}</span><i style="background:linear-gradient(90deg,${C.PALE},${C.BLUE})"></i><span>${M.low ? "Lower" : "Higher"}</span><span class="t-nodata"><b></b>No data</span>`);
    function outline(n, strong) {
      hl.selectAll("*").remove(); if (!n) return;
      const node = paths.filter((d) => d.properties.name === n).node(); if (!node) return; const dd = node.getAttribute("d");
      [["#f1f0ec", 4.5], [strong ? C.BLUE : C.INK, 2.2]].forEach(([c, w]) => hl.append("path").attr("d", dd).attr("fill", "none").attr("stroke", c).attr("stroke-width", w).attr("stroke-linejoin", "round"));
    }
    function show(n, isWorst) {
      const s = S[n]; if (!s || s[key] == null) { readout.innerHTML = `<b>${esc(n)}</b><span>No data for this measure</span>`; outline(n, false); return; }
      const r = rankOf(n);
      readout.innerHTML = `<b>${esc(n)}</b><strong>${M.fmt(s[key])}</strong><span>${M.unit}</span><small>${isWorst ? (M.low ? "The lowest" : "The highest") + " of " + ranked.length : ord(r) + (M.low ? " lowest" : " highest") + " of " + ranked.length}</small>`;
      outline(n, isWorst || r === 1);
    }
    const ties = ranked.filter(([, s2]) => s2[key] === ws[key]).length;
    function showDefault() { // lead with the worst case; if several states tie for it, say so instead of picking one
      if (ties > 1) { hl.selectAll("*").remove(); readout.innerHTML = `<b>${ties} states</b><strong>${M.fmt(ws[key])}</strong><span>${M.unit}</span><small>Tied for the lowest. Hover a state.</small>`; }
      else show(wn, true);
    }
    paths.on("pointerenter", (e, d) => show(d.properties.name, false)).on("pointerdown", (e, d) => show(d.properties.name, false)).on("pointerleave", showDefault);
    box.append(readout, legend);
    showDefault();
    return { el: box, worstName: wn, worstVal: ws[key], enter() {
      paths.transition().duration(reduce ? 0 : 1400).delay((d, i) => (reduce ? 0 : i * 14)).attr("fill", (d) => { const v = S[d.properties.name][key]; return v == null ? C.GREY : col(v); });
    } };
  }

  /* ====================== Story 1: The thread ====================== */
  function mountThread(host) {
    const wrap = div("thread"); host.appendChild(wrap);
    const T = TOP ? TOP.top : [], MORE = TOP && TOP.more ? TOP.more : [];
    const pick = (list, i) => list[i] || { title: "Stories that offer a path to care", author: "The writers", url: PUB };

    /* --- the moments: a writer, then the map that goes with the story --- */
    const pairs = [
      { s: pick(T, 1), map: "mental", lead: (p, n) => `In ${p}, ${n} of adults report frequent mental distress.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 3), map: "food", lead: (p, n) => `In ${p}, ${n} of adults faced food insecurity in the past year.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 5), map: "housing", lead: (p, n) => `In ${p}, ${n} of adults faced housing insecurity in the past year.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 0), map: "poverty", lead: (p, n) => `In ${p}, ${n} of people live below the poverty line. Across the country, it is one in eight.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 4), map: "uninsured", lead: (p, n) => `In ${p}, ${n} of working-age adults have no health insurance.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 2), map: "ratio", lead: (p, n) => `In ${p}, the top fifth of households earn ${n} what the bottom fifth does.`, num: (v) => ({ to: v, dec: 1, suf: "×" }) },
      { s: pick(T, 8), map: "minwage", lead: (p, n, extra) => `In ${extra} states, the minimum wage is still ${n} an hour. It has not changed since 2009.`, num: (v) => ({ to: v, dec: 2, pre: "$" }), minwage: true },
      { s: pick(MORE, 0), map: "student", lead: (p, n) => `In ${p}, borrowers owe an average of ${n} in federal student loans.`, num: (v) => ({ to: v, pre: "$" }) },
    ];
    const moments = [];
    pairs.forEach((pr) => {
      moments.push({ type: "voice", s: pr.s });
      const z = interactiveMap(pr.map);
      const c = pr.num(z.worstVal), textNum = fmtNum(c.to, c);
      const nStates = pr.minwage ? Object.values(S).filter((s) => s.minwage === z.worstVal).length : 0;
      const html = pr.lead(place(z.worstName), `<em data-count>${textNum}</em>`, nStates);
      moments.push({ type: "fact", html, count: c, viz: z, src: MAPS[pr.map].src, speak: null });
    });

    /* --- opening: it animates in on load, then the second sentence lights as you scroll --- */
    const intro = div("t-intro"); const sticky = div("t-sticky");
    const lit = document.createElement("p"); lit.className = "t-lit";
    lit.innerHTML = '<span class="t-a">Behind every number is <em>a person.</em></span> <span class="t-b">Coping With Capitalism exists to offer clear and accessible paths to <em>self and collective care.</em></span>';
    const cue = document.createElement("p"); cue.className = "t-cue"; cue.setAttribute("aria-hidden", "true"); cue.innerHTML = '<span>Scroll</span><i></i>';
    sticky.append(lit, cue); intro.appendChild(sticky); wrap.appendChild(intro);
    const wa = splitWords(lit.querySelector(".t-a")), wb = splitWords(lit.querySelector(".t-b"));
    const maskWords = (ws) => ws.forEach((w) => { const m = document.createElement("span"); m.className = "wm"; w.replaceWith(m); m.appendChild(w); });
    if (reduce) { wb.forEach((w) => (w.style.opacity = 1)); }
    else {
      maskWords(wa);
      gsap.set(wa, { yPercent: 110, opacity: 0, filter: "blur(10px)" }); gsap.set(wb, { opacity: 0, y: 14 }); gsap.set(cue, { opacity: 0 });
      gsap.timeline({ defaults: { ease: "expo.out" } })
        .to(wa, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.5, stagger: 0.11 }, 0.2)
        .to(wb, { opacity: 0.16, y: 0, duration: 1.1, stagger: 0.025 }, 1.2)
        .to(cue, { opacity: 1, duration: 0.9 }, 2.4);
      // as soon as you scroll, the second sentence lights word by word and the cue steps aside
      gsap.to(wb, { opacity: 1, ease: "none", stagger: 0.5, scrollTrigger: { trigger: intro, start: "top top", end: "bottom bottom", scrub: true } });
      gsap.to(cue, { opacity: 0, ease: "none", scrollTrigger: { trigger: intro, start: "top top", end: "+=140", scrub: true } });
    }

    /* --- the body: the line and the moments --- */
    const body = div("t-body"); wrap.appendChild(body);
    const lineSvg = el("svg", { class: "t-line", "aria-hidden": "true" });
    const ghost = el("path", { class: "t-ghost" }), threadPath = el("path", { class: "t-path" }), tip = el("g", { class: "t-tip" }, '<circle r="14" class="t-tip-ring"/><circle r="5.5" class="t-tip-dot"/>');
    lineSvg.append(ghost, threadPath, tip); body.appendChild(lineSvg);

    const enters = []; const nodes = [];
    moments.forEach((m, k) => {
      const side = k % 4 < 2 ? "left" : "right"; // a writer and its map share a side
      const d = div(`t-m ${side} ${m.type}`); const copy = div("t-copy");
      if (m.type === "voice") {
        const s = m.s; copy.innerHTML = `<svg class="t-sig" viewBox="0 0 100 100" aria-hidden="true"><path d="${scribble(k + 3)}"/></svg><h3 class="t-title">${esc(s.title)}</h3><p class="t-by">by ${esc(s.author)}</p><p class="t-meta">${vlink(s.url, "Read on Medium")}</p>`;
      } else {
        copy.innerHTML = `<p class="t-say">${m.html}</p>`; const media = div("t-media"); media.appendChild(m.viz.el); copy.appendChild(media); copy.insertAdjacentHTML("beforeend", `<p class="t-src">${m.src}</p>`); enters[k] = m.viz.enter;
      }
      d.appendChild(copy); body.appendChild(d); nodes.push(d);
    });

    /* --- the end: the line runs into the sun, outlines it, then it fills --- */
    const end = div("t-end"); const sn = sun("min(46vw, 320px)"); const sunWrap = div("t-sunwrap"); sunWrap.appendChild(sn.svg); end.appendChild(sunWrap);
    end.insertAdjacentHTML("beforeend", `<p class="t-close"><em data-n="${TOP ? TOP.totals.stories : 467}">${fmt.num(TOP ? TOP.totals.stories : 467)}</em> stories. <em data-n="${TOP ? TOP.totals.writers : 123}">${fmt.num(TOP ? TOP.totals.writers : 123)}</em> writers. <em data-n="${followers}" data-dec="1" data-suf="K">${followers.toFixed(1)}K</em> followers.</p><p class="t-close-sub">${HIATUS_LINE}</p>${vlink(PUB, "Read the publication", "vlink t-cta")}`);
    body.appendChild(end); sn.init();
    const closeNums = [...end.querySelectorAll("em[data-n]")];

    /* --- the rail: where you are, and a way to jump --- */
    const rail = document.createElement("nav"); rail.className = "t-rail"; rail.setAttribute("aria-label", "Jump to a moment");
    rail.innerHTML = moments.map((m, k) => `<button type="button" data-k="${k}" aria-label="${m.type === "voice" ? esc(m.s.title) : "Map " + (Math.floor(k / 2) + 1)}"><i></i></button>`).join("");
    document.body.appendChild(rail);
    const dots = [...rail.querySelectorAll("button")]; let active = -1;
    const setRail = (k) => dots.forEach((b, i) => b.classList.toggle("on", i === k));

    nodes.forEach((n, k) => {
      const copy = n.querySelector(".t-copy"), sig = n.querySelector(".t-sig path"), say1 = n.querySelector(".t-say"), fact1 = n.querySelector("[data-count]");
      let words = [];
      if (say1) words = splitWords(say1);
      if (sig) { const len = sig.getTotalLength(); sig.style.strokeDasharray = len; sig.style.strokeDashoffset = reduce ? 0 : len; }
      if (reduce) enters[k] && enters[k]();
      else {
        gsap.set(copy, { opacity: 0, y: 36 }); if (words.length) gsap.set(words, { opacity: 0.18 });
        ScrollTrigger.create({ trigger: n, start: "top 70%", once: true, onEnter: () => {
          gsap.to(copy, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" });
          if (sig) gsap.to(sig, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" });
          if (words.length) gsap.to(words, { opacity: 1, duration: 0.5, stagger: 0.035, ease: "power1.out" });
          if (fact1 && moments[k].count) countTween(fact1, moments[k].count, { delay: 0.3 });
          enters[k] && enters[k]();
        } });
        gsap.fromTo(copy, { yPercent: 4 }, { yPercent: -4, ease: "none", scrollTrigger: { trigger: n, start: "top bottom", end: "bottom top", scrub: true } });
      }
      ScrollTrigger.create({ trigger: n, start: "center 62%", end: "center 38%", onToggle: (s) => { if (s.isActive && k !== active) { active = k; setRail(k); } } });
    });
    if (reduce) closeNums.forEach((n) => (n.textContent = fmtNum(+n.dataset.n, { dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" })));
    else {
      closeNums.forEach((n) => (n.textContent = fmtNum(0, { dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" })));
      ScrollTrigger.create({ trigger: end, start: "top 40%", once: true, onEnter: () => closeNums.forEach((n, i) => countTween(n, { to: +n.dataset.n, dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" }, { delay: 0.1 * i, duration: 1.8 })) });
    }
    rail.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const n = nodes[+b.dataset.k]; const y = n.getBoundingClientRect().top + scrollY - innerHeight * 0.2; window.lenis ? window.lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: "smooth" }); });
    ScrollTrigger.create({ trigger: body, start: "top 70%", end: "bottom 30%", onToggle: (s) => rail.classList.toggle("show", s.isActive) });

    /* --- the line: it is drawn to the pen tip, which rides a fixed height on screen and, at the end, traces the sun --- */
    let geo = null;
    function sizeLine() {
      const bodyBox = body.getBoundingClientRect(), w = body.clientWidth, h = body.scrollHeight, small = w < 820; lineSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      // where the sun's outline begins, in body coordinates
      const sr = sn.svg.getBoundingClientRect(), k = sr.width / SUN.w;
      const sunX = sr.left - bodyBox.left, sunY = sr.top - bodyBox.top; const startPt = [sunX + sn.start.x * k, sunY + sn.start.y * k];
      const ys = nodes.map((n) => n.offsetTop + n.offsetHeight / 2), cx = small ? 20 : w * 0.5;
      const pts = [[cx, 0]];
      nodes.forEach((n, i) => { const left = n.classList.contains("left"); const x = small ? 20 + (i % 2 ? 8 : -2) : w * 0.5 + (left ? 1 : -1) * w * 0.045, y = ys[i];
        pts.push([small ? 20 + (i % 2 ? -6 : 6) : w * 0.5 + (left ? -1 : 1) * w * 0.012, y - 120]); pts.push([x, y]); pts.push([cx, y + 120]); });
      pts.push([cx, startPt[1] - 160]); pts.push(startPt);
      const dstr = d3.line().curve(d3.curveCatmullRom.alpha(0.6))(pts); ghost.setAttribute("d", dstr); threadPath.setAttribute("d", dstr);
      const len = threadPath.getTotalLength(); threadPath.style.strokeDasharray = len;
      // y -> length lookup, so the tip can sit at a fixed height on screen
      const N = 900, Ls = [], Ys = []; let maxY = -1;
      for (let i = 0; i <= N; i++) { const L = (i / N) * len, p = threadPath.getPointAtLength(L); maxY = Math.max(maxY, p.y); Ls.push(L); Ys.push(maxY); }
      const lenAtY = (y) => { let a = 0, b = N; while (a < b) { const m = (a + b) >> 1; if (Ys[m] < y) a = m + 1; else b = m; } return Ls[a]; };
      geo = { len, lenAtY, startY: startPt[1], sunH: sr.height, sunTop: sunY, sunX, k };
      update();
    }
    function update() {
      if (!geo) return;
      const bodyTop = body.getBoundingClientRect().top + scrollY, tipY = scrollY - bodyTop + innerHeight * 0.6;
      if (reduce) { threadPath.style.strokeDashoffset = 0; sn.set(1); tip.style.opacity = 0; return; }
      const L = clamp(geo.lenAtY(tipY), 0, geo.len);
      threadPath.style.strokeDashoffset = geo.len - L;
      // the sun: once the line arrives, the outline draws, then it fills
      const s = clamp((tipY - geo.startY) / (geo.sunH * 0.95));
      sn.set(s);
      if (s > 0 && s < 0.62) { const pt = sn.pointAt(s); tip.setAttribute("transform", `translate(${geo.sunX + pt.x * geo.k},${geo.sunTop + pt.y * geo.k})`); tip.style.opacity = 1; }
      else if (s === 0 && L > 2 && L < geo.len - 1) { const pt = threadPath.getPointAtLength(L); tip.setAttribute("transform", `translate(${pt.x},${pt.y})`); tip.style.opacity = 1; }
      else tip.style.opacity = 0;
    }
    ScrollTrigger.create({ trigger: body, start: "top bottom", end: "bottom top", onUpdate: update, onRefresh: update });
    document.fonts && document.fonts.ready.then(() => { sizeLine(); });
    sizeLine(); const ro = new ResizeObserver(() => { clearTimeout(ro.__t); ro.__t = setTimeout(() => { sizeLine(); ScrollTrigger.refresh(); }, 200); }); ro.observe(body);
    return () => { ro.disconnect(); rail.remove(); };
  }

  /* ---------- registry, switcher bar ---------- */
  const STORIES = [{ name: "The thread", mount: mountThread }, ...(window.CWC_STORIES || [])];
  let cur = clamp((parseInt(new URLSearchParams(location.search).get("c"), 10) || 1) - 1, 0, STORIES.length - 1), ctx = null, cleanup = null;
  function build(i) {
    if (ctx) ctx.revert(); if (cleanup) cleanup(); root.innerHTML = ""; root.className = "story"; root.removeAttribute("style");
    cur = i; const u = new URL(location.href); u.searchParams.set("c", i + 1); history.replaceState(null, "", u);
    ctx = gsap.context(() => { cleanup = STORIES[i].mount(root) || null; }, root);
    document.querySelectorAll(".story-bar a").forEach((a, n) => (n === i ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    ScrollTrigger.sort(); ScrollTrigger.refresh();
  }
  const chev = (d) => `<button type="button" class="sb-nav" data-d="${d}" aria-label="${d < 0 ? "Previous" : "Next"} story"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="${d < 0 ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  const bar = document.createElement("nav"); bar.className = "story-bar show"; bar.setAttribute("aria-label", "Scroll stories");
  bar.innerHTML = chev(-1) + STORIES.map((c, n) => `<a href="?c=${n + 1}" data-i="${n}"><i>${n + 1}</i><span>${c.name}</span></a>`).join("") + chev(1);
  document.body.appendChild(bar);
  let wiping = false;
  function go(i) {
    i = (i + STORIES.length) % STORIES.length; if (i === cur || wiping) return;
    if (reduce) { build(i); return window.scrollTo(0, 0); }
    wiping = true; const cv = div("curtain"); document.body.appendChild(cv); gsap.set(cv, { clipPath: "circle(0% at 50% 100%)" });
    gsap.timeline({ onComplete: () => { cv.remove(); wiping = false; } })
      .to(cv, { clipPath: "circle(150% at 50% 100%)", duration: 0.7, ease: "power3.inOut" })
      .add(() => { build(i); window.lenis ? window.lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0); ScrollTrigger.update(); })
      .to(cv, { clipPath: "circle(0% at 50% 0%)", duration: 0.8, ease: "power3.inOut" }, "+=0.15");
  }
  bar.addEventListener("click", (e) => { const n = e.target.closest(".sb-nav"); if (n) return go(cur + +n.dataset.d); const a = e.target.closest("a"); if (!a) return; e.preventDefault(); go(+a.dataset.i); });
  window.addEventListener("keydown", (e) => { if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || document.querySelector("dialog[open]")) return; if (e.key === "]") go(cur + 1); else if (e.key === "[") go(cur - 1); });
  build(cur);
  document.fonts && document.fonts.ready.then(() => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
})();
