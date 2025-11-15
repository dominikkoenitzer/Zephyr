/**
 * Enhanced smooth scrolling utility with requestAnimationFrame
 * Provides ultra-smooth scrolling experience
 */

/**
 * Smooth scroll to element with easing
 * @param {HTMLElement} element - Target element to scroll to
 * @param {Object} options - Scroll options
 */
export const smoothScrollTo = (element, options = {}) => {
  const {
    offset = 0,
    duration = 800,
    easing = 'easeInOutCubic'
  } = options;

  if (!element) return;

  const start = window.pageYOffset || document.documentElement.scrollTop;
  const target = element.getBoundingClientRect().top + start - offset;
  const distance = target - start;
  let startTime = null;

  // Easing functions
  const easingFunctions = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  };

  const easingFunction = easingFunctions[easing] || easingFunctions.easeInOutCubic;

  const animateScroll = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const ease = easingFunction(progress);
    window.scrollTo(0, start + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

/**
 * Smooth scroll to top
 */
export const smoothScrollToTop = (duration = 800) => {
  const start = window.pageYOffset || document.documentElement.scrollTop;
  const distance = -start;
  let startTime = null;

  const animateScroll = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Ease in out cubic
    const ease = progress < 0.5 
      ? 4 * progress * progress * progress 
      : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
    
    window.scrollTo(0, start + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

/**
 * Initialize smooth scroll enhancements
 */
export const initSmoothScroll = () => {
  // Enhance native smooth scrolling with passive listeners
  if ('scrollBehavior' in document.documentElement.style) {
    // Add passive scroll listeners for better performance
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Trigger any scroll-based animations here
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }
};

