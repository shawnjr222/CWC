/* 100 households: who holds the wealth, then who the people are. Federal Reserve Distributive Financial Accounts, 2024, rounded. */
(function () {
  const BLUE = "#1250c4", MID = "#6f8fd6", LIGHT = "#c3d0ee", INK = "#111", GREY = "#d9d7d1";
  const G = [
    { id: "top1", wealth: 31, people: 1, color: BLUE },
    { id: "next9", wealth: 36, people: 9, color: MID },
    { id: "mid40", wealth: 30, people: 40, color: LIGHT },
    { id: "bot50", wealth: 3, people: 50, color: INK },
  ];
  const seq = (k) => G.flatMap((g) => Array(g[k]).fill(g.color));
  const W = seq("wealth"), P = seq("people");
  const grid = document.getElementById("grid");
  grid.innerHTML = Array.from({ length: 100 }, () => '<i class="dot"></i>').join("");
  const dots = [...grid.children];
  const el = { cap: document.getElementById("cap"), kicker: document.getElementById("kicker"), big: document.getElementById("big"), line: document.getElementById("line"), src: document.getElementById("src") };
  const SRC = "Federal Reserve Distributive Financial Accounts, 2024, rounded. Each dot is about 1%.";
  const upto = (n) => (i) => (i < n ? W[i] : GREY);
  const STEPS = [
    { color: () => GREY, t: { kicker: "Scroll", big: "100", line: "Picture 100 American households.", src: "" } },
    { color: () => GREY, t: { kicker: "Each dot is 1%", big: "1%", line: "of everything American households own.", src: SRC } },
    { color: upto(31), t: { kicker: "The top 1%", big: "31", line: "of the 100 dots.", src: SRC } },
    { color: upto(67), t: { kicker: "The top 10%", big: "67", line: "Two thirds of all the wealth.", src: SRC } },
    { color: upto(97), t: { kicker: "The middle 40%", big: "30", line: "share what is left.", src: SRC } },
    { color: (i) => W[i], t: { kicker: "The bottom half", big: "3", line: "dots for half of all households.", src: SRC } },
    { color: (i) => P[i], t: { kicker: "Now count the people", big: "50%", line: "of households. Three percent of the wealth.", src: SRC } },
  ];
  const N = STEPS.length;
  const steps = document.getElementById("steps");
  steps.innerHTML = Array.from({ length: N }, () => "<i></i>").join("");
  const marks = [...steps.children];
  let cur = -1;
  function paint(i, instant) {
    const f = STEPS[i].color;
    dots.forEach((d, k) => {
      const c = f(k);
      if (d.__c === c) return; d.__c = c;
      gsap.killTweensOf(d);
      if (instant) { gsap.set(d, { backgroundColor: c }); return; }
      gsap.to(d, { backgroundColor: c, duration: 0.45, delay: (k % 100) * 0.007, ease: "power2.out" });
      gsap.fromTo(d, { scale: 0.7 }, { scale: 1, duration: 0.6, delay: (k % 100) * 0.007, ease: "back.out(2)", overwrite: false });
    });
  }
  function show(i) {
    const dir = i >= cur ? 1 : -1; const first = cur < 0; cur = i;
    marks.forEach((m, k) => m.classList.toggle("on", k === i));
    paint(i, first);
    const t = STEPS[i].t;
    if (first) { el.kicker.textContent = t.kicker; el.big.innerHTML = t.big; el.line.innerHTML = t.line; el.src.textContent = t.src; } else setCaption(el, t, dir);
  }
  show(0);
  ScrollTrigger.create({
    trigger: "#stage", start: "top top", end: () => "+=" + innerHeight * N * 0.85, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: (s) => { const i = Math.min(N - 1, Math.floor(s.progress * N)); if (i !== cur) show(i); },
  });
})();
