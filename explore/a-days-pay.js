/* A day's pay: the clock runs from 9 to 5. Federal minimum wage vs. the average top-5% household's income spread over a work year. */
(async function () {
  const data = await (await fetch("../assets/data/states.json")).json();
  const MIN = 7.25, TOP = data.us.top5avg / 2080; // $/hour
  const money = (v) => d3.format("$,.2f")(v), money0 = d3.format("$,.0f");
  const el = { cap: document.getElementById("cap"), kicker: document.getElementById("kicker"), big: document.getElementById("big"), line: document.getElementById("line"), src: document.getElementById("src") };
  const SRC = "Top 5%: average household income spread over a 2,080-hour work year (Census ACS 2023). Minimum wage: federal, $7.25 an hour.";
  const dayMin = MIN * 8, dayTop = TOP * 8;
  const T1 = dayMin / TOP; // hours until the top 5% has earned a full minimum-wage day
  const mins = Math.round(T1 * 60);
  const TXT = [
    { kicker: "Scroll", big: "", line: "One workday. Two ways of earning.", src: "" },
    { kicker: `By 9:${String(mins).padStart(2, "0")} am`, big: money0(dayMin), line: "A minimum-wage worker's entire day. The average top-5% household has already earned it.", src: SRC },
    { kicker: "By 12:00 pm", big: money0(TOP * 3), line: `for the top 5% so far. The minimum-wage worker has earned ${money(MIN * 3)}.`, src: SRC },
    { kicker: "By 5:00 pm", big: (TOP / MIN).toFixed(1) + "×", line: `${money0(dayTop)} against ${money0(dayMin)}. The same eight hours.`, src: SRC },
  ];
  const START = 0.12, END = 0.9;
  const cut = [0, START + (END - START) * (T1 / 8), START + (END - START) * (3 / 8), END];
  const steps = document.getElementById("steps"); steps.innerHTML = TXT.map(() => "<i></i>").join(""); const marks = [...steps.children];
  const clock = document.getElementById("clock"), vMin = document.getElementById("vMin"), vTop = document.getElementById("vTop"), fMin = document.getElementById("fMin"), fTop = document.getElementById("fTop");
  const hm = (h) => { const m = Math.round(h * 60) + 9 * 60; const hh = Math.floor(m / 60), mm = m % 60; return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "am" : "pm"}`; };
  let cur = -1;
  function show(i) { const dir = i >= cur ? 1 : -1; const first = cur < 0; cur = i; marks.forEach((m, k) => m.classList.toggle("on", k === i)); const x = TXT[i]; if (first) { el.kicker.textContent = x.kicker; el.big.innerHTML = x.big; el.line.innerHTML = x.line; el.src.textContent = x.src; } else setCaption(el, x, dir); }
  show(0);
  ScrollTrigger.create({
    trigger: "#stage", start: "top top", end: () => "+=" + innerHeight * 3.2, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: (s) => {
      const p = s.progress, t = 8 * Math.min(1, Math.max(0, (p - START) / (END - START)));
      clock.textContent = hm(t);
      vMin.textContent = money(MIN * t); vTop.textContent = money(TOP * t);
      fTop.style.width = (t / 8) * 100 + "%"; fMin.style.width = ((MIN * t) / (TOP * 8)) * 100 + "%";
      let i = 0; cut.forEach((c, k) => { if (p >= c && k > 0) i = k; });
      if (i !== cur) show(i);
    },
  });
})();
