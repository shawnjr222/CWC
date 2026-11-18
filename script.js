document.getElementById("year").textContent = new Date().getFullYear();

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (window.gsap && window.ScrollTrigger && !reduce) {
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll (Lenis) driven by GSAP's ticker */
  const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* WORK: pinned, then the project row slides sideways as you scroll down (at every screen size) */
  const track = document.getElementById("track");
  const cards = [...track.querySelectorAll(".card")];
  const wNow = document.getElementById("w-now");
  const setNow = (i) => (wNow.textContent = String(Math.min(cards.length, Math.max(1, i))).padStart(2, "0"));
  const mm = gsap.matchMedia();

  mm.add("(min-width: 0px)", () => {
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: ".work",
        start: "top top",
        end: () => "+=" + dist(),
        pin: ".work-pin",
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => setNow(Math.round(self.progress * (cards.length - 1)) + 1),
      },
    });
  });

}

/* About modal */
const dlg = document.getElementById("about");
const openBtn = document.getElementById("about-open");
openBtn.addEventListener("click", () => { dlg.showModal(); document.body.style.overflow = "hidden"; window.lenis && lenis.stop(); });
const closeDlg = () => dlg.close();
document.getElementById("about-close").addEventListener("click", closeDlg);
dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDlg(); });
dlg.addEventListener("close", () => { document.body.style.overflow = ""; window.lenis && lenis.start(); });

/* Logo / name: a short pause, then a long, eased glide back to the top (uses Lenis when it's running) */
const brand = document.querySelector(".brand");
if (brand) {
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  brand.addEventListener("click", (e) => {
    e.preventDefault();
    const dist = window.scrollY;
    if (dist < 4) return;
    // farther down takes a little longer, between 1.6s and 2.8s
    const duration = Math.min(2.8, Math.max(1.6, 1.2 + dist / 3500));
    setTimeout(() => {
      if (window.lenis) window.lenis.scrollTo(0, { duration, easing: easeInOut, lock: false });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 160);
  });
}
