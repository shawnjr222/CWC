/* Pinned map story: one measure per scroll step, state by state. Data: Census ACS 2023, CDC PLACES (BRFSS), FSA, 2025 minimum wages. */
(async function () {
  const BLUE = "#1250c4", LIGHT = "#e3e6f1", NEUTRAL = "#d9d7d1";
  const $ = d3.format("$,.0f");
  const [data, atlas] = await Promise.all([d3.json("../assets/data/states.json"), d3.json("../assets/data/states-10m.json")]);
  const pct = (v) => v + "%";
  const M = [
    { key: "student", name: "Student debt", fmt: $, line: "Nobody should owe decades of their life for an education.", what: "Average federal student loan per borrower", src: "Federal Student Aid data, about 2023, as charted by Axios." },
    { key: "uninsured", name: "No health insurance", fmt: pct, line: "Staying healthy should never cost you everything you have.", what: "Adults 18 to 64 with no health insurance", src: "CDC PLACES (BRFSS) 2023, county estimates weighted by population." },
    { key: "housing", name: "Housing insecurity", fmt: pct, line: "A roof is not a luxury. No one should live in fear of losing theirs.", what: "Adults facing housing insecurity in the past year", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    { key: "food", name: "Food insecurity", fmt: pct, line: "No one should go hungry in one of the richest countries on earth.", what: "Adults facing food insecurity in the past year", src: "CDC PLACES (BRFSS) 2023. Gray states have no data." },
    { key: "poverty", name: "Poverty", fmt: pct, line: "Working your whole life shouldn't leave you poor.", what: "People living in poverty", src: "U.S. Census Bureau, American Community Survey 2023." },
    { key: "ratio", name: "The wealth gap", fmt: (v) => v.toFixed(1) + "×", line: "A gap this wide is not an accident. It is not ethical.", what: "Top fifth of households vs. bottom fifth, income", src: "80th ÷ 20th percentile household income, Census ACS 2023. Income, not wealth." },
    { key: "minwage", name: "Minimum wage", low: true, fmt: (v) => "$" + v.toFixed(2), line: "A full-time job should pay for a life.", what: "The wage floor", src: "Higher of state or federal minimum wage, 2025." },
  ];
  const N = M.length + 1; // intro + measures

  const el = { cap: document.getElementById("cap"), kicker: document.getElementById("kicker"), big: document.getElementById("big"), line: document.getElementById("line"), src: document.getElementById("src") };
  const mapEl = document.getElementById("map"), stepsEl = document.getElementById("steps");
  stepsEl.innerHTML = Array.from({ length: N }, () => "<i></i>").join("");
  const dots = [...stepsEl.children];

  let cur = -1, svg, path, feats;
  function draw() {
    const r = mapEl.getBoundingClientRect(); const w = Math.max(260, r.width), h = Math.max(160, r.height);
    mapEl.innerHTML = ""; svg = d3.select(mapEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    feats = topojson.feature(atlas, atlas.objects.states).features.filter((f) => data.states[f.properties.name]);
    const proj = d3.geoAlbersUsa().fitExtent([[0, 0], [w, h]], { type: "FeatureCollection", features: feats });
    path = d3.geoPath(proj);
    svg.append("g").selectAll("path").data(feats).join("path").attr("d", path).attr("fill", NEUTRAL).attr("stroke", "#f1f0ec").attr("stroke-width", 0.8);
    paint(cur < 0 ? 0 : cur, true);
  }
  function scaleFor(m) {
    const vals = Object.values(data.states).map((s) => s[m.key]).filter((v) => v != null);
    const [lo, hi] = d3.extent(vals);
    const t = d3.scaleLinear().domain([lo, hi]).range(m.low ? [1, 0] : [0, 1]);
    return (v) => d3.interpolateRgb(LIGHT, BLUE)(t(v));
  }
  function worst(m) {
    const e = Object.entries(data.states).filter(([, s]) => s[m.key] != null).sort((a, b) => (m.low ? a[1][m.key] - b[1][m.key] : b[1][m.key] - a[1][m.key]));
    return e[0];
  }
  function paint(i, instant) {
    svg.selectAll(".hl").remove();
    if (i === 0) { svg.selectAll("g path").transition().duration(instant ? 0 : 500).attr("fill", NEUTRAL); return; }
    const m = M[i - 1], col = scaleFor(m), [wn] = worst(m);
    svg.selectAll("g path").transition().duration(instant ? 0 : 700).attr("fill", (d) => { const v = data.states[d.properties.name][m.key]; return v == null ? NEUTRAL : col(v); });
    const node = svg.selectAll("g path").filter((d) => d.properties.name === wn).node();
    if (node) { const dd = node.getAttribute("d"); [["#fff", 4], [BLUE, 2]].forEach(([c, w]) => svg.append("path").attr("class", "hl").attr("d", dd).attr("fill", "none").attr("stroke", c).attr("stroke-width", w).attr("opacity", 0).transition().delay(instant ? 0 : 500).duration(300).attr("opacity", 1)); }
  }
  function textFor(i) {
    if (i === 0) return { kicker: "Scroll", big: "", line: "Life under capitalism, state by state.", src: "" };
    const m = M[i - 1], [wn, ws] = worst(m);
    if (m.key === "minwage") {
      const n = Object.values(data.states).filter((s) => s.minwage === ws.minwage).length;
      return { kicker: `${String(i).padStart(2, "0")} · ${m.name}`, big: m.fmt(ws.minwage), line: `${m.line}<br><span style="color:var(--dim)">The floor in ${n} states.</span>`, src: m.src };
    }
    return { kicker: `${String(i).padStart(2, "0")} · ${m.name} · highest in ${wn}`, big: m.fmt(ws[m.key]), line: m.line, src: `${m.what}. ${m.src}` };
  }
  function show(i) {
    const dir = i >= cur ? 1 : -1; const first = cur < 0; cur = i;
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
    paint(i, first);
    if (first) { const t = textFor(i); el.kicker.textContent = t.kicker; el.big.innerHTML = t.big; el.line.innerHTML = t.line; el.src.textContent = t.src; }
    else setCaption(el, textFor(i), dir);
  }

  draw(); show(0);
  new ResizeObserver(() => { clearTimeout(window.__rt); window.__rt = setTimeout(draw, 150); }).observe(mapEl);
  ScrollTrigger.create({
    trigger: "#stage", start: "top top", end: () => "+=" + innerHeight * N * 0.85, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: (s) => { const i = Math.min(N - 1, Math.floor(s.progress * N)); if (i !== cur) show(i); },
  });
})();
