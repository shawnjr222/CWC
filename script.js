document.getElementById("year").textContent = new Date().getFullYear();

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (window.gsap && window.ScrollTrigger && !reduce) {
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll (Lenis) driven by GSAP's ticker */
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* HERO intro */
  const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro
    .from(".hero-title .inner", { yPercent: 110, duration: 1.2, stagger: 0.12 })
    .from(".map-wrap", { opacity: 0, y: 16, duration: 0.9, ease: "power3.out" }, "-=0.8");


  /* WHY: scrubbed word reveal */
  const why = document.getElementById("why-text");
  const words = why.textContent.trim().split(/\s+/);
  why.setAttribute("aria-label", words.join(" "));
  why.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w} </span>`).join("");
  gsap.to(".why-text .w", {
    opacity: 1,
    ease: "none",
    stagger: 0.5,
    scrollTrigger: {
      trigger: ".why",
      start: window.innerWidth < 900 ? "top 80%" : "top 25%",
      end: window.innerWidth < 900 ? "bottom 55%" : "bottom 85%",
      scrub: true,
    },
  });

  /* HIATUS */
  gsap.from(".pause-title .inner", {
    yPercent: 110, duration: 1.1, stagger: 0.12, ease: "power4.out",
    scrollTrigger: { trigger: ".pause", start: "top 65%" },
  });
  gsap.from(".pause .label, .pause-copy", {
    opacity: 0, y: 14, duration: 0.9, stagger: 0.12,
    scrollTrigger: { trigger: ".pause", start: "top 65%" },
  });
  gsap.from(".steps li i", {
    scaleX: 0, duration: 0.9, stagger: 0.25, ease: "power3.inOut",
    scrollTrigger: { trigger: ".steps", start: "top 85%" },
  });
  gsap.from(".steps li > :not(i)", {
    opacity: 0, y: 10, duration: 0.7, stagger: 0.12,
    scrollTrigger: { trigger: ".steps", start: "top 85%" },
  });

  /* WORK: pinned horizontal scroll on large screens, native swipe below 900px */
  const track = document.getElementById("track");
  const cards = [...track.querySelectorAll(".card")];
  const wNow = document.getElementById("w-now");
  const setNow = (i) => (wNow.textContent = String(Math.min(cards.length, Math.max(1, i))).padStart(2, "0"));
  const mm = gsap.matchMedia();

  mm.add("(min-width: 900px)", () => {
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

  mm.add("(max-width: 899px)", () => {
    const onScroll = () => {
      const step = cards[1].offsetLeft - cards[0].offsetLeft || 1;
      setNow(Math.round(track.scrollLeft / step) + 1);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => track.removeEventListener("scroll", onScroll);
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
