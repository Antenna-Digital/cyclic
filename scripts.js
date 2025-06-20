console.debug("%cScripts.js loaded", "color: lightgreen;");

// Debounce function to limit function calls during resize
function debounce(func, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
}

function fluidClamp(minScreen, maxScreen, minValue, maxValue, currentScreen = window.innerWidth) {
  const clampedVW = Math.min(Math.max(currentScreen, minScreen), maxScreen);
  const vwMultiplier = (maxValue - minValue) / (maxScreen - minScreen);
  const fluidValue = minValue + vwMultiplier * (clampedVW - minScreen);

  return Math.min(Math.max(fluidValue, minValue), maxValue);
}

// Register GSAP Stuff (now done in Webflow)
// gsap.registerPlugin(ScrollTrigger);
// gsap.registerPlugin(CustomEase);

// GSAP Custom Eases
CustomEase.create("out-quad", "0.5, 1, 0.89, 1");

let lenis;

// Lenis setup
function setupLenis() {
  lenis = new Lenis();

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  lenis.start();

  let isPaused = false;

  document.addEventListener('click', (e) => {
    const navButton = e.target.closest('.w-nav-button');
    const navWrap = e.target.closest('.nav_1_mobile_contain');

    // Case 1: Toggle on button click
    if (navButton) {
      isPaused ? lenis.start() : lenis.stop();
      isPaused = !isPaused;
      return;
    }

    // Case 2: Resume only if click is inside nav wrap (not on button) and nav is open
    if (navWrap && !navWrap.contains(navButton)) {
      if (isPaused) {
        lenis.start();
        isPaused = false;
      }
    }
  });

  function trapScroll(el) {
    el.addEventListener('wheel', (e) => {
      const delta = e.deltaY;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        e.preventDefault();
      }
      // Allow scroll inside the element if it's not at an edge
    }, { passive: false });

    let startY = 0;

    el.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });

    el.addEventListener('touchmove', (e) => {
      const deltaY = startY - e.touches[0].clientY;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  const navScroll = document.querySelector('.nav_1_menu_scroll');
  if (navScroll) trapScroll(navScroll);
}

// grabCursor setup
function setupGrabCursor(elem) {
  // Function to set grab cursor (mimicking Swiper's grabCursor behavior)
  function setGrabCursor() {
    elem.style.cursor = "grab";
    elem.style.touchAction = "none"; // Prevent default touch scrolling issues
  }

  // Function to set grabbing cursor
  function setGrabbingCursor() {
    elem.style.cursor = "grabbing";
  }

  // Ensure the scrollbar exists before adding event listeners
  if (elem) {
    // Apply grab cursor when pointer enters scrollbar
    elem.addEventListener("pointerenter", setGrabCursor);

    // Change to grabbing on pointer down (start dragging)
    elem.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") {
        // Ensure it's not a touch event
        setGrabbingCursor();
      }
    });

    // Reset to grab cursor when dragging stops
    document.addEventListener("pointerup", () => {
      setGrabCursor();
    });

    // Reset cursor when mouse leaves the scrollbar drag
    elem.addEventListener("pointerleave", () => {
      setGrabCursor();
    });
  }
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
    // const topOffsetPercent = window.innerWidth > 600 ? 85 : 95;

    // ScrollTrigger with time grouping logic
    ScrollTrigger.create({
      trigger: element,
      start: `top bottom-=15%`,
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

// Nav Animation on Scroll
function navAnimationOnScroll() {
  // Retrieve the initial value of --theme--text before any GSAP manipulation
  const navElement = document.querySelector(".nav_1_component");
  const initialTextColor = getComputedStyle(navElement)
    .getPropertyValue("--_theme---text")
    .trim();

  function calculateNavHeight() {
    const navContainer = document.querySelector(".nav_1_mobile_contain");
    const px = parseFloat(getComputedStyle(navContainer).height);
    return px / 16;
  }

  let initialHeightRem = calculateNavHeight();
  // console.log("initialHeightRem:", initialHeightRem);

  function getFluidScrollOffsets() {
    const startValue = fluidClamp(480, 1440, 5, 20);     // 1–20px fluid
    const endValue   = fluidClamp(480, 1440, 80, 150);   // 80–150px fluid

    return { startValue, endValue };
  }
  let { startValue, endValue } = getFluidScrollOffsets();
  // console.log(startValue, endValue);

  window.addEventListener("resize", () => {
    initialHeightRem = calculateNavHeight();
  });

  gsap.set(".nav_1_wrap", {
    backgroundColor: "rgba(7, 39, 45, 0)"
  });

  gsap.to(".nav_1_wrap", {
    scrollTrigger: {
      start: `${startValue}px top`,
      end: `${endValue}px`,
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

        // Interpolate color and update variable
        const interpolatedColor = gsap.utils.interpolate(
          initialTextColor,
          finalTextColor,
          progress
        );
        navElement.style.setProperty("--_theme---text", interpolatedColor);
      },
      onLeaveBack: () => {
        // Add a slight delay before removing styles
        setTimeout(() => {
          navElement.style.removeProperty("--_theme---text");
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
          dragSize: 120,
        },
        navigation: {
          prevEl: prevBtn,
          nextEl: nextBtn,
        },
        breakpoints: {
          500: {
            scrollbar: {
              dragSize: 200,
            },
          },
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

      const scrollbarDrag = scrollbarEl.querySelector(".swiper-scrollbar-drag");
      setupGrabCursor(scrollbarDrag);
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
          dragSize: 120,
        },
        navigation: {
          prevEl: prevBtn,
          nextEl: nextBtn,
        },
        breakpoints: {
          500: {
            scrollbar: {
              dragSize: 200,
            },
          },
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

      const scrollbarDrag = scrollbarEl.querySelector(".swiper-scrollbar-drag");
      setupGrabCursor(scrollbarDrag);
    });
  }
}

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

          // statVal.innerHTML = formattedZeroValue; // Start from the correct number of digits
          // statVal.innerHTML = ""; // clear out any preexisting content
          // console.debug(
          //   `Original: ${originalValue}, Zeroed: ${formattedZeroValue}`
          // );
          var od = new Odometer({
            el: statVal,
            format: "(,ddd).dd",
            value: formattedZeroValue,
            duration: 3000,
          });
          od.render(); // forces odometer to build its internal DOM now
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

// Auto-Update Copyright Year
function copyrightAutoUpdate() {
  const currentYear = new Date().getFullYear();
  $("[data-copyright-year]").html(currentYear);
}

// Timeline
function timeline() {
  if (document.querySelector('.timeline_wrap')) {
    console.debug('timeline(s) exist');
    const timelineComponents = document.querySelectorAll(".timeline_wrap");

    timelineComponents.forEach((component) => {
      const headerItems = [...component.querySelectorAll('.timeline_header_collection_item')];
      const navItems = [...component.querySelectorAll('.timeline_nav_collection_item')];
      const prevBtn = component.querySelector('.timeline_header_button.is-prev');
      const nextBtn = component.querySelector('.timeline_header_button.is-next');

      let currentIndex = headerItems.findIndex(item => item.classList.contains('is-active'));
      let isTransitioning = false;

      // Set first active state if none
      if (currentIndex === -1) {
        headerItems[0].classList.add('is-active');
        navItems[0].classList.add('is-active');
        currentIndex = 0;
      }

      function animateTimelineTransition(newIndex) {
        if (isTransitioning || newIndex === currentIndex || newIndex < 0 || newIndex >= headerItems.length) return;

        isTransitioning = true;

        const oldItem = headerItems[currentIndex];
        const newItem = headerItems[newIndex];

        const oldContentWrap = oldItem.querySelector('.timeline_header_content_inner');
        const newContentWrap = newItem.querySelector('.timeline_header_content_inner');

        const oldContentWrapText = oldContentWrap.querySelector('.timeline_header_content_text_wrap');
        const newContentWrapText = newContentWrap.querySelector('.timeline_header_content_text_wrap');

        const oldHeadingWrap = oldContentWrap.querySelector('.timeline_header_content_heading_wrap');
        const newHeadingWrap = newContentWrap.querySelector('.timeline_header_content_heading_wrap');

        const oldTagsWrap = oldContentWrap.querySelector('.timeline_header_content_tags_wrap');
        const newTagsWrap = newContentWrap.querySelector('.timeline_header_content_tags_wrap');

        const oldHeadingContent = oldHeadingWrap.querySelector('.timeline_header_content_heading');
        const newHeadingContent = newHeadingWrap.querySelector('.timeline_header_content_heading');

        const oldMarqueeContain = oldItem.querySelector('.timeline_header_marquee_contain');
        const newMarqueeContain = newItem.querySelector('.timeline_header_marquee_contain');

        const oldMarqueeContent = oldMarqueeContain.querySelector('.timeline_header_marquee_content');
        const newMarqueeContent = newMarqueeContain.querySelector('.timeline_header_marquee_content');

        gsap.to(oldContentWrapText.children, {
          opacity: 0,
          duration: 0.7,
          stagger: 0.05,
          onComplete: () => {
            oldItem.classList.remove('is-active');
            navItems[currentIndex].classList.remove('is-active');

            newItem.classList.add('is-active');
            navItems[newIndex].classList.add('is-active');

            navItems[newIndex].scrollIntoView({
              behavior: 'smooth',
              inline: 'center', // or 'nearest' depending on your layout
              block: 'nearest'
            });

            // Reset the translateY and opacity for the heading and text wraps
            gsap.set(newContentWrapText.children, { opacity: 0 });
            gsap.set(newHeadingContent, { y: newHeadingWrap.offsetHeight });
            gsap.set(newMarqueeContent, { y: newMarqueeContain.offsetHeight });
            gsap.set(newTagsWrap.children, { opacity: 0 });

            gsap.to(newContentWrapText.children, {
              opacity: 1,
              duration: 0.7,
              stagger: 0.05
            });

            gsap.to(newHeadingContent, {
              y: 0,
              duration: 0.7
            });

            gsap.to(newMarqueeContent, {
              y: 0,
              duration: 0.7
            });

            gsap.to(newTagsWrap.children, {
              opacity: 1,
              duration: 0.7,
              ease: 'power1.inOut'
            });

            gsap.to(newContentWrap.children, {
              y: 0,
              opacity: 1,
              duration: 0,
              stagger: 0.05,
              onComplete: () => {
                currentIndex = newIndex;
                isTransitioning = false;

                prevBtn.classList.toggle('is-disabled', currentIndex === 0);
                nextBtn.classList.toggle('is-disabled', currentIndex === headerItems.length - 1);
              }
            });
          }
        });

        gsap.to(oldHeadingContent, {
          y: -oldHeadingWrap.offsetHeight,
          duration: 0.7,
          ease: 'power1.inOut'
        });

        gsap.to(oldMarqueeContent, {
          y: -oldMarqueeContain.offsetHeight,
          duration: 0.7,
          ease: 'power1.inOut'
        });

        gsap.to(oldTagsWrap.children, {
          opacity: 0,
          duration: 0.7,
          stagger: 0.05,
          ease: 'power1.inOut'
        });
      }

      prevBtn.addEventListener('click', () => {
        animateTimelineTransition(currentIndex - 1);
      });

      nextBtn.addEventListener('click', () => {
        animateTimelineTransition(currentIndex + 1);
      });

      navItems.forEach((navItem, index) => {
        navItem.addEventListener('click', () => {
          animateTimelineTransition(index);
        });
      });

      // Initial button state
      prevBtn.classList.toggle('is-disabled', currentIndex === 0);
      nextBtn.classList.toggle('is-disabled', currentIndex === headerItems.length - 1);
    });
  }
}


// Init Function
const init = () => {
  console.debug("%cRun init", "color: lightgreen;");

  setupLenis();
  initScrollAnimations();
  navAnimationOnScroll();
  swipers();
  finsweetStuff();
  splitPanelScrollLock();
  bambooLinks();
  odometers();
  copyrightAutoUpdate();
  timeline();
}; // end init

$(window).on("load", init);