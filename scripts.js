console.debug("%cScripts.js loaded", "color: lightgreen;");

// Debounce function to limit function calls during resize
function debounce(func, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
}

// Register GSAP Stuff (now done in Webflow)
// gsap.registerPlugin(ScrollTrigger);
// gsap.registerPlugin(CustomEase);

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
      parseFloat(setDuration) || 0.85;
    const customGroupDelay =
      parseFloat(setGroupDelay) || 0.15;
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
      start: "top 85%",
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

/* LOOK INTO WHY THE NAV HEIGHT IS JUMPING TO 5ish REM ON SCROLL ON MOBILE */
// Nav Animation on Scroll
function navAnimationOnScroll() {
  // Retrieve the initial value of --theme--text before any GSAP manipulation
  const navElement = document.querySelector(".nav_1_component");
  const initialTextColor = getComputedStyle(navElement)
    .getPropertyValue("--_theme---text")
    .trim();
  // const initialTextInvertColor = getComputedStyle(navElement)
  //   .getPropertyValue("--_theme---text-invert")
  //   .trim();

  // Calculate the current --nav--height
  function calculateNavHeight() {
    const vw = window.innerWidth / 100; // Convert to vw units

    // Values from your clamp function:
    const minRem = 5;
    const maxRem = 9.375;

    // Breaking down the middle value: 2.8125rem + 7.29166vw
    const baseRem = 2.8125;
    const vwMultiplier = 7.29166;

    // Calculate the fluid value (middle part of clamp)
    const fluidValue = baseRem + (vwMultiplier * vw) / 16;

    // Apply the clamp logic
    const finalRemValue = Math.min(Math.max(minRem, fluidValue), maxRem);

    // Convert to pixels (1rem = 16px)
    // return Math.round(finalRemValue * 16);

    return finalRemValue;
  }

  // You can then use it like:
  let initialHeightRem = calculateNavHeight();

  // And update it on resize if needed:
  window.addEventListener("resize", () => {
    initialHeightRem = calculateNavHeight();
  });

  gsap.set(".nav_1_wrap", {
    backgroundColor: "rgba(7, 39, 45, 0)"
  });

  gsap.to(".nav_1_wrap", {
    scrollTrigger: {
      start: "20px top",
      end: "150px",
      scrub: true,
      ease: "power2.inOut",
      onUpdate: (self) => {
        const progress = self.progress;

        // console.debug(initialHeightPx, initialHeightRem);
        const finalHeight = 5;
        const currentHeight =
          initialHeightRem + (finalHeight - initialHeightRem) * progress;

        // Update nav height variable
        document.documentElement.style.setProperty(
          "--nav_1--height",
          `${currentHeight}rem`
        );

        // Get the final color (e.g., --swatch--light)
        const finalTextColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--swatch--off-white")
          .trim();
        // Get the final color (e.g., --swatch--dark)
        // const finalTextInvertColor = getComputedStyle(document.documentElement)
        //   .getPropertyValue("--swatch--evergreen")
        //   .trim();

        // Interpolate color and update variable
        const interpolatedColor = gsap.utils.interpolate(
          initialTextColor,
          finalTextColor,
          progress
        );
        // Interpolate invert color and update variable
        // const interpolatedInvertColor = gsap.utils.interpolate(
        //   initialTextInvertColor,
        //   finalTextInvertColor,
        //   progress
        // );
        navElement.style.setProperty("--_theme---text", interpolatedColor);
        // navElement.style.setProperty(
        //   "--_theme---text-invert",
        //   interpolatedInvertColor
        // );
      },
      onLeaveBack: () => {
        // Add a slight delay before removing styles
        setTimeout(() => {
          navElement.style.removeProperty("--_theme---text");
          // navElement.style.removeProperty("--_theme---text-invert");
          document.documentElement.style.removeProperty("--nav_1--height");
        }, 150); // Delay to ensure animation finishes
      },
    },
    backgroundColor: "rgba(7, 39, 45, 1)", // Desired background color
    duration: 1,
  });
}

/* Swipers */
function swipers() {
  // Card Slider
  if (document.querySelector(".swiper.card-slider_swiper")) {
    console.debug("card swiper(s) exists");
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
    console.debug("resources swiper(s) exists");
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
// https://finsweet.com/attributes/attributes-api
function finsweetStuff() {
  console.debug(
    "%c [DEBUG] Starting finsweetStuff",
    "background: #33cc33; color: white"
  );

  window.FinsweetAttributes ||= [];
  window.FinsweetAttributes.push([
    'list',
    (listInstances) => {
      listInstances.forEach((list)=>{
        list.addHook("afterRender", (items) => {
          ScrollTrigger.refresh();
          lenis.resize();
        })
      });

      /* Log all stages of lifecycle */
      /*
      const phases = [
        'start',
        'filter',
        'sort',
        'pagination',
        'beforeRender',
        'render',
        'afterRender'
      ];
      listInstances.forEach((list) => {
        phases.forEach((phase) => {
          list.addHook(phase, (items) => {
            console.log(`[fs-list] Phase: ${phase}`, {
              listInstance: list,
              itemCount: items.length,
              items
            });
            return items;
          });
        });
      });
      */
    }
  ]);
}

// Split Panel Scroll Lock
function splitPanelScrollLock() {
  if (document.querySelector('.split-panel-scroll-lock_wrap')) {
    const splitPanelScrollLockComponents = document.querySelectorAll('.split-panel-scroll-lock_wrap');

    splitPanelScrollLockComponents.forEach((component)=>{
      ScrollTrigger.create({
        trigger: component,
        start: "top top",
        end: "bottom bottom",
        scrub: false,
      });

      const steps = component.querySelectorAll(".split-panel-scroll-lock_content_step");
      const images = component.querySelectorAll(".split-panel-scroll-lock_images_wrap img");

      component.querySelector('.split-panel-scroll-lock_total').innerHTML = steps.length;

      steps.forEach((step, index) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top center",
          end: "bottom center",
          onEnter: () => switchActive(index),
          onEnterBack: () => switchActive(index),
          // markers: true
        });
      });

      function switchActive(index) {
        // console.debug(index);
        component.querySelector('.split-panel-scroll-lock_index').innerHTML = index + 1;

        images.forEach((img, i) => {
          img.classList.toggle('is-active', i === index);
        });

        steps.forEach((step, i) => {
          step.classList.toggle('is-active', i === index);
        });
      }
    })
  }
}

// Open BambooHR links in new tab
function bambooLinks(){
  const interval = setInterval(() => {
    const bambooEl = document.getElementById('BambooHR');
    if (!bambooEl) return;

    const links = bambooEl.querySelectorAll('a');
    if (links.length === 0) return;

    links.forEach(link => {
      // console.debug(link);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    clearInterval(interval); // Stop polling once done
  }, 1000); // Check every 300ms
}

// Odometers
function odometers() {
  const statSections = document.querySelectorAll(".split-panel-stats_wrap");
  if (statSections.length) {
    statSections.forEach((section) => {
      const statValues = section.querySelectorAll("[data-countup]");
      const statInit = function (statValues) {
        statValues.forEach(function (statVal, index) {
          const originalValue = statVal.innerHTML.trim();
          const [integerPart, decimalPart] = originalValue.split(".");
          const zeroIntegerPart = integerPart.replace(/\d/g, "0"); // Convert integer part to zeroes while preserving commas
          const formattedZeroValue =
            decimalPart !== undefined
              ? `${zeroIntegerPart}.${"0".repeat(decimalPart.length)}`
              : zeroIntegerPart; // Preserve decimal places if present

          statVal.innerHTML = formattedZeroValue; // Start from the correct number of digits
          // console.debug(
          //   `Original: ${originalValue}, Zeroed: ${formattedZeroValue}`
          // );

          var od = new Odometer({
            el: statVal,
            format: "(,ddd).dd",
            value: formattedZeroValue,
            duration: 3000,
          });
          var delay = index * 0.15;
          gsap.to(statVal, {
            ease: "none",
            scrollTrigger: {
              trigger: statVal,
              start: "top 90%",
              invalidateOnRefresh: !0,
              scrub: 0,
              onEnter: function onEnter() {
                gsap.delayedCall(delay, function () {
                  od.update(originalValue);
                });
              },
            },
          });
        });
      };
      statInit(statValues);
    });
  }
}

// Init Function
const init = () => {
  console.debug("%cRun init", "color: lightgreen;");

  enableLenis();
  initScrollAnimations();
  navAnimationOnScroll();
  swipers();
  initializeMarquee();
  finsweetStuff();
  splitPanelScrollLock();
  bambooLinks();
  odometers();
}; // end init

$(window).on("load", init);