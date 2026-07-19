/* =====================================================================
   Font-size control — floating A− / ↺ / A+ pill, mobile only (hidden on
   desktop via CSS). Scales --scale on :root (everything is in rem/em, so
   it scales the whole page) and persists the preference in localStorage.
   Self-injecting — pages just include this script.
   ===================================================================== */
(function () {
  var KEY = "mysql-fundamentals-font-scale";
  var MIN = 0.85, MAX = 1.8, STEP = 0.15;

  function clamp(v) { return Math.min(MAX, Math.max(MIN, v)); }

  function getScale() {
    var v = parseFloat(localStorage.getItem(KEY));
    return isNaN(v) ? 1 : clamp(v);
  }

  function baseSize() {
    var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--base"));
    return (!isNaN(v) && v > 0) ? v : 16;
  }

  function apply(scale) {
    // px inline pe <html> — învinge orice regulă din stylesheet (chiar și din cache)
    document.documentElement.style.fontSize = (baseSize() * scale) + "px";
    document.documentElement.style.setProperty("--scale", scale);
    localStorage.setItem(KEY, scale);
  }

  function build() {
    apply(getScale());

    var bar = document.createElement("div");
    bar.className = "fontsize-control";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Mărime text");

    function mk(label, title, fn) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.title = title;
      b.setAttribute("aria-label", title);
      b.addEventListener("click", fn);
      bar.appendChild(b);
      return b;
    }

    mk("A−", "Micșorează textul", function () { apply(clamp(getScale() - STEP)); });
    mk("↺", "Mărime implicită", function () { apply(1); });
    mk("A+", "Mărește textul", function () { apply(clamp(getScale() + STEP)); });

    document.body.appendChild(bar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
