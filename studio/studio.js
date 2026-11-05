/* Droplates Template Studio — customises a real template and exports it as a ZIP. No dependencies. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var SLUGS = ["saas", "portfolio", "agency"];
  var slug = new URLSearchParams(location.search).get("t");
  if (SLUGS.indexOf(slug) < 0) slug = "saas";
  var base = "../products/" + slug + "/";
  var KEY = "droplates-studio-" + slug;
  var frame = $("#frame"), form = $("#form");
  var manifest, defaults, state, site;

  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 2600); }
  function get(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function set(o, p, v) { var ks = p.split("."), last = ks.pop(); ks.reduce(function (a, k) { return a[k] = a[k] || {}; }, o)[last] = v; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function push() { if (frame.contentWindow) frame.contentWindow.postMessage({ type: "droplates:config", config: state }, location.origin); }
  function update(path, value) { set(state, path, value); state = site.validate(state); save(); push(); }

  /* ---------- Form ---------- */
  function el(tag, attrs, kids) { var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }); (kids || []).forEach(function (c) { e.appendChild(c); }); return e; }
  function chips(path, options, label) {
    var wrap = el("div", { class: "chips", role: "group", "aria-label": label });
    options.forEach(function (o) {
      var b = el("button", { type: "button", "aria-pressed": String(get(state, path) === o), text: o === "" ? "auto" : o });
      b.addEventListener("click", function () { update(path, o); [].forEach.call(wrap.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); }); });
      wrap.appendChild(b);
    });
    return el("div", { class: "f" }, [el("span", { text: label }), wrap]);
  }
  function select(path, options, label) {
    var s = el("select", { "aria-label": label });
    options.forEach(function (o) { var op = el("option", { value: o, text: o === "" ? "Preset default" : o }); if (get(state, path) === o) op.selected = true; s.appendChild(op); });
    s.addEventListener("change", function () { update(path, s.value); });
    return el("label", { class: "f" }, [el("span", { text: label }), s]);
  }
  function text(path, label, type) {
    var input = type === "textarea" ? el("textarea", { rows: "3", maxlength: "300" }) : el("input", { type: type || "text", maxlength: "300" });
    input.value = get(state, path) || "";
    input.addEventListener("input", function () { update(path, input.value); });
    input.addEventListener("change", function () { if ((get(state, path) || "") !== input.value) { input.setAttribute("aria-invalid", "true"); toast("That value is not valid and was not applied."); } else input.removeAttribute("aria-invalid"); });
    return el("label", { class: "f" }, [el("span", { text: label }), input]);
  }
  function image(path, label) {
    var input = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/svg+xml" });
    var prev = el("img", { class: "logo-prev", alt: "" }); prev.hidden = !get(state, path); if (get(state, path)) prev.src = get(state, path);
    var clear = el("button", { type: "button", class: "ghost", text: "Remove" });
    input.addEventListener("change", function () {
      var f = input.files[0]; if (!f) return;
      if (f.size > 250000) { toast("Please use a logo under 250 KB."); input.value = ""; return; }
      var r = new FileReader(); r.onload = function () { update(path, r.result); prev.src = r.result; prev.hidden = false; }; r.readAsDataURL(f);
    });
    clear.addEventListener("click", function () { update(path, ""); prev.hidden = true; input.value = ""; });
    return el("div", { class: "f" }, [el("span", { text: label }), input, el("div", { class: "row" }, [prev, clear])]);
  }
  function colour() {
    var auto = el("input", { type: "checkbox" }); auto.checked = !state.style.accent;
    var pick = el("input", { type: "color", "aria-label": "Accent colour" }); pick.value = state.style.accent || "#777777"; pick.disabled = auto.checked;
    auto.addEventListener("change", function () { pick.disabled = auto.checked; update("style.accent", auto.checked ? "" : pick.value); });
    pick.addEventListener("input", function () { update("style.accent", pick.value); });
    return el("div", { class: "f" }, [el("span", { text: "Accent colour" }), el("div", { class: "row" }, [pick, el("label", {}, [auto, document.createTextNode("Automatic")])])]);
  }
  function build() {
    form.innerHTML = "";
    var style = el("fieldset", {}, [el("legend", { text: "Style" }),
      chips("preset", manifest.presets, "Preset"), chips("theme", ["light", "dark"], "Theme"), colour(),
      select("style.font", manifest.fonts, "Body font")]);
    if (manifest.headFonts.length) style.appendChild(select("style.headFont", [""].concat(manifest.headFonts), "Heading font"));
    style.appendChild(chips("style.buttons", ["auto", "pill", "rounded", "square"], "Buttons"));
    style.appendChild(chips("style.density", ["compact", "normal", "spacious"], "Spacing"));
    form.appendChild(style);
    Object.keys(manifest.fields).forEach(function (group) {
      var fs = el("fieldset", {}, [el("legend", { text: group })]);
      manifest.fields[group].forEach(function (f) { fs.appendChild(f[2] === "image" ? image(f[0], f[1]) : text(f[0], f[1], f[2])); });
      form.appendChild(fs);
    });
  }

  /* ---------- Preview ---------- */
  frame.addEventListener("load", function () {
    var w = frame.contentWindow;
    if (!w.SITE) return;
    if (!site) {
      site = w.SITE; defaults = JSON.parse(JSON.stringify(w.SITE.defaults));
      state = site.validate(load() || defaults);
      build();
    }
    site = w.SITE; push();
    var p = frame.contentWindow.location.pathname.split("/").pop() || "index.html";
    if ($("#page").value !== p && manifest.pages.some(function (x) { return x[0] === p; })) $("#page").value = p;
  });
  $("#page").addEventListener("change", function () { frame.src = base + $("#page").value; });
  document.querySelectorAll(".seg button").forEach(function (b) { b.addEventListener("click", function () {
    document.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    frame.style.width = b.dataset.w;
  }); });
  $("#full").addEventListener("click", function () { var s = $("#stage"); if (s.requestFullscreen) s.requestFullscreen(); });
  $("#reset").addEventListener("click", function () { if (!confirm("Reset all settings to the template defaults?")) return; state = JSON.parse(JSON.stringify(defaults)); save(); build(); push(); toast("Settings reset."); });
  var panel = $("#panel");
  $("#open-sheet").addEventListener("click", function () { panel.classList.add("open"); });
  $("#close-sheet").addEventListener("click", function () { panel.classList.remove("open"); });

  /* ---------- ZIP export (store method, no compression) ---------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (s, p) { return s + p.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }
  function configFile(cfg) {
    return "/*\n * Site configuration — generated by Droplates Template Studio.\n * Edit freely. Schema version " + cfg.schema + ". Text values are inserted as plain text.\n * See README.md for every option.\n */\nwindow.SITE_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  }
  $("#download").addEventListener("click", function () {
    var btn = this; if (!site) return;
    var cfg = site.validate(state);
    var extra = [], enc = new TextEncoder(), m = /^data:image\/(png|jpeg|webp|svg\+xml);base64,(.+)$/i.exec(cfg.brand && cfg.brand.logo || "");
    if (m) {
      var ext = { "png": "png", "jpeg": "jpg", "webp": "webp", "svg+xml": "svg" }[m[1].toLowerCase()];
      var bin = atob(m[2]), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      extra.push({ name: "assets/logo." + ext, data: bytes }); cfg.brand.logo = "assets/logo." + ext;
    }
    btn.disabled = true; btn.textContent = "Preparing…";
    var folder = "droplates-" + slug + "/";
    Promise.all(manifest.files.map(function (f) {
      if (f === "config.js") return Promise.resolve({ name: folder + f, data: enc.encode(configFile(cfg)) });
      return fetch(base + f).then(function (r) { if (!r.ok) throw new Error(f); return r.arrayBuffer(); }).then(function (b) { return { name: folder + f, data: new Uint8Array(b) }; });
    })).then(function (files) {
      extra.forEach(function (x) { x.name = folder + x.name; });
      var blob = zip(files.concat(extra));
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "droplates-" + slug + "-free.zip";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast("Download ready.");
    }).catch(function (e) { toast("Download failed: could not load " + e.message); })
      .finally(function () { btn.disabled = false; btn.textContent = "Download free"; });
  });

  /* ---------- Start ---------- */
  fetch(base + "manifest.json").then(function (r) { return r.json(); }).then(function (mf) {
    manifest = mf;
    $("#tname").textContent = mf.name + " · Free";
    document.title = mf.name + " — Template Studio — Droplates";
    mf.pages.forEach(function (p) { $("#page").appendChild(el("option", { value: p[0], text: p[1] })); });
    frame.src = base + "index.html";
  }).catch(function () { $("#tname").textContent = "Template not found"; });
})();
