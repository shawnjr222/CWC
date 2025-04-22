gsap.registerPlugin(ScrollTrigger);

// Background color setup
function setInitialBackground() {
  const bgColorElement = document.querySelector(".bg-color");
  const initialColor = bgColors[0];

  bgColorElement.style.background = `linear-gradient(0deg, ${initialColor} 0%, rgba(255, 255, 255, 0) 100%)`;
  bgColorElement.style.transition = "none";
}

const bgColors = [
  "#C25F4F",
  "#A1EDE0",
  "#FEBB05",
  "#111111",
  "#2B4068",
  "#682C40",
  "#1250C4",
];
const bgColorElement = document.querySelector(".bg-color");

gsap.utils.toArray(".item").forEach((item, index) => {
  let img = item.querySelector(".item-img img");

  gsap.fromTo(
    img,
    { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" },
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      ease: "power3.inOut",
      duration: 2,
      scrollTrigger: {
        trigger: item,
        start: "center bottom",
        end: "bottom top",
        toggleActions: "play none none none",
        onEnter: () => updateBackground(bgColors[index]),
        onEnterBack: () => updateBackground(bgColors[index]),
      },
    }
  );
});

function updateBackground(color) {
  gsap.to(bgColorElement, {
    background: `linear-gradient(0deg, ${color} 0%, rgba(255, 255, 255, 0) 100%)`,
    duration: 2,
    ease: "power1.out",
  });
}

document.addEventListener("DOMContentLoaded", function () {
  setInitialBackground();

  const counterElement = document.querySelector(".counter p");
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  function updateScrollPercentage() {
    const scrollPosition = window.scrollY;
    const scrolledPercentage = Math.round((scrollPosition / docHeight) * 100);
    counterElement.textContent = `${scrolledPercentage}`;
  }

  window.addEventListener("scroll", updateScrollPercentage);

  // 🆕 About Overlay and Mobile Buttons Setup
  const aboutLink = document.getElementById("about-link");
  const aboutOverlay = document.querySelector(".about-overlay");
  const aboutContent = document.querySelector(".about-content");
  const closeAbout = document.querySelector(".close-about");
  const aboutButtonsMobileWrapper = document.querySelector(".about-buttons-mobile-wrapper");
  const closeAboutMobile = document.querySelector(".close-about-mobile");

  const aboutTimeline = gsap.timeline({ paused: true });

  // Blocks animation
  aboutTimeline.to(".about-overlay .block", {
    duration: 0.8,
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
    stagger: 0.1,
    ease: "power3.inOut"
  });

  // About text content fade in
  aboutTimeline.to(aboutContent, {
    duration: 0.5,
    opacity: 1,
    pointerEvents: "auto"
  }, "-=0.4"); // Overlap timing

  // 🔥 Fade in mobile buttons together with text
  aboutTimeline.to(aboutButtonsMobileWrapper, {
    duration: 0.5,
    opacity: 1,
    pointerEvents: "auto"
  }, "-=0.4"); // Sync with aboutContent

  // Open About
  aboutLink.addEventListener("click", function (e) {
    e.preventDefault();
    aboutOverlay.style.pointerEvents = "auto";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    aboutTimeline.play();
  });

  // Close About (Desktop ✕)
  closeAbout.addEventListener("click", function () {
    aboutTimeline.reverse().then(() => {
      aboutOverlay.style.pointerEvents = "none";
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    });
  });

  // Close About (Mobile Close Button)
  closeAboutMobile.addEventListener("click", function () {
    aboutTimeline.reverse().then(() => {
      aboutOverlay.style.pointerEvents = "none";
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    });
  });

});
