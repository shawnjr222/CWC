/* The gap: three bars grow with the scroll, then the camera pulls back. Census ACS 2023 household income, national. */
(async function () {
  const data = await (await fetch("../assets/data/states.json")).json();
  const { p20, p80, top5avg } = data.us;
  const money = d3.format("$,.0f");
  const ratio80 = p80 / p20, ratio5 = top5avg / p20;
  const el = { cap: document.getElementById("cap"), kicker: document.getElementById("kicker"), big: document.getElementById("big"), line: document.getElementById("line"), src: document.getElementById("src") };
  const SRC = "Household income, United States. U.S. Census Bureau, American Community Survey 2023 (1-year).";
  const TXT = [
    { kicker: "Scroll", big: "", line: "One country. One year. Three households.", src: "" },
    { kicker: "A household in the bottom fifth", big: money(p20), line: "a year, or less.", src: SRC },
    { kicker: "A household in the top fifth", big: ratio80.toFixed(1) + "×", line: `${money(p80)} a year, or more. ${ratio80.toFixed(1)} times the bottom.`, src: SRC },
    { kicker: "The top 5%, on average", big: ratio5.toFixed(1) + "×", line: `${money(top5avg)} a year. About sixteen times the bottom fifth.`, src: SRC },
  ];
  const N = TXT.length;
  let cur = -1;
  const chart = document.getElementById("chart"), bars = document.getElementById("bars");
  const b20 = document.getElementById("b20"), b80 = document.getElementById("b80"), b5 = document.getElementById("b5");
  const t = (id) => document.querySelector("#" + id + " b");
  const steps = document.getElementById("steps"); steps.innerHTML = Array.from({ length: N }, () => "<i></i>").join(""); const marks = [...steps.children];
  gsap.set([b20, b80, b5], { height: 0 });
  document.querySelectorAll(".tag").forEach((x) => (x.style.opacity = 0));

  const H = () => chart.clientHeight;
  const unit = () => (H() * 0.78) / p80;           // p80 fills ~78% of the chart at first
  const h = (v) => unit() * v;
  const finalScale = () => (H() * 0.8) / h(top5avg); // pull back so the 5% bar fits
  const n = { a: 0, b: 0, c: 0 };
  const setInv = () => { const s = gsap.getProperty(bars, "scaleY"); bars.style.setProperty("--inv", String(1 / s)); };

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: "#stage", start: "top top", end: () => "+=" + innerHeight * N * 0.85, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => { const i = Math.min(N - 1, Math.floor(s.progress * N)); if (i !== cur) show(i); } },
  });
  tl.addLabel("a", 0.5)
    .to(".b20 .tag", { opacity: 1, duration: 0.1 }, "a+=0.1")
    .to(b20, { height: () => h(p20), duration: 1, onUpdate: setInv }, "a")
    .to(n, { a: p20, duration: 1, onUpdate: () => (t("t20").textContent = money(n.a)) }, "a")
    .addLabel("b", ">+0.4")
    .to("#t80", { opacity: 1, duration: 0.1 }, "b+=0.1")
    .to(b80, { height: () => h(p80), duration: 1, onUpdate: setInv }, "b")
    .to(n, { b: p80, duration: 1, onUpdate: () => (t("t80").textContent = money(n.b)) }, "b")
    .addLabel("c", ">+0.4")
    .to("#t5", { opacity: 1, duration: 0.1 }, "c+=0.1")
    .to(b5, { height: () => h(top5avg), duration: 1.6, onUpdate: setInv }, "c")
    .to(bars, { scaleY: () => finalScale(), duration: 1.6, onUpdate: setInv }, "c")
    .to(n, { c: top5avg, duration: 1.6, onUpdate: () => (t("t5").textContent = money(n.c)) }, "c")
    .to({}, { duration: 0.5 });
  gsap.set(bars, { transformOrigin: "50% 100%" });
  document.querySelectorAll(".tag").forEach((x) => (x.style.transform = "translateX(-50%) scaleY(var(--inv,1))"));
  document.getElementById("t20").style.opacity = 0;

  function show(i) {
    const dir = i >= cur ? 1 : -1; const first = cur < 0; cur = i;
    marks.forEach((m, k) => m.classList.toggle("on", k === i));
    const x = TXT[i];
    if (first) { el.kicker.textContent = x.kicker; el.big.innerHTML = x.big; el.line.innerHTML = x.line; el.src.textContent = x.src; } else setCaption(el, x, dir);
  }
  show(0);
})();
