/* 40.8 million: one dot is 100,000 people living below the federal poverty line. Scroll to fill them; optional ticks. Census ACS 2023. */
(function () {
  const POOR = 40763043, PER = 100000, DOTS = Math.ceil(POOR / PER); // 408
  const el = { cap: document.getElementById("cap"), kicker: document.getElementById("kicker"), big: document.getElementById("big"), line: document.getElementById("line"), src: document.getElementById("src") };
  const SRC = "People below the federal poverty line, United States. U.S. Census Bureau, American Community Survey 2023 (1-year).";
  const field = document.getElementById("field");
  field.innerHTML = Array.from({ length: DOTS }, () => "<i></i>").join("");
  const dots = [...field.children];
  const steps = document.getElementById("steps");
  const set = (t) => { el.kicker.textContent = t.kicker; el.line.innerHTML = t.line; el.src.textContent = t.src; };
  const TXT = [
    { kicker: "Scroll", line: "Each dot is 100,000 people.", src: "" },
    { kicker: "Living below the federal poverty line", line: "Each dot is 100,000 people.", src: SRC },
    { kicker: "40.8 million people", line: "One in eight Americans.", src: SRC },
  ];
  steps.innerHTML = TXT.map(() => "<i></i>").join(""); const marks = [...steps.children];
  let lit = 0, stage = -1;
  el.big.textContent = "0";
  const fmt = d3.format(",");

  // optional sound: a soft tick for each dot that lights
  const snd = document.getElementById("snd"); let ctx = null, on = false;
  snd.addEventListener("click", () => {
    on = !on; snd.setAttribute("aria-pressed", String(on)); snd.textContent = on ? "Sound on" : "Sound off";
    if (on && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (on && ctx.state === "suspended") ctx.resume();
  });
  const tick = (i) => {
    if (!on || !ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = "triangle"; o.frequency.value = 320 + (i / DOTS) * 520;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.08);
  };
  function setStage(s) {
    if (s === stage) return; const dir = s >= stage ? 1 : -1; const first = stage < 0; stage = s;
    marks.forEach((m, k) => m.classList.toggle("on", k === s));
    if (first) set(TXT[s]); else window.setCaption({ cap: el.cap, kicker: el.kicker, big: { set innerHTML(v) {} }, line: el.line, src: el.src }, { kicker: TXT[s].kicker, big: null, line: TXT[s].line, src: TXT[s].src }, dir);
  }
  setStage(0);
  ScrollTrigger.create({
    trigger: "#stage", start: "top top", end: () => "+=" + innerHeight * 3, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: (s) => {
      const p = Math.min(1, Math.max(0, (s.progress - 0.06) / 0.84));
      const n = Math.round(p * DOTS);
      if (n !== lit) {
        const up = n > lit, a = Math.min(n, lit), b = Math.max(n, lit);
        for (let i = a; i < b; i++) dots[i].classList.toggle("on", up);
        if (up) for (let i = Math.max(lit, n - 4); i < n; i++) tick(i);
        lit = n;
        const people = Math.min(POOR, Math.round(n * PER));
        el.big.textContent = n >= DOTS ? "40.8 million" : fmt(people);
      }
      setStage(p >= 0.999 ? 2 : p > 0 ? 1 : 0);
    },
  });
})();
