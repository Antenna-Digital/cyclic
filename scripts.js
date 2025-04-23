console.debug("%cScripts.js loaded", "color: lightgreen;");

// Debounce function to limit function calls during resize
function debounce(func, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
}

// Register GSAP Stuff
gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(CustomEase);

// GSAP Custom Eases
CustomEase.create("out-quad", "0.5, 1, 0.89, 1");

let lenis;

// Lenis setup
function enableLenis() {
  lenis = new Lenis();

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  lenis.start();
}

/** Scroll Animations
 *
 * Usage:
 * ------
 * 1. Add data attributes to your HTML elements:
 *    - data-anim: Specifies the animation type
 *    - data-anim-duration: (Optional) Sets custom animation duration in seconds or milliseconds
 *    - data-anim-delay: (Optional) Sets element's individual delay in seconds or milliseconds
 *    - data-anim-group-delay: (Optional) Sets custom stagger delay between elements entering visibility within 0.1s time frame in seconds or milliseconds
 *
 * Example HTML:
 * ```html
 * <div data-anim="fadeslide-up" data-anim-duration="0.8" data-anim-group-delay="0.15"></div>
 * ```
 *
 * Necessary CSS:
 * ------
 * ```css
 * [data-anim] {
 *   opacity: 0;
 *   will-change: transform, opacity;
 *   backface-visibility: hidden;
 *   perspective: 1000px;
 * }
 * html.wf-design-mode [data-anim],
 * html.wf-doc [data-anim],
 * html.site-scrollbar [data-anim],
 * html.w-editor [data-anim] { opacity: 1; }
 * ```
 *
 * Animation Types:
 * ---------------
 * - "fadeslide-up": Fades in while sliding up
 * - "fadeslide-in-left": Fades in while sliding from left
 * - "fadeslide-in-right": Fades in while sliding from right
 * - "fadeslide-in": Smart directional fade-slide based on panel layout
 * - "fade": Simple fade in
 *
 * Default Values:
 * --------------
 * - Animation Duration: 0.75 seconds
 * - Stagger Delay: 0.1 seconds
 * - Scroll Trigger Point: 90% from top of viewport
 * - Reset Time Window: 0.1 seconds (for grouping staggered animations)
 *
 * Special Features:
 * ---------------
 * 1. Stagger Grouping:
 *    - Elements triggered within 0.1 seconds are grouped together
 *    - Each group starts its own stagger sequence
 *    - Helps maintain visual coherence for elements entering viewport together
 *
 * 2. Performance:
 *    - Animations trigger only once
 *    - Uses performant GSAP animations
 *    - Optimized trigger calculations
 *
 * Implementation Notes:
 * -------------------
 * - Call initScrollAnimations() after DOM is ready
 * - Ensure GSAP and ScrollTrigger are loaded before initialization
 * - Animations trigger when elements are 90% visible from the top of viewport
 *
 */
function initScrollAnimations() {
  // Select all elements with data-anim attribute
  const animElements = document.querySelectorAll("[data-anim]");

  let lastTriggerTime = 0; // Store the timestamp of the last group
  let groupIndex = 0; // To reset delay for new groups
  const resetTime = 0.1; // Time window (in seconds) to reset the stagger delay

  let screenWidth = window.innerWidth;
  let transitionAmount = screenWidth < 600 ? 40 : 75;
  let transitionAmountNeg = transitionAmount * -1;

  window.addEventListener("resize", () => {
    screenWidth = window.innerWidth;
    transitionAmount = screenWidth < 600 ? 40 : 75; // Update transitionAmount on resize
    transitionAmountNeg = transitionAmount * -1;
  });

  animElements.forEach((element, index) => {
    let setDuration = element.getAttribute("data-anim-duration");
    let setGroupDelay = element.getAttribute("data-anim-group-delay");
    let setDelay = element.getAttribute("data-anim-delay");

    // If the value is greater than 50, we assume it was set with milliseconds in mind so we convert to seconds
    if (setDuration > 50) { setDuration = setDuration / 1000; }
    if (setGroupDelay > 50) { setGroupDelay = setGroupDelay / 1000; }
    if (setDelay > 50) { setDelay = setDelay / 1000; }

    const animType = element.getAttribute("data-anim");
    const customDuration =
      parseFloat(setDuration) || 0.75;
    const customGroupDelay =
      parseFloat(setGroupDelay) || 0.1;
    const customDelay =
      parseFloat(setDelay) || false;

    const rect = element.getBoundingClientRect();
    const isAboveViewport = rect.bottom < 0; // Element is already above the viewport

    if (isAboveViewport) {
      gsap.set(element, { opacity: 1, x: 0, y: 0 }); // Instantly reveal elements above viewport
      return;
    }

    let fromX = 0;

    // ScrollTrigger with time grouping logic
    ScrollTrigger.create({
      trigger: element,
      start: "top 90%",
      once: true, // Ensure the animation runs only once
      onEnter: () => {
        const currentTime = performance.now() / 1000; // Convert to seconds

        // If the time since the last trigger is greater than resetTime, reset the group index
        if (currentTime - lastTriggerTime > resetTime) {
          groupIndex = 0; // Reset delay index for new group
        }

        lastTriggerTime = currentTime; // Update last trigger time

        let delay = 0;

        if (customDelay) {
          delay = customDelay;
        } else {
          delay = groupIndex * customGroupDelay; // Calculate delay within the group
          groupIndex++; // Increment group index for next element
        }

        // Animation variations based on data-anim type
        const baseAnimation = {
          opacity: 0,
          duration: customDuration,
          ease: "quad.out",
        };

        // Optional: Log delay for debugging
        // console.table(element.className, delay);

        switch (animType) {
          case "fadeslide-up":
            gsap.fromTo(
              element,
              { ...baseAnimation, y: transitionAmount },
              { ...baseAnimation, y: 0, opacity: 1, delay: delay }
            );
            break;

          case "fadeslide-in-left":
            gsap.fromTo(
              element,
              { ...baseAnimation, x: transitionAmountNeg },
              { ...baseAnimation, x: 0, opacity: 1, delay: delay }
            );
            break;

          case "fadeslide-in-right":
            gsap.fromTo(
              element,
              { ...baseAnimation, x: transitionAmount },
              { ...baseAnimation, x: 0, opacity: 1, delay: delay }
            );
            break;

          case "fadeslide-in":
            gsap.fromTo(
              element,
              { ...baseAnimation, x: fromX },
              { ...baseAnimation, x: 0, opacity: 1, delay: delay }
            );
            break;

          case "fade":
            gsap.fromTo(element, baseAnimation, {
              ...baseAnimation,
              opacity: 1,
              delay: delay,
            });
            break;
        }
      },
    });
  });
}

// Init Function
const init = () => {
  console.debug("%cRun init", "color: lightgreen;");

  enableLenis();
  initScrollAnimations();
  finsweetStuff();
}; // end init

$(window).on("load", init);