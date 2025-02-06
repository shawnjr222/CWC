gsap.registerPlugin(ScrollTrigger);

const bgColors = [
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
  const counterElement = document.querySelector(".counter p");
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  function updateScrollPercentage() {
    const scrollPosition = window.scrollY;
    const scrolledPercentage = Math.round((scrollPosition / docHeight) * 100);
    counterElement.textContent = `${scrolledPercentage}`;
  }

  window.addEventListener("scroll", updateScrollPercentage);
});
