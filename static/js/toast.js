/*
 * toast.js
 * --------
 * Minimal, dependency-free toast notifications + a copy-to-clipboard
 * helper wired to any element with [data-copy-target] / [data-copy-value].
 */

(function () {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  window.showToast = function (message, kind = "info", duration = 2600) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${kind}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("toast-show"));
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 250);
    }, duration);
  };

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for browsers/contexts without Clipboard API permission
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy-target], [data-copy-value]");
    if (!btn) return;

    let text = btn.getAttribute("data-copy-value");
    if (!text) {
      const targetSelector = btn.getAttribute("data-copy-target");
      const targetEl = document.querySelector(targetSelector);
      text = targetEl ? (targetEl.value !== undefined ? targetEl.value : targetEl.textContent) : "";
    }
    if (!text) return;

    const ok = await copyText(text);
    window.showToast(ok ? "Copied to clipboard" : "Could not copy — please copy manually", ok ? "ok" : "error");
  });
})();
