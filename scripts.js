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

/* Swipers */
function swipers() {
  // Card Slider
  if (document.querySelector(".swiper.card-slider_swiper")) {
    console.log("card swiper(s) exists");
    const cardSwiperComponents = document.querySelectorAll(".card-slider_wrap");
    cardSwiperComponents.forEach((component) => {
      const swiperEl = component.querySelector('.swiper');
      const swiperWrapperEl = component.querySelector('.swiper-wrapper');
      const scrollbarEl = component.querySelector('.swiper-scrollbar');
      const prevBtn = component.querySelector('.swiper-button-prev');
      const nextBtn = component.querySelector('.swiper-button-next');

      new Swiper(swiperEl, {
        slidesPerView: 1,
        spaceBetween: 20,
        speed: 500,
        lazyPreloadPrevNext: 3,
        grabCursor: true,
        scrollbar: {
          el: scrollbarEl,
          draggable: true,
          dragSize: 200,
        },
        navigation: {
          prevEl: prevBtn,
          nextEl: nextBtn,
        },
        breakpoints: {
          800: {
            slidesPerView: 2,
            scrollbar: {
              dragSize: 400,
            },
          },
          1300: {
            slidesPerView: 3,
            scrollbar: {
              dragSize: 640,
            },
          },
        },
        on: {
          init: function () {
            console.debug("%cSwiper initialized", "color: cyan;");
          }
        }
      });
    });
  }

  // Resources Slider
  if (document.querySelector(".swiper.resources-slider_swiper")) {
    console.log("resources swiper(s) exists");
    const resourcesSwiperComponents = document.querySelectorAll(".resources-slider_wrap");
    resourcesSwiperComponents.forEach((component) => {
      const swiperEl = component.querySelector('.swiper');
      const swiperWrapperEl = component.querySelector('.swiper-wrapper');
      const scrollbarEl = component.querySelector('.swiper-scrollbar');
      const prevBtn = component.querySelector('.swiper-button-prev');
      const nextBtn = component.querySelector('.swiper-button-next');

      new Swiper(swiperEl, {
        slidesPerView: 'auto',
        spaceBetween: 20,
        speed: 500,
        lazyPreloadPrevNext: 3,
        grabCursor: true,
        scrollbar: {
          el: scrollbarEl,
          draggable: true,
          dragSize: 200,
        },
        navigation: {
          prevEl: prevBtn,
          nextEl: nextBtn,
        },
        breakpoints: {
          800: {
            scrollbar: {
              dragSize: 400,
            },
          },
          1300: {
            scrollbar: {
              dragSize: 640,
            },
          },
        },
        on: {
          init: function () {
            console.debug("%cSwiper initialized", "color: cyan;");
          }
        }
      });
    });
  }
}

// Marquee Stuff
const initializeMarquee = () => {
  const marquee = document.querySelector('[wb-data="marquee"]');
  if (!marquee) return;

  let duration = parseFloat(marquee.getAttribute("duration-per-item")) || 2.5;
  const marqueeContent = marquee.firstChild;
  if (!marqueeContent) return;

  const itemList = marquee.querySelector(".w-dyn-items");
  if (itemList) {
    const childrenCount = itemList.children.length;
    duration *= childrenCount; // Multiply the duration by the number of direct children
  }

  const marqueeContentClone = marqueeContent.cloneNode(true);
  marquee.append(marqueeContentClone); // Ensure cloned content is appended correctly

  let tween;

  const playMarquee = () => {
    let progress = tween ? tween.progress() : 0;
    tween && tween.progress(0).kill();

    const width = parseInt(
      getComputedStyle(marqueeContent).getPropertyValue("width")
    );
    const distanceToTranslate = -1 * width;

    tween = gsap.fromTo(
      marquee.children,
      { xPercent: 0 },
      {
        xPercent: -100,
        duration,
        ease: "none",
        repeat: -1,
      }
    );
    tween.progress(progress);
  };

  playMarquee();

  window.addEventListener("resize", debounce(playMarquee));
}; // end marquee stuff

// Finsweet Stuff
function finsweetStuff() {
  console.debug(
    "%c [DEBUG] Starting finsweetStuff",
    "background: #33cc33; color: white"
  );
  window.fsAttributes = window.fsAttributes || [];

  window.fsAttributes.push([
    "cmsfilter",
    (filterInstances) => {
      console.debug("cmsfilter Successfully loaded!");

      const [filterInstance] = filterInstances;

      if (filterInstance) {
        filterInstance.listInstance.on("renderitems", (renderedItems) => {
          setTimeout(function () {
            ScrollTrigger.refresh();
          }, 1000);
        });
      }
    },
  ]);

  window.fsAttributes.push([
    "cmsload",
    (listInstances) => {
      console.debug("cmsload Successfully loaded!");

      const [listInstance] = listInstances;

      if (listInstance) {
        listInstance.on("renderitems", (renderedItems) => {
          setTimeout(function () {
            ScrollTrigger.refresh();
          }, 1000);
        });
      }
    },
  ]);
}

// Init Function
const init = () => {
  console.debug("%cRun init", "color: lightgreen;");

  enableLenis();
  initScrollAnimations();
  swipers();
  initializeMarquee();
  finsweetStuff();
}; // end init

$(window).on("load", init);