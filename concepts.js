/* Stories 2 to 6. Loaded before story.js; each mount(host) runs inside a gsap.context, so its scroll triggers are cleaned up on switch.
   All of them draw with the same blue line and finish on the blue sun logo filling in. */
(function () {
  const K = () => window.CWC;
  const div = (cls, html) => { const d = document.createElement("div"); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
  const pinTL = (stage, vh, extra = {}) => gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: stage, start: "top top", end: () => "+=" + innerHeight * vh, pin: true, scrub: 1.1, anticipatePin: 1, invalidateOnRefresh: true, ...extra } });
  const cap = (kicker, big, line, src) => div("c-cap", `<p class="mono c-kick">${kicker}</p>${big ? `<p class="c-big">${big}</p>` : ""}<p class="c-line">${line}</p>${src ? `<p class="mono c-src">${src}</p>` : ""}`);
  const prox = (fn, tl, at, dur, ease = "none") => { const o = { v: 0 }; tl.to(o, { v: 1, duration: dur, ease, onUpdate: () => fn(o.v) }, at); return o; };

  /* a wavy line drawn in real pixels (no scaling), so dash lengths are exact. Returns its length. */
  function wave(path, w, h, base, amp, periods, phase = 0.6) {
    const n = Math.max(8, Math.round(periods * 8)), pts = [];
    for (let i = 0; i <= n; i++) pts.push([(i / n) * w, base * h + amp * h * Math.sin((i / n) * periods * Math.PI * 2 + phase)]);
    path.setAttribute("d", d3.line().curve(d3.curveBasis)(pts));
    const L = path.getTotalLength(); path.style.strokeDasharray = L; return L;
  }

  /* the headline facts every story draws on */
  function facts() {
    const k = K(), { MEAS, worst, fmt, MINW, TOPH, US, POOR } = k;
    const w = (key) => { const [name, s] = worst(key); return { name, val: MEAS[key].fmt(s[key]) }; };
    return {
      student: { ...w("student"), m: MEAS.student }, uninsured: { ...w("uninsured"), m: MEAS.uninsured }, housing: { ...w("housing"), m: MEAS.housing }, food: { ...w("food"), m: MEAS.food },
      wage: { val: fmt.money2(MINW), line: "an hour. The federal minimum wage has not changed since 2009.", src: "U.S. Department of Labor." },
      poor: { val: "40.8 million", line: "people in the United States live below the poverty line. One in eight.", src: "U.S. Census Bureau, American Community Survey 2023." },
      day: { val: fmt.money(MINW * 8), line: "A minimum-wage worker's entire day. The average top-5% household has already earned it.", src: "Top 5%: average household income over a 2,080-hour year. Minimum wage: federal, $7.25." },
      gap: { val: (US.top5avg / US.p20).toFixed(1) + "×", line: `The average top-5% household earns ${fmt.money(US.top5avg)}. The bottom fifth, ${fmt.money(US.p20)} or less.`, src: "U.S. Census Bureau, American Community Survey 2023." },
    };
  }

  /* ============ STORY 2: Line drawings, pinned. One illustration at a time, drawn by the line, ending in the sun. ============ */
  function story2(host) {
    const { icon, prep, setDraw, sun, C } = K(), F = facts();
    const stage = div("c-stage c2"); host.appendChild(stage);
    const count = div("c2-count mono", "01 / 07"), art = div("c2-art"), caps = div("c2-caps");
    const rule = K().el("svg", { class: "c2-rule", "aria-hidden": "true" });
    const rp = K().el("path", { fill: "none", stroke: C.BLUE, "stroke-width": 2, "stroke-linecap": "round" }); rule.appendChild(rp);
    stage.append(count, art, caps, rule);
    const steps = [
      { ic: "people", k: "It starts here", big: "", line: "Start with a person.", src: "" },
      { ic: "cap", k: `Student debt · highest in ${F.student.name}`, big: F.student.val, line: F.student.m.line, src: F.student.m.src },
      { ic: "heart", k: `No health insurance · highest in ${F.uninsured.name}`, big: F.uninsured.val, line: F.uninsured.m.line, src: F.uninsured.m.src },
      { ic: "house", k: `Housing insecurity · highest in ${F.housing.name}`, big: F.housing.val, line: F.housing.m.line, src: F.housing.m.src },
      { ic: "plate", k: `Food insecurity · highest in ${F.food.name}`, big: F.food.val, line: F.food.m.line, src: F.food.m.src },
      { ic: "coin", k: "The wage floor", big: F.wage.val, line: F.wage.line, src: F.wage.src },
      { ic: "clock", k: "A day's pay", big: F.day.val, line: F.day.line, src: F.day.src },
    ];
    const items = steps.map((s) => { const i = icon(s.ic, 2.2); art.appendChild(i.svg); const c = cap(s.k, s.big, s.line, s.src); caps.appendChild(c); return { ...i, c, lens: prep(i.paths) }; });
    const last = cap("Coping With Capitalism", "", "Behind every number is a person.", ""); caps.appendChild(last);
    const sn = sun("min(46vh, 70vw)"); sn.svg.classList.add("c2-sun"); art.appendChild(sn.svg); sn.init();
    gsap.set([...items.map((x) => x.c), last], { opacity: 0, y: 18 });
    let rL = 1; const build2 = () => { const w = rule.clientWidth || innerWidth, h = 24; rule.setAttribute("viewBox", `0 0 ${w} ${h}`); rL = wave(rp, w, h, 0.5, 0.3, Math.max(2, w / 360)); rp.style.strokeDashoffset = rL; };
    build2();
    const tl = pinTL(stage, 10.5, { onRefresh: build2 });
    prox((v) => (rp.style.strokeDashoffset = rL * (1 - v)), tl, 0, 8.6);
    items.forEach((it, i) => {
      const t = i;
      tl.call(() => (count.textContent = `${String(i + 1).padStart(2, "0")} / 07`), null, t)
        .to(it.c, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, t + 0.05);
      prox((v) => setDraw(it.paths, it.lens, v), tl, t, 0.5);
      tl.to(it.c, { opacity: 0, y: -16, duration: 0.2, ease: "power2.in" }, t + 0.8);
      prox((v) => it.paths.forEach((p, k) => (p.style.strokeDashoffset = -it.lens[k] * v)), tl, t + 0.72, 0.28, "power1.in");
    });
    tl.call(() => (count.textContent = "07 / 07"), null, 7).to(last, { opacity: 1, y: 0, duration: 0.3 }, 7.3);
    prox((v) => sn.set(v), tl, 7, 1.3, "power1.inOut");
    tl.to({}, { duration: 0.6 }, 8.3);
  }

  /* ============ STORY 3: The stack. The ten most-applauded stories, as cards that pile up as you scroll. ============ */
  function story3(host) {
    const { sun, C, TOP, PUB, ARROW, reduce, clamp } = K();
    const wrap = div("c3"); host.appendChild(wrap);
    const top = (TOP && TOP.top) || [];
    const nf = (n) => d3.format(",")(n);
    const intro = div("c3-intro", `<div class="c3-intro-in"><p class="mono c-kick">Coping With Capitalism · on Medium</p><h3 class="c3-read" aria-label="Read.">${"Read.".split("").map((ch) => `<span class="ch"><i>${ch}</i></span>`).join("")}</h3><p class="c-line">${TOP ? `${nf(TOP.totals.stories)} stories from ${nf(TOP.totals.writers)} writers, each one a path to self and collective care. These ten were applauded the most.` : "Stories from writers around the world, each one a path to self and collective care."}</p><p class="mono c-src">Scroll</p></div>`);
    wrap.appendChild(intro);
    const stack = div("c3-stack"); wrap.appendChild(stack);
    const palette = [["#fff", C.INK], [C.PALE, C.INK], ["#fff", C.INK], [C.BLUE, "#fff"], ["#fff", C.INK]];
    const cards = top.map((s, i) => {
      const [bg, fg] = palette[i % palette.length];
      const d = div("c3-card", `<div class="c3-card-in" style="background:${bg};color:${fg}"><span class="c3-rank" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div class="c3-body"><p class="mono c3-meta" style="opacity:.65">${s.date} · ${nf(s.claps)} claps</p><h4>${s.title}</h4><p class="c3-by">by ${s.author}</p><a class="vlink c3-link" style="color:${fg}" href="${s.url}" target="_blank" rel="noopener">Read on Medium${K().ARROW}</a></div></div>`);
      d.style.setProperty("--i", i); stack.appendChild(d); return d;
    });
    const endBox = div("sun-end"); const sn = sun("min(46vw, 300px)"); endBox.append(sn.svg); endBox.insertAdjacentHTML("beforeend", `<p class="mono">Coping With Capitalism</p><a class="vlink" href="${PUB}" target="_blank" rel="noopener">Read the whole publication${K().ARROW}</a>`); wrap.appendChild(endBox); sn.init();
    // title letters rise
    const chs = [...intro.querySelectorAll(".ch i")]; gsap.set(chs, { yPercent: 115 });
    gsap.to(chs, { yPercent: 0, duration: 1.0, stagger: 0.07, ease: "power4.out", delay: 0.2 });
    gsap.from(intro.querySelectorAll(".c-line, .c-kick, .c-src"), { opacity: 0, y: 16, duration: 0.9, stagger: 0.12, delay: 0.9, ease: "power3.out" });
    // each card settles back as the next one rides over it
    cards.forEach((d, i) => {
      const inn = d.querySelector(".c3-card-in");
      const next = cards[i + 1]; if (!next || reduce) return;
      gsap.to(inn, { scale: 0.92, opacity: 0.5, ease: "none", scrollTrigger: { trigger: next, start: "top 85%", end: "top 18%", scrub: true } });
    });
    if (!reduce) ScrollTrigger.create({ trigger: endBox, start: "top 85%", end: "center 45%", scrub: 0.6, onUpdate: (s) => sn.set(s.progress) }); else sn.set(1);
  }

  /* ============ STORY 4: Kinetic type. Circle wipes between full-screen colour panels, with words that rise into place. ============ */
  function story4(host) {
    const { icon, prep, setDraw, sun, C } = K(), F = facts();
    const stage = div("c-stage c4"); host.appendChild(stage);
    const P = [
      { bg: C.BONE, fg: C.INK, ac: C.BLUE, k: "Listen", big: "", line: "Behind every number is a person.", ic: null },
      { bg: C.INK, fg: "#fff", ac: "#fff", k: "The wage floor", big: F.wage.val, line: "an hour. Unchanged since 2009.", ic: "coin" },
      { bg: C.BLUE, fg: "#fff", ac: "#fff", k: "Poverty", big: "40.8 million", line: "people. One in eight Americans.", ic: "people" },
      { bg: C.BONE, fg: C.INK, ac: C.BLUE, k: "The gap", big: F.gap.val, line: "The top 5% household against the bottom fifth.", ic: "clock" },
      { bg: C.INK, fg: "#fff", ac: "#fff", k: "Student debt", big: F.student.val, line: `average federal loan in ${F.student.name}.`, ic: "cap" },
      { bg: C.BONE, fg: C.INK, ac: C.BLUE, k: "Coping With Capitalism", big: "", line: "These voices are still here.", ic: null, sun: true },
    ];
    const split = (s) => s.split(" ").map((w) => `<span class="w"><i>${w}&nbsp;</i></span>`).join("");
    const panels = P.map((p, i) => {
      const d = div("c4-panel", `<div class="c4-in" style="color:${p.fg}"><p class="mono c-kick" style="color:${p.fg};opacity:.7">${p.k}</p>${p.big ? `<p class="c4-big">${split(p.big)}</p>` : ""}<p class="c4-line">${split(p.line)}</p></div>`);
      d.style.background = p.bg; d.style.zIndex = i + 1; stage.appendChild(d);
      const o = { d, words: [...d.querySelectorAll(".w i")] };
      if (p.ic) { const ic = icon(p.ic, 1.8); ic.paths.forEach((x) => x.setAttribute("stroke", p.ac)); ic.svg.classList.add("c4-ico"); d.appendChild(ic.svg); o.lens = prep(ic.paths); o.paths = ic.paths; }
      if (p.sun) { const sn = sun("min(38vh, 56vw)"); sn.svg.classList.add("c4-sun"); d.appendChild(sn.svg); sn.init(); o.sn = sn; }
      return o;
    });
    const tl = pinTL(stage, 10);
    panels.forEach((o, i) => {
      const t = i * 1.6;
      gsap.set(o.words, { yPercent: 115 });
      if (i > 0) tl.fromTo(o.d, { clipPath: "circle(0% at 50% 62%)" }, { clipPath: "circle(150% at 50% 62%)", duration: 0.9, ease: "power2.inOut" }, t - 0.5);
      else gsap.set(o.d, { clipPath: "circle(150% at 50% 62%)" });
      tl.to(o.words, { yPercent: 0, duration: 0.55, stagger: 0.05, ease: "power3.out" }, i ? t + 0.05 : 0);
      if (o.paths) prox((v) => setDraw(o.paths, o.lens, v), tl, t + 0.1, 1.0);
      if (o.sn) prox((v) => o.sn.set(v), tl, t + 0.1, 1.4, "power1.inOut");
      if (i < panels.length - 1) tl.to(o.words, { yPercent: -115, duration: 0.4, stagger: 0.03, ease: "power2.in" }, t + 1.15);
    });
    tl.to({}, { duration: 0.6 });
  }

  /* ============ STORY 5: What it made. The nine things this publication did, each revealed by a mask that lifts the picture into place. ============ */
  function story5(host) {
    const { sun, C, PUB, ARROW, TOP } = K();
    const stage = div("c-stage c5m"); host.appendChild(stage);
    const IMG = "assets/web/";
    const items = [
      { d: "03.28.2023", t: "The Medium publication", p: "Where it began: a place for clear and accessible paths to self and collective care.", img: "p-pub.jpg", link: ["Read the publication", PUB] },
      { d: "04.28.2023", t: "A workshop with incarcerated youth", p: "Design thinking, taught to young people inside the system.", img: "p-workshop.jpg" },
      { d: "11.20.2023", t: "The interview series", p: "Conversations about work, money and care.", img: "p-interview.jpg", link: ["Read the interviews", "https://shawnjr.medium.com/list/cwc-interview-series-ad4f8055a587"] },
      { d: "03.01.2024", t: "This is how we cope", p: "A card game for talking about what we carry.", img: "p-game.jpg", link: ["Play the game", "https://thisishowwecope.com"] },
      { d: "03.19.2024", t: "An editors panel with Medium", p: "Publication editors, in conversation.", img: "p-panel.jpg" },
      { d: "08.17.2024", t: "Medium Day 2024", p: "A talk on strategies for self and collective care.", img: "p-md24.jpg" },
      { d: "Summer 2025", t: "Guest editor for Paper Zero", p: "Putting a journal together with other writers.", img: "p-paper.jpg", link: ["Read the journal", "https://ko-fi.com/s/d4c96492d7"] },
      { d: "09.19.2025", t: "Medium Day 2025", p: "Back on stage to talk about mutual care.", img: "p-md25.jpg" },
      { d: "10.01.2025", t: "Coping With Art", p: "Care, through art.", img: "p-art.jpg" },
    ];
    const N = items.length;
    stage.innerHTML = `<div class="c5m-intro"><p class="mono c-kick">What it is for</p><p class="c5m-mission">Coping With Capitalism exists to offer clear and accessible paths to self and collective care.</p><p class="mono c-src">${TOP ? `${d3.format(",")(TOP.totals.stories)} stories · ${d3.format(",")(TOP.totals.writers)} writers · 2023 to 2025` : "2023 to 2025"}</p></div>
      <div class="c5m-frame"></div><div class="c5m-texts"></div><div class="c5m-count mono">01 / 09</div><div class="c5m-end"></div>`;
    const intro = stage.querySelector(".c5m-intro"), frame = stage.querySelector(".c5m-frame"), texts = stage.querySelector(".c5m-texts"), count = stage.querySelector(".c5m-count"), end = stage.querySelector(".c5m-end");
    const imgs = items.map((it) => { const f = div("c5m-img", `<img src="${IMG}${it.img}" alt="${it.t}" />`); frame.appendChild(f); return f; });
    const txts = items.map((it, i) => { const t = div("c5m-txt", `<p class="mono c-kick">${String(i + 1).padStart(2, "0")} · ${it.d}</p><h4>${it.t}</h4><p class="c-line">${it.p}</p>${it.link ? `<a class="vlink" href="${it.link[1]}" target="_blank" rel="noopener">${it.link[0]}${ARROW}</a>` : ""}`); texts.appendChild(t); return t; });
    const sn = sun("min(40vh, 52vw)"); end.appendChild(sn.svg); end.insertAdjacentHTML("beforeend", `<p class="mono">Coping With Capitalism</p><p class="c-line">On hiatus. Still here.</p>`); sn.init();
    gsap.set(imgs, { clipPath: "inset(100% 0% 0% 0% round 22px)" }); gsap.set(imgs.map((x) => x.firstChild), { scale: 1.35 }); gsap.set(txts, { opacity: 0, y: 30 }); gsap.set(end, { opacity: 0 }); gsap.set([frame, count], { opacity: 0 });
    const tl = pinTL(stage, 12);
    // the mission line leaves, the frame arrives
    tl.to(intro, { opacity: 0, y: -30, duration: 0.7, ease: "power2.in" }, 0.9).to([frame, count], { opacity: 1, duration: 0.5 }, 1.2);
    items.forEach((it, i) => {
      const t = 1.4 + i * 1.15;
      tl.call(() => (count.textContent = `${String(i + 1).padStart(2, "0")} / 09`), null, t)
        .to(imgs[i], { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 0.9, ease: "power3.inOut" }, t)
        .to(imgs[i].firstChild, { scale: 1, duration: 1.4, ease: "power2.out" }, t)
        .to(txts[i], { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, t + 0.3);
      if (i < N - 1) { tl.to(txts[i], { opacity: 0, y: -24, duration: 0.4, ease: "power2.in" }, t + 0.85).to(imgs[i], { yPercent: -8, opacity: 0.0, duration: 0.5, ease: "power1.in" }, t + 1.05); }
    });
    const tEnd = 1.4 + N * 1.15;
    tl.to(txts[N - 1], { opacity: 0, y: -24, duration: 0.4 }, tEnd - 0.2).to([frame, count], { opacity: 0, duration: 0.5 }, tEnd - 0.1).to(end, { opacity: 1, duration: 0.5 }, tEnd + 0.2);
    prox((v) => sn.set(v), tl, tEnd + 0.2, 1.4, "power1.inOut");
    tl.to({}, { duration: 0.6 }, tEnd + 1.6);
  }

  /* ============ STORY 6: Start with one. Pull back to a hundred households, then fall into a single person, who becomes the sun. ============ */
  function story6(host) {
    const { sun, C } = K();
    const stage = div("c-stage c6"); host.appendChild(stage);
    const dotsBox = div("c6-dots"), caps = div("c6-caps"); stage.append(dotsBox, caps);
    dotsBox.innerHTML = Array.from({ length: 100 }, (_, i) => `<i${i === 99 ? ' class="me"' : ""}></i>`).join(""); const dots = [...dotsBox.children], me = dots[99];
    const sn = sun("min(42vh, 60vw)"); sn.svg.classList.add("c6-sun"); stage.appendChild(sn.svg); sn.init();
    const lines = [cap("It starts with one", "", "One household.", ""), cap("Now a hundred", "", "100 households. Some hold nearly everything. Some hold almost nothing.", "Federal Reserve Distributive Financial Accounts, 2024, rounded."), cap("One of them", "", "Not a number. A person.", ""), cap("Coping With Capitalism", "", "Behind every number is a person.", "")];
    lines.forEach((c2) => { caps.appendChild(c2); gsap.set(c2, { opacity: 0, y: 18 }); });
    gsap.set(sn.svg, { opacity: 0, scale: 0.2 });
    // keep the followed dot at the centre while we zoom: zoom about it, nudged so it sits in the middle of the stage
    const st = { tx: 0, ty: 0 };
    const place = () => { const bw = dotsBox.offsetWidth, bh = dotsBox.offsetHeight, mx = me.offsetLeft + me.offsetWidth / 2, my = me.offsetTop + me.offsetHeight / 2; dotsBox.style.transformOrigin = `${(mx / bw) * 100}% ${(my / bh) * 100}%`; st.tx = bw / 2 - mx; st.ty = bh / 2 - my; };
    place(); gsap.set(dotsBox, { x: () => st.tx, y: () => st.ty, scale: 11 }); gsap.set(dots.slice(0, 99), { opacity: 0 });
    const tl = pinTL(stage, 10.5, { onRefresh: () => { place(); } });
    tl.to(lines[0], { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.15)
      .to(lines[0], { opacity: 0, y: -14, duration: 0.3, ease: "power2.in" }, 1.7)
      .to(dotsBox, { x: 0, y: 0, scale: 1, duration: 2.8, ease: "power2.inOut" }, 1.0)
      .to(dots.slice(0, 99), { opacity: 1, duration: 1.2, stagger: 0.006, ease: "power1.out" }, 1.4)
      .to(lines[1], { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 3.2)
      .to(lines[1], { opacity: 0, y: -14, duration: 0.3, ease: "power2.in" }, 4.7)
      .to(dots.slice(0, 99), { opacity: 0, duration: 0.9, stagger: 0.004, ease: "power1.in" }, 4.5)
      .to(dotsBox, { x: () => st.tx, y: () => st.ty, scale: 16, duration: 2.2, ease: "power2.inOut" }, 4.7)
      .to(lines[2], { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 5.1)
      .to(lines[2], { opacity: 0, y: -14, duration: 0.3, ease: "power2.in" }, 6.5)
      .to(me, { opacity: 0, duration: 0.7, ease: "power1.inOut" }, 6.5)
      .to(sn.svg, { opacity: 1, scale: 1, duration: 1.1, ease: "power2.out" }, 6.5)
      .to(lines[3], { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 7.6);
    prox((v) => sn.set(v), tl, 6.6, 1.8, "power1.inOut");
    tl.to({}, { duration: 0.7 }, 8.4);
  }

  window.CWC_STORIES = [
    { name: "Line drawings", mount: story2 },
    { name: "The stack", mount: story3 },
    { name: "Kinetic type", mount: story4 },
    { name: "What it made", mount: story5 },
    { name: "Zoom descent", mount: story6 },
  ];
})();
