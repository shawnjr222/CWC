/* Six story concepts, each told along one unbroken line that draws itself as you scroll (after Listen to America).
   Voices are the real writers and headlines from the publication's featured stories; numbers come from the data in this repo.
   The bar at the bottom switches between concepts. "Listen" reads each moment with the browser's text-to-speech. */
(async function () {
  const root = document.getElementById("story");
  if (!root || !window.gsap || !window.ScrollTrigger || !window.d3 || !window.topojson) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BLUE = "#1250c4", MID = "#6f8fd6", LIGHT = "#c3d0ee", INK = "#111", GREY = "#d9d7d1", NEUTRAL = "#d9d7d1", PALE = "#e3e6f1";
  const [data, atlas] = await Promise.all([d3.json("assets/data/states.json"), d3.json("assets/data/states-10m.json")]);
  const S = data.states, US = data.us;
  const money = d3.format("$,.0f"), money2 = d3.format("$,.2f"), num = d3.format(",");

  /* ---------- the voices (real featured stories) ---------- */
  const V = {
    gomez: { who: "James Gómez", say: "Why I'm Anti-Capitalist" },
    sen: { who: "Sanchari Sen", say: "101 Sins of Capitalism" },
    hamilton: { who: "Kaylin Hamilton", say: "From Famine Walls to Welfare Conditions, Why Do We Always Punish The Poor?" },
    hotta: { who: "Annika Hotta", say: "Independence Looks Different For Everyone, Especially If You're Disabled" },
    ogamdi: { who: "Dr. Emmanuel Ogamdi", say: "Playing Russian Roulette With Mental Health Patients" },
    judge: { who: "Tiffany Judge", say: "Americans Are Burying Themselves Alive With Cheap Stuff" },
  };
  const voice = (k) => ({ type: "voice", ...V[k], speak: `${V[k].say}. By ${V[k].who}.` });
  const END = { type: "end", say: "The publication is on hiatus. These voices are still here.", link: ["Read the publication", "https://medium.com/coping-with-capitalism"] };

  /* ---------- helpers ---------- */
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  function scribble(seed) {
    const r = rng(seed * 9301 + 49297), pts = [];
    const loops = 5 + Math.floor(r() * 4), A = 34 + r() * 8, B = 14 + r() * 10, n = 3 + Math.floor(r() * 4), ph = r() * 6.28, sk = 0.7 + r() * 0.5;
    for (let i = 0; i <= 220; i++) { const t = (i / 220) * Math.PI * 2 * (loops / 2); pts.push([50 + A * Math.cos(t * 0.5) * 0.9 + B * Math.cos(t * n + ph), 50 + A * Math.sin(t * 0.5) * sk + B * Math.sin(t * n + ph) * 0.9]); }
    return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
  }
  const ARROW = '<span class="arrow-slide" aria-hidden="true"><span class="arrow-out"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="arrow-in"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>';

  /* ---------- measure helpers for the map ---------- */
  const MEAS = {
    student: { name: "Student debt", fmt: money, line: "Nobody should owe decades of their life for an education.", src: "Federal Student Aid data, about 2023, as charted by Axios." },
    uninsured: { name: "No health insurance", fmt: (v) => v + "%", line: "Staying healthy should never cost you everything you have.", src: "CDC PLACES (BRFSS) 2023, adults 18 to 64." },
    housing: { name: "Housing insecurity", fmt: (v) => v + "%", line: "A roof is not a luxury. No one should live in fear of losing theirs.", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    poverty: { name: "Poverty", fmt: (v) => v + "%", line: "Working your whole life shouldn't leave you poor.", src: "U.S. Census Bureau, American Community Survey 2023." },
    minwage: { name: "Minimum wage", low: true, fmt: (v) => "$" + v.toFixed(2), line: "A full-time job should pay for a life.", src: "Higher of state or federal minimum wage, 2025." },
  };
  const worst = (k) => { const m = MEAS[k]; return Object.entries(S).filter(([, s]) => s[k] != null).sort((a, b) => (m.low ? a[1][k] - b[1][k] : b[1][k] - a[1][k]))[0]; };
  const scaleFor = (k) => { const m = MEAS[k]; const vals = Object.values(S).map((s) => s[k]).filter((v) => v != null); const [lo, hi] = d3.extent(vals); const t = d3.scaleLinear().domain([lo, hi]).range(m.low ? [1, 0] : [0, 1]); return (v) => d3.interpolateRgb(PALE, BLUE)(t(v)); };

  /* ---------- visualisations: each returns an element and an enter() that plays when it scrolls into view ---------- */
  function mapViz(key) {
    const el = document.createElement("div"); el.className = "viz viz-map";
    const W = 560, H = 340; const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`);
    const feats = topojson.feature(atlas, atlas.objects.states).features.filter((f) => S[f.properties.name]);
    const path = d3.geoPath(d3.geoAlbersUsa().fitExtent([[0, 0], [W, H]], { type: "FeatureCollection", features: feats }));
    const paths = svg.append("g").selectAll("path").data(feats).join("path").attr("d", path).attr("fill", NEUTRAL).attr("stroke", "#f1f0ec").attr("stroke-width", 0.8);
    const col = scaleFor(key), [wn] = worst(key);
    return { el, enter() {
      paths.transition().duration(reduce ? 0 : 1100).delay((d, i) => (reduce ? 0 : i * 12)).attr("fill", (d) => { const v = S[d.properties.name][key]; return v == null ? NEUTRAL : col(v); });
      const node = paths.filter((d) => d.properties.name === wn).node();
      if (node) { const dd = node.getAttribute("d"); [["#fff", 4], [BLUE, 2]].forEach(([c, w]) => svg.append("path").attr("d", dd).attr("fill", "none").attr("stroke", c).attr("stroke-width", w).attr("opacity", 0).transition().delay(reduce ? 0 : 1000).duration(400).attr("opacity", 1)); }
    } };
  }
  const WEALTH = [[31, BLUE], [36, MID], [30, LIGHT], [3, INK]], PEOPLE = [[1, BLUE], [9, MID], [40, LIGHT], [50, INK]];
  const seq = (g) => g.flatMap(([n, c]) => Array(n).fill(c));
  function dotsViz(fn) { // fn(i) -> color
    const el = document.createElement("div"); el.className = "viz viz-dots"; el.innerHTML = Array.from({ length: 100 }, () => "<i></i>").join("");
    const d = [...el.children];
    return { el, enter() { d.forEach((x, i) => gsap.to(x, { backgroundColor: fn(i), duration: reduce ? 0 : 0.5, delay: reduce ? 0 : i * 0.012, ease: "power2.out" })); } };
  }
  function barsViz(show) { // show: which of p20,p80,top5 to display
    const el = document.createElement("div"); el.className = "viz viz-bars";
    const vals = { p20: US.p20, p80: US.p80, top5: US.top5avg }, labels = { p20: "Bottom fifth", p80: "Top fifth", top5: "Top 5%, average" }, cols = { p20: INK, p80: BLUE, top5: MID };
    el.innerHTML = '<div class="bars">' + ["p20", "p80", "top5"].map((k) => `<div class="b" data-k="${k}" style="${show.includes(k) ? "" : "visibility:hidden"}"><span class="t">${money(vals[k])}</span><i style="background:${cols[k]}"></i><em class="mono">${labels[k]}</em></div>`).join("") + "</div>";
    const bars = [...el.querySelectorAll(".b i")];
    return { el, enter() { bars.forEach((b) => { const k = b.parentNode.dataset.k; if (!show.includes(k)) return; gsap.fromTo(b, { height: 0 }, { height: (vals[k] / US.top5avg) * 100 + "%", duration: reduce ? 0 : 1.4, ease: "power3.out" }); }); } };
  }
  const POOR = 40763043, PER = 100000, DOTS = Math.ceil(POOR / PER);
  function povertyViz(frac) {
    const el = document.createElement("div"); el.className = "viz viz-poverty"; el.innerHTML = Array.from({ length: DOTS }, () => "<i></i>").join("");
    const d = [...el.children], n = Math.round(DOTS * frac);
    return { el, enter() { d.slice(0, n).forEach((x, i) => gsap.to(x, { backgroundColor: BLUE, duration: 0.25, delay: reduce ? 0 : i * 0.006 })); } };
  }
  const MINW = 7.25, TOPH = US.top5avg / 2080;
  function dayViz(t) { // hours elapsed, 0..8
    const el = document.createElement("div"); el.className = "viz viz-day";
    el.innerHTML = `<div class="r"><div class="l"><span class="mono">Minimum wage</span><b data-v="min">$0.00</b></div><div class="tr"><div class="f min"></div></div></div><div class="r"><div class="l"><span class="mono">Top 5% household, average</span><b data-v="top">$0.00</b></div><div class="tr"><div class="f"></div></div></div>`;
    const fm = el.querySelector(".f.min"), ft = el.querySelector(".f:not(.min)"), vm = el.querySelector('[data-v="min"]'), vt = el.querySelector('[data-v="top"]');
    return { el, enter() { const o = { t: 0 }; gsap.to(o, { t, duration: reduce ? 0 : 1.8, ease: "power2.out", onUpdate: () => { fm.style.width = ((MINW * o.t) / (TOPH * 8)) * 100 + "%"; ft.style.width = (o.t / 8) * 100 + "%"; vm.textContent = money2(MINW * o.t); vt.textContent = money2(TOPH * o.t); } }); } };
  }
  const rows = Object.entries(S).sort((a, b) => b[1].median - a[1].median);
  function spreadViz(hl) {
    const el = document.createElement("div"); el.className = "viz viz-spread";
    const W = 560, H = 320, x = d3.scaleLinear().domain([15000, 260000]).range([28, W - 110]), rh = H / rows.length;
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.selectAll("g").data(rows).join("g").attr("transform", (d, i) => `translate(0,${i * rh + rh / 2})`).attr("opacity", 0);
    g.append("line").attr("x1", (d) => x(d[1].p20)).attr("x2", (d) => x(d[1].p80)).attr("stroke", BLUE).attr("stroke-width", Math.max(2, rh * 0.45)).attr("stroke-linecap", "round").attr("opacity", (d) => (hl ? (d[0] === hl ? 1 : 0.18) : 0.45));
    g.append("circle").attr("cx", (d) => x(d[1].median)).attr("r", Math.max(1.8, rh * 0.32)).attr("fill", INK);
    if (hl) g.filter((d) => d[0] === hl).append("text").attr("x", (d) => x(d[1].p80) + 8).attr("dy", "0.34em").attr("font-size", 11).attr("font-family", "Inter Tight, sans-serif").attr("fill", INK).text((d) => d[0]);
    return { el, enter() { g.transition().duration(reduce ? 0 : 400).delay((d, i) => (reduce ? 0 : i * 16)).attr("opacity", 1); } };
  }

  /* ---------- the six concepts ---------- */
  const widestName = Object.entries(S).sort((a, b) => b[1].ratio - a[1].ratio)[0], lowName = Object.entries(S).sort((a, b) => a[1].p20 - b[1].p20)[0];
  const mapMoment = (k) => { const [wn, ws] = worst(k), m = MEAS[k]; const isMin = k === "minwage"; const n = isMin ? Object.values(S).filter((s) => s.minwage === ws.minwage).length : 0;
    return { type: "viz", who: isMin ? m.name : `${m.name} · highest in ${wn}`, big: m.fmt(ws[k]), line: m.line, note: isMin ? `The wage floor in ${n} states.` : "", src: m.src, viz: () => mapViz(k), speak: `${m.name}. ${m.line}` }; };
  const dotMoment = (who, big, line, fn, speak) => ({ type: "viz", who, big, line, src: "Federal Reserve Distributive Financial Accounts, 2024, rounded. Each dot is about 1%.", viz: () => dotsViz(fn), speak: speak || line });
  const W = seq(WEALTH), P = seq(PEOPLE);
  const SRC_I = "U.S. Census Bureau, American Community Survey 2023, household income.";
  const fmtM = (n) => (n / 1e6).toFixed(1) + " million";
  const CONCEPTS = [
    { id: "map", name: "Map story", title: "One map, every measure.", sub: "Follow the line, state by state.", moments: [
      voice("gomez"), mapMoment("student"), mapMoment("uninsured"), voice("sen"), mapMoment("housing"), mapMoment("poverty"), voice("hamilton"), mapMoment("minwage"), END ] },
    { id: "households", name: "100 households", title: "Picture 100 households.", sub: "Each dot is 1% of the wealth.", moments: [
      voice("gomez"),
      dotMoment("The top 1%", "31", "of the 100 dots.", (i) => (i < 31 ? W[i] : GREY), "The top one percent hold thirty one of the one hundred dots."),
      voice("sen"),
      dotMoment("The top 10%", "67", "Two thirds of all the wealth.", (i) => (i < 67 ? W[i] : GREY), "The top ten percent hold two thirds of all the wealth."),
      dotMoment("The bottom half", "3", "dots for half of all households.", (i) => W[i], "The bottom half of households hold three dots."),
      voice("hotta"),
      dotMoment("Now count the people", "50%", "of households. Three percent of the wealth.", (i) => P[i], "Now count the people. Half of households, three percent of the wealth."), END ] },
    { id: "gap", name: "The gap", title: "Three households. One year.", sub: "Watch the distance open up.", moments: [
      voice("hamilton"),
      { type: "viz", who: "The bottom fifth", big: money(US.p20), line: "a year, or less.", src: SRC_I, viz: () => barsViz(["p20"]), speak: `The bottom fifth of households live on ${money(US.p20)} a year, or less.` },
      { type: "viz", who: "The top fifth", big: (US.p80 / US.p20).toFixed(1) + "×", line: `${money(US.p80)} a year or more. ${(US.p80 / US.p20).toFixed(1)} times the bottom.`, src: SRC_I, viz: () => barsViz(["p20", "p80"]), speak: `The top fifth earn ${(US.p80 / US.p20).toFixed(1)} times the bottom.` },
      voice("hotta"),
      { type: "viz", who: "The top 5%, on average", big: (US.top5avg / US.p20).toFixed(1) + "×", line: `${money(US.top5avg)} a year. About sixteen times the bottom fifth.`, src: SRC_I, viz: () => barsViz(["p20", "p80", "top5"]), speak: `The top five percent earn about sixteen times the bottom fifth.` }, END ] },
    { id: "poverty", name: "40.8 million", title: "Each dot is 100,000 people.", sub: "Watch them add up.", moments: [
      voice("ogamdi"),
      { type: "viz", who: "Living below the poverty line", big: fmtM(POOR * 0.25), line: "A quarter of them.", src: "U.S. Census Bureau, American Community Survey 2023.", viz: () => povertyViz(0.25), speak: "Ten million people. A quarter of them." },
      voice("judge"),
      { type: "viz", who: "Living below the poverty line", big: fmtM(POOR * 0.6), line: "Still counting.", src: "U.S. Census Bureau, American Community Survey 2023.", viz: () => povertyViz(0.6), speak: "Twenty four million people. Still counting." },
      { type: "viz", who: "Living below the poverty line", big: "40.8 million", line: "One in eight Americans.", src: "U.S. Census Bureau, American Community Survey 2023.", viz: () => povertyViz(1), speak: "Forty point eight million people. One in eight Americans." }, END ] },
    { id: "day", name: "A day's pay", title: "One workday. Two ways of earning.", sub: "The clock runs from nine to five.", moments: [
      voice("judge"),
      { type: "viz", who: `By 9:${String(Math.round(((MINW * 8) / TOPH) * 60)).padStart(2, "0")} am`, big: money(MINW * 8), line: "A minimum-wage worker's entire day. The average top-5% household has already earned it.", src: "Top 5%: average household income over a 2,080-hour year. Minimum wage: federal, $7.25.", viz: () => dayViz((MINW * 8) / TOPH), speak: "By nine fourteen, the average top five percent household has earned a minimum wage worker's whole day." },
      voice("ogamdi"),
      { type: "viz", who: "By 12:00 pm", big: money(TOPH * 3), line: `for the top 5% so far. The minimum-wage worker has earned ${money2(MINW * 3)}.`, src: "Top 5%: average household income over a 2,080-hour year. Minimum wage: federal, $7.25.", viz: () => dayViz(3), speak: "By noon the minimum wage worker has earned twenty one dollars and seventy five cents." },
      { type: "viz", who: "By 5:00 pm", big: (TOPH / MINW).toFixed(1) + "×", line: `${money(TOPH * 8)} against ${money(MINW * 8)}. The same eight hours.`, src: "Top 5%: average household income over a 2,080-hour year. Minimum wage: federal, $7.25.", viz: () => dayViz(8), speak: "Same eight hours. Thirty three times apart." }, END ] },
    { id: "states", name: "State by state", title: "51 places. One country.", sub: "The income range in every state.", moments: [
      voice("gomez"),
      { type: "viz", who: "From the bottom fifth to the top fifth", big: "51", line: "places, ranked by typical income. Each bar is the range.", src: "Household income, 20th to 80th percentile. U.S. Census Bureau, ACS 2023.", viz: () => spreadViz(null), speak: "Fifty one places. Each bar is the range of income." },
      { type: "viz", who: `The widest gap · ${widestName[0]}`, big: widestName[1].ratio.toFixed(1) + "×", line: `The top fifth earn ${money(widestName[1].p80)} or more. The bottom fifth, ${money(widestName[1].p20)} or less.`, src: "Household income, 20th and 80th percentile. U.S. Census Bureau, ACS 2023.", viz: () => spreadViz(widestName[0]), speak: `The widest gap is in ${widestName[0]}.` },
      voice("hamilton"),
      { type: "viz", who: `The lowest floor · ${lowName[0]}`, big: money(lowName[1].p20), line: "or less, a year, for the bottom fifth of households.", src: "Household income, 20th percentile. U.S. Census Bureau, ACS 2023.", viz: () => spreadViz(lowName[0]), speak: `The lowest floor is in ${lowName[0]}.` }, END ] },
  ];

  /* ---------- state ---------- */
  let cur = Math.max(0, Math.min(CONCEPTS.length - 1, (parseInt(new URLSearchParams(location.search).get("c"), 10) || 1) - 1));
  let triggers = [], drawTween = null, els = [], threadPath, lineSvg, head, snd, resizeObs;
  const tts = window.speechSynthesis; let listenOn = false, voices = [], active = -1;
  const loadVoices = () => (voices = (tts ? tts.getVoices() : []).filter((v) => /^en/i.test(v.lang)));
  if (tts) { loadVoices(); tts.onvoiceschanged = loadVoices; }

  function clearAll() {
    triggers.forEach((t) => t.kill()); triggers = []; drawTween && drawTween.kill(); drawTween = null;
    if (tts) tts.cancel(); active = -1; resizeObs && resizeObs.disconnect();
    root.querySelectorAll(".viz *").forEach((n) => gsap.killTweensOf(n)); root.innerHTML = "";
  }

  function build(i, scrollTo) {
    clearAll(); cur = i; const C = CONCEPTS[i];
    const u = new URL(location.href); u.searchParams.set("c", i + 1); history.replaceState(null, "", u);
    head = document.createElement("div"); head.className = "thread-head";
    head.innerHTML = `<p class="mono label">Concept ${i + 1} of ${CONCEPTS.length}</p><h2>${C.title}</h2><p>${C.sub}</p>`;
    snd = document.createElement("button"); snd.className = "thread-snd"; snd.type = "button"; snd.setAttribute("aria-pressed", String(listenOn)); snd.textContent = listenOn ? "Listen: on" : "Listen: off"; if (!tts) snd.style.display = "none";
    snd.addEventListener("click", () => { listenOn = !listenOn; snd.setAttribute("aria-pressed", String(listenOn)); snd.textContent = listenOn ? "Listen: on" : "Listen: off"; if (!listenOn && tts) { tts.cancel(); els.forEach((e) => e.classList.remove("speaking")); } });
    const NS = "http://www.w3.org/2000/svg";
    lineSvg = document.createElementNS(NS, "svg"); lineSvg.setAttribute("class", "thread-line"); lineSvg.setAttribute("aria-hidden", "true");
    threadPath = document.createElementNS(NS, "path"); lineSvg.appendChild(threadPath);
    root.append(lineSvg, snd, head);

    const enters = [];
    els = C.moments.map((m, k) => {
      const side = m.type === "end" ? "center" : k % 2 === 0 ? "left" : "right";
      const d = document.createElement("div"); d.className = `moment ${side}${m.type === "viz" ? " is-stat" : ""}`;
      const card = document.createElement("div"); card.className = "card-v";
      if (m.type === "voice") card.innerHTML = `<svg class="sig" viewBox="0 0 100 100" aria-hidden="true"><path d="${scribble(k + 3)}"/></svg><p class="mono who">${m.who}</p><p class="say">${m.say}</p><p class="mono listen-now"><i></i>Listening</p>`;
      else if (m.type === "viz") { const z = m.viz(); card.innerHTML = `<p class="mono who">${m.who}</p><p class="num">${m.big}</p><p class="note">${m.line}${m.note ? `<br><span style="color:var(--dim)">${m.note}</span>` : ""}</p>`; card.appendChild(z.el); card.insertAdjacentHTML("beforeend", `<p class="mono src">${m.src}</p><p class="mono listen-now"><i></i>Listening</p>`); enters[k] = z.enter; }
      else card.innerHTML = `<p class="say">${m.say}</p><p class="note"><a class="foot-link" style="font-family:inherit;text-transform:none;letter-spacing:inherit;border-bottom:1px solid currentColor" href="${m.link[1]}" target="_blank" rel="noopener">${m.link[0]}${ARROW}</a></p>`;
      d.appendChild(card); root.appendChild(d); return d;
    });

    els.forEach((e, k) => {
      const card = e.querySelector(".card-v"), p = e.querySelector(".sig path");
      if (reduce) { enters[k] && enters[k](); return; }
      gsap.set(card, { opacity: 0, y: 28 });
      let len = 0; if (p) { len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); }
      triggers.push(ScrollTrigger.create({ trigger: e, start: "top 72%", once: true, onEnter: () => { gsap.to(card, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }); if (p) gsap.to(p, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }); enters[k] && enters[k](); } }));
      triggers.push(ScrollTrigger.create({ trigger: e, start: "center 62%", end: "center 38%", onToggle: (s) => { if (s.isActive && k !== active) { active = k; speak(k); } } }));
    });
    sizeLine();
    resizeObs = new ResizeObserver(() => { clearTimeout(window.__srt); window.__srt = setTimeout(sizeLine, 200); }); resizeObs.observe(root);
    // switcher state
    document.querySelectorAll(".story-bar a").forEach((a, n) => (n === i ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    ScrollTrigger.refresh();
    if (scrollTo) { const top = root.getBoundingClientRect().top + scrollY; (window.lenis ? window.lenis.scrollTo(top, { duration: 1.2 }) : window.scrollTo({ top, behavior: "smooth" })); }
  }

  function sizeLine() {
    const w = root.clientWidth, h = root.scrollHeight, small = w < 760;
    lineSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const ys = els.map((e) => e.offsetTop + e.offsetHeight / 2);
    const pts = [[small ? 22 : w * 0.5, head.offsetTop + head.offsetHeight + 10]];
    els.forEach((e, k) => { const left = e.classList.contains("left"), center = e.classList.contains("center"); const x = small ? 22 + (k % 2 ? 10 : -4) : center ? w * 0.5 : w * 0.5 + (left ? 1 : -1) * w * 0.05, y = ys[k];
      pts.push([small ? 22 + (k % 2 ? -8 : 8) : w * 0.5 + (left ? -1 : 1) * w * 0.012, y - 110]); pts.push([x, y]); pts.push([small ? 22 : w * 0.5, y + 110]); });
    pts.push([small ? 22 : w * 0.5, ys[ys.length - 1] + 150]);
    threadPath.setAttribute("d", d3.line().curve(d3.curveCatmullRom.alpha(0.6))(pts));
    const len = threadPath.getTotalLength(); threadPath.style.strokeDasharray = len;
    drawTween && drawTween.kill();
    if (reduce) { threadPath.style.strokeDashoffset = 0; return; }
    threadPath.style.strokeDashoffset = len;
    drawTween = gsap.to(threadPath, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: root, start: "top 55%", end: "bottom 70%", scrub: 0.5, invalidateOnRefresh: true } });
  }

  function speak(k) {
    if (!listenOn || !tts) return;
    tts.cancel(); els.forEach((e) => e.classList.remove("speaking"));
    const m = CONCEPTS[cur].moments[k]; if (!m.speak) return;
    const u = new SpeechSynthesisUtterance(m.speak);
    if (voices.length) u.voice = voices[k % voices.length]; u.pitch = 0.85 + ((k * 37) % 30) / 100; u.rate = 0.95;
    u.onstart = () => els[k] && els[k].classList.add("speaking"); u.onend = u.onerror = () => els[k] && els[k].classList.remove("speaking");
    tts.speak(u);
  }
  window.addEventListener("pagehide", () => tts && tts.cancel());

  /* ---------- the switcher bar ---------- */
  const bar = document.createElement("nav"); bar.className = "story-bar"; bar.setAttribute("aria-label", "Story concepts");
  bar.innerHTML = CONCEPTS.map((c, n) => `<a href="?c=${n + 1}" data-i="${n}"><i>${n + 1}</i><span>${c.name}</span></a>`).join("");
  document.body.appendChild(bar);
  bar.addEventListener("click", (e) => { const a = e.target.closest("a"); if (!a) return; e.preventDefault(); build(+a.dataset.i, true); });
  ScrollTrigger.create({ trigger: root, start: "top 85%", end: "bottom 15%", onToggle: (s) => bar.classList.toggle("show", s.isActive) });

  build(cur, false);
  document.fonts && document.fonts.ready.then(() => { sizeLine(); ScrollTrigger.refresh(); });
})();
