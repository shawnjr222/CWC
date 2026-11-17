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
