/* Droplates template runtime v2 (shared by all free templates). Applies config.js and powers interactions. No dependencies.
 * Config schema 2 = schema 1 + content/links/images/sections overrides. Schema 1 configs are migrated automatically. */
(function () {
  "use strict";
  var SCHEMA = 2;
  var FONTS = {
    "Inter": "Inter:wght@400;500;600;700", "Space Grotesk": "Space+Grotesk:wght@400;500;600;700",
    "IBM Plex Sans": "IBM+Plex+Sans:wght@400;500;600;700", "Manrope": "Manrope:wght@400;500;600;700",
    "Instrument Serif": "Instrument+Serif:ital@0;1", "Fraunces": "Fraunces:opsz,wght@9..144,400;9..144,600"
  };
  var root = document.documentElement;
  var PRESETS = (root.dataset.presets || "").split(",").filter(Boolean);
  var HEAD_FONTS = (root.dataset.headFonts || "").split(",").filter(Boolean);
  var ENUMS = { theme: ["dark", "light"], buttons: ["auto", "pill", "rounded", "square"], density: ["compact", "normal", "spacious"] };
  var KEY_RE = /^[a-z0-9-]{1,40}$/;
  var IMG_RE = /^(data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|assets\/[\w\-./]+\.(png|jpe?g|webp|svg))$/;

  function get(obj, path) { return path.split(".").reduce(function (o, k) { return o && o[k] !== undefined ? o[k] : undefined; }, obj); }
  function safeUrl(u) { u = String(u || "").trim(); if (/^javascript:/i.test(u)) return ""; return /^(https?:\/\/[^\s<>"]+|mailto:[^\s<>"]+|tel:[+\d\s-]+|#[\w-]*|[\w\-./]+(#[\w-]*)?)$/i.test(u) ? u : ""; }
  function hex(c) { return /^#[0-9a-f]{6}$/i.test(c) ? c : null; }
  function inkFor(c) { var n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#0a0a0a" : "#ffffff"; }
  function obj(x) { return x && typeof x === "object" && !Array.isArray(x) ? x : {}; }
  // Validate a value against an example of the expected shape (used for lists such as plans, projects, team).
  function like(v, ex, key) {
    if (Array.isArray(ex)) { if (!Array.isArray(v)) return JSON.parse(JSON.stringify(ex)); return ex.length ? v.slice(0, 24).map(function (x) { return like(x, ex[0], key); }) : []; }
    if (ex && typeof ex === "object") { var o = {}; v = obj(v); Object.keys(ex).forEach(function (k) { o[k] = k in v ? like(v[k], ex[k], k) : JSON.parse(JSON.stringify(ex[k])); }); return o; }
    if (typeof ex === "boolean") return typeof v === "boolean" ? v : ex;
    if (typeof ex === "number") return typeof v === "number" && isFinite(v) ? v : ex;
    if (typeof v !== "string") return ex;
    v = v.slice(0, 600);
    if (/url$/i.test(key || "")) return v ? safeUrl(v) : "";
    if (key === "image") return v && v.length < 1500000 && IMG_RE.test(v) ? v : "";
    return v;
  }

  // Migrate older schemas, then validate against defaults; invalid values fall back to defaults.
  function migrate(c) {
    c = JSON.parse(JSON.stringify(obj(c)));
    if (!c.schema || c.schema < 2) { c.content = obj(c.content); c.links = obj(c.links); c.images = obj(c.images); c.sections = obj(c.sections); c.schema = 2; }
    return c;
  }
  function validate(c, d) {
    var out = JSON.parse(JSON.stringify(d));
    out.schema = SCHEMA; out.content = {}; out.links = {}; out.images = {}; out.sections = {};
    if (!c || typeof c !== "object") return out;
    c = migrate(c);
    if (PRESETS.indexOf(c.preset) > -1) out.preset = c.preset;
    if (ENUMS.theme.indexOf(c.theme) > -1) out.theme = c.theme;
    var s = obj(c.style);
    if (hex(s.accent) || s.accent === "") out.style.accent = s.accent;
    if (FONTS[s.font]) out.style.font = s.font;
    if ("headFont" in out.style && (s.headFont === "" || HEAD_FONTS.indexOf(s.headFont) > -1)) out.style.headFont = s.headFont;
    if (ENUMS.buttons.indexOf(s.buttons) > -1) out.style.buttons = s.buttons;
    if (ENUMS.density.indexOf(s.density) > -1) out.style.density = s.density;
    Object.keys(out).forEach(function (g) {
      if (["style", "content", "links", "images", "sections"].indexOf(g) > -1 || !out[g] || typeof out[g] !== "object" || Array.isArray(out[g]) || !c[g]) return;
      Object.keys(out[g]).forEach(function (k) {
        var v = c[g][k];
        if (typeof out[g][k] === "boolean") { if (typeof v === "boolean") out[g][k] = v; return; }
        if (typeof v !== "string") return;
        if (k === "logo" && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(v) && v.length < 400000) { out[g][k] = v; return; }
        v = v.slice(0, 400);
        if (/url|logo|endpoint|image/i.test(k) || g === "social") v = v ? safeUrl(v) : "";
        if (k === "email" && v && !/^\S+@\S+\.\S+$/.test(v)) return;
        out[g][k] = v;
      });
    });
    Object.keys(out).forEach(function (k) { if (Array.isArray(d[k]) && c[k] !== undefined) out[k] = like(c[k], d[k], k); });
    Object.keys(obj(c.content)).forEach(function (k) { var v = c.content[k]; if (KEY_RE.test(k) && typeof v === "string") out.content[k] = v.slice(0, 2000); });
    Object.keys(obj(c.links)).forEach(function (k) { var v = safeUrl(c.links[k]); if (KEY_RE.test(k) && v) out.links[k] = v; });
    Object.keys(obj(c.images)).forEach(function (k) { var v = c.images[k]; if (KEY_RE.test(k) && typeof v === "string" && v.length < 1500000 && IMG_RE.test(v)) out.images[k] = v; });
    Object.keys(obj(c.sections)).forEach(function (k) { if (KEY_RE.test(k) && obj(c.sections[k]).hidden === true) out.sections[k] = { hidden: true }; });
    return out;
  }

  var DEFAULTS = migrate(window.SITE_CONFIG || {});
  var config = validate(window.SITE_CONFIG, DEFAULTS);
  var ORIG = new WeakMap(); // original text/href/background per element, so removing an override restores the template default

  function loadFont(name) {
    if (!FONTS[name]) return;
    var id = "font-" + name.replace(/\s/g, "");
    if (document.getElementById(id)) return;
    var l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + FONTS[name] + "&display=swap";
    document.head.appendChild(l);
  }
  function orig(el, key, val) { var o = ORIG.get(el) || {}; if (!(key in o)) { o[key] = val; ORIG.set(el, o); } return o[key]; }

  /* Lists: <div data-list="plans"><template>…<b data-k="name"></b>…</template></div> renders one copy per item.
     data-k="field" (text, "." = the item itself), data-k-href, data-k-bg (image), data-k-class="field:class", data-k-attr="m:field,y:field",
     data-k-initial="field" (first letter), data-k-show="field". Nested data-list inside a template renders a sub-list. */
  // true if an element between el (exclusive) and top (inclusive when top is itself a list host) is a list host
  function innerOf(el, top) {
    var sawGen = el.hasAttribute("data-gen");
    for (var p = el.parentElement; p; p = p.parentElement) {
      if (p === top) return top.hasAttribute("data-list") && sawGen;
      if (p.hasAttribute("data-list")) return true;
      if (p.hasAttribute("data-gen")) sawGen = true;
    }
    return false;
  }
  function fill(top, item, path) {
    [top].concat([].slice.call(top.querySelectorAll("*"))).forEach(function (e) {
      if (e !== top && innerOf(e, top)) return;
      var d = e.dataset;
      var val = function (f) { return f === "." ? item : (item && typeof item === "object" ? item[f] : undefined); };
      var at = function (f) { return f === "." ? path : path + "." + f; };
      if (d.k) { var v = val(d.k); e.textContent = v == null ? "" : String(v); e.setAttribute("data-lk", at(d.k)); }
      if (d.kInitial) { var t = String(val(d.kInitial) || "?"); e.textContent = t.charAt(0).toUpperCase(); }
      if (d.kHref) { var u = val(d.kHref); if (u) e.setAttribute("href", u); e.setAttribute("data-lk-href", at(d.kHref)); }
      if (d.kBg) { var b = val(d.kBg); e.style.backgroundImage = b ? 'url("' + b + '")' : ""; e.style.backgroundSize = "cover"; e.style.backgroundPosition = "center"; e.classList.toggle("has-img", !!b); e.setAttribute("data-lk-img", at(d.kBg)); }
      if (d.kClass) d.kClass.split(",").forEach(function (p) { var kv = p.split(":"); e.classList.toggle(kv[1], !!val(kv[0])); });
      if (d.kAttr) d.kAttr.split(",").forEach(function (p) { var kv = p.split(":"); e.setAttribute("data-" + kv[0], String(val(kv[1]) || "")); });
      if (d.kShow) e.hidden = !val(d.kShow);
    });
  }
  function renderList(host, items, path) {
    var tpl = null; [].forEach.call(host.children, function (ch) { if (ch.tagName === "TEMPLATE") tpl = ch; });
    if (!tpl) return;
    [].slice.call(host.children).forEach(function (ch) { if (ch.hasAttribute("data-gen")) ch.remove(); });
    (Array.isArray(items) ? items : []).forEach(function (item, i) {
      var frag = tpl.content.cloneNode(true), p = path + "." + i;
      [].slice.call(frag.children).forEach(function (top) {
        top.setAttribute("data-gen", "");
        if (top.hasAttribute("data-list")) renderList(top, item && item[top.dataset.list], p + "." + top.dataset.list);
        [].slice.call(top.querySelectorAll("[data-list]")).forEach(function (sub) { if (!innerOf(sub, top)) renderList(sub, item && item[sub.dataset.list], p + "." + sub.dataset.list); });
        fill(top, item, p);
      });
      host.appendChild(frag);
    });
  }
  function renderLists(c) {
    document.querySelectorAll("[data-list]").forEach(function (host) {
      if (host.closest("template,[data-gen]")) return;
      renderList(host, get(c, host.dataset.list), host.dataset.list);
    });
  }

  function apply(c) {
    renderLists(c);
    document.querySelectorAll("[data-show]").forEach(function (el) { el.hidden = get(c, el.dataset.show) !== true || (!editing && sessionStorage.getItem("dp-dismiss-" + el.dataset.show) === "1"); });
    root.dataset.preset = c.preset; root.dataset.theme = c.theme; root.dataset.density = c.style.density;
    if (c.style.buttons === "auto") delete root.dataset.buttons; else root.dataset.buttons = c.style.buttons;
    ["--accent", "--band-accent"].forEach(function (v) {
      if (c.style.accent) { root.style.setProperty(v, c.style.accent); root.style.setProperty(v + "-ink", inkFor(c.style.accent)); }
      else { root.style.removeProperty(v); root.style.removeProperty(v + "-ink"); }
    });
    root.style.setProperty("--font", '"' + c.style.font + '",system-ui,sans-serif'); loadFont(c.style.font);
    if (c.style.headFont) { root.style.setProperty("--font-head", '"' + c.style.headFont + '",serif'); loadFont(c.style.headFont); }
    else root.style.removeProperty("--font-head");
    (root.dataset.presetFonts || "").split(",").forEach(loadFont);
    document.querySelectorAll("[data-c]").forEach(function (el) { var v = get(c, el.dataset.c); if (typeof v === "string") el.textContent = v; });
    document.querySelectorAll("[data-c-href]").forEach(function (el) {
      var v = get(c, el.dataset.cHref); if (el.dataset.cHref === "contact.email") v = v ? "mailto:" + v : "";
      if (v) { el.href = v; el.hidden = false; } else if (el.hasAttribute("data-optional")) el.hidden = true;
    });
    document.querySelectorAll("[data-e]").forEach(function (el) { var d = orig(el, "text", el.textContent); var v = c.content[el.dataset.e]; el.textContent = typeof v === "string" ? v : d; });
    document.querySelectorAll("[data-el]").forEach(function (el) { var d = orig(el, "href", el.getAttribute("href")); el.setAttribute("href", c.links[el.dataset.el] || d); });
    document.querySelectorAll("[data-ei]").forEach(function (el) {
      var v = c.images[el.dataset.ei];
      if (v) { el.style.backgroundImage = 'url("' + v + '")'; el.style.backgroundSize = "cover"; el.style.backgroundPosition = "center"; el.classList.add("has-img"); }
      else { el.style.backgroundImage = ""; el.classList.remove("has-img"); }
    });
    document.querySelectorAll("[data-s]").forEach(function (el) { el.hidden = !!(c.sections[el.dataset.s] && c.sections[el.dataset.s].hidden); });
    document.querySelectorAll(".logo").forEach(function (el) {
      var img = el.querySelector("img"), mark = el.querySelector("i");
      if (c.brand && c.brand.logo) { if (!img) { img = document.createElement("img"); img.alt = ""; el.insertBefore(img, el.firstChild); } img.src = c.brand.logo; if (mark) mark.hidden = true; }
      else { if (img) img.remove(); if (mark) mark.hidden = false; }
    });
    var page = document.body.dataset.page || "";
    if (c.seo) {
      document.title = (page ? page + " · " : "") + c.seo.siteName;
      var md = document.querySelector('meta[name="description"]'); if (md) md.content = c.seo.description;
    }
    if (editing) { placeTag(); document.querySelectorAll("[data-lk],[data-lk-img]").forEach(function (el) { if (!el.hasAttribute("tabindex") && !/^(A|BUTTON)$/.test(el.tagName)) el.setAttribute("tabindex", "0"); }); }
  }
  var imgStyle = document.createElement("style"); imgStyle.textContent = ".has-img{color:transparent!important}"; document.head.appendChild(imgStyle);

  /* ---------- Studio edit mode (only active when the Studio asks; never in a downloaded site) ---------- */
  var editing = false, selected = null, tag = null, studio = window.parent !== window ? window.parent : null;
  var EDITABLE = "[data-c],[data-e],[data-el],[data-ei],[data-lk],[data-lk-img]";
  function send(msg) { if (studio) studio.postMessage(msg, location.origin); }
  function sectionsInfo() {
    var seen = {}, list = [];
    document.querySelectorAll("[data-s]").forEach(function (el) {
      var id = el.dataset.s; if (seen[id]) return; seen[id] = 1;
      var keys = [].map.call(document.querySelectorAll('[data-s="' + id + '"] [data-e],[data-s="' + id + '"] [data-el],[data-s="' + id + '"] [data-ei]'), function (x) { return x.dataset.e || x.dataset.el || x.dataset.ei; });
      list.push({ id: id, label: el.dataset.sLabel || id, optional: el.dataset.sOptional === "true", keys: keys });
    });
    return list;
  }
  function describe(el) {
    var sec = el.closest("[data-s]"), info = { section: sec ? sec.dataset.s : null, sectionLabel: sec ? sec.dataset.sLabel : "Header" };
    if (el.dataset.ei) return Object.assign(info, { kind: "image", key: el.dataset.ei, label: "Image" });
    if (el.dataset.lk || el.dataset.lkImg) {
      var path = el.dataset.lk || el.dataset.lkImg, segs = path.split("."), j = -1;
      segs.forEach(function (x, i) { if (/^\d+$/.test(x)) j = i; });
      return Object.assign(info, { kind: "item", path: el.dataset.lk || null, hrefPath: el.dataset.lkHref || null, imgPath: el.dataset.lkImg || null,
        list: segs.slice(0, j).join("."), index: +segs[j], value: el.textContent, label: el.dataset.lkImg && !el.dataset.lk ? "Image" : "List item" });
    }
    if (el.dataset.c) return Object.assign(info, { kind: "config", key: el.dataset.c, label: el.dataset.c, value: el.textContent, hrefKey: el.dataset.cHref || null });
    var o = ORIG.get(el) || {};
    var d = Object.assign(info, { kind: el.dataset.el ? "link" : "text", key: el.dataset.e || null, linkKey: el.dataset.el || null, value: el.textContent,
      defaultValue: o.text, href: el.getAttribute("href"), defaultHref: o.href, label: el.dataset.el ? "Button" : ({ H1: "Heading", H2: "Heading", H3: "Heading", H4: "Heading", P: "Paragraph", LI: "List item", BLOCKQUOTE: "Quote", A: "Link" }[el.tagName] || "Text") });
    return d;
  }
  function placeTag() {
    if (!tag) return;
    if (!selected || !document.contains(selected) || selected.closest("[hidden]")) { tag.hidden = true; return; }
    var r = selected.getBoundingClientRect(); tag.hidden = false;
    tag.style.top = Math.max(0, r.top + scrollY - 24) + "px"; tag.style.left = Math.max(0, r.left + scrollX - 2) + "px";
  }
  function select(el, notify) {
    if (selected) selected.removeAttribute("data-dp-sel");
    selected = el; if (!el) { placeTag(); return; }
    el.setAttribute("data-dp-sel", ""); var d = describe(el); tag.textContent = d.label; placeTag();
    if (notify) send(Object.assign({ type: "droplates:picked" }, d));
  }
  function enableEditing() {
    if (editing) return; editing = true;
    var st = document.createElement("style"); st.id = "dp-edit";
    st.textContent = EDITABLE.split(",").map(function (s) { return s + ":hover"; }).join(",") + "{outline:1px dashed rgba(76,141,255,.75);outline-offset:3px;cursor:pointer}" +
      "[data-dp-sel]{outline:2px solid #4c8dff!important;outline-offset:3px}" +
      "#dp-tag{position:absolute;z-index:2147483647;font:500 11px/1 Inter,system-ui,sans-serif;background:#4c8dff;color:#fff;padding:4px 7px;border-radius:4px;pointer-events:none;letter-spacing:0;text-transform:none}";
    document.head.appendChild(st);
    tag = document.createElement("div"); tag.id = "dp-tag"; tag.hidden = true; document.body.appendChild(tag);
    document.querySelectorAll(EDITABLE).forEach(function (el) { if (!el.hasAttribute("tabindex") && !/^(A|BUTTON)$/.test(el.tagName)) el.setAttribute("tabindex", "0"); });
    document.addEventListener("click", function (e) {
      var el = e.target.closest(EDITABLE); var a = e.target.closest("a,button[type=submit],[role=tab],.toggle button,[data-f]");
      if (el) { e.preventDefault(); e.stopPropagation(); select(el, true); } else if (a && a.tagName === "A") e.preventDefault();
    }, true);
    document.addEventListener("submit", function (e) { e.preventDefault(); }, true);
    document.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(EDITABLE)) { e.preventDefault(); select(e.target, true); } });
    addEventListener("scroll", placeTag, { passive: true }); addEventListener("resize", placeTag);
  }

  apply(config);
  window.SITE = { apply: function (c) { config = validate(c, DEFAULTS); apply(config); return config; }, validate: function (c) { return validate(c, DEFAULTS); }, defaults: validate(DEFAULTS, DEFAULTS), current: function () { return config; }, schema: SCHEMA };

  // Messages from Template Studio (same origin only)
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || typeof e.data.type !== "string") return;
    var m = e.data;
    if (m.type === "droplates:config") window.SITE.apply(m.config);
    else if (m.type === "droplates:edit") { enableEditing(); send({ type: "droplates:ready", page: location.pathname.split("/").pop() || "index.html", sections: sectionsInfo() }); }
    else if (m.type === "droplates:scroll") { var s = document.querySelector('[data-s="' + String(m.section).replace(/[^a-z0-9-]/g, "") + '"]'); if (s && !s.hidden) s.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }
    else if (m.type === "droplates:deselect") select(null);
  });

  // Product tour: clicking a step shows its screenshot
  document.addEventListener("click", function (e) {
    var step = e.target.closest("[data-tour] [data-steps] > [data-gen]"); if (!step || editing) return;
    var tour = step.closest("[data-tour]"), steps = [].slice.call(tour.querySelectorAll("[data-steps] > [data-gen]")), i = steps.indexOf(step);
    steps.forEach(function (s, k) { s.classList.toggle("on", k === i); s.setAttribute("aria-current", k === i ? "step" : "false"); });
    tour.querySelectorAll("[data-shots] > [data-gen]").forEach(function (s, k) { s.hidden = k !== i; });
    var bar = tour.querySelector("[data-progress]"); if (bar) bar.style.width = ((i + 1) / steps.length * 100) + "%";
  });
  function initTours() { document.querySelectorAll("[data-tour]").forEach(function (t) { var first = t.querySelector("[data-steps] > [data-gen]"); if (first && !t.querySelector("[data-steps] > .on")) { first.classList.add("on"); t.querySelectorAll("[data-shots] > [data-gen]").forEach(function (s, k) { s.hidden = k !== 0; }); var bar = t.querySelector("[data-progress]"), n = t.querySelectorAll("[data-steps] > [data-gen]").length; if (bar && n) bar.style.width = (100 / n) + "%"; } }); }
  initTours(); var _apply = window.SITE.apply; window.SITE.apply = function (c) { var r = _apply(c); initTours(); return r; };
  document.addEventListener("click", function (e) { var x = e.target.closest("[data-dismiss]"); if (!x || editing) return; var el = x.closest("[data-show]"); if (el) { el.hidden = true; try { sessionStorage.setItem("dp-dismiss-" + el.dataset.show, "1"); } catch (er) {} } });

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

  // Filters (projects): buttons with data-f, items with data-cat
  var fs = [].slice.call(document.querySelectorAll("[data-f]"));
  fs.forEach(function (b) { b.addEventListener("click", function () {
    fs.forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    document.querySelectorAll("[data-cat]").forEach(function (i) { i.hidden = b.dataset.f !== "all" && i.dataset.cat !== b.dataset.f; });
  }); });

  // Contact form: validates, then sends to config.contact.formEndpoint if set
  var f = document.getElementById("cf"), err = document.getElementById("err");
  if (f) f.addEventListener("submit", function (ev) {
    ev.preventDefault(); if (editing) return; var bad = null;
    f.querySelectorAll("[required]").forEach(function (el) {
      var v = el.value.trim(), ok = v && (el.type !== "email" || /^\S+@\S+\.\S+$/.test(v)) && (!(el.minLength > 0) || v.length >= el.minLength);
      el.setAttribute("aria-invalid", !ok); if (!ok && !bad) bad = el;
    });
    if (bad) { err.textContent = "Please check the highlighted fields."; bad.focus(); return; }
    var ep = config.contact && config.contact.formEndpoint;
    if (!ep) { err.textContent = "This form is not connected yet. Set contact.formEndpoint in config.js to receive messages."; return; }
    err.textContent = "Sending…";
    fetch(ep, { method: "POST", body: new FormData(f), headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw 0; f.reset(); err.textContent = "Thanks — your message was sent."; })
      .catch(function () { err.textContent = "Sorry, the message could not be sent. Please email instead."; });
  });

  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
