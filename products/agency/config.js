/*
 * Site configuration — edit this file to customise your website.
 * Schema version 1. Text values are inserted as plain text (never as HTML).
 * Template Studio on droplates.com writes this same file when you download.
 */
window.SITE_CONFIG = {
  schema: 1,
  template: "agency",
  edition: "free",
  preset: "contemporary",      // "contemporary" | "corporate" | "studio"
  theme: "light",              // "light" | "dark"
  style: {
    accent: "",                // "" = automatic, or a hex colour like "#2f5bea"
    font: "Inter",             // "Inter" | "IBM Plex Sans" | "Manrope" | "Space Grotesk"
    headFont: "",              // "" = preset decides, or "Instrument Serif" | "Fraunces" | "Inter"
    buttons: "auto",           // "auto" | "pill" | "rounded" | "square"
    density: "normal"          // "compact" | "normal" | "spacious"
  },
  brand: { name: "Forma", logo: "" },         // logo: path to an image, e.g. "assets/logo.svg". Shown next to the name.
  nav: { services: "Services", work: "Work", about: "About", cta: "Start a project" },
  hero: {
    title: "We build brands",
    titleEm: "that people remember.",
    text: "Forma is an independent design and strategy studio for ambitious companies.",
    ctaLabel: "See our work",
    ctaUrl: "work.html"
  },
  contact: { email: "hello@example.com", phone: "+32 000 00 00 00", address: "Demo Street 1, Brussels", formEndpoint: "" },
  social: { instagram: "", linkedin: "", behance: "" },
  seo: { siteName: "Forma", description: "Forma is an independent design and strategy studio." }
};
