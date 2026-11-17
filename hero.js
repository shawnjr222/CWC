/* Hero: interactive U.S. map of how capitalism lands on people, state by state.
   Data: U.S. Census Bureau ACS 2023 (1-year) and 2025 state minimum wages. */
(function () {
  const vizEl = document.getElementById("hero-viz");
  const readout = document.getElementById("readout");
  const chipsEl = document.getElementById("chips");
  const srcEl = document.getElementById("src");
  const standEl = document.getElementById("stand");
  const BLUE = "#1250c4";
  const LIGHT = "#e3e6f1";
  const $ = d3.format("$,.0f");

  const oneIn = (pct) => Math.round(100 / pct);

  // dark = more severe. `low` means lower values are worse.
  const extremes = (key, fmt, what) => () => {
    const e = Object.entries(data.states).filter(([, s]) => s[key] != null).sort((x, y) => y[1][key] - x[1][key]);
    const hi = e[0], lo = e[e.length - 1];
    return `${what}: highest in <b>${hi[0]}</b> (${fmt(hi[1][key])}), lowest in <b>${lo[0]}</b> (${fmt(lo[1][key])}).`;
  };
  const pct = (v) => v + "%";

  const METRICS = [
    {
      id: "student", stand: "Nobody should owe decades of their life for an education.", label: "Student debt", key: "student", low: false,
      line: (v) => `Borrowers owe an average of <b>${$(v)}</b> in federal student loans.`,
      nat: extremes("student", $, "Average student loan debt"),
      src: "Average federal loan balance per borrower, about 2023. Federal Student Aid, via Axios.",
    },
    {
      id: "uninsured", stand: "Staying healthy should never cost you everything you have.", label: "No health insurance", key: "uninsured", low: false,
      line: (v) => `<b>${v}%</b> of adults aged 18 to 64 have no health insurance, so a bad diagnosis can mean debt.`,
      nat: extremes("uninsured", pct, "Adults without health insurance"),
      src: "CDC PLACES (BRFSS) 2023, adults 18 to 64 (Pennsylvania, Kentucky 2022). County estimates, population-weighted.",
    },
    {
      id: "housing", stand: "A roof is not a luxury. No one should live in fear of losing theirs.", label: "Housing insecurity", key: "housing", low: false,
      line: (v) => `<b>${v}%</b> of adults say they faced housing insecurity in the past year.`,
      nat: extremes("housing", pct, "Housing insecurity"),
      src: "CDC PLACES (BRFSS) 2023 (some states 2022). County estimates, population-weighted. Gray = no data.",
    },
    {
      id: "utility", stand: "Heat and light should not depend on a bill you cannot pay.", label: "Utility shutoffs", key: "utility", low: false,
      line: (v) => `<b>${v}%</b> of adults were threatened with a utility shut-off in the past year.`,
      nat: extremes("utility", pct, "Utility shut-off threats"),
      src: "CDC PLACES (BRFSS) 2023 (some states 2022). County estimates, population-weighted. Gray = no data.",
    },
    {
      id: "food", stand: "No one should go hungry in one of the richest countries on earth.", label: "Food insecurity", key: "food", low: false,
      line: (v) => `<b>${v}%</b> of adults say they faced food insecurity in the past year.`,
      nat: extremes("food", pct, "Food insecurity"),
      src: "CDC PLACES (BRFSS) 2023 (some states 2022). County estimates, population-weighted. Gray = no data.",
    },
    {
      id: "snap", stand: "No one should need food stamps to get through the month.", label: "Food stamps", key: "snap", low: false,
      line: (v) => `<b>${v}%</b> of adults received food stamps in the past year.`,
      nat: extremes("snap", pct, "Food stamp use"),
      src: "CDC PLACES (BRFSS) 2023 (some states 2022). County estimates, population-weighted. Gray = no data.",
    },
    {
      id: "poverty", stand: "Working your whole life shouldn't leave you poor.", label: "Poverty", key: "poverty", low: false,
      line: (v) => `<b>${v}%</b> of people live in poverty, about 1 in ${oneIn(v)}.`,
      nat: (u) => `Across the U.S., <b>${u.poverty}%</b> of people live in poverty, about 1 in ${oneIn(u.poverty)}.`,
      src: "People below the federal poverty line. U.S. Census Bureau, ACS 2023.",
    },
    {
      id: "ratio", stand: "A gap this wide is not an accident. It is not ethical.", label: "The wealth gap", key: "ratio", low: false,
      line: (v) => `The top fifth of households earn <b>${v.toFixed(1)}×</b> what the bottom fifth earns.`,
      nat: (u) => `Nationally, the top fifth of households earn <b>${u.ratio.toFixed(1)}×</b> what the bottom fifth earns.`,
      src: "80th ÷ 20th percentile household income, Census ACS 2023. Income, not wealth.",
    },
    {
      id: "minwage", stand: "A full-time job should pay for a life.", label: "Minimum wage", key: "minwage", low: true,
      line: (v) => `The minimum wage is <b>$${v.toFixed(2)}</b> an hour, about <b>${$(v * 2080)}</b> a year full-time, before taxes.`,
      nat: (u) => `The federal minimum wage is <b>$${u.minwage.toFixed(2)}</b> an hour and hasn't changed since 2009.`,
      src: "Higher of state or federal minimum wage, 2025. Full-time = 2,080 hours a year.",
    },
    {
      id: "mental", stand: "The weight of just getting by shows up in our minds.", label: "Mental distress", key: "mental", low: false,
      line: (v) => `<b>${v}%</b> of adults report frequent mental distress.`,
      nat: extremes("mental", pct, "Frequent mental distress"),
      src: "CDC PLACES (BRFSS) 2023 (some states 2022). County estimates, population-weighted. Gray = no data.",
    },
    {
      id: "transit", stand: "Getting to work, care and groceries should not depend on owning a car.", label: "Transportation", key: "transit", low: false,
      line: (v) => `<b>${v}%</b> of adults lacked reliable transportation in the past year.`,
      nat: extremes("transit", pct, "No reliable transportation"),
      src: "CDC PLACES (BRFSS) 2023 (some states 2022). County estimates, population-weighted. Gray = no data.",
    },
  ];

  let data = null, atlas = null, metric = METRICS[0], selected = null, resizeT;

  function colorFor(m) {
    const vals = Object.values(data.states).map((s) => s[m.key]).filter((v) => v != null);
    const [lo, hi] = d3.extent(vals);
    const t = d3.scaleLinear().domain([lo, hi]).range(m.low ? [1, 0] : [0, 1]);
    return { color: (v) => d3.interpolateRgb(LIGHT, BLUE)(t(v)), lo, hi };
  }

  const fillOf = (color, d) => { const v = data.states[d.properties.name][metric.key]; return v == null ? "#d9d7d1" : color(v); };

  function setReadout(name) {
    const m = metric;
    if (!name) {
      readout.innerHTML = m.nat(data.us);
      return;
    }
    const s = data.states[name];
    if (s[m.key] == null) { readout.innerHTML = `<b>${name}.</b> No data available for this measure.`; return; }
    readout.innerHTML = `<b>${name}.</b> ${m.line(s[m.key])}${data.us[m.key] == null ? "" : `<small>U.S.: ${fmtNat(m)}</small>`}`;
  }
  function fmtNat(m) {
    const v = data.us[m.key];
    if (v == null) return "no single national figure";
    return m.id === "poverty" ? v + "%" : m.id === "ratio" ? v.toFixed(1) + "×" : m.id === "minwage" ? "$" + v.toFixed(2) + "/hr" : $(v);
  }

  function draw() {
    const r = vizEl.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width)), h = Math.max(180, Math.round(r.height));
    d3.select(vizEl).selectAll("*").remove();
    const svg = d3.select(vizEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const states = topojson.feature(atlas, atlas.objects.states).features.filter((f) => data.states[f.properties.name]);
    const proj = d3.geoAlbersUsa().fitExtent([[0, 0], [w, h]], { type: "FeatureCollection", features: states });
    const path = d3.geoPath(proj);
    const { color } = colorFor(metric);

    svg.append("g").selectAll("path").data(states).join("path")
      .attr("d", path)
      .attr("fill", (d) => fillOf(color, d))
      .attr("stroke", "#f1f0ec").attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      .on("pointerenter", (e, d) => pick(d.properties.name))
      .on("pointerleave", () => pick(null))
      .on("click", (e, d) => { selected = selected === d.properties.name ? null : d.properties.name; pick(selected); });

    highlight(selected);
    setReadout(selected);
  }

  function highlight(name) {
    const svg = d3.select(vizEl).select("svg");
    svg.selectAll(".hl").remove();
    if (!name) return;
    const node = svg.selectAll("g path").filter((d) => d.properties.name === name).node();
    if (!node) return;
    const d = node.getAttribute("d");
    svg.append("path").attr("class", "hl").attr("d", d).attr("fill", "none").attr("stroke", "#fff").attr("stroke-width", 4).style("pointer-events", "none");
    svg.append("path").attr("class", "hl").attr("d", d).attr("fill", "none").attr("stroke", BLUE).attr("stroke-width", 2).style("pointer-events", "none");
  }
  function pick(name) {
    const n = name || selected;
    highlight(n);
    setReadout(n);
  }

  function recolor() {
    const { color } = colorFor(metric);
    d3.select(vizEl).selectAll("path").transition().duration(600)
      .attr("fill", (d) => fillOf(color, d));
    srcEl.textContent = metric.src;
    standEl.textContent = metric.stand;
    setReadout(selected);
  }

  function buildChips() {
    const one = METRICS.map((m) => `<button type="button" class="chip" data-id="${m.id}" aria-pressed="${m === metric}">${m.label}</button>`).join("");
    // Repeat the set until the track is wider than the window plus one set, so the loop never shows a gap.
    const ticker = document.getElementById("ticker");
    const setHTML = (hidden) => `<div class="ticker-set"${hidden ? ' aria-hidden="true"' : ""}>${hidden ? one.replace(/<button /g, '<button tabindex="-1" ') : one}</div>`;
    const layout = () => {
      chipsEl.innerHTML = setHTML(false);
      const w = chipsEl.firstElementChild.getBoundingClientRect().width || 1;
      const copies = Math.ceil(ticker.clientWidth / w) + 1;
      chipsEl.innerHTML = setHTML(false) + Array.from({ length: copies }, () => setHTML(true)).join("");
      chipsEl.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === metric.id)));
      chipsEl.style.setProperty("--shift", `-${w}px`);
      chipsEl.style.setProperty("--dur", `${Math.round(w / 22)}s`);
    };
    layout();
    let lt;
    new ResizeObserver(() => { clearTimeout(lt); lt = setTimeout(layout, 200); }).observe(ticker);
    chipsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      metric = METRICS.find((m) => m.id === b.dataset.id);
      chipsEl.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === metric.id)));
      recolor();
    });

    const toggle = document.getElementById("ticker-toggle");
    let userPaused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apply = () => {
      ticker.classList.toggle("is-paused", userPaused);
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.setAttribute("aria-label", userPaused ? "Play the moving pills" : "Pause the moving pills");
      toggle.title = userPaused ? "Play" : "Pause";
    };
    toggle.addEventListener("click", () => { userPaused = !userPaused; apply(); });
    apply();
  }

  Promise.all([d3.json("assets/data/states.json"), d3.json("assets/data/states-10m.json")]).then(([d, a]) => {
    data = d; atlas = a;
    buildChips();
    srcEl.textContent = metric.src;
    standEl.textContent = metric.stand;
    draw();
    if (window.gsap) gsap.from("#hero-viz path", { opacity: 0, duration: 0.8, stagger: 0.012, ease: "power2.out" });
    new ResizeObserver(() => { clearTimeout(resizeT); resizeT = setTimeout(draw, 150); }).observe(vizEl);
  });
})();
