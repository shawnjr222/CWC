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

}

/* WORK images: loaded only when they are about to be seen (a screen or so away, in either direction), never at first paint */
{
  const imgs = [...document.querySelectorAll("img[data-src]")];
  const load = (img) => { img.srcset = img.dataset.srcset; img.src = img.dataset.src; img.removeAttribute("data-src"); img.removeAttribute("data-srcset"); };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } }), { rootMargin: "1200px 1200px 1200px 1200px" });
    imgs.forEach((img) => io.observe(img));
  } else imgs.forEach(load);
}

/* WORK: the project row is a plain horizontal scroller. Swipe it, scroll sideways on a trackpad, shift + wheel, or drag it with the mouse. No scrolling down required. */
{
  const track = document.getElementById("track");
  const cards = [...track.querySelectorAll(".card")];
  const wNow = document.getElementById("w-now");
  const setNow = (i) => (wNow.textContent = String(Math.min(cards.length, Math.max(1, i))).padStart(2, "0"));
  const sync = () => {
    const step = cards[1].offsetLeft - cards[0].offsetLeft || 1, max = track.scrollWidth - track.clientWidth;
    setNow(track.scrollLeft >= max - 4 ? cards.length : Math.round(track.scrollLeft / step) + 1);
  };
  track.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
  // sideways wheel / trackpad gestures belong to the row (the smooth-scroll library would otherwise claim them); up and down still scrolls the page
  track.addEventListener("wheel", (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });
  // mouse drag
  let down = false, moved = false, sx = 0, sl = 0;
  track.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
  window.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; track.classList.add("dragging"); } if (moved) track.scrollLeft = sl - dx; });
  const endDrag = () => { if (!down) return; down = false; track.classList.remove("dragging"); };
  window.addEventListener("pointerup", endDrag); window.addEventListener("pointercancel", endDrag);
  track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  track.addEventListener("dragstart", (e) => e.preventDefault());
}

/* About modal */
const dlg = document.getElementById("about");
const openBtn = document.getElementById("about-open");
openBtn.addEventListener("click", () => { dlg.showModal(); document.body.style.overflow = "hidden"; window.lenis && lenis.stop(); });
/* closing plays an exit first: the panel eases down and fades, the backdrop clears, then the dialog really closes */
let closing = false;
const calmMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const closeDlg = () => {
  if (!dlg.open || closing) return;
  if (calmMotion()) { dlg.close(); return; }
  closing = true; dlg.classList.add("closing");
  const panel = dlg.querySelector(".about-panel"); let done = false;
  const finish = () => { if (done) return; done = true; dlg.classList.remove("closing"); closing = false; dlg.close(); };
  panel.addEventListener("animationend", finish, { once: true }); setTimeout(finish, 600); // the timer is a safety net
};
dlg.addEventListener("cancel", (e) => { e.preventDefault(); closeDlg(); }); // Escape gets the same exit
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
