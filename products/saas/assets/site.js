/* Applies config.js to the page and powers interactions. No dependencies. */
(function () {
  "use strict";
  var FONTS = { "Inter": "Inter:wght@400;500;600;700", "Space Grotesk": "Space+Grotesk:wght@400;500;600;700", "IBM Plex Sans": "IBM+Plex+Sans:wght@400;500;600;700", "Manrope": "Manrope:wght@400;500;600;700" };
  var ENUMS = { preset: ["minimal", "modern", "bold"], theme: ["dark", "light"], buttons: ["auto", "pill", "rounded", "square"], density: ["compact", "normal", "spacious"] };
  var root = document.documentElement;

  function get(obj, path) { return path.split(".").reduce(function (o, k) { return o && o[k] !== undefined ? o[k] : undefined; }, obj); }
  function safeUrl(u) { u = String(u || "").trim(); return /^(https?:\/\/|mailto:|tel:|#|[a-z0-9_\-./]+\.html(#.*)?$|[a-z0-9_\-./]+\/?$)/i.test(u) && !/^javascript:/i.test(u) ? u : ""; }
  function hex(c) { return /^#[0-9a-f]{6}$/i.test(c) ? c : null; }
  function inkFor(c) { var n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#050505" : "#ffffff"; }

  // Validate a config; returns a clean copy (unknown/invalid values fall back to defaults)
  function validate(c, d) {
    var out = JSON.parse(JSON.stringify(d));
    if (!c || typeof c !== "object") return out;
    ["preset", "theme"].forEach(function (k) { if (ENUMS[k].indexOf(c[k]) > -1) out[k] = c[k]; });
    var s = c.style || {};
    if (hex(s.accent) || s.accent === "") out.style.accent = s.accent;
    if (FONTS[s.font]) out.style.font = s.font;
    if (ENUMS.buttons.indexOf(s.buttons) > -1) out.style.buttons = s.buttons;
    if (ENUMS.density.indexOf(s.density) > -1) out.style.density = s.density;
    ["brand", "nav", "hero", "contact", "social", "seo"].forEach(function (g) {
      if (!c[g]) return;
      Object.keys(out[g]).forEach(function (k) {
        var v = c[g][k]; if (typeof v !== "string") return;
        v = v.slice(0, 300);
        if (/url|logo|endpoint/i.test(k) || g === "social") v = v ? safeUrl(v) : "";
        if (k === "email" && v && !/^\S+@\S+\.\S+$/.test(v)) return;
        out[g][k] = v;
      });
    });
    return out;
  }

  var DEFAULTS = JSON.parse(JSON.stringify(window.SITE_CONFIG || {}));
  var config = validate(window.SITE_CONFIG, DEFAULTS);

  function loadFont(name) {
    var id = "font-" + name.replace(/\s/g, "");
    if (document.getElementById(id)) return;
    var l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + FONTS[name] + "&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
  }

  function apply(c) {
    root.dataset.preset = c.preset; root.dataset.theme = c.theme;
    root.dataset.density = c.style.density;
    if (c.style.buttons === "auto") delete root.dataset.buttons; else root.dataset.buttons = c.style.buttons;
    if (c.style.accent) { root.style.setProperty("--accent", c.style.accent); root.style.setProperty("--accent-ink", inkFor(c.style.accent)); }
    else { root.style.removeProperty("--accent"); root.style.removeProperty("--accent-ink"); }
    root.style.setProperty("--font", '"' + c.style.font + '",system-ui,sans-serif');
    loadFont(c.style.font); if (c.preset === "bold") loadFont("Space Grotesk");
    document.querySelectorAll("[data-c]").forEach(function (el) { var v = get(c, el.dataset.c); if (typeof v === "string") el.textContent = v; });
    document.querySelectorAll("[data-c-href]").forEach(function (el) {
      var v = get(c, el.dataset.cHref); if (el.dataset.cHref === "contact.email") v = v ? "mailto:" + v : "";
      if (v) { el.href = v; el.hidden = false; } else if (el.dataset.optional !== undefined) el.hidden = true;
    });
    document.querySelectorAll(".logo").forEach(function (el) {
      var img = el.querySelector("img");
      if (c.brand.logo) { if (!img) { img = document.createElement("img"); el.insertBefore(img, el.firstChild); } img.src = c.brand.logo; img.alt = ""; el.querySelector("i") && (el.querySelector("i").hidden = true); }
      else { if (img) img.remove(); el.querySelector("i") && (el.querySelector("i").hidden = false); }
    });
    var page = document.body.dataset.page || "";
    document.title = (page ? page + " · " : "") + c.seo.siteName;
    var md = document.querySelector('meta[name="description"]'); if (md) md.content = c.seo.description;
  }
  apply(config);
  window.SITE = { apply: function (c) { config = validate(c, DEFAULTS); apply(config); return config; }, validate: function (c) { return validate(c, DEFAULTS); }, defaults: DEFAULTS };

  // Live updates from Template Studio (same origin only)
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== "droplates:config") return;
    window.SITE.apply(e.data.config);
  });

  // Mobile menu
  var nav = document.querySelector("nav"), tog = document.querySelector(".nav-toggle");
  if (nav && tog) tog.addEventListener("click", function () { var o = nav.classList.toggle("open"); tog.setAttribute("aria-expanded", o); });

  // Tabs
  var tabs = [].slice.call(document.querySelectorAll('[role="tab"]'));
  function sel(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute("aria-controls")).hidden = !on; }); }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { sel(t); });
    t.addEventListener("keydown", function (e) { var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return; var n = tabs[(i + d + tabs.length) % tabs.length]; sel(n); n.focus(); });
  });

  // Pricing toggle
  var bs = [].slice.call(document.querySelectorAll(".toggle button"));
  bs.forEach(function (b) { b.addEventListener("click", function () { bs.forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); document.querySelectorAll(".pr").forEach(function (p) { p.firstChild.textContent = p.dataset[b.dataset.p]; }); }); });

  // Contact form: validates, then sends to config.contact.formEndpoint if set
  var f = document.getElementById("cf"), err = document.getElementById("err");
  if (f) f.addEventListener("submit", function (ev) {
    ev.preventDefault(); var bad = null;
    f.querySelectorAll("[required]").forEach(function (el) {
      var v = el.value.trim(), ok = v && (el.type !== "email" || /^\S+@\S+\.\S+$/.test(v)) && (!el.minLength || el.minLength < 0 || v.length >= el.minLength);
      el.setAttribute("aria-invalid", !ok); if (!ok && !bad) bad = el;
    });
    if (bad) { err.textContent = "Please check the highlighted fields."; bad.focus(); return; }
    if (!config.contact.formEndpoint) { err.textContent = "This form is not connected yet. Set contact.formEndpoint in config.js to receive messages."; return; }
    err.textContent = "Sending…";
    fetch(config.contact.formEndpoint, { method: "POST", body: new FormData(f), headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw 0; f.reset(); err.textContent = "Thanks — your message was sent."; })
      .catch(function () { err.textContent = "Sorry, the message could not be sent. Please email us instead."; });
  });

  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
