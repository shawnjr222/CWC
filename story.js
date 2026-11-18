/* Two scroll stories about life under capitalism. Both end with the blue sun logo: in "The thread" the line itself runs down into the sun,
   traces its outline, and then the sun fills in.
   Core: data, helpers, the sun, the line illustrations, the switcher. Story 1 (The thread) lives here; story 2 (Kinetic type) in concepts.js.
   References: Gladeye's Listen to America (one line, many voices) and Apple's product pages (sticky storytelling, scroll-lit text, count-ups, clean stops). */
(async function () {
  const root = document.getElementById("story");
  if (!root || !window.gsap || !window.ScrollTrigger || !window.d3 || !window.topojson) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [data, atlas, SUN, TOP] = await Promise.all([d3.json("assets/data/states.json?d=4"), d3.json("assets/data/states-10m.json"), d3.json("assets/data/sun.json"), d3.json("assets/data/medium-top10.json").catch(() => null)]);

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
    let lens = null, last = -1;
    const api = { svg, start, outer: strokes[0],
      init() { lens = strokes.map((s) => { const L = s.getTotalLength(); s.style.strokeDasharray = L; s.style.strokeDashoffset = L; return L; }); fill.setAttribute("opacity", 0); last = -1; },
      // the strokes draw one after another, the outer outline first (it is the one the thread arrives at), then the rest; all done by p = 0.62, then the fill
      set(p) { if (!lens) api.init(); p = clamp(p); if (p === last) return; last = p; const tot = lens.reduce((a, b) => a + b, 0); let c = 0; strokes.forEach((s, i) => { const w = (lens[i] / tot) * 0.62; s.style.strokeDashoffset = lens[i] * (1 - clamp((p - c) / w)); c += w; }); const f = clamp((p - 0.55) / 0.45); fill.setAttribute("opacity", f * f * (3 - 2 * f)); },
      pointAt(p) { if (!lens) api.init(); const tot = lens.reduce((a, b) => a + b, 0), w = (lens[0] / tot) * 0.62; return strokes[0].getPointAtLength(lens[0] * clamp(p / w)); },
    };
    return api;
  }

  /* ---------- one continuous line per story, drawn from its title: simple shapes, a little hand-drawn (100 x 100) ---------- */
  const ART = [
    [/laid off/i, "M64 46 L70 20 L44 16 L38 44 M16 50 L50 38 L84 50 L50 62 L16 50 L16 84 L50 96 L84 84 L84 50 M50 62 L50 96"],
    [/bread/i, "M10 62 C8 40 26 26 50 26 C74 26 92 40 90 62 C89 70 85 74 80 74 L80 84 C80 87 78 89 75 89 L25 89 C22 89 20 87 20 84 L20 74 C15 74 11 70 10 62 M28 46 C34 42 38 50 38 58 M46 42 C52 38 56 46 56 54 M64 46 C70 42 74 50 74 56"],
    [/housing costs/i, "M18 88 L18 50 L50 20 L64 33 L64 24 L73 24 L73 41 L82 50 L82 88 L18 88 L40 88 L40 66 L58 66 L58 88"],
    [/you.?re poor/i, "M55 46 C50 42 43 44 44 49 C45 53 55 51 56 56 C57 61 49 61 44 58 M50 64 L50 40 M39 52 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 M8 74 L92 70 L94 30 L6 34 L8 74", [0, 1]],
    [/self-help/i, "M58 50 L42 50 M42 46 L58 46 L58 40 C62 36 64 32 64 28 C64 20 58 14 50 14 C42 14 36 20 36 28 C36 32 38 36 42 40 L42 46 M50 64 L50 96 C60 90 74 88 88 92 L88 58 C74 54 60 56 50 64 C40 56 26 54 12 58 L12 92 C26 88 40 90 50 96"],
    [/neo-feudal/i, "M16 80 L12 32 L34 54 L50 22 L66 54 L88 32 L84 80 L16 80 L15 66 L85 66"],
    [/no work/i, "M18 86 L24 92 L58 58 L46 46 L60 30 L90 60 L74 76 L64 66 L58 58 L52 52 L18 86"],
    [/internship/i, "M12 36 L38 36 L38 24 L62 24 L62 36 L88 36 L88 84 L12 84 L12 36 L12 58 L88 58 L88 36 L12 84"],
  ];
  const ART_FALLBACK = "M50 18 C72 18 84 34 82 54 C80 74 62 84 46 82 C28 80 16 64 20 46 C24 28 38 20 50 18";
  let measureSvg = null; const sketchCache = new Map();
  /* sample the strokes (every "M" is a lift of the pen, bridged by a straight stroke) and let the pen wander a little: returns [x, y] points in the 100 box */
  function sketch(title, flip) {
    const key = title + (flip ? "|f" : ""); if (sketchCache.has(key)) return sketchCache.get(key);
    if (!measureSvg) { measureSvg = el("svg", { "aria-hidden": "true" }); measureSvg.style.cssText = "position:absolute;width:0;height:0;visibility:hidden;pointer-events:none"; document.body.appendChild(measureSvg); }
    const hit = ART.find(([re]) => re.test(title)), d = hit ? hit[1] : ART_FALLBACK, keep = (hit && hit[2]) || [], raw = [];
    d.split("M").filter(Boolean).forEach((part, pi) => {
      const p = el("path", { d: "M" + part }); measureSvg.appendChild(p); const L = p.getTotalLength(), n = Math.max(12, Math.round(L / 1.3)), pts = [];
      for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((i / n) * L); pts.push([q.x, q.y]); }
      measureSvg.removeChild(p);
      if (flip) { // mirror the picture so it starts on the side facing the thread, but never mirror a symbol (a "$" must stay a "$")
        const xs = pts.map((q) => q[0]), c = Math.min(...xs) + Math.max(...xs);
        pts.forEach((q) => { q[0] = keep.includes(pi) ? 100 - (c - q[0]) : 100 - q[0]; });
      }
      raw.push(...pts);
    });
    const dense = [raw[0]]; for (let i = 1; i < raw.length; i++) { const A = raw[i - 1], B = raw[i], m = Math.max(1, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / 1.4)); for (let k = 1; k <= m; k++) dense.push([A[0] + ((B[0] - A[0]) * k) / m, A[1] + ((B[1] - A[1]) * k) / m]); }
    const ph = (title.length * 1.7) % 6.28; let l = 0; const out = dense.map((q, i) => { if (i) l += Math.hypot(q[0] - dense[i - 1][0], q[1] - dense[i - 1][1]); const w = (v) => Math.sin(l * 0.1 + v) * 0.6 + Math.sin(l * 0.29 + v * 1.9) * 0.25; return [q[0] + w(ph) * 0.6, q[1] + w(ph + 2.1) * 0.6]; });
    sketchCache.set(key, out); return out;
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
  window.CWC = { sketch, root, reduce, data, atlas, SUN, TOP, PUB, HIATUS_LINE, C, S, US, fmt, worst, POOR, MINW, TOPH, followers, place, icon, prep, setDraw, sun, scribble, ARROW, vlink, el, div, clamp, esc, countTween, fmtNum, splitWords, NS };

  /* ====================== interactive maps ====================== */
  // Each map leads with the worst case (outlined), and answers hover or touch with that state's own figure and rank.
  const MAPS = {
    mental: { key: "mental", unit: "of adults report frequent mental distress", fmt: (v) => v + "%", src: "CDC PLACES (BRFSS) 2023: adults with 14 or more poor mental health days a month." },
    food: { key: "food", unit: "of adults faced food insecurity in the past year", fmt: (v) => v + "%", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    housing: { key: "housing", unit: "of adults faced housing insecurity in the past year", fmt: (v) => v + "%", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    poverty: { key: "poverty", unit: "of people live below the poverty line", fmt: (v) => v + "%", src: "U.S. Census Bureau, American Community Survey 2025 (1-year)." },
    disability: { key: "disability", unit: "of adults report a disability", fmt: (v) => v.toFixed(1) + "%", src: "CDC PLACES (BRFSS) 2023: adults reporting a hearing, vision, cognitive, mobility, self-care or independent-living disability. Gray states have no data." },
    ratio: { key: "ratio", unit: "times more income for the top fifth of households than the bottom fifth", fmt: (v) => v.toFixed(1) + "×", src: "80th ÷ 20th percentile household income. U.S. Census Bureau, ACS 2025 (1-year). Income, not wealth." },
    minwage: { key: "minwage", low: true, unit: "minimum wage an hour", fmt: (v) => "$" + v.toFixed(2), src: "Higher of state or federal minimum wage, as of November 2026 (U.S. Department of Labor). Darker means lower." },
    student: { key: "student", unit: "average federal student loan per borrower", fmt: (v) => fmt.money(v), src: "Federal Student Aid data, about 2023: state averages as charted by Axios; U.S. average from Federal Student Aid, end of 2023." },
  };
  let GEO = null;
  function interactiveMap(name) {
    const M = MAPS[name], key = M.key;
    const box = div("t-viz t-map");
    const W = 560, H = 340;
    const svg = d3.select(box).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", `Map of the United States. ${M.unit}, by state. Hover or tap a state.`);
    if (!GEO) { const fs = topojson.feature(atlas, atlas.objects.states).features.filter((f) => S[f.properties.name]); const pg = d3.geoPath(d3.geoAlbersUsa().fitExtent([[2, 2], [W - 2, H - 2]], { type: "FeatureCollection", features: fs })); GEO = { feats: fs, d: new Map(fs.map((f) => [f.properties.name, pg(f)])) }; }
    const feats = GEO.feats, path = (f) => GEO.d.get(f.properties.name);
    const vals = Object.values(S).map((s) => s[key]).filter((v) => v != null); const [lo, hi] = d3.extent(vals);
    const t = d3.scaleLinear().domain([lo, hi]).range(M.low ? [1, 0] : [0, 1]); const col = (v) => d3.interpolateRgb(C.PALE, C.BLUE)(t(v));
    const ranked = Object.entries(S).filter(([, s]) => s[key] != null).sort((a, b) => (M.low ? a[1][key] - b[1][key] : b[1][key] - a[1][key]));
    const rankOf = (n) => { const v = S[n][key]; return 1 + ranked.filter(([, s2]) => (M.low ? s2[key] < v : s2[key] > v)).length; }; // ties share a rank
    const tiedWith = (n) => ranked.filter(([, s2]) => s2[key] === S[n][key]).length;
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
      readout.innerHTML = `<b>${esc(n)}</b><strong>${M.fmt(s[key])}</strong><span>${M.unit}</span><small>${(tiedWith(n) > 1 ? "Tied for " : "") + (r === 1 ? (tiedWith(n) > 1 ? "the " : "The ") + (M.low ? "lowest" : "highest") : ord(r) + (M.low ? " lowest" : " highest")) + " of " + ranked.length}</small>`;
      outline(n, isWorst || r === 1);
    }
    const ties = ranked.filter(([, s2]) => s2[key] === ws[key]).length;
    function showDefault() { // lead with the worst case; if several states tie for it, say so instead of picking one
      if (ties > 1) { hl.selectAll("*").remove(); ranked.slice(0, ties).forEach(([nm]) => { const dd = paths.filter((d) => d.properties.name === nm).node().getAttribute("d"); hl.append("path").attr("d", dd).attr("fill", "none").attr("stroke", C.BLUE).attr("stroke-width", 1.8).attr("stroke-linejoin", "round"); }); readout.innerHTML = `<b>${ties} states</b><strong>${M.fmt(ws[key])}</strong><span>${M.unit}</span><small>Tied for the lowest. Hover a state.</small>`; }
      else show(wn, true);
    }
    paths.on("pointerenter", (e, d) => show(d.properties.name, false)).on("pointerdown", (e, d) => show(d.properties.name, false)).on("pointerleave", showDefault);
    box.append(legend, readout);
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
    const pairs = [ // most pressing first: poverty, then the essentials, then mental health, then wages and inequality, then debt
      { s: pick(T, 0), map: "poverty", nat: US.poverty, lead: (p, n) => `${n} of people in the U.S. live below the poverty line.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 3), map: "food", nat: US.food, lead: (p, n) => `${n} of adults in the U.S. faced food insecurity in the past year.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 5), map: "housing", nat: US.housing, lead: (p, n) => `${n} of adults in the U.S. faced housing insecurity in the past year.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 4), map: "disability", nat: US.disability, lead: (p, n) => `${n} of adults in the U.S. report a disability.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 1), map: "mental", nat: US.mental, lead: (p, n) => `${n} of adults in the U.S. report frequent mental distress.`, num: (v) => ({ to: v, dec: 1, suf: "%" }) },
      { s: pick(T, 8), map: "minwage", lead: (p, n, extra) => `In ${extra} states, the minimum wage is still ${n} an hour. It has not changed since 2009.`, num: (v) => ({ to: v, dec: 2, pre: "$" }), minwage: true },
      { s: pick(T, 2), map: "ratio", nat: US.ratio, lead: (p, n) => `In the U.S., the top fifth of households earn ${n} what the bottom fifth does.`, num: (v) => ({ to: v, dec: 1, suf: "×" }) },
      { s: pick(MORE, 0), map: "student", nat: US.student, lead: (p, n) => `In the U.S., federal student loan borrowers owe an average of ${n}.`, num: (v) => ({ to: v, pre: "$" }) },
    ];
    const TAGS = { poverty: "People living below the poverty line", food: "Food insecurity", housing: "Housing insecurity", disability: "Adults living with a disability", mental: "Frequent mental distress", minwage: "The $7.25 minimum wage", ratio: "Income inequality", student: "Student loan debt" };
    const moments = [], issues = [];
    pairs.forEach((pr) => {
      const z = interactiveMap(pr.map);
      const c = pr.num(pr.nat != null ? pr.nat : z.worstVal), textNum = fmtNum(c.to, c); // the headline is the national figure; the map and readout still lead with the worst state
      const nStates = pr.minwage ? Object.values(S).filter((s) => s.minwage === z.worstVal).length : 0;
      const html = pr.lead(place(z.worstName), `<em data-count data-final="${textNum}">${textNum}</em>`, nStates);
      const val = MAPS[pr.map].fmt(z.worstVal), nm = z.worstName;
      issues.push({ tag: TAGS[pr.map], stat: pr.minwage ? `${nStates} states are stuck at ${val} an hour` : pr.map === "ratio" ? `${nm} has the widest gap, ${val}` : pr.map === "student" ? `${nm} has the highest average balance, ${val}` : `${nm} is highest, at ${val}` });
      moments.push({ type: "fact", html, count: c, viz: z, src: MAPS[pr.map].src, speak: null }); // the statistic first,
      moments.push({ type: "voice", s: pr.s }); // then the Medium story that goes with it
    });

    /* --- opening: it animates in on load, then the second sentence lights as you scroll --- */
    // the headline is already on the page (and has already played); adopt it so the layout is the same and nothing flashes
    const intro = root.querySelector(".t-intro"); wrap.insertBefore(intro, wrap.firstChild);
    { // the scroll cue's line grows down with the scroll until it meets the start of the thread, so the two are one line
      const cueLine = intro.querySelector(".t-cue i"), pin = intro.querySelector(".t-sticky");
      if (cueLine && !reduce) {
        const reach = () => { const a = pin.getBoundingClientRect(), b = cueLine.getBoundingClientRect(); return a.height - (b.top - a.top); };
        gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: intro, start: "top top", end: () => "+=" + Math.max(1, intro.offsetHeight - innerHeight), scrub: true, invalidateOnRefresh: true, onUpdate: (self) => intro.classList.toggle("scrolled", self.progress > 0.012) } })
          .fromTo(cueLine, { height: 36 }, { height: reach, onUpdate() { cueLine.style.setProperty("--keep", Math.min(1, this.progress() / 0.5) * 100 + "%"); } }, 0); // solid, like the thread, by the time it is half grown
      }
    }
    let introTl = null;

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
        const s = m.s; d.appendChild(div("t-art")); copy.innerHTML = `<h3 class="t-title">${esc(s.title)}</h3><p class="t-by">by ${esc(s.author)}</p><p class="t-meta">${vlink(s.url, "Read on Medium")}</p>`;
      } else {
        copy.innerHTML = `<p class="t-say">${m.html}</p>`; const media = div("t-media"); media.appendChild(m.viz.el); copy.appendChild(media); copy.insertAdjacentHTML("beforeend", `<p class="t-src">${m.src}</p>`); enters[k] = m.viz.enter;
      }
      d.appendChild(copy); body.appendChild(d); nodes.push(d);
    });

    /* --- the end: the line runs into the sun, outlines it, then it fills --- */
    const end = div("t-end"); const sn = sun("min(40vw, 236px)"); sn.svg.style.transformOrigin = `${(sn.start.x / SUN.w) * 100}% ${(sn.start.y / SUN.h) * 100}%`; const sunWrap = div("t-sunwrap"); sunWrap.appendChild(sn.svg); end.appendChild(sunWrap);
    end.insertAdjacentHTML("beforeend", `<p class="t-close"><span class="t-l1"><em data-n="${TOP ? TOP.totals.stories : 467}">${fmt.num(TOP ? TOP.totals.stories : 467)}</em> stories. <em data-n="${TOP ? TOP.totals.writers : 123}">${fmt.num(TOP ? TOP.totals.writers : 123)}</em> writers.</span> <span class="t-l2"><em data-n="${followers}" data-dec="1" data-suf="K">${followers.toFixed(1)}K</em> followers.</span></p><p class="t-close-sub">${HIATUS_LINE}</p>${vlink(PUB, "Read the publication", "vlink t-cta")}`);
    body.appendChild(end); sn.init();
    const closeNums = [...end.querySelectorAll("em[data-n]")];

    /* --- the rail: a dot per moment. One label grows out of the dot you hover and glides from dot to dot; a click glides you there --- */
    const rail = document.createElement("nav"); rail.className = "t-rail"; rail.setAttribute("aria-label", "Jump to a moment");
    const labelFor = (k) => { const is = issues[k >> 1], m = moments[k]; return m.type === "voice" ? { tag: m.s.title, sub: `Story by ${m.s.author} · ${is.tag}` } : { tag: is.tag, sub: `Map: ${is.stat}` }; };
    rail.innerHTML = moments.map((m, k) => { const l = labelFor(k); return `<button type="button" data-k="${k}" aria-label="${esc(l.tag)}: ${esc(l.sub)}"><i></i></button>`; }).join("") + '<div class="t-pop" aria-hidden="true"><div class="t-pop-in"></div></div>';
    document.body.appendChild(rail);
    const pop = rail.querySelector(".t-pop"), popIn = pop.firstElementChild; let popK = -1, popHide = null;
    const showPop = (k) => {
      clearTimeout(popHide); const b = dots[k], l = labelFor(k);
      if (popK !== k) { popIn.innerHTML = `<b>${esc(l.tag)}</b><small>${esc(l.sub)}</small>`; popIn.classList.remove("swap"); void popIn.offsetWidth; popIn.classList.add("swap"); }
      const wasOpen = pop.classList.contains("open");
      if (!wasOpen) { pop.classList.add("snap"); pop.style.setProperty("--y", b.offsetTop + b.offsetHeight / 2 + "px"); void pop.offsetWidth; pop.classList.remove("snap"); } // start at this dot, not where it last closed
      pop.style.setProperty("--y", b.offsetTop + b.offsetHeight / 2 + "px"); pop.style.setProperty("--w", Math.ceil(popIn.offsetWidth) + "px"); pop.style.setProperty("--h", Math.ceil(popIn.offsetHeight) + "px");
      pop.classList.add("open"); popK = k;
    };
    const hidePop = () => { clearTimeout(popHide); popHide = setTimeout(() => { pop.classList.remove("open"); popK = -1; }, 90); };
    const dots = [...rail.querySelectorAll("button")]; let active = -1;
    const setRail = (k) => dots.forEach((b, i) => b.classList.toggle("on", i === k));
    const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const glide = (y) => { const d = Math.abs(y - scrollY), dur = Math.min(2.6, Math.max(1.1, 0.9 + (d / innerHeight) * 0.28)); if (window.lenis) window.lenis.scrollTo(y, { duration: dur, easing: easeIO, lock: false }); else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" }); };
    const jump = (y) => glide(y);
    const coarse = matchMedia("(hover: none)").matches;
    rail.addEventListener("pointerover", (e) => { const b = e.target.closest("button"); if (b && !coarse) showPop(+b.dataset.k); });
    rail.addEventListener("pointerleave", () => { if (!coarse) hidePop(); });
    rail.addEventListener("focusin", (e) => { const b = e.target.closest("button"); if (b) showPop(+b.dataset.k); });
    rail.addEventListener("focusout", hidePop);
    rail.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return; const k = +b.dataset.k;
      if (coarse && popK !== k) return showPop(k); // on touch, the first tap shows the label and a second tap goes there
      const n = nodes[k]; jump(n.getBoundingClientRect().top + scrollY + n.offsetHeight / 2 - innerHeight * 0.5); hidePop();
    });
    document.addEventListener("pointerdown", (e) => { if (!rail.contains(e.target)) { clearTimeout(popHide); pop.classList.remove("open"); popK = -1; } });

    nodes.forEach((n, k) => {
      const copy = n.querySelector(".t-copy"), sigs = [...n.querySelectorAll(".t-sig path")], say1 = n.querySelector(".t-say"), fact1 = n.querySelector("[data-count]");
      let words = [];
      if (say1) words = splitWords(say1);
      sigs.forEach((sg) => { const len = sg.getTotalLength(); sg.style.strokeDasharray = len; sg.style.strokeDashoffset = reduce ? 0 : len; });
      if (reduce) enters[k] && enters[k]();
      else {
        gsap.set(copy, { opacity: 0, y: 36 }); if (words.length) gsap.set(words, { opacity: 0.18 });
        ScrollTrigger.create({ trigger: n, start: "top 70%", once: true, onEnter: () => {
          gsap.to(copy, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" });
          if (sigs.length) gsap.to(sigs, { strokeDashoffset: 0, duration: 1.5, stagger: 0.28, ease: "power2.inOut" });
          if (words.length) gsap.to(words, { opacity: 1, duration: 0.5, stagger: 0.035, ease: "power1.out" });
          if (fact1 && moments[k].count) countTween(fact1, moments[k].count, { delay: 0.3 });
          enters[k] && enters[k]();
        } });
        gsap.fromTo(copy, { yPercent: 4 }, { yPercent: -4, ease: "none", scrollTrigger: { trigger: n, start: "top bottom", end: "bottom top", scrub: true } });
      }
      ScrollTrigger.create({ trigger: n, start: "center 62%", end: "center 38%", onToggle: (s) => { if (s.isActive && k !== active) { active = k; setRail(k); } } });
    });
    closeNums.forEach((n) => (n.dataset.final = n.textContent));
    /* every number that counts up keeps the width of its final value from the start, so the words around it never move while it counts */
    const countEls = [...wrap.querySelectorAll("em[data-count], .t-close em[data-n]"), ...document.querySelectorAll(".t-end em[data-n]")].filter((e, i, a) => a.indexOf(e) === i);
    const reserveNums = () => countEls.forEach((e) => { const cur = e.textContent; e.style.width = ""; e.textContent = e.dataset.final || cur; e.style.width = Math.ceil(e.getBoundingClientRect().width) + "px"; e.textContent = cur; });
    if (reduce) closeNums.forEach((n) => (n.textContent = fmtNum(+n.dataset.n, { dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" })));
    else {
      closeNums.forEach((n) => (n.textContent = fmtNum(0, { dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" })));
      ScrollTrigger.create({ trigger: end, start: "top 40%", once: true, onEnter: () => closeNums.forEach((n, i) => countTween(n, { to: +n.dataset.n, dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" }, { delay: 0.1 * i, duration: 1.8 })) });
    }
    reserveNums(); document.fonts && document.fonts.ready.then(reserveNums);
    ScrollTrigger.create({ trigger: body, start: "top 70%", end: "bottom 30%", onToggle: (s) => rail.classList.toggle("show", s.isActive) });

    /* --- the line: it is drawn to the pen tip, which rides a fixed height on screen and, at the end, traces the sun --- */
    let geo = null, bodyTopY = 0, tipVis = -1, lastL = -1;
    const measure = () => { bodyTopY = body.getBoundingClientRect().top + scrollY; };
    function sizeLine() {
      measure();
      const bodyBox = body.getBoundingClientRect(), w = body.clientWidth, h = body.scrollHeight, small = w < 820; lineSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      // where the sun's outline begins, in body coordinates
      const sr = sn.svg.getBoundingClientRect(), k = sr.width / SUN.w;
      const sunX = sr.left - bodyBox.left, sunY = sr.top - bodyBox.top; const startPt = [sunX + sn.start.x * k, sunY + sn.start.y * k];
      const ys = nodes.map((n) => n.offsetTop + n.offsetHeight / 2), cx = small ? 20 : w * 0.5;
      const curve = d3.line().curve(d3.curveCatmullRom.alpha(0.6)), tmp = el("path"), vh = innerHeight;
      // the line is built from small pieces (curves, and each story's drawing); we keep a dense [length, x, y] table of it as we go,
      // so asking "where is the pen" never has to walk one enormous path
      const segs = [], arts = [], T = []; let cur = small ? [[w / 2, 0], [w / 2, 70]] : [[cx, 0]], first = true, Lacc = 0;
      const addCurve = (pts) => { const dd = curve(pts); segs.push(first ? dd : dd.replace(/^M/, "L")); first = false; tmp.setAttribute("d", dd); const Lc = tmp.getTotalLength(), m = Math.max(2, Math.ceil(Lc / 5)); for (let i = T.length ? 1 : 0; i <= m; i++) { const q = tmp.getPointAtLength((Lc * i) / m); T.push([Lacc + (Lc * i) / m, q.x, q.y]); } Lacc += Lc; };
      nodes.forEach((n, i) => {
        const art = moments[i].type === "voice" ? n.querySelector(".t-art") : null;
        if (art) { // leave the line, sketch the story's picture in one stroke, come back
          const r = art.getBoundingClientRect(), a = { x: r.left - bodyBox.left, y: r.top - bodyBox.top, w: r.width, h: r.height };
          const flip = !small && a.x + a.w / 2 < cx;
          const px = sketch(moments[i].s.title, flip).map(([x, y]) => [a.x + x * a.w / 100, a.y + y * a.h / 100]);
          const s0 = px[0], e0 = px[px.length - 1];
          const ay0 = Math.max(a.y - a.h * 1.25, cur[cur.length - 1][1] + 70), sx = small && !T.length ? w / 2 : cx; cur.push([sx, ay0]); addCurve(cur); // travel ends well above the picture
          const A0 = Lacc, i0 = T.length - 1;
          addCurve([[sx, ay0], [(sx + s0[0]) / 2, (ay0 + s0[1]) / 2 - 20], s0]);
          segs.push("L" + px.slice(1).map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"));
          for (let j = 1; j < px.length; j++) { Lacc += Math.hypot(px[j][0] - px[j - 1][0], px[j][1] - px[j - 1][1]); T.push([Lacc, px[j][0], px[j][1]]); }
          arts.push({ i0, i1: T.length - 1, from: a.y + a.h / 2 - vh * 0.5 });
          const exitY = Math.max(a.y + a.h * 1.1 + 50, e0[1] + 100);
          cur = [e0, [(cx + e0[0]) / 2, e0[1] + 44], [cx, exitY]];
        } else {
          const left = n.classList.contains("left"); const x = small ? 20 + (i % 2 ? 8 : -2) : w * 0.5 + (left ? 1 : -1) * w * 0.045, y = ys[i];
          cur.push([small ? 20 + (i % 2 ? -6 : 6) : w * 0.5 + (left ? -1 : 1) * w * 0.012, y - 120], [x, y], [cx, y + 120]);
        }
      });
      { // the last stretch drops straight into the top of the sun; never down past it and back up, which would make a hook
        const lastY = cur[cur.length - 1][1], mid = Math.max(lastY + 40, startPt[1] - 160);
        if (mid < startPt[1] - 30) cur.push([cx, mid]); else if (lastY > startPt[1] - 30) cur.pop();
        cur.push(startPt); addCurve(cur);
      }
      threadPath.setAttribute("d", segs.join(" ")); ghost.removeAttribute("d"); // the route ahead stays hidden until the pen draws it
      const len = threadPath.getTotalLength(); threadPath.style.strokeDasharray = len; const sc = len / Lacc; T.forEach((q) => (q[0] *= sc));
      // scroll position -> length. Travel follows the path's own height; each drawing gets its own stretch of scroll, as much as it can
      // have without the pen ever rising above the middle of the screen (or sinking below the bottom edge).
      const M = T.length, Ys = new Array(M); let Y = 0, ai = 0;
      for (let i = 0; i < M; i++) {
        const p = T[i], ds = i ? p[0] - T[i - 1][0] : 0, art = arts.find((q) => i > q.i0 && i <= q.i1);
        if (art) {
          if (art.ya == null) {
            art.ya = Math.max(Y, Math.min(art.from, T[art.i0][2] + vh * 0.04)); art.Lb = T[art.i0][0]; art.Le = T[art.i1][0]; let sp = vh * 0.5;
            for (let j = art.i0 + 1; j <= art.i1; j++) { const f = (T[j][0] - art.Lb) / (art.Le - art.Lb); if (f > 0.02) sp = Math.min(sp, (T[j][2] + vh * 0.04 - art.ya) / f); }
            art.span = Math.max(sp, vh * 0.14);
          }
          Y = Math.max(Y + ds * 0.12, art.ya + ((p[0] - art.Lb) / (art.Le - art.Lb)) * art.span, p[2] - vh * 0.34); // always advancing, so no stretch of the drawing is ever skipped
        } else Y = Math.max(Y + ds * 0.25, p[2]);
        Ys[i] = Y;
      }
      const lenAtY = (yy) => { let lo = 0, hi = M - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (Ys[m] < yy) lo = m + 1; else hi = m; } if (lo === 0) return T[0][0]; const y0 = Ys[lo - 1], y1 = Ys[lo], f = y1 > y0 ? Math.min(1, Math.max(0, (yy - y0) / (y1 - y0))) : 1; return T[lo - 1][0] + (T[lo][0] - T[lo - 1][0]) * f; };
      const posAt = (L) => { let lo = 0, hi = M - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (T[m][0] < L) lo = m + 1; else hi = m; } if (lo === 0) return { x: T[0][1], y: T[0][2] }; const A = T[lo - 1], B = T[lo], f = B[0] > A[0] ? (L - A[0]) / (B[0] - A[0]) : 1; return { x: A[1] + (B[1] - A[1]) * f, y: A[2] + (B[2] - A[2]) * f }; };
      const endBottom = end.lastElementChild.getBoundingClientRect().bottom - bodyBox.top, blockMid = (sunY + endBottom) / 2, yDone = blockMid + vh * 0.1; // scroll (as tipY) at which the sun and the text below it are centred on screen
      geo = { len, lenAtY, posAt, yEnd: Ys[M - 1], yDone, startY: startPt[1], sunH: sr.height, sunTop: sunY, sunX, k };
      update();
    }
    let sT = 0, sC = 0, sP = 0; const easeSun = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const paintSun = () => { sP = easeSun(sC); sn.set(sP); const f = clamp((sP - 0.55) / 0.45); sn.svg.style.transform = `scale(${(0.93 + 0.07 * f * f * (3 - 2 * f)).toFixed(4)})`; };
    const sunTick = (time, dt) => { if (reduce || !geo) return; const d = sT - sC; if (Math.abs(d) < 0.0004) { if (sC !== sT) { sC = sT; paintSun(); update(); } return; } sC += d * (1 - Math.exp(-(dt || 16) / 150)); paintSun(); update(); };
    gsap.ticker.add(sunTick);
    function update() {
      if (!geo) return;
      const tipY = scrollY - bodyTopY + innerHeight * 0.6;
      if (reduce) { threadPath.style.strokeDashoffset = 0; sn.set(1); tip.style.opacity = 0; return; }
      const L = clamp(geo.lenAtY(tipY), 0, geo.len);
      if (L !== lastL) { lastL = L; threadPath.style.strokeDashoffset = geo.len - L; }
      // the sun: once the line arrives, the outline draws, then it fills. The scroll sets a target; the drawing eases toward it.
      sT = clamp((tipY - geo.yEnd) / Math.max(geo.yDone - geo.yEnd, innerHeight * 0.3)); // the outline starts when the thread has arrived and finishes just as the sun and the text under it are centred
      const s = sP, arrived = L >= geo.len - 1; // the dot belongs to the real end of the thread; it only dips into the sun once the thread has actually arrived there
      if (arrived && s > 0 && s < 0.14) { const pt = sn.pointAt(s); tip.setAttribute("transform", `translate(${geo.sunX + pt.x * geo.k},${geo.sunTop + pt.y * geo.k})`); tip.style.opacity = 1 - s / 0.14; tipVis = 1; } // it dips into the logo and fades; the outline keeps drawing
      else if (L > 0.5 && (!arrived || s === 0)) { // born at the end of the line: it fades and grows in over the first stretch of thread, then rides the tip
        const pt = threadPath.getPointAtLength(L), e = Math.min(1, L / 140), k = 0.25 + 0.75 * (1 - Math.pow(1 - e, 3)); // the exact point on the line, so the dot is never off its end
        tip.setAttribute("transform", `translate(${pt.x},${pt.y}) scale(${k.toFixed(3)})`); tip.style.opacity = (1 - Math.pow(1 - e, 2)).toFixed(3); tipVis = 1;
      }
      else if (tipVis !== 0) { tip.style.opacity = 0; tipVis = 0; }
    }
    ScrollTrigger.create({ trigger: body, start: "top bottom", end: "bottom top", onUpdate: update, onRefresh: () => { measure(); update(); } });
    sizeLine(); let roFirst = true; const ro = new ResizeObserver(() => { if (roFirst) { roFirst = false; return; } clearTimeout(ro.__t); ro.__t = setTimeout(() => { reserveNums(); sizeLine(); ScrollTrigger.refresh(); }, 200); }); ro.observe(body);
    return () => { ro.disconnect(); rail.remove(); gsap.ticker.remove(sunTick); };
  }

  /* ---------- mount ---------- */
  try { history.scrollRestoration = "manual"; } catch (e) {}
  window.addEventListener("pageshow", (e) => { if (e.persisted) window.scrollTo(0, 0); });
  let ctx = null;
  ctx = gsap.context(() => { mountThread(root); }, root);
  ScrollTrigger.sort(); ScrollTrigger.refresh();
  const top0 = () => { if (!location.hash) { window.lenis ? window.lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0); } };
  top0(); document.documentElement.classList.add("ready");
  document.fonts && document.fonts.ready.then(() => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
})();
