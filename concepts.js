/* Stories 2 to 6. Loaded before story.js; each mount(host) runs inside a gsap.context, so its scroll triggers are cleaned up on switch.
   All of them draw with the same blue line and finish on the blue sun logo filling in. */
(function () {
  const K = () => window.CWC;
  const div = (cls, html) => { const d = document.createElement("div"); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
  const pinTL = (stage, vh, extra = {}) => gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: stage, start: "top top", end: () => "+=" + innerHeight * vh, pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true, ...extra } });
  const cap = (kicker, big, line, src) => div("c-cap", `<p class="mono c-kick">${kicker}</p>${big ? `<p class="c-big">${big}</p>` : ""}<p class="c-line">${line}</p>${src ? `<p class="mono c-src">${src}</p>` : ""}`);
  const prox = (fn, tl, at, dur, ease = "none") => { const o = { v: 0 }; tl.to(o, { v: 1, duration: dur, ease, onUpdate: () => fn(o.v) }, at); return o; };

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
    const count = div("c2-count mono", "01 / 06"), art = div("c2-art"), caps = div("c2-caps");
    const rule = K().el("svg", { class: "c2-rule", viewBox: "0 0 1200 24", preserveAspectRatio: "none", "aria-hidden": "true" });
    const rp = K().el("path", { d: "M0 12 C150 -2 300 26 450 12 S750 -2 900 12 S1100 24 1200 12", fill: "none", stroke: C.BLUE, "stroke-width": 2, "vector-effect": "non-scaling-stroke", "stroke-linecap": "round" }); rule.appendChild(rp);
    stage.append(count, art, caps, rule);
    const steps = [
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
    rp.setAttribute("pathLength", 1); rp.style.strokeDasharray = 1; rp.style.strokeDashoffset = 1;
    const tl = pinTL(stage, 9);
    tl.to(rp, { strokeDashoffset: 0, duration: 7.6 }, 0);
    items.forEach((it, i) => {
      const t = i;
      tl.call(() => (count.textContent = `${String(i + 1).padStart(2, "0")} / 06`), null, t)
        .to(it.c, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, t + 0.05);
      prox((v) => setDraw(it.paths, it.lens, v), tl, t, 0.5);
      tl.to(it.c, { opacity: 0, y: -16, duration: 0.15 }, t + 0.84);
      prox((v) => it.paths.forEach((p, k) => (p.style.strokeDashoffset = -it.lens[k] * v)), tl, t + 0.8, 0.2);
    });
    tl.call(() => (count.textContent = "06 / 06"), null, 6).to(last, { opacity: 1, y: 0, duration: 0.3 }, 6.3);
    prox((v) => sn.set(v), tl, 6, 1.3, "power1.inOut");
    tl.to({}, { duration: 0.5 }, 7.3);
  }

  /* ============ STORY 3: Horizontal journey. Walk one long line through six rooms. ============ */
  function story3(host) {
    const { icon, prep, setDraw, sun, C, S, V, el, clamp } = K(), F = facts();
    const stage = div("c-stage c3"); host.appendChild(stage);
    const track = div("c3-track"); stage.appendChild(track);
    const rooms = [
      { ic: "cap", k: "Student debt", big: F.student.val, line: `highest in ${F.student.name}`, v: V.sen },
      { ic: "heart", k: "No health insurance", big: F.uninsured.val, line: `highest in ${F.uninsured.name}`, v: V.ogamdi },
      { ic: "house", k: "Housing insecurity", big: F.housing.val, line: `highest in ${F.housing.name}`, v: V.hamilton },
      { ic: "plate", k: "Food insecurity", big: F.food.val, line: `highest in ${F.food.name}`, v: V.judge },
      { ic: "coin", k: "The wage floor", big: F.wage.val, line: "an hour, since 2009", v: V.gomez },
      { ic: "people", k: "Poverty", big: F.poor.val, line: "people. One in eight.", v: V.hotta },
    ];
    const N = rooms.length + 2; // intro + rooms + sun
    const panels = [];
    const intro = div("c3-panel c3-intro", `<div class="c3-txt"><p class="mono c-kick">Walk through it</p><h3>Six rooms. One line.</h3><p class="c-line">Keep scrolling and the line will lead you through.</p></div>`); track.appendChild(intro);
    rooms.forEach((r, i) => {
      const p = div("c3-panel", `<span class="c3-mark" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div class="c3-art"></div><div class="c3-txt"><p class="mono c-kick">${r.k}</p><p class="c-big">${r.big}</p><p class="c-line">${r.line}</p><p class="c3-voice"><span class="mono">${r.v.who}</span>${r.v.say}</p></div>`);
      const ic = icon(r.ic, 2); p.querySelector(".c3-art").appendChild(ic.svg); ic.lens = prep(ic.paths); p.ic = ic; track.appendChild(p); panels.push(p);
    });
    const end = div("c3-panel c3-end", `<div class="c3-art"></div><div class="c3-txt"><p class="mono c-kick">Coping With Capitalism</p><p class="c-line">Behind every number is a person.</p></div>`); const sn = sun("min(52vh, 60vw)"); end.querySelector(".c3-art").appendChild(sn.svg); track.appendChild(end); sn.init();
    // the long line
    const line = el("svg", { class: "c3-line", viewBox: `0 0 ${N * 100} 100`, preserveAspectRatio: "none", "aria-hidden": "true" });
    const pts = []; for (let i = 0; i <= N * 6; i++) { const x = (i / (N * 6)) * N * 100; pts.push([x, innerWidth < 760 ? 88 + 7 * Math.sin((i / 6) * Math.PI * 2 + 0.6) : 50 + 20 * Math.sin((i / 6) * Math.PI * 2 + 0.6)]); }
    const lp = el("path", { d: d3.line().curve(d3.curveBasis)(pts), fill: "none", stroke: C.BLUE, "stroke-width": 2, "vector-effect": "non-scaling-stroke", "stroke-linecap": "round" }); line.appendChild(lp); track.appendChild(line);
    lp.setAttribute("pathLength", 1); lp.style.strokeDasharray = 1; lp.style.strokeDashoffset = 1;
    const marks = [...track.querySelectorAll(".c3-mark")], txts = [...track.querySelectorAll(".c3-txt")];
    const dist = () => Math.max(1, track.scrollWidth - innerWidth);
    gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: stage, start: "top top", end: () => "+=" + dist() * 1.15, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => {
        const p = s.progress, pos = p * (N - 1); // 0..N-1 panel index at screen center
        lp.style.strokeDashoffset = 1 - clamp(p * 1.04);
        panels.forEach((pn, i) => { const idx = i + 1; setDraw(pn.ic.paths, pn.ic.lens, clamp((pos - (idx - 0.75)) / 0.8)); marks[i].style.transform = `translateX(${(pos - idx) * -14}vw)`; });
        sn.set(clamp((pos - (N - 1 - 0.8)) / 0.8));
      } } });
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

  /* ============ STORY 5: Voices wall. Giant headlines slide across the page; the line ties them to the sun. ============ */
  function story5(host) {
    const { V, sun, scribble, C, el, say, stopSay, listenButton, reduce } = K(), F = facts();
    const wrap = div("c5"); host.appendChild(wrap);
    const keys = ["gomez", "sen", "hamilton", "hotta", "ogamdi", "judge"];
    const inter = { 1: { k: "The wage floor", b: F.wage.val, l: "an hour, since 2009." }, 3: { k: "Poverty", b: "40.8 million", l: "people. One in eight." }, 5: { k: "The gap", b: F.gap.val, l: "top 5% against the bottom fifth." } };
    const vline = el("svg", { class: "c5-vline", "aria-hidden": "true", preserveAspectRatio: "none" }); const vp = el("path", { fill: "none", stroke: C.BLUE, "stroke-width": 2, "vector-effect": "non-scaling-stroke", "stroke-linecap": "round" }); vline.appendChild(vp); wrap.appendChild(vline);
    const head = div("c5-head", `<p class="mono c-kick">Listen</p><h3>Six voices. Read them loud.</h3>`); wrap.appendChild(head); const snd = listenButton(wrap);
    const rows = [];
    keys.forEach((k, i) => {
      const v = V[k]; const text = `${v.say} — `.repeat(4);
      const r = div(`c5-row${i % 2 ? " alt" : ""}`, `<div class="c5-who"><svg class="sig" viewBox="0 0 100 100" aria-hidden="true"><path d="${scribble(i + 11)}"/></svg><span class="mono">${v.who}</span></div><div class="c5-clip"><div class="c5-run" aria-label="${v.say}">${text}</div></div>`);
      wrap.appendChild(r); const sg = r.querySelector(".sig path"); const L = sg.getTotalLength(); sg.style.strokeDasharray = L; sg.style.strokeDashoffset = L;
      rows.push({ r, run: r.querySelector(".c5-run"), sg, L, v, i });
      if (inter[i]) wrap.appendChild(div("c5-inter", `<p class="mono c-kick">${inter[i].k}</p><p class="c-big">${inter[i].b}</p><p class="c-line">${inter[i].l}</p>`));
    });
    const sunBox = div("sun-end"); const sn = sun("min(46vw, 320px)"); sunBox.append(sn.svg); sunBox.insertAdjacentHTML("beforeend", '<p class="mono">Coping With Capitalism</p>'); wrap.appendChild(sunBox); sn.init();
    rows.forEach((o) => {
      const dir = o.i % 2 ? 1 : -1;
      gsap.fromTo(o.run, { xPercent: dir > 0 ? -45 : 0 }, { xPercent: dir > 0 ? 0 : -45, ease: "none", scrollTrigger: { trigger: o.r, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      ScrollTrigger.create({ trigger: o.r, start: "top 75%", once: true, onEnter: () => gsap.to(o.sg, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }) });
      o.r.addEventListener("mouseenter", () => say(`${o.v.say}. By ${o.v.who}.`, o.i, () => o.r.classList.add("speaking"), () => o.r.classList.remove("speaking")));
      o.r.addEventListener("mouseleave", () => { stopSay(); o.r.classList.remove("speaking"); });
    });
    // lean the rows with the scroll speed
    if (!reduce) ScrollTrigger.create({ trigger: wrap, start: "top bottom", end: "bottom top", onUpdate: (s) => { const sk = gsap.utils.clamp(-7, 7, s.getVelocity() / -260); gsap.to(rows.map((o) => o.run), { skewX: sk, duration: 0.3, overwrite: true, ease: "power3.out" }); gsap.to(rows.map((o) => o.run), { skewX: 0, duration: 0.7, delay: 0.1, overwrite: false, ease: "power3.out" }); } });
    if (!reduce) ScrollTrigger.create({ trigger: sunBox, start: "top 85%", end: "center 45%", scrub: 0.6, onUpdate: (s) => sn.set(s.progress) }); else sn.set(1);
    function sizeLine() { const w = wrap.clientWidth, h = wrap.scrollHeight; vline.setAttribute("viewBox", `0 0 ${w} ${h}`); const top = head.offsetTop + head.offsetHeight, bot = sunBox.offsetTop + 60; const pts = []; for (let y = top, n = 0; y <= bot; y += 140, n++) pts.push([w * (n % 2 ? 0.46 : 0.54), y]); pts.push([w * 0.5, bot]); vp.setAttribute("d", d3.line().curve(d3.curveCatmullRom.alpha(0.6))(pts)); const L = vp.getTotalLength(); vp.style.strokeDasharray = L; vp.style.strokeDashoffset = reduce ? 0 : L; vp.__tw && vp.__tw.kill(); if (!reduce) vp.__tw = gsap.to(vp, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: wrap, start: "top 55%", end: "bottom 70%", scrub: 0.5, invalidateOnRefresh: true } }); }
    sizeLine(); const ro = new ResizeObserver(() => { clearTimeout(ro.__t); ro.__t = setTimeout(() => { sizeLine(); ScrollTrigger.refresh(); }, 200); }); ro.observe(wrap);
    return () => { ro.disconnect(); vp.__tw && vp.__tw.kill(); };
  }

  /* ============ STORY 6: Zoom descent. From a country to one household to one person, who becomes the sun. ============ */
  function story6(host) {
    const { sun, C, S, atlas, worst, MEAS, el } = K(), F = facts();
    const stage = div("c-stage c6"); host.appendChild(stage);
    const mapBox = div("c6-map"), dotsBox = div("c6-dots"), caps = div("c6-caps"); stage.append(mapBox, dotsBox, caps);
    // map: zoom toward the state with the highest food insecurity
    const W = 960, H = 580; const [target] = worst("food");
    const svg = d3.select(mapBox).append("svg").attr("viewBox", `0 0 ${W} ${H}`);
    const feats = topojson.feature(atlas, atlas.objects.states).features.filter((f) => S[f.properties.name]);
    const proj = d3.geoAlbersUsa().fitExtent([[10, 10], [W - 10, H - 10]], { type: "FeatureCollection", features: feats }), path = d3.geoPath(proj);
    const col = K().scaleFor("food");
    svg.append("g").selectAll("path").data(feats).join("path").attr("d", path).attr("fill", (d) => { const v = S[d.properties.name].food; return v == null ? C.GREY : col(v); }).attr("stroke", "#f1f0ec").attr("stroke-width", 0.8);
    const tf = feats.find((f) => f.properties.name === target), [cx, cy] = path.centroid(tf);
    gsap.set(mapBox, { xPercent: -50, yPercent: -50 }); mapBox.style.transformOrigin = `${(cx / W) * 100}% ${(cy / H) * 100}%`;
    // 100 households, the last one is the person we follow
    dotsBox.innerHTML = Array.from({ length: 100 }, (_, i) => `<i${i === 99 ? ' class="me"' : ""}></i>`).join(""); const dots = [...dotsBox.children], me = dots[99];
    const sn = sun("min(42vh, 60vw)"); sn.svg.classList.add("c6-sun"); stage.appendChild(sn.svg); sn.init();
    const lines = [cap("One country", "", `51 places. In ${target}, ${F.food.val} of adults faced food insecurity.`, F.food.m.src), cap("Inside one place", "", "100 households.", ""), cap("One of them", "", "Not a number. A person.", ""), cap("Coping With Capitalism", "", "Behind every number is a person.", "")];
    lines.forEach((c) => { caps.appendChild(c); gsap.set(c, { opacity: 0, y: 18 }); });
    gsap.set(dotsBox, { opacity: 0, scale: 0.1 }); gsap.set(sn.svg, { opacity: 0, scale: 0.2 });
    // zoom about the last dot: set transform-origin after layout
    const setOrigin = () => { const b = dotsBox.getBoundingClientRect(), m = me.getBoundingClientRect(); const z = gsap.getProperty(dotsBox, "scale") || 1; dotsBox.style.transformOrigin = `${((m.left + m.width / 2 - b.left) / b.width) * 100}% ${((m.top + m.height / 2 - b.top) / b.height) * 100}%`; };
    requestAnimationFrame(setOrigin);
    const tl = pinTL(stage, 10, { onRefresh: setOrigin });
    tl.to(lines[0], { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.1)
      .to(mapBox, { scale: 9, duration: 2.2, ease: "power2.in" }, 0.3)
      .to(lines[0], { opacity: 0, y: -14, duration: 0.25 }, 1.5)
      .to(mapBox, { opacity: 0, duration: 0.6 }, 2.0)
      .to(dotsBox, { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" }, 1.6)
      .to(lines[1], { opacity: 1, y: 0, duration: 0.3 }, 2.3)
      .to(lines[1], { opacity: 0, y: -14, duration: 0.25 }, 3.4)
      .to(lines[2], { opacity: 1, y: 0, duration: 0.3 }, 3.6)
      .to(dots.slice(0, 99), { opacity: 0, duration: 0.8, stagger: 0.004 }, 3.4)
      .to(dotsBox, { scale: 16, duration: 2.0, ease: "power2.in" }, 3.5)
      .to(lines[2], { opacity: 0, y: -14, duration: 0.25 }, 5.1)
      .to(me, { opacity: 0, duration: 0.5 }, 5.2)
      .to(sn.svg, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" }, 5.2)
      .to(lines[3], { opacity: 1, y: 0, duration: 0.4 }, 6.0);
    prox((v) => sn.set(v), tl, 5.4, 1.6, "power1.inOut");
    tl.to({}, { duration: 0.6 }, 7.0);
  }

  window.CWC_STORIES = [
    { name: "Line drawings", mount: story2 },
    { name: "Horizontal journey", mount: story3 },
    { name: "Kinetic type", mount: story4 },
    { name: "Voices wall", mount: story5 },
    { name: "Zoom descent", mount: story6 },
  ];
})();
