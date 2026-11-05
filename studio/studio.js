/* Droplates Template Studio 2.0 — click-to-edit, sections, brand kits, undo/redo, drafts and ZIP export. No dependencies. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var SLUGS = ["saas", "portfolio", "agency"];
  var slug = new URLSearchParams(location.search).get("t"); if (SLUGS.indexOf(slug) < 0) slug = "saas";
  var base = "../products/" + slug + "/";
  var KEY = "droplates-studio-" + slug, DKEY = "droplates-drafts-" + slug, KITS = "droplates-brandkits";
  var frame = $("#frame");
  var manifest, defaults, state, site, sections = [], picked = null, page = "index.html";
  var past = [], future = [], lastCoalesce = null, lastTime = 0, MAX_HISTORY = 50;

  /* ---------- utils ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function get(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function set(o, p, v) { var ks = p.split("."), last = ks.pop(); ks.reduce(function (a, k) { return a[k] = a[k] || {}; }, o)[last] = v; }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "text") e.textContent = attrs[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e;
  }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 2800); }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast("Browser storage is full — changes stay for this session only. Export a JSON backup."); return false; } }
  function read(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function readFile(file, max, cb) { if (file.size > max) { toast("File too large (max " + Math.round(max / 1000) + " KB)."); return; } var r = new FileReader(); r.onload = function () { cb(r.result); }; r.readAsText(file); }
  function readImage(file, max, cb) { if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast("Use a PNG, JPG or WebP image."); return; } if (file.size > max) { toast("Image too large (max " + Math.round(max / 1000) + " KB)."); return; } var r = new FileReader(); r.onload = function () { cb(r.result); }; r.readAsDataURL(file); }
  function download(name, blob) { var a = el("a", { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }

  /* ---------- state + history ---------- */
  function push() { if (frame.contentWindow) frame.contentWindow.postMessage({ type: "droplates:config", config: state }, location.origin); }
  function commit(next, coalesce) {
    var now = Date.now();
    if (!(coalesce && coalesce === lastCoalesce && now - lastTime < 1200)) { past.push(JSON.stringify(state)); if (past.length > MAX_HISTORY) past.shift(); }
    lastCoalesce = coalesce || null; lastTime = now; future = [];
    state = site.validate(next); store(KEY, state); push(); syncHistory();
  }
  function change(fn, coalesce) { var n = clone(state); fn(n); commit(n, coalesce); }
  function restore(json) { state = site.validate(JSON.parse(json)); store(KEY, state); push(); syncHistory(); renderAll(); }
  function undo() { if (!past.length) return; future.push(JSON.stringify(state)); restore(past.pop()); lastCoalesce = null; }
  function redo() { if (!future.length) return; past.push(JSON.stringify(state)); restore(future.pop()); lastCoalesce = null; }
  function syncHistory() { $("#undo").disabled = !past.length; $("#redo").disabled = !future.length; }

  /* ---------- controls ---------- */
  function field(label, input) { return el("label", { class: "f" }, [el("span", { text: label }), input]); }
  function chips(path, options, label) {
    var wrap = el("div", { class: "chips", role: "group", "aria-label": label });
    options.forEach(function (o) { wrap.appendChild(el("button", { type: "button", "aria-pressed": String(get(state, path) === o), text: o, onclick: function () { change(function (n) { set(n, path, o); }); renderStyle(); } })); });
    return el("div", { class: "f" }, [el("span", { text: label }), wrap]);
  }
  function selectCtl(path, options, label) {
    var s = el("select", { onchange: function () { change(function (n) { set(n, path, s.value); }); } });
    options.forEach(function (o) { var op = el("option", { value: o, text: o === "" ? "Preset default" : o }); if (get(state, path) === o) op.selected = true; s.appendChild(op); });
    return field(label, s);
  }
  function textCtl(path, label, type) {
    var input = type === "textarea" ? el("textarea", { rows: "3", maxlength: "400" }) : el("input", { type: type === "email" ? "email" : type === "url" ? "url" : "text", maxlength: "400" });
    input.value = get(state, path) || "";
    input.addEventListener("input", function () { change(function (n) { set(n, path, input.value); }, path); });
    input.addEventListener("change", function () { var ok = (get(state, path) || "") === input.value; if (ok) input.removeAttribute("aria-invalid"); else { input.setAttribute("aria-invalid", "true"); toast("That value is not valid and was not applied."); } });
    return field(label, input);
  }
  function imageCtl(label, current, onSet, onClear) {
    var file = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp" });
    file.addEventListener("change", function () { if (file.files[0]) readImage(file.files[0], 1100000, onSet); });
    return el("div", { class: "f" }, [el("span", { text: label }), current ? el("img", { class: "thumb", src: current, alt: "" }) : null, file,
      current ? el("button", { type: "button", class: "ghost sm", text: "Remove image", onclick: onClear }) : null]);
  }

  /* ---------- panels ---------- */
  function renderPages() {
    var box = $("#pages"); box.innerHTML = ""; $("#page-m").innerHTML = "";
    manifest.pages.forEach(function (p) {
      box.appendChild(el("button", { type: "button", class: "row" + (p[0] === page ? " on" : ""), onclick: function () { go(p[0]); } }, [el("span", { class: "lbl", text: p[1] })]));
      var o = el("option", { value: p[0], text: p[1] }); if (p[0] === page) o.selected = true; $("#page-m").appendChild(o);
    });
  }
  function renderSections() {
    var box = $("#sections"); box.innerHTML = "";
    if (!sections.length) { box.appendChild(el("p", { class: "hint", text: "No sections on this page." })); return; }
    sections.forEach(function (s) {
      var hidden = !!(state.sections[s.id] && state.sections[s.id].hidden);
      var row = el("div", { class: "row" + (hidden ? " off" : "") + (picked && picked.section === s.id ? " on" : ""), role: "button", tabindex: "0", "aria-label": "Go to section " + s.label,
        onclick: function () { frame.contentWindow.postMessage({ type: "droplates:scroll", section: s.id }, location.origin); },
        onkeydown: function (e) { if (e.key === "Enter") this.click(); } }, [
        el("span", { class: "lbl", text: s.label }),
        s.optional ? el("button", { type: "button", class: "act", title: hidden ? "Show section" : "Hide section", "aria-label": (hidden ? "Show " : "Hide ") + s.label, text: hidden ? "○" : "●",
          onclick: function (e) { e.stopPropagation(); change(function (n) { if (hidden) delete n.sections[s.id]; else n.sections[s.id] = { hidden: true }; }); renderSections(); } }) : null,
        el("button", { type: "button", class: "act", title: "Reset section", "aria-label": "Reset " + s.label, text: "↺", onclick: function (e) { e.stopPropagation(); resetSection(s); } })
      ]);
      box.appendChild(row);
    });
  }
  function resetSection(s) {
    change(function (n) { delete n.sections[s.id]; s.keys.forEach(function (k) { delete n.content[k]; delete n.links[k]; delete n.images[k]; }); });
    renderSections(); renderElement(); toast("Section “" + s.label + "” reset.");
  }
  function renderElement() {
    var p = $("#p-element"); p.innerHTML = "";
    if (!picked) { p.appendChild(el("div", { class: "empty", text: "Click any outlined text, button or image in the preview to edit it here." })); return; }
    p.appendChild(el("div", { class: "sel-head" }, [el("span", { class: "dot" }), el("b", { text: picked.label }), el("small", { text: "in " + (picked.sectionLabel || "page") })]));
    if (picked.kind === "config") {
      var meta = Object.values(manifest.fields).reduce(function (a, g) { return a.concat(g); }, []).filter(function (f) { return f[0] === picked.key; })[0];
      p.appendChild(textCtl(picked.key, meta ? meta[1] : "Text", meta && meta[2] === "textarea" ? "textarea" : "text"));
      if (picked.hrefKey && picked.hrefKey !== "contact.email") p.appendChild(textCtl(picked.hrefKey, "Link", "url"));
      p.appendChild(el("p", { class: "hint", text: "This text is a site setting and is used wherever it appears." }));
    } else if (picked.kind === "image") {
      p.appendChild(imageCtl("Image", state.images[picked.key], function (data) { change(function (n) { n.images[picked.key] = data; }); renderElement(); },
        function () { change(function (n) { delete n.images[picked.key]; }); renderElement(); }));
      p.appendChild(el("p", { class: "hint", text: "PNG, JPG or WebP up to 1 MB. Included in your download as a file." }));
    } else {
      if (picked.key) {
        var ta = el("textarea", { rows: "4", maxlength: "2000" }); ta.value = picked.key in state.content ? state.content[picked.key] : picked.defaultValue;
        ta.addEventListener("input", function () { change(function (n) { if (ta.value === picked.defaultValue) delete n.content[picked.key]; else n.content[picked.key] = ta.value; }, "c:" + picked.key); });
        p.appendChild(field(picked.kind === "link" ? "Button text" : "Text", ta));
      }
      if (picked.linkKey) {
        var u = el("input", { type: "text", maxlength: "400", placeholder: "page.html or https://…" }); u.value = state.links[picked.linkKey] || picked.defaultHref || "";
        u.addEventListener("input", function () { change(function (n) { if (u.value === picked.defaultHref || !u.value) delete n.links[picked.linkKey]; else n.links[picked.linkKey] = u.value; }, "l:" + picked.linkKey); });
        u.addEventListener("change", function () { var ok = !u.value || u.value === picked.defaultHref || state.links[picked.linkKey] === u.value; u.toggleAttribute("aria-invalid", !ok); if (!ok) toast("Use a page like contact.html, or a full https:// link."); });
        p.appendChild(field("Link", u));
      }
      p.appendChild(el("button", { type: "button", class: "ghost", text: "Reset this element", onclick: function () {
        change(function (n) { if (picked.key) delete n.content[picked.key]; if (picked.linkKey) delete n.links[picked.linkKey]; }); renderElement(); } }));
    }
    var s = sections.filter(function (x) { return x.id === picked.section; })[0];
    if (s) p.appendChild(el("div", { class: "inline", style: "margin-top:14px" }, [
      s.optional ? el("button", { type: "button", class: "ghost sm", text: "Hide section", onclick: function () { change(function (n) { n.sections[s.id] = { hidden: true }; }); renderSections(); } }) : null,
      el("button", { type: "button", class: "ghost sm", text: "Reset section", onclick: function () { resetSection(s); } })]));
  }
  function renderStyle() {
    var p = $("#p-style"); p.innerHTML = "";
    p.appendChild(el("p", { class: "h", text: "Style" }));
    p.appendChild(chips("preset", manifest.presets, "Preset"));
    p.appendChild(chips("theme", ["light", "dark"], "Theme"));
    var auto = el("input", { type: "checkbox" }); auto.checked = !state.style.accent;
    var pick = el("input", { type: "color", "aria-label": "Accent colour" }); pick.value = state.style.accent || "#777777"; pick.disabled = auto.checked;
    auto.addEventListener("change", function () { pick.disabled = auto.checked; change(function (n) { n.style.accent = auto.checked ? "" : pick.value; }); });
    pick.addEventListener("input", function () { change(function (n) { n.style.accent = pick.value; }, "accent"); });
    p.appendChild(el("div", { class: "f" }, [el("span", { text: "Accent colour" }), el("div", { class: "inline" }, [pick, el("label", {}, [auto, "Automatic"])])]));
    p.appendChild(selectCtl("style.font", manifest.fonts, "Body font"));
    if (manifest.headFonts.length) p.appendChild(selectCtl("style.headFont", [""].concat(manifest.headFonts), "Heading font"));
    p.appendChild(chips("style.buttons", ["auto", "pill", "rounded", "square"], "Buttons"));
    p.appendChild(chips("style.density", ["compact", "normal", "spacious"], "Spacing"));
  }
  function renderBrand() {
    var p = $("#p-brand"); p.innerHTML = "";
    p.appendChild(el("p", { class: "h", text: "Branding" }));
    (manifest.fields.Branding || []).forEach(function (f) {
      if (f[2] === "image") p.appendChild(imageCtl(f[1], state.brand.logo, function (d) { change(function (n) { n.brand.logo = d; }); renderBrand(); }, function () { change(function (n) { n.brand.logo = ""; }); renderBrand(); }));
      else p.appendChild(textCtl(f[0], f[1], f[2]));
    });
    p.appendChild(el("p", { class: "h", text: "Brand kits" }));
    p.appendChild(el("p", { class: "hint", style: "margin-top:0", text: "Save your brand once and apply it to any Droplates template. Stored in this browser." }));
    var kits = read(KITS, []);
    kits.forEach(function (k, i) {
      var sw = el("span", { class: "sw" }, [el("i", { style: "background:" + (k.style && k.style.accent || "#777") }), el("i", { style: "background:#f2f2f2" }), el("i", { style: "background:#111" })]);
      p.appendChild(el("div", { class: "kit" }, [el("div", { class: "kit-top" }, [sw, el("b", { text: k.name }), el("small", { text: (k.style && k.style.font) || "" })]),
        el("div", { class: "inline" }, [
          el("button", { type: "button", class: "ghost sm", text: "Apply", onclick: function () { applyKit(k); } }),
          el("button", { type: "button", class: "ghost sm", text: "Rename", onclick: function () { var nm = prompt("Kit name", k.name); if (nm) { kits[i].name = nm.slice(0, 60); store(KITS, kits); renderBrand(); } } }),
          el("button", { type: "button", class: "ghost sm", text: "Duplicate", onclick: function () { var c = clone(k); c.name = k.name + " copy"; kits.splice(i + 1, 0, c); store(KITS, kits); renderBrand(); } }),
          el("button", { type: "button", class: "ghost sm", text: "Export", onclick: function () { download(k.name.replace(/[^\w-]+/g, "-") + ".brandkit.json", new Blob([JSON.stringify({ droplates: "brandkit", version: 1, kit: k }, null, 2)], { type: "application/json" })); } }),
          el("button", { type: "button", class: "ghost sm danger", text: "Delete", onclick: function () { if (confirm("Delete brand kit “" + k.name + "”?")) { kits.splice(i, 1); store(KITS, kits); renderBrand(); } } })])]));
    });
    var imp = el("input", { type: "file", accept: "application/json,.json", hidden: true });
    imp.addEventListener("change", function () { if (imp.files[0]) readFile(imp.files[0], 600000, function (txt) { var k = parseKit(txt); if (!k) return toast("That file is not a valid brand kit."); kits.push(k); store(KITS, kits); renderBrand(); toast("Brand kit imported."); }); });
    p.appendChild(el("div", { class: "inline" }, [
      el("button", { type: "button", class: "primary", text: "Save current as kit", onclick: function () { var nm = prompt("Name this brand kit", state.brand.name || "My brand"); if (!nm) return; kits.push(kitFrom(state, nm)); store(KITS, kits); renderBrand(); toast("Brand kit saved."); } }),
      el("label", { class: "ghost file" }, ["Import kit", imp])]));
  }
  function renderSettings() {
    var p = $("#p-settings"); p.innerHTML = "";
    Object.keys(manifest.fields).forEach(function (g) {
      if (g === "Branding") return;
      p.appendChild(el("p", { class: "h", text: g }));
      manifest.fields[g].forEach(function (f) { p.appendChild(textCtl(f[0], f[1], f[2])); });
    });
  }
  function renderAll() { renderPages(); renderSections(); renderElement(); renderStyle(); renderBrand(); renderSettings(); }

  /* ---------- brand kits ---------- */
  var KIT_FIELDS = { brand: ["name", "logo"], style: ["accent", "font", "headFont", "buttons"], contact: ["email", "phone", "address", "location"], social: ["x", "linkedin", "github", "instagram", "dribbble", "behance"] };
  function kitFrom(c, name) {
    var k = { name: String(name).slice(0, 60) };
    Object.keys(KIT_FIELDS).forEach(function (g) { KIT_FIELDS[g].forEach(function (f) { if (c[g] && typeof c[g][f] === "string" && c[g][f] !== "") { k[g] = k[g] || {}; k[g][f] = c[g][f]; } }); });
    return k;
  }
  function parseKit(txt) {
    try { var j = JSON.parse(txt); var k = j && j.droplates === "brandkit" ? j.kit : j; if (!k || typeof k.name !== "string") return null;
      var out = { name: k.name.slice(0, 60) };
      Object.keys(KIT_FIELDS).forEach(function (g) { if (!k[g] || typeof k[g] !== "object") return; KIT_FIELDS[g].forEach(function (f) { if (typeof k[g][f] === "string" && k[g][f].length < 400000) { out[g] = out[g] || {}; out[g][f] = k[g][f]; } }); });
      return out; } catch (e) { return null; }
  }
  function applyKit(k) {
    var applied = 0;
    change(function (n) { Object.keys(KIT_FIELDS).forEach(function (g) { if (!k[g] || !n[g]) return; Object.keys(k[g]).forEach(function (f) { if (f in n[g]) { n[g][f] = k[g][f]; applied++; } }); }); });
    renderAll(); toast("Applied “" + k.name + "” (" + applied + " settings). Unsupported fields were skipped.");
  }

  /* ---------- drafts ---------- */
  function renderDrafts() {
    var box = $("#draft-list"), drafts = read(DKEY, {}); box.innerHTML = "";
    var names = Object.keys(drafts);
    if (!names.length) box.appendChild(el("p", { class: "hint", style: "margin:0", text: "No saved drafts yet." }));
    names.forEach(function (nm) {
      box.appendChild(el("div", { class: "ditem" }, [el("span", { text: nm }),
        el("button", { type: "button", class: "ghost sm", text: "Load", onclick: function () { change(function (n) { Object.assign(n, clone(drafts[nm].config)); }); renderAll(); toast("Loaded “" + nm + "”."); } }),
        el("button", { type: "button", class: "ghost sm", text: "Duplicate", onclick: function () { var c = prompt("Name for the copy", nm + " copy"); if (c) { drafts[c.slice(0, 60)] = clone(drafts[nm]); store(DKEY, drafts); renderDrafts(); } } }),
        el("button", { type: "button", class: "ghost sm danger", text: "✕", "aria-label": "Delete " + nm, onclick: function () { if (confirm("Delete draft “" + nm + "”?")) { delete drafts[nm]; store(DKEY, drafts); renderDrafts(); } } })]));
    });
  }
  $("#drafts-btn").addEventListener("click", function () { var m = $("#drafts"); m.hidden = !m.hidden; this.setAttribute("aria-expanded", String(!m.hidden)); if (!m.hidden) renderDrafts(); });
  document.addEventListener("click", function (e) { if (!e.target.closest(".menu-wrap")) { $("#drafts").hidden = true; $("#drafts-btn").setAttribute("aria-expanded", "false"); } });
  $("#draft-save").addEventListener("click", function () { var nm = prompt("Name this draft", "Draft " + (Object.keys(read(DKEY, {})).length + 1)); if (!nm) return; var d = read(DKEY, {}); d[nm.slice(0, 60)] = { config: state, saved: new Date().toISOString() }; if (store(DKEY, d)) toast("Draft saved."); renderDrafts(); });
  $("#draft-export").addEventListener("click", function () { download("droplates-" + slug + "-config.json", new Blob([JSON.stringify({ droplates: "config", template: slug, schema: state.schema, config: state }, null, 2)], { type: "application/json" })); });
  $("#draft-import").addEventListener("change", function () {
    var f = this.files[0]; this.value = ""; if (!f) return;
    readFile(f, 8000000, function (txt) {
      try { var j = JSON.parse(txt), c = j && j.droplates === "config" ? j.config : j;
        if (j && j.template && j.template !== slug) toast("This file was made for another template; compatible settings were applied.");
        change(function (n) { Object.keys(n).forEach(function (k) { delete n[k]; }); Object.assign(n, site.validate(c)); }); renderAll(); toast("Configuration imported.");
      } catch (e) { toast("That file is not a valid configuration."); }
    });
  });
  $("#reset").addEventListener("click", function () { if (!confirm("Reset all settings and edits to the template defaults? You can undo this.")) return; change(function (n) { Object.keys(n).forEach(function (k) { delete n[k]; }); Object.assign(n, clone(defaults)); }); renderAll(); toast("Reset to defaults."); });

  /* ---------- preview + messaging ---------- */
  function go(p) { if (p === page) return; page = p; picked = null; frame.src = base + p; renderPages(); renderElement(); }
  frame.addEventListener("load", function () {
    var w = frame.contentWindow; if (!w.SITE) return;
    site = w.SITE;
    if (!defaults) { defaults = clone(site.defaults); state = site.validate(read(KEY, null) || defaults); store(KEY, state); renderAll(); if (new URLSearchParams(location.search).get("download") === "1") setTimeout(function () { $("#download").click(); }, 300); }
    page = (w.location.pathname.split("/").pop() || "index.html"); renderPages();
    push(); w.postMessage({ type: "droplates:edit" }, location.origin);
  });
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || e.source !== frame.contentWindow || !e.data) return;
    var m = e.data;
    if (m.type === "droplates:ready") { sections = Array.isArray(m.sections) ? m.sections : []; renderSections(); }
    else if (m.type === "droplates:picked") { picked = m; renderElement(); renderSections(); showTab("element"); if (matchMedia("(max-width:900px)").matches) openSheet("insp"); }
  });

  /* ---------- tabs, devices, shortcuts, mobile sheets ---------- */
  function showTab(t) { $$(".tabs [role=tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.tab === t)); }); $$(".tp").forEach(function (p) { p.hidden = p.dataset.panel !== t; }); }
  $$(".tabs [role=tab]").forEach(function (b) { b.addEventListener("click", function () { showTab(b.dataset.tab); }); });
  $$(".seg button").forEach(function (b) { b.addEventListener("click", function () { $$(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); frame.style.width = b.dataset.w; }); });
  $("#full").addEventListener("click", function () { var s = $("#stage"); if (s.requestFullscreen) s.requestFullscreen(); });
  $("#undo").addEventListener("click", undo); $("#redo").addEventListener("click", redo);
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey) || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); } else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
  });
  $("#page-m").addEventListener("change", function () { go(this.value); });
  function openSheet(id) { $$(".nav,.ins").forEach(function (p) { p.classList.toggle("open", p.id === id); }); }
  $$(".close").forEach(function (b) { b.addEventListener("click", function () { $$(".nav,.ins").forEach(function (p) { p.classList.remove("open"); }); $$(".tabbar button").forEach(function (x) { x.classList.remove("on"); }); }); });
  $$(".tabbar button").forEach(function (b) { b.addEventListener("click", function () {
    $$(".tabbar button").forEach(function (x) { x.classList.toggle("on", x === b); });
    if (b.dataset.m === "navp") openSheet("navp"); else { showTab(b.dataset.m); openSheet("insp"); }
  }); });

  /* ---------- ZIP export (store method) ---------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0, d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data), h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, time, true); h.setUint16(12, date, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, time, true); c.setUint16(14, date, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name); offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (s, p) { return s + p.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }
  function dataUrlToFile(url, name) {
    var m = /^data:image\/(png|jpeg|webp|svg\+xml);base64,(.+)$/i.exec(url); if (!m) return null;
    var ext = { "png": "png", "jpeg": "jpg", "webp": "webp", "svg+xml": "svg" }[m[1].toLowerCase()];
    var bin = atob(m[2]), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { name: "assets/" + name + "." + ext, data: bytes };
  }
  function configFile(cfg) {
    return "/*\n * Site configuration — generated by Droplates Template Studio.\n * Schema version " + cfg.schema + ". Text values are inserted as plain text. See README.md for every option.\n */\nwindow.SITE_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  }
  $("#download").addEventListener("click", function () {
    var btn = this; if (!site) return;
    var cfg = site.validate(state), extra = [], enc = new TextEncoder();
    var logo = cfg.brand && cfg.brand.logo && dataUrlToFile(cfg.brand.logo, "logo"); if (logo) { extra.push(logo); cfg.brand.logo = logo.name; }
    Object.keys(cfg.images).forEach(function (k) { var f = dataUrlToFile(cfg.images[k], "img-" + k); if (f) { extra.push(f); cfg.images[k] = f.name; } });
    btn.disabled = true; btn.textContent = "Preparing…";
    var folder = "droplates-" + slug + "/";
    Promise.all(manifest.files.map(function (f) {
      if (f === "config.js") return Promise.resolve({ name: folder + f, data: enc.encode(configFile(cfg)) });
      return fetch(base + f).then(function (r) { if (!r.ok) throw new Error(f); return r.arrayBuffer(); }).then(function (b) { return { name: folder + f, data: new Uint8Array(b) }; });
    })).then(function (files) {
      extra.forEach(function (x) { x.name = folder + x.name; });
      download("droplates-" + slug + "-free.zip", zip(files.concat(extra)));
      toast("Download ready. Unzip it and open index.html — see README.md to publish.");
    }).catch(function (e) { toast("Download failed: could not load " + e.message); })
      .finally(function () { btn.disabled = false; btn.innerHTML = 'Download<span class="desk-only"> free</span>'; });
  });

  /* ---------- start ---------- */
  fetch(base + "manifest.json").then(function (r) { return r.json(); }).then(function (mf) {
    manifest = mf;
    $("#tname").innerHTML = ""; $("#tname").appendChild(document.createTextNode(mf.name)); $("#tname").appendChild(el("small", { text: "Free · v" + mf.version }));
    document.title = mf.name + " — Template Studio — Droplates";
    frame.src = base + "index.html";
  }).catch(function () { $("#tname").textContent = "Template not found"; });
})();
