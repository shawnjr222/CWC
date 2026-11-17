/* The Thread. Voices are the real writers and headlines from the publication's featured stories; stats come from the data on this site.
   "Listen" reads each moment aloud with the browser's built-in text-to-speech (not recordings). */
(function () {
  const root = document.getElementById("thread");
  if (!root || !window.gsap || !window.ScrollTrigger) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const MOMENTS = [
    { type: "voice", who: "James Gómez", say: "Why I'm Anti-Capitalist" },
    { type: "stat", who: "The wage floor", num: "$7.25", note: "an hour. The federal minimum wage has not changed since 2009.", src: "U.S. Department of Labor.", speak: "The federal minimum wage is seven dollars and twenty five cents an hour. It has not changed since two thousand nine." },
    { type: "voice", who: "Sanchari Sen", say: "101 Sins of Capitalism" },
    { type: "stat", who: "Poverty", num: "40.8 million", note: "people in the United States live below the poverty line. One in eight.", src: "U.S. Census Bureau, American Community Survey 2023.", speak: "Forty point eight million people in the United States live below the poverty line. One in eight." },
    { type: "voice", who: "Kaylin Hamilton", say: "From Famine Walls to Welfare Conditions, Why Do We Always Punish The Poor?" },
    { type: "voice", who: "Annika Hotta", say: "Independence Looks Different For Everyone, Especially If You're Disabled" },
    { type: "stat", who: "Student debt", num: "$54,863", note: "average federal student loan per borrower in the District of Columbia. The lowest state is still $29,834.", src: "Federal Student Aid data, about 2023, as charted by Axios.", speak: "The average federal student loan per borrower in the District of Columbia is fifty four thousand, eight hundred and sixty three dollars." },
    { type: "voice", who: "Dr. Emmanuel Ogamdi", say: "Playing Russian Roulette With Mental Health Patients" },
    { type: "stat", who: "The gap", num: "15.9×", note: "The average top-5% household earns about sixteen times what the bottom fifth does.", src: "U.S. Census Bureau, American Community Survey 2023.", speak: "The average top five percent household earns about sixteen times what the bottom fifth does." },
    { type: "voice", who: "Tiffany Judge", say: "Americans Are Burying Themselves Alive With Cheap Stuff" },
    { type: "end", say: "The publication is on hiatus. These voices are still here.", link: ["Read the publication", "https://medium.com/coping-with-capitalism"] },
  ];

  const ARROW = '<span class="arrow-slide" aria-hidden="true"><span class="arrow-out"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="arrow-in"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>';

  // a scribble "portrait": looping line from a seeded random function, in the spirit of Listen to America (an abstract line, never a likeness)
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  function scribble(seed) {
    const r = rng(seed * 9301 + 49297), pts = [];
    const loops = 5 + Math.floor(r() * 4), A = 34 + r() * 8, B = 14 + r() * 10, n = 3 + Math.floor(r() * 4), ph = r() * 6.28, sk = 0.7 + r() * 0.5;
    for (let i = 0; i <= 220; i++) {
      const t = (i / 220) * Math.PI * 2 * (loops / 2);
      const x = 50 + A * Math.cos(t * 0.5) * 0.9 + B * Math.cos(t * n + ph);
      const y = 50 + A * Math.sin(t * 0.5) * sk + B * Math.sin(t * n + ph) * 0.9;
      pts.push([x, y]);
    }
    return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
  }

  // ---------- build the DOM ----------
  const head = document.createElement("div");
  head.className = "thread-head";
  head.innerHTML = '<p class="mono label">Listen</p><h2>Behind every number is a person.</h2><p>Follow the line. These are the voices and the numbers of life under capitalism.</p>';
  const snd = document.createElement("button");
  snd.className = "thread-snd"; snd.type = "button"; snd.setAttribute("aria-pressed", "false"); snd.textContent = "Listen: off";
  const svgNS = "http://www.w3.org/2000/svg";
  const lineSvg = document.createElementNS(svgNS, "svg"); lineSvg.setAttribute("class", "thread-line"); lineSvg.setAttribute("aria-hidden", "true");
  const threadPath = document.createElementNS(svgNS, "path"); lineSvg.appendChild(threadPath);
  root.append(lineSvg, snd, head);

  const els = MOMENTS.map((m, i) => {
    const side = m.type === "end" ? "center" : i % 2 === 0 ? "left" : "right";
    const d = document.createElement("div");
    d.className = `moment ${side}${m.type === "stat" ? " is-stat" : ""}`;
    const sig = m.type === "end" ? "" : `<svg class="sig" viewBox="0 0 100 100" aria-hidden="true"><path d="${scribble(i + 3)}"/></svg>`;
    let body = "";
    if (m.type === "voice") body = `<p class="mono who">${m.who}</p><p class="say">${m.say}</p><p class="mono listen-now"><i></i>Listening</p>`;
    if (m.type === "stat") body = `<p class="mono who">${m.who}</p><p class="num">${m.num}</p><p class="note">${m.note}</p><p class="mono src">${m.src}</p><p class="mono listen-now"><i></i>Listening</p>`;
    if (m.type === "end") body = `<p class="say">${m.say}</p><p class="note"><a class="foot-link" style="font-family:inherit;text-transform:none;letter-spacing:inherit;border-bottom:1px solid currentColor" href="${m.link[1]}" target="_blank" rel="noopener">${m.link[0]}${ARROW}</a></p>`;
    d.innerHTML = `<div class="card-v">${sig}${body}</div>`;
    root.appendChild(d);
    return d;
  });

  // ---------- the line ----------
  let pathLen = 0;
  function buildLine() {
    const rect = root.getBoundingClientRect(), w = rect.width, h = root.scrollHeight;
    lineSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const small = w < 760;
    const ys = els.map((e) => e.offsetTop + e.offsetHeight / 2);
    const pts = [[small ? 22 : w * 0.5, head.offsetTop + head.offsetHeight + 10]];
    els.forEach((e, i) => {
      const left = e.classList.contains("left"), center = e.classList.contains("center");
      const x = small ? 22 + (i % 2 ? 10 : -4) : center ? w * 0.5 : w * 0.5 + (left ? 1 : -1) * w * 0.05;
      const y = ys[i];
      pts.push([small ? 22 + (i % 2 ? -8 : 8) : w * 0.5 + (left ? -1 : 1) * w * 0.012, y - 90]);
      pts.push([x, y]);
      pts.push([small ? 22 : w * 0.5, y + 90]);
    });
    const last = ys[ys.length - 1];
    pts.push([small ? 22 : w * 0.5, last + 140]);
    const line = d3.line().curve(d3.curveCatmullRom.alpha(0.6));
    threadPath.setAttribute("d", line(pts));
    pathLen = threadPath.getTotalLength();
    threadPath.style.strokeDasharray = pathLen; threadPath.style.strokeDashoffset = reduce ? 0 : pathLen;
  }

  // ---------- scroll: draw the line, reveal each voice ----------
  let drawTween;
  function wire() {
    drawTween && drawTween.scrollTrigger && drawTween.scrollTrigger.kill(); drawTween && drawTween.kill();
    if (reduce) return;
    drawTween = gsap.to(threadPath, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: root, start: "top 55%", end: "bottom 70%", scrub: 0.5, invalidateOnRefresh: true } });
  }
  const sigTweens = [];
  els.forEach((e, i) => {
    const card = e.querySelector(".card-v"), p = e.querySelector(".sig path");
    if (reduce) return;
    gsap.set(card, { opacity: 0, y: 28 });
    let len = 0; if (p) { len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); }
    ScrollTrigger.create({
      trigger: e, start: "top 72%", once: true,
      onEnter: () => { gsap.to(card, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }); if (p) gsap.to(p, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }); },
    });
  });

  // ---------- listen (text to speech) ----------
  const tts = window.speechSynthesis; let on = false, voices = [];
  const loadVoices = () => (voices = (tts ? tts.getVoices() : []).filter((v) => /^en/i.test(v.lang)));
  if (tts) { loadVoices(); tts.onvoiceschanged = loadVoices; }
  if (!tts) snd.style.display = "none";
  snd.addEventListener("click", () => {
    on = !on; snd.setAttribute("aria-pressed", String(on)); snd.textContent = on ? "Listen: on" : "Listen: off";
    if (!on && tts) { tts.cancel(); els.forEach((e) => e.classList.remove("speaking")); }
  });
  let active = -1;
  function speak(i) {
    if (!on || !tts) return;
    tts.cancel(); els.forEach((e) => e.classList.remove("speaking"));
    const m = MOMENTS[i]; if (m.type === "end") return;
    const text = m.type === "voice" ? `${m.say}. By ${m.who}.` : m.speak;
    const u = new SpeechSynthesisUtterance(text);
    if (voices.length) u.voice = voices[i % voices.length];
    u.pitch = 0.85 + ((i * 37) % 30) / 100; u.rate = 0.95;
    u.onstart = () => els[i].classList.add("speaking"); u.onend = u.onerror = () => els[i].classList.remove("speaking");
    tts.speak(u);
  }
  els.forEach((e, i) => ScrollTrigger.create({ trigger: e, start: "center 62%", end: "center 38%", onToggle: (s) => { if (s.isActive && i !== active) { active = i; speak(i); } } }));
  window.addEventListener("pagehide", () => tts && tts.cancel());

  // ---------- go ----------
  function init() { buildLine(); wire(); ScrollTrigger.refresh(); }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(init));
  let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(init, 200); }).observe(root);
})();
