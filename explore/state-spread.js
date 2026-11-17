/* State by state: the income range from the bottom fifth to the top fifth, for every state. Census ACS 2023. */
(async function () {
  const data = await (await fetch("../assets/data/states.json")).json();
  const BLUE = "#1250c4", INK = "#111", DIM = "#a3a29d";
  const money = d3.format("$,.0f");
  const rows = Object.entries(data.states).sort((a, b) => b[1].median - a[1].median);
  const widest = Object.entries(data.states).sort((a, b) => b[1].ratio - a[1].ratio)[0];
  const poorest = Object.entries(data.states).sort((a, b) => a[1].p20 - b[1].p20)[0];
  const SRC = "Household income at the 20th and 80th percentile, by state. U.S. Census Bureau, American Community Survey 2023 (1-year).";
  const TXT = [
    { kicker: "Scroll", big: "", line: "51 places. One country.", src: "" },
    { kicker: `The widest gap · ${widest[0]}`, big: widest[1].ratio.toFixed(1) + "×", line: `The top fifth earn ${money(widest[1].p80)} or more. The bottom fifth, ${money(widest[1].p20)} or less.`, src: SRC },
    { kicker: `The lowest floor · ${poorest[0]}`, big: money(poorest[1].p20), line: "or less, a year, for the bottom fifth of households.", src: SRC },
  ];
  const el = { cap: document.getElementById("cap"), kicker: document.getElementById("kicker"), big: document.getElementById("big"), line: document.getElementById("line"), src: document.getElementById("src") };
  const steps = document.getElementById("steps"); steps.innerHTML = TXT.map(() => "<i></i>").join(""); const marks = [...steps.children];
  const chartEl = document.getElementById("chart");
  let cur = -1, g, rowEls;
  function draw() {
    const r = chartEl.getBoundingClientRect(); const w = Math.max(280, r.width), h = Math.max(180, r.height);
    chartEl.innerHTML = ""; const svg = d3.select(chartEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const x = d3.scaleLinear().domain([15000, 260000]).range([34, w - 120]);
    const rh = h / rows.length;
    g = svg.append("g");
    rowEls = g.selectAll("g").data(rows).join("g").attr("transform", (d, i) => `translate(0,${i * rh + rh / 2})`).attr("opacity", 0);
    rowEls.append("text").attr("x", 0).attr("dy", "0.34em").attr("font-size", Math.min(10, rh * 0.9)).attr("fill", DIM).attr("font-family", "JetBrains Mono, monospace").text((d) => d[0].slice(0, 2).toUpperCase() === "DI" ? "DC" : d[0].slice(0, 2).toUpperCase());
    rowEls.append("line").attr("class", "bar").attr("x1", (d) => x(d[1].p20)).attr("x2", (d) => x(d[1].p80)).attr("stroke", BLUE).attr("stroke-width", Math.max(2, rh * 0.45)).attr("stroke-linecap", "round").attr("opacity", 0.4);
    rowEls.append("circle").attr("cx", (d) => x(d[1].median)).attr("r", Math.max(1.8, rh * 0.32)).attr("fill", INK);
    rowEls.append("text").attr("class", "lab").attr("x", (d) => x(d[1].p80) + 10).attr("dy", "0.34em").attr("font-size", Math.max(9, Math.min(12, rh))).attr("fill", INK).attr("opacity", 0).text((d) => d[0]);
    highlight(cur);
    reveal(prog);
  }
  let prog = 0;
  function reveal(p) { // rows appear top to bottom over the first half of the scroll
    const n = rows.length * Math.min(1, p / 0.5);
    rowEls.attr("opacity", (d, i) => Math.max(0, Math.min(1, n - i)));
  }
  function highlight(i) {
    if (!rowEls) return;
    const name = i === 1 ? widest[0] : i === 2 ? poorest[0] : null;
    rowEls.select(".bar").attr("stroke", (d) => (d[0] === name ? BLUE : BLUE)).attr("opacity", (d) => (name ? (d[0] === name ? 1 : 0.15) : 0.4));
    rowEls.select(".lab").attr("opacity", (d) => (d[0] === name ? 1 : 0));
  }
  function show(i) { const dir = i >= cur ? 1 : -1; const first = cur < 0; cur = i; marks.forEach((m, k) => m.classList.toggle("on", k === i)); highlight(i); const x = TXT[i]; if (first) { el.kicker.textContent = x.kicker; el.big.innerHTML = x.big; el.line.innerHTML = x.line; el.src.textContent = x.src; } else setCaption(el, x, dir); }
  draw(); show(0);
  new ResizeObserver(() => { clearTimeout(window.__rt); window.__rt = setTimeout(draw, 150); }).observe(chartEl);
  ScrollTrigger.create({
    trigger: "#stage", start: "top top", end: () => "+=" + innerHeight * 3, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: (s) => { prog = s.progress; reveal(prog); const i = prog >= 0.78 ? 2 : prog >= 0.55 ? 1 : 0; if (i !== cur) show(i); },
  });
})();
