/* Story 2: Kinetic type. Loaded before story.js; mount(host) runs inside a gsap.context, so its scroll triggers are cleaned up on switch.
   One pinned stage. Full-screen panels arrive as growing circles, words rise into place, numbers count up, and the scroll settles on each
   panel (Apple-style stops). The last panel draws the blue sun logo and fills it in. */
(function () {
  function kinetic(host) {
    const { C, TOP, PUB, fmt, US, worst, fmtNum, splitWords, icon, prep, setDraw, sun, vlink, div, el, clamp, reduce } = window.CWC;
    const [dc0, dcs] = worst("student"); const dc = dc0 === "District of Columbia" ? "the District of Columbia" : dc0;
    const tot = TOP ? TOP.totals : { stories: 467, writers: 123 }; const fol = window.CWC.followers;

    const P = [
      { kind: "say", bg: C.BONE, fg: C.INK, ac: C.BLUE, text: "Behind every number is a person." },
      { kind: "stat", bg: C.INK, fg: "#fff", ac: "#fff", ic: "coin", num: { to: 7.25, dec: 2, pre: "$" }, line: "an hour. The federal minimum wage has not changed since 2009." },
      { kind: "stat", bg: C.BLUE, fg: "#fff", ac: "#fff", ic: "people", num: { to: 40.8, dec: 1, suf: " million" }, line: "people live below the poverty line. One in eight." },
      { kind: "stat", bg: C.BONE, fg: C.INK, ac: C.BLUE, ic: "clock", num: { to: US.top5avg / US.p20, dec: 1, suf: "×" }, line: `The average top-5% household earns ${fmt.money(US.top5avg)} a year. The bottom fifth, ${fmt.money(US.p20)} or less.` },
      { kind: "stat", bg: C.INK, fg: "#fff", ac: "#fff", ic: "cap", num: { to: dcs.student, pre: "$" }, line: `in federal student loans, on average, in ${dc}.` },
      { kind: "pub", bg: C.BLUE, fg: "#fff", ac: "#fff" },
      { kind: "end", bg: C.BONE, fg: C.INK, ac: C.BLUE },
    ];
    const N = P.length, STEP = 2.2, total = N * STEP;

    const stage = div("k-stage" + (reduce ? " k-static" : "")); host.appendChild(stage);
    const nodes = P.map((p, i) => {
      const d = div("k-panel"); d.style.background = p.bg; d.style.color = p.fg; d.style.zIndex = i + 1;
      let inner = "";
      if (p.kind === "say") inner = `<h2 class="k-say">${p.text}</h2><p class="k-cue" aria-hidden="true"><span>Scroll</span><svg viewBox="0 0 12 22" width="12" height="22" fill="none"><path d="M6 1v18M1 14l5 6 5-6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></p>`;
      if (p.kind === "stat") inner = `<p class="k-num"><span data-num>${fmtNum(0, p.num)}</span></p><p class="k-line">${p.line}</p>`;
      if (p.kind === "pub") inner = `<p class="k-trio"><span><b data-n="${tot.stories}">${fmt.num(tot.stories)}</b> stories</span><span><b data-n="${tot.writers}">${fmt.num(tot.writers)}</b> writers</span><span><b data-n="${fol}" data-dec="1" data-suf="K">${fol.toFixed(1)}K</b> followers</span></p><p class="k-line">Coping With Capitalism exists to offer clear and accessible paths to self and collective care.</p>`;
      if (p.kind === "end") inner = `<div class="k-sunbox"></div><p class="k-line">${window.CWC.HIATUS_LINE}</p>${vlink(PUB, "Read the publication", "vlink k-cta")}`;
      d.innerHTML = `<div class="k-in">${inner}</div>`;
      const o = { d, p, words: [], par: [] };
      const inn = d.querySelector(".k-in");
      d.querySelectorAll(".k-say, .k-line").forEach((n) => splitWords(n).forEach((w) => { const m = document.createElement("span"); m.className = "wm"; w.replaceWith(m); m.appendChild(w); o.words.push(w); }));
      if (p.ic) { const ic = icon(p.ic, 1.6, p.ac); ic.svg.classList.add("k-ico"); d.appendChild(ic.svg); o.lens = prep(ic.paths); o.paths = ic.paths; o.par.push(ic.svg); }
      if (p.kind === "stat") { o.num = d.querySelector("[data-num]"); o.par.push(d.querySelector(".k-num")); }
      if (p.kind === "pub") o.nums = [...d.querySelectorAll("b[data-n]")];
      if (p.kind === "end") { const sn = sun("min(34vh, 52vw)"); d.querySelector(".k-sunbox").appendChild(sn.svg); sn.init(); o.sn = sn; }
      stage.appendChild(d); return o;
    });

    if (reduce) { // plain stacked panels, everything visible
      nodes.forEach((o) => { if (o.paths) setDraw(o.paths, o.lens, 1); if (o.sn) o.sn.set(1); if (o.p.num) o.num.textContent = fmtNum(o.p.num.to, o.p.num); if (o.nums) o.nums.forEach((n) => (n.textContent = fmtNum(+n.dataset.n, { dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" }))); });
      return;
    }

    // the progress line and its stops
    const rail = div("k-rail"); rail.innerHTML = '<i class="k-fill"></i>' + P.map((_, i) => `<b style="left:${((i * STEP + 1) / total) * 100}%"></b>`).join(""); stage.appendChild(rail);
    const fill = rail.querySelector(".k-fill"), ticks = [...rail.querySelectorAll("b")];

    // opening state: first panel's words rise on load; everything else waits for the scroll
    nodes.forEach((o, i) => { gsap.set(o.words, { yPercent: 115 }); if (i > 0) gsap.set(o.d, { clipPath: "circle(0% at 50% 62%)" }); else gsap.set(o.d, { clipPath: "circle(150% at 50% 62%)" }); if (o.p.kind === "pub") o.nums.forEach((n) => (n.textContent = fmtNum(0, { dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" }))); });
    gsap.to(nodes[0].words, { yPercent: 0, duration: 1.1, stagger: 0.07, ease: "expo.out", delay: 0.25 });
    gsap.from(nodes[0].d.querySelector(".k-cue"), { opacity: 0, y: 12, duration: 0.9, delay: 1.2, ease: "expo.out" });

    const snaps = P.map((_, i) => Math.min(1, (i * STEP + 1.05) / total));
    const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: stage, start: "top top", end: () => "+=" + innerHeight * N * 1.3, pin: true, scrub: 0.9, anticipatePin: 1, invalidateOnRefresh: true,
      snap: { snapTo: snaps, duration: { min: 0.25, max: 0.8 }, delay: 0.12, ease: "power2.inOut" } } });
    tl.to(fill, { scaleX: 1, duration: total }, 0).to(nodes[0].d.querySelector(".k-cue"), { opacity: 0, duration: 0.4 }, 0.25);
    nodes.forEach((o, i) => {
      const t = i * STEP;
      if (i > 0) tl.to(rail, { color: o.p.fg, duration: 0.3, ease: "power1.out" }, t - 0.25);
      if (i > 0) tl.fromTo(o.d, { clipPath: "circle(0% at 50% 62%)" }, { clipPath: "circle(150% at 50% 62%)", duration: 1.0, ease: "power3.inOut" }, t - 0.55);
      if (i > 0) tl.to(o.words, { yPercent: 0, duration: 0.8, stagger: 0.035, ease: "expo.out" }, t + 0.05);
      if (o.paths) { const g = { v: 0 }; tl.to(g, { v: 1, duration: 1.1, ease: "power2.inOut", onUpdate: () => setDraw(o.paths, o.lens, g.v) }, t + 0.05); }
      if (o.num) { const b = { v: 0 }; tl.to(b, { v: o.p.num.to, duration: 0.95, ease: "power3.out", onUpdate: () => (o.num.textContent = fmtNum(b.v, o.p.num)) }, t + 0.1); }
      if (o.nums) o.nums.forEach((n, k) => { const b = { v: 0 }; tl.to(b, { v: +n.dataset.n, duration: 1.0, ease: "power3.out", onUpdate: () => (n.textContent = fmtNum(b.v, { dec: +n.dataset.dec || 0, suf: n.dataset.suf || "" })) }, t + 0.1 + k * 0.12); });
      if (o.sn) { const g = { v: 0 }; tl.to(g, { v: 1, duration: 1.4, ease: "power1.inOut", onUpdate: () => o.sn.set(g.v) }, t + 0.05); }
      if (i < N - 1) tl.to(o.words, { yPercent: -115, duration: 0.4, stagger: 0.015, ease: "power2.in" }, t + 1.72);
    });
    tl.to({}, { duration: 0.001 }, total - 0.001);
    tl.eventCallback("onUpdate", () => { const p = tl.progress() * total; ticks.forEach((b, i) => b.classList.toggle("on", p >= i * STEP - 0.4)); });

    // a little pointer parallax on devices that have a pointer
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const movers = nodes.flatMap((o) => o.par);
      const qs = movers.map((m) => ({ x: gsap.quickTo(m, "x", { duration: 0.9, ease: "power3.out" }), y: gsap.quickTo(m, "y", { duration: 0.9, ease: "power3.out" }) }));
      stage.addEventListener("pointermove", (e) => { const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5; qs.forEach((q, i) => { const d = i % 2 ? 22 : 14; q.x(nx * -d); q.y(ny * -d); }); });
    }
  }
  window.CWC_STORIES = [{ name: "Kinetic type", mount: kinetic }];
})();
