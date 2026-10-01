/*
 * animations.js
 * -------------
 * Small, dependency-free animation helpers shared across pages.
 */

const VoteSetuAnim = (() => {
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Animate a number counting up (or down) from its current displayed
   * value to `target`, over `duration` ms, using an ease-out curve.
   * Falls back to an instant set for reduced-motion users.
   */
  function animateCount(el, target, duration = 700) {
    if (!el) return;
    target = Number(target) || 0;

    if (prefersReducedMotion()) {
      el.textContent = target;
      return;
    }

    const start = Number(el.dataset.animCurrent || 0);
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const value = Math.round(start + (target - start) * eased);
      el.textContent = value;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
        el.dataset.animCurrent = String(target);
      }
    }
    requestAnimationFrame(tick);
  }

  /** Replace an element's content with a skeleton placeholder block. */
  function showSkeleton(el, kind = "skeleton-line") {
    if (!el) return;
    el.classList.add("skeleton", kind);
  }

  function hideSkeleton(el, kind = "skeleton-line") {
    if (!el) return;
    el.classList.remove("skeleton", kind);
  }

  return { animateCount, showSkeleton, hideSkeleton, prefersReducedMotion };
})();
