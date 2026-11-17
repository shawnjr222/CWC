/* Shared: smooth scroll (Lenis) wired to GSAP ScrollTrigger */
gsap.registerPlugin(ScrollTrigger);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion && window.Lenis) {
  const lenis = new Lenis({ lerp: 0.1 });
  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.setCaption = (els, text, dir = 1) => {
  // quick out, swap, in
  const tl = gsap.timeline();
  tl.to(els.cap, { opacity: 0, y: -10 * dir, duration: 0.18, ease: "power2.in" })
    .add(() => { els.kicker.textContent = text.kicker || ""; els.big.innerHTML = text.big || ""; els.line.innerHTML = text.line || ""; els.src.textContent = text.src || ""; })
    .fromTo(els.cap, { opacity: 0, y: 14 * dir }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" });
};

/* Six-way switcher, shown on every idea page */
(function () {
  const IDEAS = [
    ["map-story.html", "Map story"],
    ["100-people.html", "100 households"],
    ["the-gap.html", "The gap"],
    ["poverty-dots.html", "40.8 million"],
    ["a-days-pay.html", "A day's pay"],
    ["state-spread.html", "State by state"],
  ];
  const here = location.pathname.split("/").pop() || "index.html";
  const nav = document.createElement("nav");
  nav.className = "switch";
  nav.setAttribute("aria-label", "Scroll ideas");
  nav.innerHTML = IDEAS.map(([href, name], i) => `<a href="${href}"${href === here ? ' aria-current="page"' : ""}><i>${i + 1}</i><span>${name}</span></a>`).join("");
  document.body.appendChild(nav);
  // keep the active one in view on narrow screens
  const cur = nav.querySelector("[aria-current]");
  if (cur) nav.scrollLeft = cur.offsetLeft - nav.clientWidth / 2 + cur.clientWidth / 2;
})();
